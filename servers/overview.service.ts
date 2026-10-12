'use server';

import { eq, desc, ne, and, asc } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { waktuMakanTable } from '@/db/schemas/patient/waktu-makan';
import { dietMappingTable } from '@/db/schemas/master/mapping-diet';
import { kategoriMenuTable } from '@/db/schemas/master/kategori-menu';
import {
  masterSiklusTable,
  masterSiklusMenuTable,
} from '@/db/schemas/master/siklus-menu';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import { isNpoPatient } from '@/lib/npo-utils';
import { hasDiitTag } from '@/lib/siklus-menu-tags';
import {
  addCalendarDays,
  formatIndoFull,
  getWibHari,
  getWibMinutes,
  getWibTodayKey,
} from '@/lib/wib';
import {
  resolveActiveCycleForDate,
  normalizeDishName,
} from '@/lib/siklus-menu-utils';
import { normalizeSaringKarboForWaktu } from '@/lib/saring-bss';

import type {
  MonitoringCardData,
  MonitoringSummary,
  MenuCategoryGroup,
} from '@/types/monitoringtypes';

export type { MonitoringCardData, MonitoringSummary };

interface NextCycleInfo {
  waktuMakan: string; // PAGI | SIANG | MALAM
  tanggalProduksi: string; // YYYY-MM-DD
  cutoffTime: string; // HH:mm
}

interface WaktuMakanConfig {
  id: number;
  jenis_makan: string;
  waktu: string;
}

const WIB_TZ = 'Asia/Jakarta';

function getNextCycle(
  configs: WaktuMakanConfig[],
  date: Date = new Date(),
): NextCycleInfo {
  const defaultTimes = {
    PAGI: '05:30',
    SIANG: '10:30',
    MALAM: '16:00',
  };

  const pagiTime =
    configs.find((c) => c.jenis_makan === 'PAGI')?.waktu || defaultTimes.PAGI;
  const siangTime =
    configs.find((c) => c.jenis_makan === 'SIANG')?.waktu || defaultTimes.SIANG;
  const malamTime =
    configs.find((c) => c.jenis_makan === 'MALAM')?.waktu || defaultTimes.MALAM;

  const getMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // WIB sentral: jam server UTC tidak boleh dipakai langsung.
  const currentMinutes = getWibMinutes(date);
  const todayKey = getWibTodayKey(date);

  const pagiMin = getMinutes(pagiTime);
  const siangMin = getMinutes(siangTime);
  const malamMin = getMinutes(malamTime);

  let waktuMakan = 'PAGI';
  let dateOffset = 0;
  let cutoffTime = pagiTime;

  if (currentMinutes < pagiMin) {
    waktuMakan = 'PAGI';
    cutoffTime = pagiTime;
  } else if (currentMinutes < siangMin) {
    waktuMakan = 'SIANG';
    cutoffTime = siangTime;
  } else if (currentMinutes < malamMin) {
    waktuMakan = 'MALAM';
    cutoffTime = malamTime;
  } else {
    waktuMakan = 'PAGI';
    cutoffTime = pagiTime;
    dateOffset = 1; // PAGI of tomorrow
  }

  return {
    waktuMakan,
    tanggalProduksi: dateOffset > 0 ? addCalendarDays(todayKey, dateOffset) : todayKey,
    cutoffTime: cutoffTime.slice(0, 5),
  };
}

function getNextCycleAfter(
  current: NextCycleInfo,
  configs: WaktuMakanConfig[],
): NextCycleInfo {
  const defaultTimes: Record<string, string> = {
    PAGI: '05:30',
    SIANG: '10:30',
    MALAM: '16:00',
  };

  const order = ['PAGI', 'SIANG', 'MALAM'];
  const currentIndex = order.indexOf(current.waktuMakan);
  const nextIndex = (currentIndex + 1) % 3;
  const nextWaktuMakan = order[nextIndex];

  const nextDateKey =
    currentIndex === 2
      ? addCalendarDays(current.tanggalProduksi, 1)
      : current.tanggalProduksi;

  const nextCutoff =
    configs.find((c) => c.jenis_makan === nextWaktuMakan)?.waktu ||
    defaultTimes[nextWaktuMakan];

  return {
    waktuMakan: nextWaktuMakan,
    tanggalProduksi: nextDateKey,
    cutoffTime: nextCutoff.slice(0, 5),
  };
}

/**
 * Helper to split and normalize comma or slash separated items
 */
function extractCodes(val: string | null | undefined): string[] {
  if (!val || !val.trim()) return [];
  return val
    .split(/[,;/]+/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        Boolean(s) &&
        s.toUpperCase() !== 'TIDAK' &&
        s.toUpperCase() !== 'NON' &&
        s !== '-'
    );
}

/**
 * Normalisasi kode diet untuk rincian produksi (DJ, RL, DH, ...).
 * Buang sentinel non diet agar chip tidak tampilkan NPO / PUASA / '-'.
 */
