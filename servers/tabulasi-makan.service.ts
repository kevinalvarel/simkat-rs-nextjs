'use server';

import { eq, desc, and, asc } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { masterSiklusMenuTable } from '@/db/schemas/master/siklus-menu';
import { isNpoPatient } from '@/lib/npo-utils';
import { consolidateSlotMenuItems } from '@/lib/siklus-menu-utils';
import type {
  TabulasiDashboardData,
  TabulasiBatchOption,
  TabulasiPatientSummary,
  TabulasiLocationGroup,
  TabulasiDietItem,
  TabulasiMenuItem,
  TabulasiSnackSummary,
  TabulasiScheduleItem,
  TabulasiHospitalCategoryGroup,
  TabulasiHospitalData,
  TabulasiHospitalItem,
  TabulasiTktpGabungan,
  TabulasiTktpKelasRincian,
} from '@/types/tabulasitypes';
import {
  getDefaultMealtime,
  normalizeKelas,
  buildMenuGroupTitle,
  menuGroupSortWeight,
  determineAutomaticMenuCycle,
  buildRoomBuildingMap,
  resolvePatientBuilding,
  resolveTabulasiPatients,
  matchPatientToDish,
  matchesDishKelas,
} from '@/helper/tabulasi';
import { hasDiitTag } from '@/lib/siklus-menu-tags';
import type { AnalyzedPatient } from '@/helper/tabulasi';
import { formatIndoFull, getWibTodayKey, WIB_TIMEZONE } from '@/lib/wib';

export type SnapshotBatch = typeof snapshotBatchTable.$inferSelect;
export type SnapshotDetail = typeof snapshotDetailTable.$inferSelect;

/**
 * Fetch all snapshot batches ordered by most recent first.
 */
export async function getTabulationBatches(): Promise<SnapshotBatch[]> {
  try {
    return await db
      .select()
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.timestamp_snapshot));
  } catch (error) {
    console.error('Error fetching tabulation batches:', error);
    return [];
  }
}

/**
 * Main Service: Fetch real-time dashboard data for Tabulasi Makan Rekapitulasi.
 *
 * Resolves patient data from either an official locked snapshot or the live
 * active patient table, then matches each patient to their menu cycle dishes
 * and aggregates portions by building (Gedung Lama / Gedung Baru).
 */
