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

const HARI_INDONESIA = [
  'MINGGU',
  'SENIN',
  'SELASA',
  'RABU',
  'KAMIS',
  'JUMAT',
  'SABTU',
] as const;

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

  const currentMinutes = date.getHours() * 60 + date.getMinutes();

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

  const targetDate = new Date(date);
  if (dateOffset > 0) {
    targetDate.setDate(targetDate.getDate() + dateOffset);
  }

  return {
    waktuMakan,
    tanggalProduksi: targetDate.toISOString().slice(0, 10),
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

  const nextDate = new Date(current.tanggalProduksi);
  if (currentIndex === 2) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  const nextCutoff =
    configs.find((c) => c.jenis_makan === nextWaktuMakan)?.waktu ||
    defaultTimes[nextWaktuMakan];

  return {
    waktuMakan: nextWaktuMakan,
    tanggalProduksi: nextDate.toISOString().slice(0, 10),
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
 * Check if a dish's assigned kelas matches a patient's kelas
 */
function matchesKelas(dishKelas: string | null | undefined, patientKelas: string | null | undefined): boolean {
  if (!dishKelas || dishKelas === 'Semua Kelas' || dishKelas.toUpperCase() === 'ALL') {
    return true;
  }
  if (!patientKelas) return true;

  const dK = dishKelas.toLowerCase().trim();
  const pK = patientKelas.toLowerCase().trim();

  if (dK === pK) return true;

  // Handle "Kelas 2 - 3" or "Kelas 2-3" or "Kelas II-III"
  if (dK.includes('2') || dK.includes('3') || dK.includes('ii') || dK.includes('iii')) {
    if (pK.includes('2') || pK.includes('3') || pK.includes('ii') || pK.includes('iii')) {
      return true;
    }
  }

  // Handle "Kelas 1" or "Kelas I"
  if (dK.includes('1') || dK.includes('kelas i') || dK === 'i') {
    if (pK.includes('1') || pK.includes('kelas i') || pK === 'i') {
      return true;
    }
  }

  // Handle "VIP" / "VVIP"
  if (dK.includes('vip') && pK.includes('vip')) {
    return true;
  }

  return false;
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
  if (j === 'SARING') return 'SARING';
  if (j === 'POKOK' || j === 'KARBO' || j === 'BENTUK_MAKANAN') return 'POKOK';
  if (j === 'EXTRA') return 'EXTRA';
  if (j === 'BUAH') return 'BUAH';
  if (j === 'SNACK') return 'SNACK';
  if (j === 'NPO') return 'NPO';
  return 'LAINNYA';
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

    // 3. Compute Target Production Date & Day Info
    const targetDateObj = new Date(nextCycle.tanggalProduksi);
    const dayIndex = isNaN(targetDateObj.getDay()) ? 1 : targetDateObj.getDay();
    const currentHari = HARI_INDONESIA[dayIndex] || 'SENIN';

    const tanggalFormatted = !isNaN(targetDateObj.getTime())
      ? targetDateObj.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : nextCycle.tanggalProduksi;

    // 4. Resolve Active Master Siklus for the target date
    const allMasterCycles = await db
      .select()
      .from(masterSiklusTable)
      .where(eq(masterSiklusTable.is_active, true))
      .orderBy(asc(masterSiklusTable.nomor_siklus));

    // Determine cycle matching by assigned 'tanggal', 'hari', or 10-day rotation
    let resolvedCycle = allMasterCycles.find(
      (c) => c.tanggal && c.tanggal === nextCycle.tanggalProduksi,
    );

    if (!resolvedCycle) {
      resolvedCycle = allMasterCycles.find(
        (c) => c.hari?.trim().toUpperCase() === currentHari,
      );
    }

    if (!resolvedCycle && allMasterCycles.length > 0) {
      // 10-day cycle standard PGRS: Day of month % 10 (or 31)
      const dayOfMonth = targetDateObj.getDate();
      const standardCycleNum =
        dayOfMonth === 31 ? 31 : dayOfMonth % 10 === 0 ? 10 : dayOfMonth % 10;
      resolvedCycle =
        allMasterCycles.find((c) => c.nomor_siklus === standardCycleNum) ||
        allMasterCycles[0];
    }

    const activeCycleNumber = resolvedCycle?.nomor_siklus || 1;
    const activeCycleNama =
      resolvedCycle?.nama_siklus || `Siklus ${activeCycleNumber}`;
    const activeCycleDeskripsi =
      resolvedCycle?.deskripsi ||
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
        asc(masterSiklusMenuTable.urutan),
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

    // 7. Fetch Master Diet Mappings
    const masterMappings = await db
      .select()
      .from(dietMappingTable)
      .where(eq(dietMappingTable.is_active, true));

    const mappingByRaw = new Map<
      string,
      {
        bentuk_makanan: string | null;
        kategori_diet: string | null;
        extra: string | null;
        buah: string | null;
        snack: string | null;
        status_mapping: string;
      }
    >();

    for (const m of masterMappings) {
      mappingByRaw.set(m.diet_rs_raw.trim().toLowerCase(), {
        bentuk_makanan: m.bentuk_makanan,
        kategori_diet: m.kategori_diet,
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
    }

    const liveDishes: Record<string, { count: number; meta: DishCounter }> = {};

    function addLiveDish(item: DishCounter, amount = 1) {
      if (!item.name || !item.name.trim()) return;
      const key = `${item.category}:${item.name.trim()}`;
      if (!liveDishes[key]) {
        liveDishes[key] = { count: 0, meta: item };
      }
      liveDishes[key].count += amount;
    }

    // Process each active patient
    // Process each active patient
    for (const p of activePatients) {
      const rawDiet = (p.diet || '').trim();

      // Explicit medical status flag from patient record
      if (p.is_npo || p.status_pasien === 'NPO') {
        addLiveDish({
          code: 'NPO',
          name: 'Puasa / NPO',
          category: 'NPO',
          dietTag: 'NPO',
        });
        continue;
      }

      if (!rawDiet) continue;

      // Lookup in master diet mapping
      const mapped = mappingByRaw.get(rawDiet.toLowerCase());

      // STRICT RULE: If not mapped or status is not MAPPED, do NOT generate production dishes
      if (!mapped || mapped.status_mapping !== 'MAPPED') {
        continue;
      }

      const pKelas = p.kelas || 'Kelas 1';

      const bentukCodes = extractCodes(mapped.bentuk_makanan);
      const kategoriCodes = extractCodes(mapped.kategori_diet);
      const extraCodes = extractCodes(mapped.extra);
      const buahCodes = extractCodes(mapped.buah);
      const snackCodes = extractCodes(mapped.snack);

      // Check if mapped to NPO / Puasa
      const isNpoMapped =
        bentukCodes.some((c) => c.toUpperCase() === 'NPO' || c.toUpperCase() === 'PUASA') ||
        kategoriCodes.some((c) => c.toUpperCase() === 'NPO' || c.toUpperCase() === 'PUASA');

      if (isNpoMapped) {
        addLiveDish({
          code: 'NPO',
          name: 'Puasa / NPO',
          category: 'NPO',
          dietTag: 'NPO',
        });
        continue;
      }

      // A. Makanan Pokok / Bentuk Makanan (e.g. BN -> Nasi Biasa, BL/TIM -> Nasi Tim, SAR -> Bubur Saring, CAIR -> Cair)
      if (bentukCodes.length > 0) {
        for (const code of bentukCodes) {
          const upperCode = code.toUpperCase();
          if (upperCode === 'NPO' || upperCode === 'PUASA') continue;

          let stapleName = 'Nasi Biasa';
          if (upperCode === 'BN' || upperCode === 'BIASA') stapleName = 'Nasi Biasa';
          else if (upperCode === 'BL' || upperCode === 'LUNAK') stapleName = 'Nasi Tim / Lunak';
          else if (upperCode === 'TIM' || upperCode === 'TM') stapleName = 'Nasi Tim';
          else if (upperCode === 'SAR' || upperCode === 'SARING') stapleName = 'Bubur Saring';
          else if (upperCode === 'CAIR' || upperCode === 'CAI') stapleName = 'Makanan Cair';
          else {
            stapleName = labelMap.get(upperCode) || defaultLabels[upperCode] || `Makanan Pokok (${code})`;
          }

          addLiveDish({
            code: upperCode,
            name: stapleName,
            category: upperCode === 'SAR' ? 'SARING' : 'POKOK',
            kelas: pKelas,
          });
        }
      }

      // B. Main dishes from active menu cycle (HEWANI, NABATI, SAYUR, etc.)
      if (activeSlotMenuItems.length > 0) {
        // Group items in cycle by jenis_makanan
        const jenisGroups = ['HEWANI', 'NABATI', 'SAYUR'];

        for (const jenis of jenisGroups) {
          const candidates = activeSlotMenuItems.filter(
            (m) =>
              m.jenis_makanan.toUpperCase() === jenis &&
              matchesKelas(m.kelas, pKelas),
          );

          if (candidates.length > 0) {
            // Find diet-specific dish matching patient's kategori diet tags (e.g. DM, RG, TKTP)
            let chosenDish = candidates.find((dish) => {
              if (!dish.kategori_menu) return false;
              const dishTags = extractCodes(dish.kategori_menu);
              return kategoriCodes.some((kc) =>
                dishTags.some((dt) => dt.toUpperCase() === kc.toUpperCase()),
              );
            });

            // If no diet-specific dish, fallback to standard dish (B / BIASA / NON DIET / empty)
            if (!chosenDish) {
              chosenDish =
                candidates.find((dish) => {
                  if (!dish.kategori_menu) return true;
                  const dTag = dish.kategori_menu.toUpperCase();
                  return dTag === 'B' || dTag === 'BIASA' || dTag === 'NON DIET' || dTag === '-';
                }) || candidates[0];
            }

            if (chosenDish) {
              addLiveDish({
                code: `MENU-${chosenDish.id}`,
                name: chosenDish.nama_makanan,
                category: mapCategoryGroup(chosenDish.jenis_makanan),
                kelas: chosenDish.kelas,
                dietTag: chosenDish.kategori_menu || undefined,
                catatan: chosenDish.catatan || undefined,
              });
            }
          } else {
            // Fallback for this category if no dish defined in cycle
            if (kategoriCodes.length > 0) {
              for (const kc of kategoriCodes) {
                const dietName = labelMap.get(kc) || defaultLabels[kc] || kc;
                addLiveDish({
                  code: kc,
                  name: `Menu ${jenis}: ${dietName}`,
                  category: mapCategoryGroup(jenis),
                  kelas: pKelas,
                });
              }
            } else {
              addLiveDish({
                code: `${jenis}-STD`,
                name: `Lauk ${jenis} (Standar ${pKelas})`,
                category: mapCategoryGroup(jenis),
                kelas: pKelas,
              });
            }
          }
        }
      } else {
        // Fallback if no menu items in cycle for this slot
        if (kategoriCodes.length > 0) {
          for (const kc of kategoriCodes) {
            const dietLabel = labelMap.get(kc) || defaultLabels[kc] || kc;
            addLiveDish({
              code: kc,
              name: `Diet ${dietLabel}`,
              category: 'HEWANI',
              kelas: pKelas,
            });
          }
        } else {
          addLiveDish({
            code: 'BIASA',
            name: `Menu Standar Siklus (${pKelas})`,
            category: 'HEWANI',
            kelas: pKelas,
          });
        }
      }

      // C. Extra dishes (e.g. PUTEL -> Putih Telur Rebus)
      if (extraCodes.length > 0) {
        for (const code of extraCodes) {
          const upperCode = code.toUpperCase();
          const extraName =
            labelMap.get(upperCode) ||
            defaultLabels[upperCode] ||
            `Extra ${code}`;
          addLiveDish({
            code: upperCode,
            name: extraName,
            category: 'EXTRA',
            kelas: pKelas,
          });
        }
      }

      // D. Buah
      if (buahCodes.length > 0) {
        for (const code of buahCodes) {
          const upperCode = code.toUpperCase();
          const buahName =
            labelMap.get(upperCode) ||
            defaultLabels[upperCode] ||
            `Buah ${code}`;
          addLiveDish({
            code: upperCode,
            name: buahName,
            category: 'BUAH',
            kelas: pKelas,
          });
        }
      } else {
        // Check if cycle defines a default fruit for all
        const defaultFruit = activeSlotMenuItems.find(
          (m) => m.jenis_makanan.toUpperCase() === 'BUAH' && matchesKelas(m.kelas, pKelas),
        );
        if (defaultFruit) {
          addLiveDish({
            code: `BUAH-${defaultFruit.id}`,
            name: defaultFruit.nama_makanan,
            category: 'BUAH',
            kelas: defaultFruit.kelas,
          });
        }
      }

      // E. Snack
      if (snackCodes.length > 0) {
        for (const code of snackCodes) {
          const upperCode = code.toUpperCase();
          const snackName =
            labelMap.get(upperCode) ||
            defaultLabels[upperCode] ||
            `Snack ${code}`;
          addLiveDish({
            code: upperCode,
            name: snackName,
            category: 'SNACK',
            kelas: pKelas,
          });
        }
      } else {
        const defaultSnack = activeSlotMenuItems.find(
          (m) => m.jenis_makanan.toUpperCase() === 'SNACK' && matchesKelas(m.kelas, pKelas),
        );
        if (defaultSnack) {
          addLiveDish({
            code: `SNACK-${defaultSnack.id}`,
            name: defaultSnack.nama_makanan,
            category: 'SNACK',
            kelas: defaultSnack.kelas,
          });
        }
      }
    }

    // 9. Fetch baseline counts from the latest LOCKED snapshot batch
    const [latestBatch] = await db
      .select()
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.timestamp_snapshot))
      .limit(1);

    const snapshotDishes: Record<string, { count: number; meta: DishCounter }> = {};

    function addSnapshotDish(item: DishCounter, amount = 1) {
      if (!item.name || !item.name.trim()) return;
      const key = `${item.category}:${item.name.trim()}`;
      if (!snapshotDishes[key]) {
        snapshotDishes[key] = { count: 0, meta: item };
      }
      snapshotDishes[key].count += amount;
    }

    if (latestBatch) {
      const snapshotDetails = await db
        .select({
          diet_rs_raw: snapshotDetailTable.diet_rs_raw,
          kelas: snapshotDetailTable.kelas,
          bentuk_makanan: snapshotDetailTable.bentuk_makanan,
          kategori_diet: snapshotDetailTable.kategori_diet,
          extra: snapshotDetailTable.extra,
          buah: snapshotDetailTable.buah,
          snack: snapshotDetailTable.snack,
          status_saat_snapshot: snapshotDetailTable.status_saat_snapshot,
        })
        .from(snapshotDetailTable)
        .where(eq(snapshotDetailTable.batch_id, latestBatch.id));

      for (const sd of snapshotDetails) {
        const rawDiet = (sd.diet_rs_raw || '').trim();

        if (sd.status_saat_snapshot === 'NPO') {
          addSnapshotDish({
            code: 'NPO',
            name: 'Puasa / NPO',
            category: 'NPO',
            dietTag: 'NPO',
          });
          continue;
        }

        const pKelas = sd.kelas || 'Kelas 1';
        let bentukCodes = extractCodes(sd.bentuk_makanan);
        let kategoriCodes = extractCodes(sd.kategori_diet);
        let extraCodes = extractCodes(sd.extra);
        let buahCodes = extractCodes(sd.buah);
        let snackCodes = extractCodes(sd.snack);

        // Fallback to mapping by raw text if parsed columns are empty
        if (!sd.bentuk_makanan && !sd.kategori_diet && rawDiet) {
          const mapped = mappingByRaw.get(rawDiet.toLowerCase());
          if (mapped && mapped.status_mapping === 'MAPPED') {
            bentukCodes = extractCodes(mapped.bentuk_makanan);
            kategoriCodes = extractCodes(mapped.kategori_diet);
            extraCodes = extractCodes(mapped.extra);
            buahCodes = extractCodes(mapped.buah);
            snackCodes = extractCodes(mapped.snack);
          }
        }

        // If not mapped, do not add snapshot dishes
        if (
          bentukCodes.length === 0 &&
          kategoriCodes.length === 0 &&
          extraCodes.length === 0 &&
          buahCodes.length === 0 &&
          snackCodes.length === 0
        ) {
          continue;
        }

        const isNpoMapped =
          bentukCodes.some((c) => c.toUpperCase() === 'NPO' || c.toUpperCase() === 'PUASA') ||
          kategoriCodes.some((c) => c.toUpperCase() === 'NPO' || c.toUpperCase() === 'PUASA');

        if (isNpoMapped) {
          addSnapshotDish({
            code: 'NPO',
            name: 'Puasa / NPO',
            category: 'NPO',
            dietTag: 'NPO',
          });
          continue;
        }

        // Staple
        if (bentukCodes.length > 0) {
          for (const code of bentukCodes) {
            const upperCode = code.toUpperCase();
            if (upperCode === 'NPO' || upperCode === 'PUASA') continue;

            let stapleName = 'Nasi Biasa';
            if (upperCode === 'BN' || upperCode === 'BIASA') stapleName = 'Nasi Biasa';
            else if (upperCode === 'BL' || upperCode === 'LUNAK') stapleName = 'Nasi Tim / Lunak';
            else if (upperCode === 'TIM' || upperCode === 'TM') stapleName = 'Nasi Tim';
            else if (upperCode === 'SAR' || upperCode === 'SARING') stapleName = 'Bubur Saring';
            else if (upperCode === 'CAIR' || upperCode === 'CAI') stapleName = 'Makanan Cair';
            else {
              stapleName = labelMap.get(upperCode) || defaultLabels[upperCode] || `Makanan Pokok (${code})`;
            }

            addSnapshotDish({
              code: upperCode,
              name: stapleName,
              category: upperCode === 'SAR' ? 'SARING' : 'POKOK',
              kelas: pKelas,
            });
          }
        }

        // Main dishes from cycle
        if (activeSlotMenuItems.length > 0) {
          const jenisGroups = ['HEWANI', 'NABATI', 'SAYUR'];
          for (const jenis of jenisGroups) {
            const candidates = activeSlotMenuItems.filter(
              (m) =>
                m.jenis_makanan.toUpperCase() === jenis &&
                matchesKelas(m.kelas, pKelas),
            );

            if (candidates.length > 0) {
              let chosenDish = candidates.find((dish) => {
                if (!dish.kategori_menu) return false;
                const dishTags = extractCodes(dish.kategori_menu);
                return kategoriCodes.some((kc) =>
                  dishTags.some((dt) => dt.toUpperCase() === kc.toUpperCase()),
                );
              });

              if (!chosenDish) {
                chosenDish =
                  candidates.find((dish) => {
                    if (!dish.kategori_menu) return true;
                    const dTag = dish.kategori_menu.toUpperCase();
                    return dTag === 'B' || dTag === 'BIASA' || dTag === 'NON DIET' || dTag === '-';
                  }) || candidates[0];
              }

              if (chosenDish) {
                addSnapshotDish({
                  code: `MENU-${chosenDish.id}`,
                  name: chosenDish.nama_makanan,
                  category: mapCategoryGroup(chosenDish.jenis_makanan),
                  kelas: chosenDish.kelas,
                  dietTag: chosenDish.kategori_menu || undefined,
                  catatan: chosenDish.catatan || undefined,
                });
              }
            } else {
              if (kategoriCodes.length > 0) {
                for (const kc of kategoriCodes) {
                  const dietName = labelMap.get(kc) || defaultLabels[kc] || kc;
                  addSnapshotDish({
                    code: kc,
                    name: `Menu ${jenis}: ${dietName}`,
                    category: mapCategoryGroup(jenis),
                    kelas: pKelas,
                  });
                }
              } else {
                addSnapshotDish({
                  code: `${jenis}-STD`,
                  name: `Lauk ${jenis} (Standar ${pKelas})`,
                  category: mapCategoryGroup(jenis),
                  kelas: pKelas,
                });
              }
            }
          }
        } else {
          if (kategoriCodes.length > 0) {
            for (const kc of kategoriCodes) {
              const dietLabel = labelMap.get(kc) || defaultLabels[kc] || kc;
              addSnapshotDish({
                code: kc,
                name: `Diet ${dietLabel}`,
                category: 'HEWANI',
                kelas: pKelas,
              });
            }
          } else {
            addSnapshotDish({
              code: 'BIASA',
              name: `Menu Standar Siklus (${pKelas})`,
              category: 'HEWANI',
              kelas: pKelas,
            });
          }
        }

        // Extra
        if (extraCodes.length > 0) {
          for (const code of extraCodes) {
            const upperCode = code.toUpperCase();
            const extraName =
              labelMap.get(upperCode) ||
              defaultLabels[upperCode] ||
              `Extra ${code}`;
            addSnapshotDish({
              code: upperCode,
              name: extraName,
              category: 'EXTRA',
              kelas: pKelas,
            });
          }
        }

        // Buah
        if (buahCodes.length > 0) {
          for (const code of buahCodes) {
            const upperCode = code.toUpperCase();
            const buahName =
              labelMap.get(upperCode) ||
              defaultLabels[upperCode] ||
              `Buah ${code}`;
            addSnapshotDish({
              code: upperCode,
              name: buahName,
              category: 'BUAH',
              kelas: pKelas,
            });
          }
        } else {
          const defaultFruit = activeSlotMenuItems.find(
            (m) => m.jenis_makanan.toUpperCase() === 'BUAH' && matchesKelas(m.kelas, pKelas),
          );
          if (defaultFruit) {
            addSnapshotDish({
              code: `BUAH-${defaultFruit.id}`,
              name: defaultFruit.nama_makanan,
              category: 'BUAH',
              kelas: defaultFruit.kelas,
            });
          }
        }

        // Snack
        if (snackCodes.length > 0) {
          for (const code of snackCodes) {
            const upperCode = code.toUpperCase();
            const snackName =
              labelMap.get(upperCode) ||
              defaultLabels[upperCode] ||
              `Snack ${code}`;
            addSnapshotDish({
              code: upperCode,
              name: snackName,
              category: 'SNACK',
              kelas: pKelas,
            });
          }
        } else {
          const defaultSnack = activeSlotMenuItems.find(
            (m) => m.jenis_makanan.toUpperCase() === 'SNACK' && matchesKelas(m.kelas, pKelas),
          );
          if (defaultSnack) {
            addSnapshotDish({
              code: `SNACK-${defaultSnack.id}`,
              name: defaultSnack.nama_makanan,
              category: 'SNACK',
              kelas: defaultSnack.kelas,
            });
          }
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
      NABATI: 3,
      SAYUR: 4,
      SARING: 5,
      EXTRA: 6,
      BUAH: 7,
      SNACK: 8,
      LAINNYA: 9,
      NPO: 10,
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

        return {
          code: meta?.code || key,
          name: meta?.name || key,
          category: meta?.category || 'LAINNYA',
          kelas: meta?.kelas,
          dietTag: meta?.dietTag,
          catatan: meta?.catatan,
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
      totalPasien: activePatients.length,
      totalPorsi,

      cards,
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
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
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  }
}