function normalizeDietCodes(codes: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of codes || []) {
    const code = (raw || '').trim().toUpperCase();
    if (!code) continue;
    if (code === '-' || code === 'TIDAK' || code === 'NON') continue;
    if (code === 'NPO' || code === 'PUASA') continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

/**
 * Tentukan 1 kode diet pemicu untuk satu hidangan agar jumlah rincian
 * selalu sama dengan total porsi (1 pasien = 1 hitung rincian).
 * Prioritas: irisan kode pasien dengan tag hidangan, lalu kode pasien pertama.
 */
function pickDietContributors(
  patientCodes: string[],
  dishTag: string | null | undefined,
): string[] {
  const patients = normalizeDietCodes(patientCodes);
  if (patients.length === 0) return [];
  if (!dishTag || !dishTag.trim() || dishTag.trim() === '-') {
    return [patients[0]];
  }
  const tags = new Set(extractCodes(dishTag).map((t) => t.toUpperCase()));
  const hit = patients.find((c) => tags.has(c));
  return [hit || patients[0]];
}

/**
 * Kode diet utama pasien untuk kartu non lauk (pokok, ekstra, buah, snack).
 * Pakai kategori diet (hewani) dulu agar konsisten RL / DJ / DH.
 */
function primaryDietCodes(
  hewani: string[],
  nabati: string[],
  sayur: string[],
): string[] {
  const h = normalizeDietCodes(hewani);
  if (h.length > 0) return [h[0]];
  const n = normalizeDietCodes(nabati);
  if (n.length > 0) return [n[0]];
  const s = normalizeDietCodes(sayur);
  if (s.length > 0) return [s[0]];
  return [];
}

/**
 * Sentinel era "Alihkan ke AG Katering" manual — hanya untuk data lama.
 * Mapping baru tidak lagi menulis nilai ini (lihat mapping-diet.service).
 */
function isLegacyKateringCode(code: string): boolean {
  return code.trim().toUpperCase() === 'KATERING';
}

/**
 * Kode bentuk makanan (uppercase) yang berflag tugas AG Katering
 * (kategori_menu.is_tugas_ag_katering). Tahan terhadap DB yang belum
 * di-migrate: kembalikan set kosong bila kolom belum ada.
 */
async function getTugasAgKateringCodes(): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ kode_item: kategoriMenuTable.kode_item })
      .from(kategoriMenuTable)
      .where(eq(kategoriMenuTable.is_tugas_ag_katering, true));
    return new Set(
      rows.map((r) => r.kode_item.trim().toUpperCase()).filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

/**
 * True bila salah satu kode bentuk teralihkan ke Live Katering: berflag
 * tugas AG Katering, atau sentinel legacy 'KATERING'.
 */
function isKateringBentuk(
  bentukCodes: string[],
  tugasCodes: Set<string>,
): boolean {
  return bentukCodes.some(
    (c) => tugasCodes.has(c.toUpperCase()) || isLegacyKateringCode(c),
  );
}

/**
 * Check if a dish's assigned kelas matches a patient's kelas.
 * Kanonis KELAS I/II/III + wildcard "Semua Kelas".
 * Legacy "Kelas 1/2/3", "KELAS 2 - 3", dan "VIP/VVIP" tetap dibaca agar data lama cocok.
 */
function matchesKelas(dishKelas: string | null | undefined, patientKelas: string | null | undefined): boolean {
  if (!dishKelas || dishKelas === 'Semua Kelas' || dishKelas.toUpperCase() === 'ALL') {
    return true;
  }
  if (!patientKelas) return true;

  const dK = dishKelas.toLowerCase().trim();
  const pK = patientKelas.toLowerCase().trim();

  if (dK === pK) return true;

  const norm = (s: string): string => {
    if (s.includes('vip')) return 'kelas i';
    if (s === '1' || s === 'i' || s === 'kelas 1' || s === 'kelas i') return 'kelas i';
    if (s === '2' || s === 'ii' || s === 'kelas 2' || s === 'kelas ii') return 'kelas ii';
    if (s === '3' || s === 'iii' || s === 'kelas 3' || s === 'kelas iii') return 'kelas iii';
    return s;
  };

  // Legacy gabungan "kelas 2 - 3" cocok untuk KELAS II dan KELAS III
  if (dK.includes('2') && dK.includes('3')) {
    const pn = norm(pK);
    return pn === 'kelas ii' || pn === 'kelas iii' || pK.includes('2') || pK.includes('3');
  }

  return norm(dK) === norm(pK);
}

/**
 * Map jenis_makanan string to standardized MenuCategoryGroup
 */
function mapCategoryGroup(jenis: string | null | undefined): MenuCategoryGroup {
  if (!jenis) return 'LAINNYA';
  const j = jenis.toUpperCase().trim();
  if (j === 'HEWANI') return 'HEWANI';
  if (j === 'NABATI') return 'NABATI';
  if (j === 'SAYUR' || j === 'SAYURAN') return 'SAYUR';
  if (j === 'HEWANI & NABATI' || j === 'HEWANI_NABATI') return 'HEWANI & NABATI';
  if (j === 'NABATI & SAYUR' || j === 'NABATI_SAYUR') return 'NABATI & SAYUR';
  if (j === 'HEWANI & SAYUR' || j === 'HEWANI_SAYUR') return 'HEWANI & SAYUR';
  if (j === 'SARING') return 'SARING';
  if (j === 'POKOK' || j === 'KARBO' || j === 'KARBOHIDRAT' || j === 'BENTUK_MAKANAN') return 'POKOK';
  if (j === 'EXTRA') return 'EXTRA';
  if (j === 'BUAH') return 'BUAH';
  if (j === 'SNACK') return 'SNACK';
  if (j === 'NPO') return 'NPO';
  return 'LAINNYA';
}

interface DishCounter {
  code: string;
  name: string;
  category: MenuCategoryGroup;
  kelas?: string;
  dietTag?: string;
  catatan?: string;
  /** True bila hidangan penampung DIIT (tag tampil = kode diet mapping pasien). */
  isDiit?: boolean;
}

/**
 * Fallback yang jelas ketika kode hasil mapping-diet tidak tertera /
 * belum didaftarkan di siklus menu aktif.
 * Alur app: mapping-diet mengisi KARBO/HEWANI/NABATI/SAYUR/BUAH/SNACK (mis. BN, B, -),
 * lalu overview/produksi menerjemahkannya ke hidangan siklus menu.
 * Jika kode tidak ada di siklus menu, jangan tampilkan nama generik
 * ("Diet X" / "Menu X" / "Makanan Pokok (X)") — tampilkan keterangan eksplisit ini.
 */
function buildMissingCycleMenuDish(
  code: string,
  jenis: string,
  pKelas: string,
): DishCounter {
  const displayCode = (code || '').trim() || '-';
  return {
    code: displayCode,
    name: 'Tidak terdaftar pada siklus menu',
    category: mapCategoryGroup(jenis),
    kelas: pKelas,
    dietTag: displayCode,
    catatan: 'Tidak terdaftar pada siklus menu',
  };
}

/**
 * True bila hidangan ditag kode DIIT (penampung fallback diet tak terdaftar
 * spesifik di slot ini). Perbandingan case-insensitive.
 */
function isDiitDish(
  item: Pick<typeof masterSiklusMenuTable.$inferSelect, 'kategori_menu'>,
): boolean {
  return hasDiitTag(item.kategori_menu);
}

/**
 * Bungkus hidangan DIIT sebagai porsi diet yang diminta: nama hidangan
 * mengikuti menu DIIT slot itu, tapi tag yang ditampilkan tetap kode diet
 * hasil mapping pasien (mis. DH tetap DH, RL tetap RL).
 */
function buildDiitFallbackDish(
  matched: typeof masterSiklusMenuTable.$inferSelect,
  requestedCode: string,
): DishCounter {
  const displayCode = (requestedCode || '').trim() || 'DIIT';
  return {
    code: `DIIT-MENU-${matched.id}`,
    name: matched.nama_makanan,
    category: mapCategoryGroup(matched.jenis_makanan),
    kelas: matched.kelas,
    dietTag: displayCode,
    catatan: matched.catatan || `Menu DIIT fallback untuk diet ${displayCode}`,
    isDiit: true,
  };
}

function resolveSupplementDishes(
  activeSlotMenuItems: Array<typeof masterSiklusMenuTable.$inferSelect>,
  category: 'BUAH' | 'SNACK',
  codes: string[],
  patientKelas: string,
  mealSlot: string,
): DishCounter[] {
  if (!['PAGI', 'SIANG'].includes(mealSlot)) return [];

  const candidates = activeSlotMenuItems.filter((item) =>
    item.jenis_makanan.toUpperCase() === category && matchesKelas(item.kelas, patientKelas),
  );

  if (category === 'BUAH' && candidates.length === 0) return [];

  const valid = [...new Set(codes.map((code) => code.trim().toUpperCase()))].filter((code) => {
    if (category !== 'SNACK') return true;
    if (code === 'SNACK_PAGI') return mealSlot === 'PAGI';
    if (code === 'SNACK_SIANG' || code === 'SNACK_SORE') return mealSlot === 'SIANG';
    return true;
  });
  if (valid.length === 0) return [];

  // Diet per tag (BUAH/SNACK kini sama seperti jenis lain).
  // Prioritas: tag persis kode pasien → hidangan wildcard tanpa tag
  // (kompatibilitas data lama, 1 porsi) → DIIT per kode → missing per kode.
  const exactAny = candidates.find((dish) => {
    if (isDiitDish(dish) || !dish.kategori_menu) return false;
    const dishTags = extractCodes(dish.kategori_menu);
    return valid.some((code) =>
      dishTags.some((dt) => dt.toUpperCase() === code.toUpperCase()),
    );
  });
  if (exactAny) {
    if (isDiitDish(exactAny)) {
      const matchedCode =
        valid.find((code) =>
          extractCodes(exactAny.kategori_menu).some(
            (dt) => dt.toUpperCase() === code.toUpperCase(),
          ),
        ) || valid[0];
      return [buildDiitFallbackDish(exactAny, matchedCode)];
    }
    return [
      {
        code: `MENU-${exactAny.id}`,
        name: exactAny.nama_makanan,
        category,
        kelas: exactAny.kelas,
        dietTag: exactAny.kategori_menu || undefined,
        catatan: exactAny.catatan || undefined,
      },
    ];
  }
  const wildcard = candidates.find(
    (dish) => !isDiitDish(dish) && extractCodes(dish.kategori_menu).length === 0,
  );
  if (wildcard) {
    return [
      {
        code: `MENU-${wildcard.id}`,
        name: wildcard.nama_makanan,
        category,
        kelas: wildcard.kelas,
        dietTag: wildcard.kategori_menu || undefined,
        catatan: wildcard.catatan || undefined,
      },
    ];
  }
  const diitOnly = candidates.find((dish) => isDiitDish(dish));
  if (diitOnly) {
    return valid.map((code) => buildDiitFallbackDish(diitOnly, code));
  }
  // Tidak ada hidangan cocok/tag/wildcard/DIIT: tandai missing per kode
  // (kasus BUAH tanpa kandidat sudah return [] di atas).
  return valid.map((code) => buildMissingCycleMenuDish(code, category, patientKelas));
}

/**
 * Resolve candidate main dishes (Hewani, Nabati, Sayur) for a patient with combined dish consolidation
 */
function resolvePatientMainDishes(
  activeSlotMenuItems: Array<typeof masterSiklusMenuTable.$inferSelect>,
  pKelas: string,
  categoryCodes: {
    HEWANI: string[];
    NABATI: string[];
    SAYUR: string[];
  },
): DishCounter[] {
  const resolvedCategories: Array<{
    jenis: 'HEWANI' | 'NABATI' | 'SAYUR';
    dish: DishCounter;
  }> = [];

  const mainKinds: Array<'HEWANI' | 'NABATI' | 'SAYUR'> = [
    'HEWANI',
    'NABATI',
    'SAYUR',
  ];

  for (const jenis of mainKinds) {
    const targetCodes = categoryCodes[jenis] || [];
    if (targetCodes.length === 0) continue;

    const candidates = activeSlotMenuItems.filter(
      (m) =>
        m.jenis_makanan.toUpperCase() === jenis &&
        matchesKelas(m.kelas, pKelas),
    );

    if (candidates.length > 0) {
      // Semua jenis (HEWANI/NABATI/SAYUR) memakai diet per tag.
      // Prioritas: tag persis kode pasien → wildcard tanpa tag
      // (kompatibilitas data lama) → DIIT/missing per kode.
      const exactMatch = candidates.find((dish) => {
        if (!dish.kategori_menu) return false;
        const dishTags = extractCodes(dish.kategori_menu);
        return targetCodes.some((kc) =>
          dishTags.some((dt) => dt.toUpperCase() === kc.toUpperCase()),
        );
      });

      if (exactMatch) {
        // Hidangan DIIT yang kebetulan ikut ter-tag kode spesifik:
        // tag tampil tetap kode diet yang diminta (mis. DH tetap DH).
        if (isDiitDish(exactMatch)) {
          const matchedCode = targetCodes.find((kc) =>
            extractCodes(exactMatch.kategori_menu).some(
              (dt) => dt.toUpperCase() === kc.toUpperCase(),
            ),
          );
          if (matchedCode) {
            resolvedCategories.push({
              jenis,
              dish: buildDiitFallbackDish(exactMatch, matchedCode),
            });
          } else {
            resolvedCategories.push({
              jenis,
              dish: {
                code: `MENU-${exactMatch.id}`,
                name: exactMatch.nama_makanan,
                category: mapCategoryGroup(exactMatch.jenis_makanan),
                kelas: exactMatch.kelas,
                dietTag: exactMatch.kategori_menu || undefined,
                catatan: exactMatch.catatan || undefined,
              },
            });
          }
        } else {
          resolvedCategories.push({
            jenis,
            dish: {
              code: `MENU-${exactMatch.id}`,
              name: exactMatch.nama_makanan,
              category: mapCategoryGroup(exactMatch.jenis_makanan),
              kelas: exactMatch.kelas,
              dietTag: exactMatch.kategori_menu || undefined,
              catatan: exactMatch.catatan || undefined,
            },
          });
        }
      } else {
        // Tidak ada tag cocok: hidangan wildcard tanpa tag menampung
        // semua diet (kompatibilitas data lama, 1 porsi).
        const wildcard = candidates.find(
          (dish) => !isDiitDish(dish) && extractCodes(dish.kategori_menu).length === 0,
        );
        if (wildcard) {
          resolvedCategories.push({
            jenis,
            dish: {
              code: `MENU-${wildcard.id}`,
              name: wildcard.nama_makanan,
              category: mapCategoryGroup(wildcard.jenis_makanan),
              kelas: wildcard.kelas,
              dietTag: wildcard.kategori_menu || undefined,
              catatan: wildcard.catatan || undefined,
            },
          });
        } else {
          // Tag terisi tapi tidak ada hidangan spesifik di slot ini:
          // arahkan ke hidangan penampung DIIT (tag tampil tetap kode mapping).
          const diitMatch = candidates.find((dish) => isDiitDish(dish));
          for (const tc of targetCodes) {
            resolvedCategories.push({
              jenis,
              dish: diitMatch
                ? buildDiitFallbackDish(diitMatch, tc)
                : buildMissingCycleMenuDish(tc, jenis, pKelas),
            });
          }
        }
      }
    } else {
      for (const tc of targetCodes) {
        resolvedCategories.push({
          jenis,
          dish: buildMissingCycleMenuDish(tc, jenis, pKelas),
        });
      }
    }
  }

  // Deduplicate and consolidate combined dishes (e.g. LOAF AYAM TAHU in Hewani & Nabati)
  const hewaniEntry = resolvedCategories.find((r) => r.jenis === 'HEWANI');
  const nabatiEntry = resolvedCategories.find((r) => r.jenis === 'NABATI');
  const sayurEntry = resolvedCategories.find((r) => r.jenis === 'SAYUR');

  const normHewani = normalizeDishName(hewaniEntry?.dish.name);
  const normNabati = normalizeDishName(nabatiEntry?.dish.name);
  const normSayur = normalizeDishName(sayurEntry?.dish.name);

  const finalDishes: DishCounter[] = [];
  const handled = new Set<string>();

  // 1. Check Hewani + Nabati match (e.g. LOAF AYAM TAHU)
  // Hidangan DIIT tidak digabung lintas jenis agar tag diet per kartu tetap jelas.
  if (
    hewaniEntry &&
    nabatiEntry &&
    !hewaniEntry.dish.isDiit &&
    !nabatiEntry.dish.isDiit &&
    normHewani &&
    normNabati &&
    normHewani === normNabati &&
    !normHewani.includes('tidak terdaftar')
  ) {
    handled.add('HEWANI');
    handled.add('NABATI');
    finalDishes.push({
      ...hewaniEntry.dish,
      category: 'HEWANI & NABATI',
      catatan:
        hewaniEntry.dish.catatan ||
        nabatiEntry.dish.catatan ||
        'Lauk gabungan Hewani & Nabati',
    });
  }

  // 2. Check Nabati + Sayur match
  if (
    !handled.has('NABATI') &&
    nabatiEntry &&
    sayurEntry &&
    !nabatiEntry.dish.isDiit &&
    !sayurEntry.dish.isDiit &&
    normNabati &&
    normSayur &&
    normNabati === normSayur &&
    !normNabati.includes('tidak terdaftar')
  ) {
    handled.add('NABATI');
    handled.add('SAYUR');
    finalDishes.push({
      ...nabatiEntry.dish,
      category: 'NABATI & SAYUR',
      catatan:
        nabatiEntry.dish.catatan ||
        sayurEntry.dish.catatan ||
        'Lauk gabungan Nabati & Sayur',
    });
  }

  // 3. Check Hewani + Sayur match
  if (
    !handled.has('HEWANI') &&
    !handled.has('SAYUR') &&
    hewaniEntry &&
    sayurEntry &&
    !hewaniEntry.dish.isDiit &&
    !sayurEntry.dish.isDiit &&
    normHewani &&
    normSayur &&
    normHewani === normSayur &&
    !normHewani.includes('tidak terdaftar')
  ) {
    handled.add('HEWANI');
    handled.add('SAYUR');
    finalDishes.push({
      ...hewaniEntry.dish,
      category: 'HEWANI & SAYUR',
      catatan:
        hewaniEntry.dish.catatan ||
        sayurEntry.dish.catatan ||
        'Lauk gabungan Hewani & Sayur',
    });
  }

  // Add all remaining individual categories
  for (const entry of resolvedCategories) {
    if (!handled.has(entry.jenis)) {
      finalDishes.push(entry.dish);
    }
  }

  return finalDishes;
}

/**
 * Fetch live overview monitoring data decomposed and translated through active Siklus Menu & Patient Class
 */
export async function getLiveMonitoringData(): Promise<MonitoringSummary> {
  try {
    // 1. Fetch time configurations
    const timeConfigs = await db.select().from(waktuMakanTable);

    // 2. Find next unlocked cycle
    let nextCycle = getNextCycle(timeConfigs);

    // Check up to 4 cycles ahead to find the first unlocked one
    for (let i = 0; i < 4; i++) {
      const [existingBatch] = await db
        .select()
        .from(snapshotBatchTable)
        .where(
          and(
            eq(snapshotBatchTable.tanggal_produksi, nextCycle.tanggalProduksi),
            eq(snapshotBatchTable.waktu_makan, nextCycle.waktuMakan),
          ),
        )
        .limit(1);

      if (!existingBatch) {
        break;
      }

      nextCycle = getNextCycleAfter(nextCycle, timeConfigs);
    }

    // 3. Compute Target Production Date & Day Info (WIB sentral)
    const currentHari = getWibHari(nextCycle.tanggalProduksi);

    const tanggalFormatted = formatIndoFull(nextCycle.tanggalProduksi);

    // 4. Resolve Active Master Siklus for the target date
    const allMasterCycles = await db
      .select()
      .from(masterSiklusTable)
      .where(eq(masterSiklusTable.is_active, true))
      .orderBy(asc(masterSiklusTable.nomor_siklus));

    // Resolve cycle using continuous auto-looping rotation and Day 31 / Siklus 11 rule
    const cycleResolution = resolveActiveCycleForDate(
      nextCycle.tanggalProduksi,
      allMasterCycles,
    );
    const activeCycleNumber = cycleResolution.activeCycleNum;
    const activeCycleNama = cycleResolution.activeCycleNama;
    const activeCycleDeskripsi =
      cycleResolution.activeCycleDeskripsi ||
      `Siklus menu ${activeCycleNama} untuk hari ${currentHari}`;

    // 5. Fetch Menu Items from master_siklus_menu for this cycle & waktu_makan
    // Standardize meal time matching: e.g. MALAM matches SORE or MALAM
    const targetWaktuMakan = nextCycle.waktuMakan.toUpperCase();
    const waktuMakanFilter =
      targetWaktuMakan === 'MALAM' ? ['MALAM', 'SORE'] : [targetWaktuMakan];

    const cycleMenuItems = await db
      .select()
      .from(masterSiklusMenuTable)
      .where(
        and(
          eq(masterSiklusMenuTable.siklus_ke, activeCycleNumber),
          eq(masterSiklusMenuTable.is_active, true),
        ),
      )
      .orderBy(
        asc(masterSiklusMenuTable.jenis_makanan),
        asc(masterSiklusMenuTable.id),
      );

    const activeSlotMenuItems = cycleMenuItems.filter((item) =>
      waktuMakanFilter.includes(item.waktu_makan.toUpperCase()),
    );

    // 6. Fetch Master Menu Categories for human-readable labels (BN -> Biasa Nasi, etc.)
    const masterMenuItems = await db.select().from(kategoriMenuTable);
    const labelMap = new Map<string, string>();
    for (const item of masterMenuItems) {
      labelMap.set(item.kode_item.toUpperCase(), item.label_item);
    }

    // Kode bentuk yang otomatis teralihkan ke Live Katering (flag tugas AG Katering)
    const tugasKateringCodes = new Set(
      masterMenuItems
        .filter(
          (item) =>
            (item as { is_tugas_ag_katering?: boolean })
              .is_tugas_ag_katering,
        )
        .map((item) => item.kode_item.trim().toUpperCase()),
    );

    // Common default labels for medical diets & food items
    const defaultLabels: Record<string, string> = {
      BN: 'Biasa Nasi',
      BL: 'Biasa Lunak',
      BC: 'Biasa Cincang',
      TIM: 'Nasi Tim',
      TM: 'Nasi Tim',
      SAR: 'Bubur Saring',
      CAIR: 'Makanan Cair',
      CAI: 'Makanan Cair',
      TKTP: 'Tinggi Kalori Tinggi Protein',
      DM: 'Diabetes Melitus',
      RG: 'Rendah Garam',
      RP: 'Rendah Protein',
      RL: 'Rendah Lemak',
      RPU: 'Rendah Purin',
      DH: 'Diet Hati',
      DJ: 'Diet Jantung',
      DL: 'Diet Lambung',
      BIASA: 'Diet Biasa Standar',
      PUTEL: 'Putih Telur Rebus',
      'P-TLR': 'Putih Telur Rebus',
      'TLR-D': 'Telur Dadar',
      'AYM-G': 'Ayam Ungkep Goreng',
      'DND-S': 'Daging Sapi Semur',
      'IKN-B': 'Ikan Bakar',
      'TMP-B': 'Tempe Bacem',
      'TFU-G': 'Tahu Goreng',
      'PSG-A': 'Pisang Ambon',
      'PPY-S': 'Pepaya Potong',
      'JRK-M': 'Jeruk Manis',
      SGP: 'Snack Gula Pasir',
      SRP: 'Snack Rendah Protein',
      NPO: 'Puasa / NPO',
      UNMAPPED: 'Belum Di-mapping',
    };

    function resolveKarboDishes(
      codes: string[],
      bentukCodes: string[],
      kelas: string,
    ): DishCounter[] {
      const category: MenuCategoryGroup = bentukCodes.some((code) =>
        ['SAR', 'SARING'].includes(code.toUpperCase()),
      ) ? 'SARING' : 'POKOK';
      // Karbohidrat tidak memakai diet: satu hidangan slot dipakai semua pasien.
      // Kode pasien diabaikan, kelas tidak difilter.
      const karboSlotItems = activeSlotMenuItems.filter(
        (item) => item.jenis_makanan.toUpperCase() === 'KARBOHIDRAT',
      );
      const hidangan = karboSlotItems[0];
      const valid = codes.filter(
        (code) => !['NPO', 'PUASA'].includes(code.toUpperCase()),
      );
      if (valid.length === 0) return [];
      // Satu hidangan untuk semua kode: kembalikan 1 porsi per pasien,
      // bukan 1 per kode, agar tidak hitung ganda.
      if (hidangan) {
        return [
          {
            code: `MENU-${hidangan.id}`,
            name: hidangan.nama_makanan,
            category: mapCategoryGroup(hidangan.jenis_makanan),
            kelas: hidangan.kelas,
            dietTag: hidangan.kategori_menu || undefined,
            catatan: hidangan.catatan || undefined,
          },
        ];
      }
      return valid.map((code) => buildMissingCycleMenuDish(code, category, kelas));
    }

    // 7. Fetch Master Diet Mappings
    const masterMappings = await db
      .select()
      .from(dietMappingTable)
      .where(eq(dietMappingTable.is_active, true));

    const mappingByRaw = new Map<
      string,
      {
        bentuk_makanan: string | null;
        karbohidrat: string | null;
        kategori_diet: string | null;
        nabati: string | null;
        sayur: string | null;
        extra: string | null;
        buah: string | null;
        snack: string | null;
        status_mapping: string;
      }
    >();

    for (const m of masterMappings) {
      let nabati = m.nabati;
      let sayur = m.sayur;
      if (!nabati && !sayur && m.extra) {
        const parts = m.extra.split(',').map((s) => s.trim());
        nabati = parts[0] || null;
        sayur = parts[1] || null;
      }
      mappingByRaw.set(m.diet_rs_raw.trim().toLowerCase(), {
        bentuk_makanan: m.bentuk_makanan,
        karbohidrat: m.karbohidrat,
        kategori_diet: m.kategori_diet,
        nabati,
        sayur,
        extra: m.extra,
        buah: m.buah,
        snack: m.snack,
        status_mapping: m.status_mapping,
      });
    }

    // 8. Fetch all live active patients (excluding unapproved pending revisions)
    const pendingRevisions = await db
      .select({
        pasien_id: otorisasiPerubahanDietTable.pasien_id,
        jenis_perubahan: otorisasiPerubahanDietTable.jenis_perubahan,
      })
      .from(otorisasiPerubahanDietTable)
      .where(eq(otorisasiPerubahanDietTable.status, 'PENDING'));

    const pendingNewPatientIds = new Set(
      pendingRevisions
        .filter((r) => r.jenis_perubahan === 'NEW_PATIENT')
        .map((r) => r.pasien_id)
    );

    const allPatients = await db
      .select({
        id: pasienTable.id,
        nama_pasien: pasienTable.nama_pasien,
        diet: pasienTable.diet,
        kelas: pasienTable.kelas,
        is_npo: pasienTable.is_npo,
        status_pasien: pasienTable.status_pasien,
      })
      .from(pasienTable)
      .where(
        and(
          ne(pasienTable.status_pasien, 'PULANG'),
          ne(pasienTable.status_pasien, 'PENDING_REVISI'),
        )
      );

    const activePatients = allPatients.filter(
      (p) => !pendingNewPatientIds.has(p.id)
    );

    // ─── TRANSLATION ENGINE: Map Patients to Menu Cycle Dishes ──────────────
    // Helper to translate a patient's requirements into actual menu items in the cycle
    interface DishCounter {
      code: string;
      name: string;
      category: MenuCategoryGroup;
      kelas?: string;
      dietTag?: string;
      catatan?: string;
      isDiit?: boolean;
    }

    const liveDishes: Record<
      string,
      { count: number; meta: DishCounter; breakdown: Record<string, number> }
    > = {};

    function dishKey(item: DishCounter): string {
      const base = `${item.category}:${item.name.trim()}`;
      // Hidangan DIIT dipakai banyak diet: bedakan kartu per kode diet (DH tetap DH).
      return item.isDiit ? `${base}:DIIT:${(item.dietTag || '-').toUpperCase()}` : base;
    }

    function addLiveDish(
      item: DishCounter,
      amount = 1,
      contributors: string[] = [],
    ) {
      if (!item.name || !item.name.trim()) return;
      const key = dishKey(item);
      if (!liveDishes[key]) {
        liveDishes[key] = { count: 0, meta: item, breakdown: {} };
      }
      liveDishes[key].count += amount;
      const dietCodes = normalizeDietCodes(contributors);
      // Fallback: bila pemicu kosong tapi hidangan DIIT bawa 1 kode, pakai itu.
      // Ini menjaga kartu DIIT tetap tampil RL: 1 walau pemanggil lupa kirim kode.
      const effective =
        dietCodes.length > 0
          ? dietCodes.slice(0, 1)
          : item.isDiit
            ? normalizeDietCodes([item.dietTag || '']).slice(0, 1)
            : [];
      for (const diet of effective) {
        liveDishes[key].breakdown[diet] =
          (liveDishes[key].breakdown[diet] || 0) + amount;
      }
    }

    function resolveMainDishContributors(
      dish: DishCounter,
      hewaniCodes: string[],
      nabatiCodes: string[],
      sayurCodes: string[],
    ): string[] {
      // DIIT dan missing sudah bawa 1 kode spesifik di dietTag / code.
      if (dish.isDiit) {
        return normalizeDietCodes([dish.dietTag || '']).slice(0, 1);
      }
      if ((dish.name || '').toLowerCase().includes('tidak terdaftar')) {
        const fromCode = normalizeDietCodes([dish.code || '']);
        if (fromCode.length > 0) return fromCode.slice(0, 1);
      }
      const cat = (dish.category || '').toUpperCase();
      if (cat === 'HEWANI') {
        return pickDietContributors(hewaniCodes, dish.dietTag);
      }
      if (cat === 'NABATI') {
        return pickDietContributors(nabatiCodes, dish.dietTag);
      }
      if (cat === 'SAYUR') {
        return pickDietContributors(sayurCodes, dish.dietTag);
      }
      // Gabungan (HEWANI & NABATI, dsb): 1 pasien tetap 1 hitung rincian,
      // pakai diet utama agar total sama dengan porsi.
      return primaryDietCodes(hewaniCodes, nabatiCodes, sayurCodes);
    }

    // Process each active patient
    for (const p of activePatients) {
      // Explicit medical status flag: NPO completely excluded from kitchen production dishes
      if (isNpoPatient(p)) {
        continue;
      }

      const rawDiet = (p.diet || '').trim();
      if (!rawDiet) continue;

      // Lookup in master diet mapping
      const mapped = mappingByRaw.get(rawDiet.toLowerCase());

      // STRICT RULE: If not mapped or status is not MAPPED, do NOT generate production dishes
      if (!mapped || mapped.status_mapping !== 'MAPPED') {
        continue;
      }

      const pKelas = p.kelas || 'KELAS I';

      const bentukCodes = extractCodes(mapped.bentuk_makanan);
      // Aturan dapur Saring: BSS ASIN otomatis jadi BSS MANIS di PAGI/MALAM
      // (display-level; nilai mapping di DB tidak diubah).
      const karboCodes = normalizeSaringKarboForWaktu(
        bentukCodes,
        extractCodes(mapped.karbohidrat),
        targetWaktuMakan,
      );
      const hewaniCodes = extractCodes(mapped.kategori_diet);
      const nabatiCodes = extractCodes(mapped.nabati);
      const sayurCodes = extractCodes(mapped.sayur);
      const extraCodes = extractCodes(mapped.extra);
      const buahCodes = extractCodes(mapped.buah);
      const snackCodes = extractCodes(mapped.snack);

      // Check if mapped to NPO / Puasa
      const isNpoMapped =
        bentukCodes.some((c) => c.toUpperCase() === 'NPO' || c.toUpperCase() === 'PUASA') ||
        hewaniCodes.some((c) => c.toUpperCase() === 'NPO' || c.toUpperCase() === 'PUASA');

      if (isNpoMapped) {
        continue;
      }

      // Pengalihan ke Live Katering: otomatis bila kode bentuk berflag tugas
      // AG Katering; sentinel 'KATERING' lama tetap didukung (kompatibilitas) -> skip live production entirely
      const isKateringMapped =
        isKateringBentuk(bentukCodes, tugasKateringCodes) ||
        hewaniCodes.some((c) => isLegacyKateringCode(c));

      if (isKateringMapped) {
        continue;
      }

      // A. Makanan Pokok / Kategori Diet (e.g. BN -> Nasi Biasa, BL/TIM -> Nasi Tim, SAR -> Bubur Saring, CAIR -> Cair)
      const stapleContributors = primaryDietCodes(hewaniCodes, nabatiCodes, sayurCodes);
      if (karboCodes.length > 0) {
        for (const dish of resolveKarboDishes(karboCodes, bentukCodes, pKelas)) {
          const fallback =
            stapleContributors.length > 0
              ? stapleContributors
              : normalizeDietCodes([dish.code || '']);
          addLiveDish(dish, 1, fallback);
        }
      } else if (bentukCodes.length > 0) {
        for (const code of bentukCodes) {
          const upperCode = code.toUpperCase();
          if (upperCode === 'NPO' || upperCode === 'PUASA') continue;

          let stapleName: string | null = 'Nasi Biasa';
          let stapleCategory: MenuCategoryGroup = 'POKOK';
          if (upperCode === 'BN' || upperCode === 'BIASA')
            stapleName = 'Nasi Biasa';
          else if (upperCode === 'BL' || upperCode === 'LUNAK')
            stapleName = 'Nasi Tim / Lunak';
          else if (upperCode === 'TIM' || upperCode === 'TM')
            stapleName = 'Nasi Tim';
          else if (upperCode === 'SAR' || upperCode === 'SARING') {
            stapleName = 'Bubur Saring';
            stapleCategory = 'SARING';
          } else if (upperCode === 'CAIR' || upperCode === 'CAI')
            stapleName = 'Makanan Cair';
          else {
            const knownStaple =
              labelMap.get(upperCode) || defaultLabels[upperCode];
            if (knownStaple) {
              stapleName = knownStaple;
            } else {
              // Kode mapping tidak dikenal di master maupun siklus → tandai missing secara eksplisit.
              const missing = buildMissingCycleMenuDish(code, 'POKOK', pKelas);
              addLiveDish(
                missing,
                1,
                stapleContributors.length > 0
                  ? stapleContributors
                  : normalizeDietCodes([code]),
              );
              continue;
            }
          }

          addLiveDish(
            {
              code: upperCode,
              name: stapleName,
              category: stapleCategory,
              kelas: pKelas,
            },
            1,
            stapleContributors.length > 0
              ? stapleContributors
              : normalizeDietCodes([upperCode]),
          );
        }
      }

      // B. Main dishes from active menu cycle (HEWANI, NABATI, SAYUR with combined dish consolidation)
      const mainDishes = resolvePatientMainDishes(
        activeSlotMenuItems,
        pKelas,
        {
          HEWANI: hewaniCodes,
          NABATI: nabatiCodes,
          SAYUR: sayurCodes,
        },
      );
      for (const dish of mainDishes) {
        addLiveDish(
          dish,
          1,
          resolveMainDishContributors(dish, hewaniCodes, nabatiCodes, sayurCodes),
        );
      }


      // C. Extra dishes (e.g. PUTEL -> Putih Telur Rebus)
      if (extraCodes.length > 0) {
        for (const code of extraCodes) {
          const upperCode = code.toUpperCase();
          const extraName =
            labelMap.get(upperCode) || defaultLabels[upperCode];
          if (extraName) {
            addLiveDish(
              {
                code: upperCode,
                name: extraName,
                category: 'EXTRA',
                kelas: pKelas,
              },
              1,
              stapleContributors.length > 0
                ? stapleContributors
                : normalizeDietCodes([upperCode]),
            );
          } else {
            const missingExtra = buildMissingCycleMenuDish(code, 'EXTRA', pKelas);
            addLiveDish(
              missingExtra,
              1,
              stapleContributors.length > 0
                ? stapleContributors
                : normalizeDietCodes([code]),
            );
          }
        }
      }

      for (const dish of resolveSupplementDishes(activeSlotMenuItems, 'BUAH', buahCodes, pKelas, targetWaktuMakan)) {
        addLiveDish(
          dish,
          1,
          dish.isDiit
            ? normalizeDietCodes([dish.dietTag || ''])
            : stapleContributors.length > 0
              ? stapleContributors
              : normalizeDietCodes([dish.code || dish.dietTag || '']),
        );
      }
      for (const dish of resolveSupplementDishes(activeSlotMenuItems, 'SNACK', snackCodes, pKelas, targetWaktuMakan)) {
        addLiveDish(
          dish,
          1,
          dish.isDiit
            ? normalizeDietCodes([dish.dietTag || ''])
            : stapleContributors.length > 0
              ? stapleContributors
              : normalizeDietCodes([dish.code || dish.dietTag || '']),
        );
      }
    }

    // 9. Fetch baseline counts from the latest LOCKED snapshot batch
    const [latestBatch] = await db
      .select()
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.timestamp_snapshot))
      .limit(1);

    const snapshotDishes: Record<
      string,
      { count: number; meta: DishCounter; breakdown: Record<string, number> }
    > = {};

    function addSnapshotDish(
      item: DishCounter,
      amount = 1,
      contributors: string[] = [],
    ) {
      if (!item.name || !item.name.trim()) return;
      const key = dishKey(item);
      if (!snapshotDishes[key]) {
        snapshotDishes[key] = { count: 0, meta: item, breakdown: {} };
      }
      snapshotDishes[key].count += amount;
      const dietCodes = normalizeDietCodes(contributors);
      const effective =
        dietCodes.length > 0
          ? dietCodes.slice(0, 1)
          : item.isDiit
            ? normalizeDietCodes([item.dietTag || '']).slice(0, 1)
            : [];
      for (const diet of effective) {
        snapshotDishes[key].breakdown[diet] =
          (snapshotDishes[key].breakdown[diet] || 0) + amount;
      }
    }

    if (latestBatch) {
      const snapshotDetails = await db
        .select({
          diet_rs_raw: snapshotDetailTable.diet_rs_raw,
          kelas: snapshotDetailTable.kelas,
          bentuk_makanan: snapshotDetailTable.bentuk_makanan,
          karbohidrat: snapshotDetailTable.karbohidrat,
          kategori_diet: snapshotDetailTable.kategori_diet,
          nabati: snapshotDetailTable.nabati,
          sayur: snapshotDetailTable.sayur,
          extra: snapshotDetailTable.extra,
          buah: snapshotDetailTable.buah,
          snack: snapshotDetailTable.snack,
          status_saat_snapshot: snapshotDetailTable.status_saat_snapshot,
        })
        .from(snapshotDetailTable)
        .where(eq(snapshotDetailTable.batch_id, latestBatch.id));

      for (const sd of snapshotDetails) {
        if (isNpoPatient(sd)) {
          continue;
        }

        const rawDiet = (sd.diet_rs_raw || '').trim();
        const pKelas = sd.kelas || 'KELAS I';
        let bentukCodes = extractCodes(sd.bentuk_makanan);
        let karboCodes = extractCodes(sd.karbohidrat);
        let hewaniCodes = extractCodes(sd.kategori_diet);
        let nabatiCodes = extractCodes(sd.nabati);
        let sayurCodes = extractCodes(sd.sayur);
        let extraCodes = extractCodes(sd.extra);
        let buahCodes = extractCodes(sd.buah);
        let snackCodes = extractCodes(sd.snack);

        // Fallback to mapping by raw text if parsed columns are empty
        if (!sd.bentuk_makanan && !sd.karbohidrat && !sd.kategori_diet && rawDiet) {
          const mapped = mappingByRaw.get(rawDiet.toLowerCase());
          if (mapped && mapped.status_mapping === 'MAPPED') {
            bentukCodes = extractCodes(mapped.bentuk_makanan);
            karboCodes = extractCodes(mapped.karbohidrat);
            hewaniCodes = extractCodes(mapped.kategori_diet);
            nabatiCodes = extractCodes(mapped.nabati);
            sayurCodes = extractCodes(mapped.sayur);
            extraCodes = extractCodes(mapped.extra);
            buahCodes = extractCodes(mapped.buah);
            snackCodes = extractCodes(mapped.snack);
          }
        }

        // If not mapped, do not add snapshot dishes
        if (
          bentukCodes.length === 0 &&
          karboCodes.length === 0 &&
          hewaniCodes.length === 0 &&
          nabatiCodes.length === 0 &&
          sayurCodes.length === 0 &&
          extraCodes.length === 0 &&
          buahCodes.length === 0 &&
          snackCodes.length === 0
        ) {
          continue;
        }

        const isNpoMapped =
          bentukCodes.some((c) => c.toUpperCase() === 'NPO' || c.toUpperCase() === 'PUASA') ||
          hewaniCodes.some((c) => c.toUpperCase() === 'NPO' || c.toUpperCase() === 'PUASA');

        if (isNpoMapped) {
          continue;
        }

        // Pengalihan ke Live Katering: otomatis via flag tugas (sentinel lama tetap didukung) -> skip live production snapshot entirely
        const isKateringMapped =
          isKateringBentuk(bentukCodes, tugasKateringCodes) ||
          hewaniCodes.some((c) => isLegacyKateringCode(c));

        if (isKateringMapped) {
          continue;
        }

        // Staple
        // Aturan dapur Saring: BSS ASIN otomatis jadi BSS MANIS di PAGI/MALAM
        // (display-level; nilai snapshot di DB tidak diubah).
        karboCodes = normalizeSaringKarboForWaktu(
          bentukCodes,
          karboCodes,
          targetWaktuMakan,
        );
        const snapStapleContributors = primaryDietCodes(hewaniCodes, nabatiCodes, sayurCodes);
        if (karboCodes.length > 0) {
          for (const dish of resolveKarboDishes(karboCodes, bentukCodes, pKelas)) {
            addSnapshotDish(
              dish,
              1,
              snapStapleContributors.length > 0
                ? snapStapleContributors
                : normalizeDietCodes([dish.code || '']),
            );
          }
        } else if (bentukCodes.length > 0) {
          for (const code of bentukCodes) {
            const upperCode = code.toUpperCase();
            if (upperCode === 'NPO' || upperCode === 'PUASA') continue;

            let stapleName: string | null = 'Nasi Biasa';
            let stapleCategory: MenuCategoryGroup = 'POKOK';
            if (upperCode === 'BN' || upperCode === 'BIASA')
              stapleName = 'Nasi Biasa';
            else if (upperCode === 'BL' || upperCode === 'LUNAK')
              stapleName = 'Nasi Tim / Lunak';
            else if (upperCode === 'TIM' || upperCode === 'TM')
              stapleName = 'Nasi Tim';
            else if (upperCode === 'SAR' || upperCode === 'SARING') {
              stapleName = 'Bubur Saring';
              stapleCategory = 'SARING';
            } else if (upperCode === 'CAIR' || upperCode === 'CAI')
              stapleName = 'Makanan Cair';
            else {
              const knownStaple =
                labelMap.get(upperCode) || defaultLabels[upperCode];
              if (knownStaple) {
                stapleName = knownStaple;
              } else {
                // Kode mapping tidak dikenal di master maupun siklus → tandai missing secara eksplisit.
                const missingStaple = buildMissingCycleMenuDish(code, 'POKOK', pKelas);
                addSnapshotDish(
                  missingStaple,
                  1,
                  snapStapleContributors.length > 0
                    ? snapStapleContributors
                    : normalizeDietCodes([code]),
                );
                continue;
              }
            }

            addSnapshotDish(
              {
                code: upperCode,
                name: stapleName,
                category: stapleCategory,
                kelas: pKelas,
              },
              1,
              snapStapleContributors.length > 0
                ? snapStapleContributors
                : normalizeDietCodes([upperCode]),
            );
          }
        }

        // Main dishes from cycle with combined dish consolidation
        const mainDishes = resolvePatientMainDishes(
          activeSlotMenuItems,
          pKelas,
          {
            HEWANI: hewaniCodes,
            NABATI: nabatiCodes,
            SAYUR: sayurCodes,
          },
        );
        for (const dish of mainDishes) {
          addSnapshotDish(
            dish,
            1,
            resolveMainDishContributors(dish, hewaniCodes, nabatiCodes, sayurCodes),
          );
        }


        // Extra
        if (extraCodes.length > 0) {
          for (const code of extraCodes) {
            const upperCode = code.toUpperCase();
            const extraName =
              labelMap.get(upperCode) || defaultLabels[upperCode];
            if (extraName) {
              addSnapshotDish(
                {
                  code: upperCode,
                  name: extraName,
                  category: 'EXTRA',
                  kelas: pKelas,
                },
                1,
                snapStapleContributors.length > 0
                  ? snapStapleContributors
                  : normalizeDietCodes([upperCode]),
              );
            } else {
              const missingSnapExtra = buildMissingCycleMenuDish(code, 'EXTRA', pKelas);
              addSnapshotDish(
                missingSnapExtra,
                1,
                snapStapleContributors.length > 0
                  ? snapStapleContributors
                  : normalizeDietCodes([code]),
              );
            }
          }
        }

      for (const dish of resolveSupplementDishes(activeSlotMenuItems, 'BUAH', buahCodes, pKelas, targetWaktuMakan)) {
          addSnapshotDish(
            dish,
            1,
            dish.isDiit
              ? normalizeDietCodes([dish.dietTag || ''])
              : snapStapleContributors.length > 0
                ? snapStapleContributors
                : normalizeDietCodes([dish.code || dish.dietTag || '']),
          );
        }
      for (const dish of resolveSupplementDishes(activeSlotMenuItems, 'SNACK', snackCodes, pKelas, targetWaktuMakan)) {
          addSnapshotDish(
            dish,
            1,
            dish.isDiit
              ? normalizeDietCodes([dish.dietTag || ''])
              : snapStapleContributors.length > 0
                ? snapStapleContributors
                : normalizeDietCodes([dish.code || dish.dietTag || '']),
          );
        }
      }
    }

    // 10. Construct Unified Cards
    const allDishKeys = new Set([
      ...Object.keys(liveDishes),
      ...Object.keys(snapshotDishes),
    ]);

    const categoryOrder: Record<string, number> = {
      POKOK: 1,
      HEWANI: 2,
      'HEWANI & NABATI': 2.5,
      NABATI: 3,
      'NABATI & SAYUR': 3.5,
      SAYUR: 4,
      'HEWANI & SAYUR': 4.5,
      SARING: 5,
      EXTRA: 6,
      BUAH: 7,
      SNACK: 8,
      LAINNYA: 9,
    };

    let totalPorsi = 0;

    const cards: MonitoringCardData[] = Array.from(allDishKeys)
      .map((key) => {
        const liveInfo = liveDishes[key];
        const snapshotInfo = snapshotDishes[key];
        const meta = liveInfo?.meta || snapshotInfo?.meta;

        const activeCount = liveInfo?.count || 0;
        const baselineCount = snapshotInfo?.count || 0;
        const changeCount = activeCount - baselineCount;

        totalPorsi += activeCount;

        // Rincian produksi pakai data live bila ada, kalau kosong pakai baseline.
        // Ini agar kartu tetap tampil RL: x walau live 0 tapi snapshot ada isi.
        const sourceBreakdown =
          liveInfo && Object.keys(liveInfo.breakdown || {}).length > 0
            ? liveInfo.breakdown
            : snapshotInfo?.breakdown || {};
        const dietBreakdown = Object.entries(sourceBreakdown)
          .map(([diet, count]) => ({ diet, count }))
          .sort((a, b) => a.diet.localeCompare(b.diet));

        return {
          code: meta?.code || key,
          name: meta?.name || key,
          category: meta?.category || 'LAINNYA',
          kelas: meta?.kelas,
          dietTag: meta?.dietTag,
          dietBreakdown,
          catatan: meta?.catatan,
          isDiit: meta?.isDiit,
          baseline: baselineCount,
          active: activeCount,
          change: changeCount,
        };
      })
      .filter((card) => card.active > 0 || card.baseline > 0);

    // Sort cards by Category Order, then Name
    cards.sort((a, b) => {
      const catA = categoryOrder[a.category as string] || 99;
      const catB = categoryOrder[b.category as string] || 99;
      if (catA !== catB) return catA - catB;
      return a.name.localeCompare(b.name);
    });

    const dateStr = nextCycle.tanggalProduksi.replace(/-/g, '');
    const previewBatchCode = `BATCH-${dateStr}-${nextCycle.waktuMakan}-PREVIEW`;

    return {
      success: true,
      batchId: null,
      batchCode: previewBatchCode,
      waktuMakan: nextCycle.waktuMakan,
      tanggalProduksi: nextCycle.tanggalProduksi,
      statusBatch: 'LIVE',
      cutoffTime: nextCycle.cutoffTime,

      // Cycle & Day Info
      siklusKe: activeCycleNumber,
      namaSiklus: activeCycleNama,
      hari: currentHari,
      tanggalFormatted,
      deskripsiSiklus: activeCycleDeskripsi,
      totalPasien: activePatients.filter((p) => !isNpoPatient(p)).length,
      totalPorsi,

      cards,
      lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: WIB_TZ }),
    };
  } catch (error) {
    console.error('Error fetching live overview data:', error);
    return {
      success: false,
      batchId: null,
      batchCode: 'ERROR-FETCH',
      waktuMakan: 'NONE',
      tanggalProduksi: '',
      statusBatch: 'LOCKED',
      cutoffTime: '00:00',

      siklusKe: 1,
      namaSiklus: 'Siklus 1',
      hari: 'SENIN',
      tanggalFormatted: '',
      totalPasien: 0,
      totalPorsi: 0,

      cards: [],
      lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: WIB_TZ }),
    };
  }
}