export async function getTabulasiDashboardData(
  batchId?: number,
  selectedDate?: string,
  mealTime?: string,
): Promise<TabulasiDashboardData> {
  try {
    const todayStr = getWibTodayKey();
    const targetDate = selectedDate || todayStr;
    const currentMeal = (mealTime || getDefaultMealtime()).toUpperCase();

    // 1. Determine menu cycle automatically (no manual user selection needed)
    const { activeCycleNum, activeCycleNama, availableSiklus } =
      await determineAutomaticMenuCycle(targetDate);

    // 2. Fetch available batches and find target batch
    const rawBatches = await getTabulationBatches();
    const availableBatches: TabulasiBatchOption[] = rawBatches.map((b) => ({
      id: b.id,
      batch_code: b.batch_code,
      tanggal_produksi: String(b.tanggal_produksi),
      waktu_makan: b.waktu_makan,
      total_pasien: b.total_pasien,
      status_batch: b.status_batch,
      cutoff_time: b.cutoff_time,
    }));

    let selectedBatch: TabulasiBatchOption | null = null;
    if (batchId) {
      selectedBatch = availableBatches.find((b) => b.id === batchId) || null;
    } else {
      selectedBatch =
        availableBatches.find(
          (b) =>
            b.tanggal_produksi === targetDate &&
            b.waktu_makan.toUpperCase() === currentMeal,
        ) || null;
    }

    // 3. Resolve real patients and room mapping
    const roomGedungMap = await buildRoomBuildingMap();
    const { patientRecords, isOfficialLocked, resolvedBatchCode } =
      await resolveTabulasiPatients(selectedBatch, targetDate, currentMeal);

    // 4. Retrieve dishes for active cycle and mealtime
    const waktuMakanFilter =
      currentMeal === 'MALAM' ? ['MALAM', 'SORE'] : [currentMeal];

    const cycleMenuItems = await db
      .select()
      .from(masterSiklusMenuTable)
      .where(
        and(
          eq(masterSiklusMenuTable.siklus_ke, activeCycleNum),
          eq(masterSiklusMenuTable.is_active, true),
        ),
      )
      .orderBy(
        asc(masterSiklusMenuTable.jenis_makanan),
        asc(masterSiklusMenuTable.id),
      );

    let slotMenuItems = cycleMenuItems.filter((item) =>
      waktuMakanFilter.includes(item.waktu_makan.toUpperCase()),
    );

    // Fallback: If active cycle dishes are not yet seeded, use cycle 1 template
    if (slotMenuItems.length === 0) {
      const fallbackItems = await db
        .select()
        .from(masterSiklusMenuTable)
        .where(
          and(
            eq(masterSiklusMenuTable.siklus_ke, 1),
            eq(masterSiklusMenuTable.is_active, true),
          ),
        )
        .orderBy(
          asc(masterSiklusMenuTable.jenis_makanan),
          asc(masterSiklusMenuTable.id),
        );

      slotMenuItems = fallbackItems.filter((item) =>
        waktuMakanFilter.includes(item.waktu_makan.toUpperCase()),
      );
    }

    // Tabulasi makan hanya untuk hidangan utama (pokok/hewani/nabati/sayur/extra).
    // Karbohidrat dikecualikan: porsinya mengikuti alur overview produksi.
    // Buah dan snack dikecualikan: porsinya dihitung dari mapping pasien di tabulasi snack & buah.
    slotMenuItems = slotMenuItems.filter((item) => {
      const jenis = (item.jenis_makanan || '').toUpperCase().trim();
      return jenis !== 'BUAH' && jenis !== 'SNACK' && jenis !== 'KARBOHIDRAT';
    });

    // 5. Analyze patient diet tags
    const totalPatients = patientRecords.length;
    let patientsEating = 0;
    let npoCount = 0;
    let specialDietCount = 0;

    const analyzed: AnalyzedPatient[] = patientRecords.map((p) => {
      const raw = (p.diet_rs_raw || '').toUpperCase();
      const isNpo = Boolean(
        p.is_npo ||
          isNpoPatient({
            ...p,
            is_npo: p.is_npo,
            status_pasien: p.status_pasien,
            status_saat_snapshot: p.status_saat_snapshot,
          }),
      );

      if (isNpo) {
        npoCount++;
      } else {
        patientsEating++;
      }

      const isDm =
        raw.includes('DM') || raw.includes('GULA') || raw.includes('DIABETES');
      const isRg =
        raw.includes('RG') ||
        raw.includes('GARAM') ||
        raw.includes('HIPERTENSI');
      const isRs = raw.includes('RS') || raw.includes('SERAT');
      const isRp = raw.includes('RP') || raw.includes('PROTEIN');
      const isDj = raw.includes('DJ') || raw.includes('JANTUNG');
      const isRl = raw.includes('RL') || raw.includes('LEMAK');
      const isRkol = raw.includes('RKOL') || raw.includes('KOLESTEROL');
      const isTktp = raw.includes('TKTP');
      const isSaring =
        raw.includes('SARING') ||
        (p.bentuk_makanan || '').toLowerCase().includes('saring');

      const isSpecial =
        isDm ||
        isRg ||
        isRs ||
        isRp ||
        isDj ||
        isRl ||
        isRkol ||
        isTktp ||
        isSaring;

      if (!isNpo && isSpecial) {
        specialDietCount++;
      }

      const isBiasa = !isSpecial || raw.includes('B') || raw.includes('BIASA');

      return {
        patient: p,
        gedungType: resolvePatientBuilding(p, roomGedungMap),
        kelasType: normalizeKelas(p.kelas),
        isNpo,
        isDm,
        isRg,
        isRs,
        isRp,
        isDj,
        isRl,
        isRkol,
        isTktp,
        isSaring,
        isBiasa,
      };
    });

    // 6. Aggregate dishes into category groups with combined dish consolidation
    const consolidatedMenuItems = consolidateSlotMenuItems(slotMenuItems);
    const categoryGroupMap = new Map<string, TabulasiHospitalItem[]>();

    /** Jenis dasar yang dicakup satu baris hidangan (gabungan mencakup keduanya). */
    function baseJenisOf(jenisMakanan: string): string[] {
      const j = (jenisMakanan || '').toUpperCase().trim();
      if (j === 'HEWANI & NABATI') return ['HEWANI', 'NABATI'];
      if (j === 'NABATI & SAYUR') return ['NABATI', 'SAYUR'];
      if (j === 'HEWANI & SAYUR') return ['HEWANI', 'SAYUR'];
      if (j === 'HEWANI' || j === 'NABATI' || j === 'SAYUR') return [j];
      return [];
    }

    // Pass 1: pencocokan eksak seperti semula + catat jenis yang tercover per pasien.
    const matchedJenisByPatient = new Map<AnalyzedPatient, Set<string>>();
    const hospitalItemByDish = new Map<object, TabulasiHospitalItem>();

    // Rincian per kelas khusus TKTP (1 pasien = 1 hitung per hidangan yang cocok).
    const tktpRincianLama: TabulasiTktpKelasRincian = { kelas_1: 0, kelas_2: 0, kelas_3: 0 };
    const tktpRincianBaru: TabulasiTktpKelasRincian = { kelas_1: 0, kelas_2: 0, kelas_3: 0 };

    for (const m of consolidatedMenuItems) {
      let porsiLama = 0;
      let porsiBaru = 0;

      const isTktpDish =
        (m.kategori_menu || '').toUpperCase().includes('TKTP') ||
        (m.nama_makanan || '').toUpperCase().includes('TKTP');

      for (const ap of analyzed) {
        if (matchPatientToDish(ap, m)) {
          if (ap.gedungType === 'GEDUNG BARU') {
            porsiBaru++;
            if (isTktpDish) {
              if (ap.kelasType === 'KELAS_1') tktpRincianBaru.kelas_1++;
              else if (ap.kelasType === 'KELAS_2') tktpRincianBaru.kelas_2++;
              else tktpRincianBaru.kelas_3++;
            }
          } else {
            porsiLama++;
            if (isTktpDish) {
              if (ap.kelasType === 'KELAS_1') tktpRincianLama.kelas_1++;
              else if (ap.kelasType === 'KELAS_2') tktpRincianLama.kelas_2++;
              else tktpRincianLama.kelas_3++;
            }
          }
          let covered = matchedJenisByPatient.get(ap);
          if (!covered) {
            covered = new Set<string>();
            matchedJenisByPatient.set(ap, covered);
          }
          for (const j of baseJenisOf(m.jenis_makanan)) covered.add(j);
        }
      }

      const groupTitle = buildMenuGroupTitle(m.jenis_makanan, m.kelas);

      if (!categoryGroupMap.has(groupTitle)) {
        categoryGroupMap.set(groupTitle, []);
      }

      const hospitalItem: TabulasiHospitalItem = {
        id: `m-${m.id}`,
        kategori: groupTitle,
        nama_menu: m.nama_makanan,
        kode_diet: m.kategori_menu || 'B',
        porsi_gedung_lama: porsiLama,
        porsi_gedung_baru: porsiBaru,
        total_porsi: porsiLama + porsiBaru,
        is_tktp: isTktpDish,
        catatan: m.catatan || undefined,
      };
      categoryGroupMap.get(groupTitle)!.push(hospitalItem);
      hospitalItemByDish.set(m, hospitalItem);
    }

    // Pass 2: DIIT fallback (logika jumlah porsi saja).
    // Pasien diet khusus yang nol cocok di suatu jenis (mis. DH tanpa
    // hidangan DH di slot ini) dialihkan ke hidangan DIIT yang se-jenis +
    // se-kelas. Baris & kode_diet tetap milik hidangan (base on siklus menu).
    const DIIT_JENIS = ['HEWANI', 'NABATI', 'SAYUR'] as const;
    for (const ap of analyzed) {
      if (ap.isNpo) continue;
      const isDiitEligible =
        ap.isDm || ap.isRg || ap.isRs || ap.isRp || ap.isDj || ap.isRl || ap.isRkol;
      if (!isDiitEligible) continue;

      const covered = matchedJenisByPatient.get(ap);
      const creditedRows = new Set<object>();
      for (const jenis of DIIT_JENIS) {
        if (covered?.has(jenis)) continue;
        const fallback = consolidatedMenuItems.find(
          (m) =>
            baseJenisOf(m.jenis_makanan).includes(jenis) &&
            hasDiitTag(m.kategori_menu) &&
            matchesDishKelas(ap, m),
        );
        if (!fallback || creditedRows.has(fallback)) continue;
        creditedRows.add(fallback);
        const target = hospitalItemByDish.get(fallback);
        if (!target) continue;
        if (ap.gedungType === 'GEDUNG BARU') {
          target.porsi_gedung_baru++;
        } else {
          target.porsi_gedung_lama++;
        }
        target.total_porsi++;
      }
    }

    let totalPortionsLama = 0;
    let totalPortionsBaru = 0;

    const categoryGroups: TabulasiHospitalCategoryGroup[] = [];
    for (const [kategori, items] of categoryGroupMap.entries()) {
      const subLama = items.reduce((s, it) => s + it.porsi_gedung_lama, 0);
      const subBaru = items.reduce((s, it) => s + it.porsi_gedung_baru, 0);
      totalPortionsLama += subLama;
      totalPortionsBaru += subBaru;

      categoryGroups.push({
        kategori,
        items,
        subtotalGedungLama: subLama,
        subtotalGedungBaru: subBaru,
        subtotalSemua: subLama + subBaru,
        isTktp: kategori.includes('TKTP'),
      });
    }

    // Sort category groups in logical culinary sequence
    categoryGroups.sort((a, b) => {
      const wA = menuGroupSortWeight(a.kategori);
      const wB = menuGroupSortWeight(b.kategori);
      if (wA !== wB) return wA - wB;
      return a.kategori.localeCompare(b.kategori);
    });

    let allItems = categoryGroups.flatMap((g) => g.items);
    let grandTotalPorsi = totalPortionsLama + totalPortionsBaru;

    // Baris baru TKTP GABUNGAN: satu baris total semua kelas.
    // Pemicu varian adalah nama menu beda per kelas hari itu.
    // Baris ini ringkasan saja, tidak menambah grand total di atas.
    let tktpGabungan: TabulasiTktpGabungan | null = null;
    {
      const tktpItems = allItems.filter((it) => it.is_tktp);
      const gabLama = tktpItems.reduce((s, it) => s + it.porsi_gedung_lama, 0);
      const gabBaru = tktpItems.reduce((s, it) => s + it.porsi_gedung_baru, 0);
      if (tktpItems.length > 0 && gabLama + gabBaru > 0) {
        const normName = (s: string) => (s || '').trim().toUpperCase();
        const seen = new Map<string, { nama_menu: string; kelas: string; kode_diet: string }>();
        for (const it of tktpItems) {
          const key = normName(it.nama_menu);
          if (!key) continue;
          if (!seen.has(key)) {
            seen.set(key, { nama_menu: it.nama_menu, kelas: it.kategori, kode_diet: it.kode_diet });
          }
        }
        const varian = Array.from(seen.values()).sort((a, b) =>
          a.nama_menu.localeCompare(b.nama_menu),
        );
        const is_uniform = varian.length <= 1;
        tktpGabungan = {
          kategori: 'TKTP GABUNGAN',
          nama_menu: is_uniform
            ? (varian[0]?.nama_menu || 'TKTP')
            : varian.map((v) => v.nama_menu).join(' / '),
          kode_diet: 'TKTP',
          porsi_gedung_lama: gabLama,
          porsi_gedung_baru: gabBaru,
          total_porsi: gabLama + gabBaru,
          is_uniform,
          varian,
          rincian_lama: { ...tktpRincianLama },
          rincian_baru: { ...tktpRincianBaru },
        };
      }
    }

    // Baris TKTP per kelas tidak ditampilkan: hanya baris TKTP GABUNGAN yang dipakai.
    // Total tetap sertakan porsi TKTP lewat gabungan agar angka dapur tidak berubah.
    for (const group of categoryGroups) {
      group.items = group.items.filter((it) => !it.is_tktp);
      group.subtotalGedungLama = group.items.reduce((s, it) => s + it.porsi_gedung_lama, 0);
      group.subtotalGedungBaru = group.items.reduce((s, it) => s + it.porsi_gedung_baru, 0);
      group.subtotalSemua = group.subtotalGedungLama + group.subtotalGedungBaru;
      if (group.items.length === 0) group.isTktp = false;
    }
    for (let i = categoryGroups.length - 1; i >= 0; i--) {
      if (categoryGroups[i].items.length === 0) categoryGroups.splice(i, 1);
    }
    allItems = categoryGroups.flatMap((g) => g.items);
    totalPortionsLama =
      categoryGroups.reduce((s, g) => s + g.subtotalGedungLama, 0) +
      (tktpGabungan?.porsi_gedung_lama ?? 0);
    totalPortionsBaru =
      categoryGroups.reduce((s, g) => s + g.subtotalGedungBaru, 0) +
      (tktpGabungan?.porsi_gedung_baru ?? 0);
    grandTotalPorsi = totalPortionsLama + totalPortionsBaru;

    // 7. Location & Diet breakdowns (feeding patients only)
    const lamaPatients = analyzed.filter(
      (a) => a.gedungType === 'GEDUNG LAMA' && !a.isNpo,
    );
    const baruPatients = analyzed.filter(
      (a) => a.gedungType === 'GEDUNG BARU' && !a.isNpo,
    );
    const totalFeedingPatients = patientsEating;

    const locationDistribution: TabulasiLocationGroup[] = [
      {
        gedung: 'GEDUNG LAMA',
        totalPatients: lamaPatients.length,
        floors: [
          {
            floorName: 'Semua Ruangan Gedung Lama',
            patientCount: lamaPatients.length,
            percentage:
              totalFeedingPatients > 0
                ? Math.round(
                    (lamaPatients.length / totalFeedingPatients) * 100,
                  )
                : 0,
          },
        ],
      },
      {
        gedung: 'GEDUNG BARU',
        totalPatients: baruPatients.length,
        floors: [
          {
            floorName: 'Semua Ruangan Gedung Baru',
            patientCount: baruPatients.length,
            percentage:
              totalFeedingPatients > 0
                ? Math.round(
                    (baruPatients.length / totalFeedingPatients) * 100,
                  )
                : 0,
          },
        ],
      },
    ];

    const dietCounts = new Map<string, number>();
    for (const ap of analyzed) {
      if (ap.isNpo) {
        dietCounts.set(
          'NPO / Puasa',
          (dietCounts.get('NPO / Puasa') || 0) + 1,
        );
      } else {
        const raw = ap.patient.diet_rs_raw?.trim() || 'Biasa';
        dietCounts.set(raw, (dietCounts.get(raw) || 0) + 1);
      }
    }

    const dietDistribution: TabulasiDietItem[] = Array.from(
      dietCounts.entries(),
    ).map(([code, count]) => ({
      code,
      name: code,
      count,
      percentage:
        totalPatients > 0
          ? Math.round((count / totalPatients) * 1000) / 10
          : 0,
      badgeVariant: code.includes('NPO')
        ? 'destructive'
        : code.includes('DM') || code.includes('RG')
          ? 'secondary'
          : 'default',
    }));

    const menuItems: TabulasiMenuItem[] = allItems.map((it) => {
      let category: TabulasiMenuItem['category'] = 'Lauk Hewani';
      if (it.kategori.includes('NABATI')) category = 'Lauk Nabati';
      else if (it.kategori.includes('SAYUR')) category = 'Sayuran';
      else if (
        it.kategori.includes('TKTP') ||
        it.kategori.includes('EXTRA')
      )
        category = 'Ekstra';

      return {
        id: it.id,
        name: it.nama_menu,
        category,
        totalPortions: it.total_porsi,
        dietBreakdown: [
          { diet: it.kode_diet, count: it.total_porsi, label: it.kode_diet },
        ],
        locationBreakdown: [
          {
            gedung: 'Gedung Lama',
            count: it.porsi_gedung_lama,
            percentage:
              it.total_porsi > 0
                ? Math.round((it.porsi_gedung_lama / it.total_porsi) * 100)
                : 0,
          },
          {
            gedung: 'Gedung Baru',
            count: it.porsi_gedung_baru,
            percentage:
              it.total_porsi > 0
                ? Math.round((it.porsi_gedung_baru / it.total_porsi) * 100)
                : 0,
          },
        ],
        status: 'READY',
      };
    });

    const snackSummary: TabulasiSnackSummary = {
      categories: [],
      items: [],
      gedungLamaCount: 0,
      gedungBaruCount: 0,
      totalPortions: 0,
    };

    const schedule: TabulasiScheduleItem[] = [
      {
        time:
          currentMeal === 'PAGI'
            ? '06:00'
            : currentMeal === 'SIANG'
              ? '11:00'
              : '16:30',
        title: `Pemorsian Makan ${currentMeal}`,
        status: isOfficialLocked ? 'COMPLETED' : 'IN_PROGRESS',
        statusLabel: isOfficialLocked ? 'Snapshot Terkunci' : 'Live Preview',
        description: `Distribusi porsi makan ${currentMeal} untuk Gedung Lama dan Gedung Baru.`,
      },
    ];

    const formattedDate = formatIndoFull(targetDate);

    const hospitalData: TabulasiHospitalData = {
      tanggal: targetDate,
      tanggalFormatted: formattedDate,
      waktuMakan: currentMeal,
      siklusNomor: activeCycleNum,
      siklusNama: activeCycleNama,
      availableSiklus,
      statusBatch: isOfficialLocked ? 'OFFICIAL_LOCKED' : 'LIVE_ACTIVE',
      batchCode: resolvedBatchCode,
      lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: WIB_TIMEZONE, hour: '2-digit', minute: '2-digit' }),
      grandTotalPasien: totalPatients,
      grandTotalPorsi,
      totalGedungLama: totalPortionsLama,
      totalGedungBaru: totalPortionsBaru,
      totalPasienMakan: patientsEating,
      totalPasienNpo: npoCount,
      totalDietKhusus: specialDietCount,
      categoryGroups,
      allItems,
      tktpGabungan,
    };

    const summary: TabulasiPatientSummary = {
      totalPatients,
      patientsEating,
      specialDiet: specialDietCount,
      othersNpo: npoCount,
      totalPortions: grandTotalPorsi,
    };

    return {
      success: true,
      batch: selectedBatch,
      availableBatches,
      summary,
      locationDistribution,
      dietDistribution,
      menuItems,
      snackSummary,
      schedule,
      hospitalData,
      lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: WIB_TIMEZONE }),
    };
  } catch (error) {
    console.error('Error in getTabulasiDashboardData:', error);
    const today = getWibTodayKey();
    const emptyHospitalData: TabulasiHospitalData = {
      tanggal: today,
      tanggalFormatted: 'Hari Ini',
      waktuMakan: 'SIANG',
      siklusNomor: 1,
      siklusNama: 'Siklus 1',
      availableSiklus: [{ nomor_siklus: 1, nama_siklus: 'Siklus 1' }],
      statusBatch: 'LIVE_ACTIVE',
      batchCode: 'BATCH-LIVE-SIANG',
      lastUpdated: '12:00',
      grandTotalPasien: 0,
      grandTotalPorsi: 0,
      totalGedungLama: 0,
      totalGedungBaru: 0,
      totalPasienMakan: 0,
      totalPasienNpo: 0,
      totalDietKhusus: 0,
      categoryGroups: [],
      allItems: [],
      tktpGabungan: null,
    };

    return {
      success: false,
      batch: null,
      availableBatches: [],
      summary: {
        totalPatients: 0,
        patientsEating: 0,
        specialDiet: 0,
        othersNpo: 0,
        totalPortions: 0,
      },
      locationDistribution: [],
      dietDistribution: [],
      menuItems: [],
      snackSummary: {
        categories: [],
        items: [],
        gedungLamaCount: 0,
        gedungBaruCount: 0,
        totalPortions: 0,
      },
      schedule: [],
      hospitalData: emptyHospitalData,
      lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: WIB_TIMEZONE }),
    };
  }
}
