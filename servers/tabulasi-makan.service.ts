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
} from '@/helper/tabulasi';
import type { AnalyzedPatient } from '@/helper/tabulasi';

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
    const todayStr = new Date().toISOString().slice(0, 10);
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

    for (const m of consolidatedMenuItems) {
      let porsiLama = 0;
      let porsiBaru = 0;

      for (const ap of analyzed) {
        if (matchPatientToDish(ap, m)) {
          if (ap.gedungType === 'GEDUNG BARU') {
            porsiBaru++;
          } else {
            porsiLama++;
          }
        }
      }

      const groupTitle = buildMenuGroupTitle(m.jenis_makanan, m.kelas);

      if (!categoryGroupMap.has(groupTitle)) {
        categoryGroupMap.set(groupTitle, []);
      }

      const isTktpItem =
        (m.kategori_menu || '').toUpperCase().includes('TKTP') ||
        (m.nama_makanan || '').toUpperCase().includes('TKTP');

      categoryGroupMap.get(groupTitle)!.push({
        id: `m-${m.id}`,
        kategori: groupTitle,
        nama_menu: m.nama_makanan,
        kode_diet: m.kategori_menu || 'B',
        porsi_gedung_lama: porsiLama,
        porsi_gedung_baru: porsiBaru,
        total_porsi: porsiLama + porsiBaru,
        is_tktp: isTktpItem,
        catatan: m.catatan || undefined,
      });
    }

    // Add dedicated TKTP line if TKTP patients exist and not yet covered
    const tktpPatients = analyzed.filter((a) => a.isTktp && !a.isNpo);
    if (tktpPatients.length > 0 && !categoryGroupMap.has('TKTP (EXTRA)')) {
      const tLama = tktpPatients.filter(
        (a) => a.gedungType === 'GEDUNG LAMA',
      ).length;
      const tBaru = tktpPatients.filter(
        (a) => a.gedungType === 'GEDUNG BARU',
      ).length;
      categoryGroupMap.set('TKTP (EXTRA)', [
        {
          id: 'tktp-extra',
          kategori: 'TKTP (EXTRA)',
          nama_menu: 'Extra Telur Rebus / Putih Telur (TKTP)',
          kode_diet: 'TKTP',
          porsi_gedung_lama: tLama,
          porsi_gedung_baru: tBaru,
          total_porsi: tLama + tBaru,
          is_tktp: true,
          catatan: 'Porsi tambahan tinggi protein pasien TKTP',
        },
      ]);
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

    const allItems = categoryGroups.flatMap((g) => g.items);
    const grandTotalPorsi = totalPortionsLama + totalPortionsBaru;

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

    let formattedDate = targetDate;
    try {
      const d = new Date(targetDate);
      formattedDate = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {}

    const hospitalData: TabulasiHospitalData = {
      tanggal: targetDate,
      tanggalFormatted: formattedDate,
      waktuMakan: currentMeal,
      siklusNomor: activeCycleNum,
      siklusNama: activeCycleNama,
      availableSiklus,
      statusBatch: isOfficialLocked ? 'OFFICIAL_LOCKED' : 'LIVE_ACTIVE',
      batchCode: resolvedBatchCode,
      lastUpdated: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      grandTotalPasien: totalPatients,
      grandTotalPorsi,
      totalGedungLama: totalPortionsLama,
      totalGedungBaru: totalPortionsBaru,
      totalPasienMakan: patientsEating,
      totalPasienNpo: npoCount,
      totalDietKhusus: specialDietCount,
      categoryGroups,
      allItems,
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
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  } catch (error) {
    console.error('Error in getTabulasiDashboardData:', error);
    const today = new Date().toISOString().slice(0, 10);
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
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  }
}