export interface LiveKateringPatient {
  id: number;
  nama_pasien: string;
  no_rm?: string | null;
  diet_raw: string;
  gedung?: string | null;
  ruangan?: string | null;
  bed?: string | null;
  kelas: string;
  status_mapping: string;
  /** True bila masuk via flag tugas AG Katering; false = data legacy 'KATERING'. */
  is_tugas_ag_katering: boolean;
}

export interface LiveKateringSummary {
  success: boolean;
  totalPasien: number;
  dietRawList: { diet_raw: string; count: number }[];
  patients: LiveKateringPatient[];
  lastUpdated: string;
}

/**
 * Fetch active patients whose mapped bentuk makanan is flagged as
 * tugas AG Katering (kategori_menu.is_tugas_ag_katering), plus data lama
 * era "Alihkan ke AG Katering" manual (sentinel 'KATERING').
 * Uses original raw text for patient display as required.
 */
export async function getLiveKateringData(): Promise<LiveKateringSummary> {
  try {
    // 1. Fetch pending revisions
    const pendingRevisions = await db
      .select({
        pasien_id: otorisasiPerubahanDietTable.pasien_id,
        jenis_perubahan: otorisasiPerubahanDietTable.jenis_perubahan,
      })
      .from(otorisasiPerubahanDietTable)
      .where(eq(otorisasiPerubahanDietTable.status, 'PENDING'));

    const pendingNewPatientIds = new Set(
      pendingRevisions
        .filter((r) => r.jenis_perubahan === 'NEW_PATIENT')
        .map((r) => r.pasien_id),
    );

    // 2. Fetch all active patients
    const allPatients = await db
      .select()
      .from(pasienTable)
      .where(
        and(
          ne(pasienTable.status_pasien, 'PULANG'),
          ne(pasienTable.status_pasien, 'PENDING_REVISI'),
        ),
      );

    const activePatients = allPatients.filter(
      (p) => !pendingNewPatientIds.has(p.id),
    );

    // 3. Fetch Master Diet Mappings
    const masterMappings = await db
      .select()
      .from(dietMappingTable)
      .where(eq(dietMappingTable.is_active, true));

    const mappingByRaw = new Map<string, typeof dietMappingTable.$inferSelect>();
    for (const m of masterMappings) {
      mappingByRaw.set(m.diet_rs_raw.trim().toLowerCase(), m);
    }

    // 3b. Kode bentuk yang otomatis teralihkan ke Live Katering (flag tugas)
    const tugasKateringCodes = await getTugasAgKateringCodes();

    // 4. Identify patients for AG Katering
    const kateringPatients: LiveKateringPatient[] = [];
    const countMap = new Map<string, number>();

    for (const p of activePatients) {
      const raw = (p.diet || '').trim();
      if (!raw) continue;

      const mapped = mappingByRaw.get(raw.toLowerCase());
      // Legacy manual: status/sentinel 'KATERING'. Baru: kode bentuk berflag tugas.
      const isLegacyKatering =
        (mapped?.status_mapping || '').trim().toUpperCase() === 'KATERING' ||
        extractCodes(mapped?.bentuk_makanan).some((c) => isLegacyKateringCode(c)) ||
        extractCodes(mapped?.kategori_diet).some((c) => isLegacyKateringCode(c));
      const isTugasKatering =
        !isLegacyKatering &&
        isKateringBentuk(extractCodes(mapped?.bentuk_makanan), tugasKateringCodes);

      if (isLegacyKatering || isTugasKatering) {
        kateringPatients.push({
          id: p.id,
          nama_pasien: p.nama_pasien,
          no_rm: p.no_rm,
          diet_raw: raw, // Always use original raw text
          gedung: p.gedung,
          ruangan: p.ruangan,
          bed: p.bed,
          kelas: p.kelas || 'KELAS I',
          status_mapping: mapped?.status_mapping || 'UNMAPPED (RAW)',
          is_tugas_ag_katering: isTugasKatering,
        });

        countMap.set(raw, (countMap.get(raw) ?? 0) + 1);
      }
    }

    const dietRawList = Array.from(countMap.entries())
      .map(([diet_raw, count]) => ({
        diet_raw,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      totalPasien: kateringPatients.length,
      dietRawList,
      patients: kateringPatients,
      lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: WIB_TZ }),
    };
  } catch (err) {
    console.error('Error fetching live katering data:', err);
    return {
      success: false,
      totalPasien: 0,
      dietRawList: [],
      patients: [],
      lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: WIB_TZ }),
    };
  }
}
