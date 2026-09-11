'use server';

import { eq, desc, and, ne, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import { pasienTable } from '@/db/schemas/patient/pasien';
import {
  masterSiklusTable,
  masterSiklusMenuTable,
} from '@/db/schemas/master/siklus-menu';
import { ruanganTable } from '@/db/schemas/master/ruangan';
import { gedungTable } from '@/db/schemas/master/gedung';
import { isNpoPatient } from '@/lib/npo-utils';
import {
  resolveActiveCycleForDate,
  consolidateSlotMenuItems,
} from '@/lib/siklus-menu-utils';
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

export type SnapshotBatch = typeof snapshotBatchTable.$inferSelect;
export type SnapshotDetail = typeof snapshotDetailTable.$inferSelect;

/** Normalized internal representation of patient for tabulation */
interface TabulasiPatientRecord {
  id: number | string;
  no_rm: string;
  nama_pasien: string;
  gedung: string;
  ruangan: string;
  kelas: string;
  diet_rs_raw: string;
  bentuk_makanan: string | null;
  kategori_diet: string | null;
  status_pasien?: string | null;
  status_saat_snapshot?: string | null;
  is_npo?: boolean | null;
}

/** Strongly-typed JSON payload for post-snapshot approved revisions */
interface ParsedPatientRevisionPayload {
  no_rm?: string;
  nama_pasien?: string;
  gedung?: string;
  ruangan?: string;
  bed?: string;
  kelas?: string;
  diet?: string;
  bentuk_makanan?: string;
  kategori_diet?: string;
}

/** Pre-analyzed patient flags for efficient and accurate dish matching */
interface AnalyzedPatient {
  patient: TabulasiPatientRecord;
  gedungType: 'GEDUNG LAMA' | 'GEDUNG BARU';
  kelasType: 'VIP' | 'KELAS_1' | 'KELAS_2_3';
  isNpo: boolean;
  isDm: boolean;
  isRg: boolean;
  isRs: boolean;
  isRp: boolean;
  isDj: boolean;
  isRl: boolean;
  isRkol: boolean;
  isTktp: boolean;
  isSaring: boolean;
  isBiasa: boolean;
}

type MasterMenuItemRow = typeof masterSiklusMenuTable.$inferSelect;

/**
 * Determine default mealtime based on current local hour
 */
function getDefaultMealtime(): 'PAGI' | 'SIANG' | 'MALAM' {
  const hour = new Date().getHours();
  if (hour < 10) return 'PAGI';
  if (hour < 15) return 'SIANG';
  return 'MALAM';
}

/**
 * Standardize hospital room class to three clinical meal groupings
 */
function normalizeKelas(rawKelas: string | null | undefined): 'VIP' | 'KELAS_1' | 'KELAS_2_3' {
  if (!rawKelas) return 'KELAS_2_3';
  const u = rawKelas.toUpperCase();
  if (u.includes('VIP')) return 'VIP';
  if (u.includes('1') || u === 'I') return 'KELAS_1';
  return 'KELAS_2_3';
}

/**
 * Helper: Automatically determine active menu cycle from date and master_siklus rules
 */
async function determineAutomaticMenuCycle(targetDate: string): Promise<{
  activeCycleNum: number;
  activeCycleNama: string;
  availableSiklus: Array<{ nomor_siklus: number; nama_siklus: string }>;
}> {
  const masterCycles = await db
    .select()
    .from(masterSiklusTable)
    .where(eq(masterSiklusTable.is_active, true))
    .orderBy(asc(masterSiklusTable.nomor_siklus));

  const resolved = resolveActiveCycleForDate(targetDate, masterCycles);
  const activeCycleNum = resolved.activeCycleNum;
  const activeCycleNama = resolved.activeCycleNama;

  const availableSiklus =
    masterCycles.length > 0
      ? masterCycles.map((c) => ({
          nomor_siklus: c.nomor_siklus,
          nama_siklus: c.nama_siklus,
        }))
      : Array.from({ length: 10 }, (_, i) => ({
          nomor_siklus: i + 1,
          nama_siklus: `Siklus ${i + 1}`,
        }));

  return { activeCycleNum, activeCycleNama, availableSiklus };
}

/**
 * Helper: Build lookup mapping for room to building (Gedung Lama vs Gedung Baru)
 */
async function buildRoomBuildingMap(): Promise<Map<string, 'GEDUNG LAMA' | 'GEDUNG BARU'>> {
  const allRooms = await db.select().from(ruanganTable);
  const allGedungs = await db.select().from(gedungTable);

  const gedungMap = new Map<number, string>();
  for (const g of allGedungs) {
    gedungMap.set(g.id, (g.nama_gedung || '').toUpperCase());
  }

  const roomGedungMap = new Map<string, 'GEDUNG LAMA' | 'GEDUNG BARU'>();
  for (const r of allRooms) {
    const gName = r.gedung_id ? gedungMap.get(r.gedung_id) || '' : '';
    const isBaru =
      gName.includes('BARU') || r.nama_ruangan.toUpperCase().includes('BARU');
    roomGedungMap.set(
      r.nama_ruangan.toUpperCase(),
      isBaru ? 'GEDUNG BARU' : 'GEDUNG LAMA',
    );
  }

  return roomGedungMap;
}

/**
 * Helper: Resolve building type of a patient record
 */
function resolvePatientBuilding(
  p: TabulasiPatientRecord,
  roomGedungMap: Map<string, 'GEDUNG LAMA' | 'GEDUNG BARU'>,
): 'GEDUNG LAMA' | 'GEDUNG BARU' {
  const pGedung = (p.gedung || '').toUpperCase();
  if (pGedung.includes('BARU')) return 'GEDUNG BARU';
  if (pGedung.includes('LAMA')) return 'GEDUNG LAMA';

  const pRuangan = (p.ruangan || '').toUpperCase();
  if (roomGedungMap.has(pRuangan)) {
    return roomGedungMap.get(pRuangan)!;
  }
  if (pRuangan.includes('BARU')) return 'GEDUNG BARU';
  return 'GEDUNG LAMA';
}

/**
 * Helper: Fetch real-time patient records (Official Snapshot or Live Preview)
 */
async function resolveTabulasiPatients(
  selectedBatch: TabulasiBatchOption | null,
  targetDate: string,
  currentMeal: string,
): Promise<{
  patientRecords: TabulasiPatientRecord[];
  isOfficialLocked: boolean;
  resolvedBatchCode: string;
}> {
  if (selectedBatch && selectedBatch.id > 0) {
    const isOfficialLocked = selectedBatch.status_batch === 'LOCKED';
    const resolvedBatchCode = selectedBatch.batch_code;

    const details = await db
      .select()
      .from(snapshotDetailTable)
      .where(eq(snapshotDetailTable.batch_id, selectedBatch.id));

    const patientRecords: TabulasiPatientRecord[] = details.map((d) => {
      const isNpo = isNpoPatient({
        ...d,
        is_npo: d.status_saat_snapshot === 'NPO',
        status_pasien: d.status_saat_snapshot,
      });
      return {
        id: d.id,
        no_rm: d.no_rm,
        nama_pasien: d.nama_pasien,
        gedung: d.gedung,
        ruangan: d.ruangan,
        kelas: d.kelas,
        diet_rs_raw: d.diet_rs_raw,
        bentuk_makanan: d.bentuk_makanan,
        kategori_diet: d.kategori_diet,
        status_saat_snapshot: isNpo ? 'NPO' : d.status_saat_snapshot,
        is_npo: isNpo,
      };
    });

    // Accumulate approved post-snapshot revisions (NEW_PATIENT)
    const revisions = await db
      .select()
      .from(otorisasiPerubahanDietTable)
      .where(
        and(
          eq(otorisasiPerubahanDietTable.batch_id, selectedBatch.id),
          eq(otorisasiPerubahanDietTable.status, 'APPROVED'),
          eq(otorisasiPerubahanDietTable.jenis_perubahan, 'NEW_PATIENT'),
        ),
      );

    for (const rev of revisions) {
      let dataBaruObj: ParsedPatientRevisionPayload = {};
      try {
        if (rev.data_baru) {
          dataBaruObj = JSON.parse(rev.data_baru) as ParsedPatientRevisionPayload;
        }
      } catch (_) {
        dataBaruObj = {};
      }

      const isRevNpo = isNpoPatient({
        nama_pasien: dataBaruObj.nama_pasien,
        diet: dataBaruObj.diet,
        diet_rs_raw: dataBaruObj.diet,
        bentuk_makanan: dataBaruObj.bentuk_makanan,
        kategori_diet: dataBaruObj.kategori_diet,
      });

      patientRecords.push({
        id: `rev-${rev.id}`,
        no_rm: dataBaruObj.no_rm || '-',
        nama_pasien: dataBaruObj.nama_pasien || 'Pasien Susulan',
        gedung: dataBaruObj.gedung || 'Gedung Lama',
        ruangan: dataBaruObj.ruangan || '-',
        kelas: dataBaruObj.kelas || 'Kelas 3',
        diet_rs_raw: dataBaruObj.diet || 'Standar',
        bentuk_makanan: dataBaruObj.bentuk_makanan || null,
        kategori_diet: dataBaruObj.kategori_diet || null,
        status_saat_snapshot: isRevNpo ? 'NPO' : 'AKTIF',
        is_npo: isRevNpo,
      });
    }

    return { patientRecords, isOfficialLocked, resolvedBatchCode };
  }

  // Fallback: Live active patients before cut-off
  const isOfficialLocked = false;
  const resolvedBatchCode = `LIVE-${targetDate.replace(/-/g, '')}-${currentMeal}`;

  const activePatients = await db
    .select()
    .from(pasienTable)
    .where(
      and(
        ne(pasienTable.status_pasien, 'PULANG'),
        ne(pasienTable.status_pasien, 'PENDING_REVISI'),
      ),
    );

  const patientRecords: TabulasiPatientRecord[] = activePatients.map((p) => {
    const isNpo = isNpoPatient(p);
    return {
      id: p.id,
      no_rm: p.no_rm || '-',
      nama_pasien: p.nama_pasien,
      gedung: p.gedung || 'Gedung Lama',
      ruangan: p.ruangan || '-',
      kelas: p.kelas || 'Kelas 3',
      diet_rs_raw: p.diet || 'Standar',
      bentuk_makanan: null,
      kategori_diet: null,
      status_pasien: isNpo ? 'NPO' : p.status_pasien,
      is_npo: isNpo,
    };
  });

  return { patientRecords, isOfficialLocked, resolvedBatchCode };
}

/**
 * Match patient clinical diet & class to menu cycle dish item
 */
function matchPatientToDish(
  patient: AnalyzedPatient,
  item: MasterMenuItemRow,
): boolean {
  if (patient.isNpo) return false;

  // 1. Class Matching
  const iKelas = (item.kelas || '').toUpperCase();
  const isSemuaKelas = iKelas.includes('SEMUA') || !iKelas;
  const isKelas1OrVip =
    iKelas === 'I' || iKelas.includes('KELAS 1') || iKelas.includes('VIP');
  const isKelas23 =
    iKelas.includes('II') ||
    iKelas.includes('III') ||
    iKelas.includes('2') ||
    iKelas.includes('3');

  if (!isSemuaKelas) {
    if (patient.kelasType === 'VIP') {
      if (iKelas.includes('VIP')) {
        // VIP exact match
      } else if (isKelas1OrVip) {
        // VIP fallback to Kelas 1
      } else {
        return false;
      }
    } else if (patient.kelasType === 'KELAS_1') {
      if (!isKelas1OrVip) return false;
    } else if (patient.kelasType === 'KELAS_2_3') {
      if (!isKelas23) return false;
    }
  }

  // 2. Clinical Diet Tag Matching
  const tag = (item.kategori_menu || '').toUpperCase();
  if (!tag || tag === 'B') {
    return (
      patient.isBiasa ||
      (!patient.isDm &&
        !patient.isRg &&
        !patient.isRp &&
        !patient.isRs &&
        !patient.isDj &&
        !patient.isSaring)
    );
  }

  if (tag.includes('DM') && patient.isDm) return true;
  if (tag.includes('RG') && patient.isRg) return true;
  if (tag.includes('RS') && patient.isRs) return true;
  if (tag.includes('RP') && patient.isRp) return true;
  if (tag.includes('DJ') && patient.isDj) return true;
  if (tag.includes('RL') && patient.isRl) return true;
  if (tag.includes('RKOL') && patient.isRkol) return true;
  if (tag.includes('SARING') && patient.isSaring) return true;
  if (tag.includes('TKTP') && patient.isTktp) return true;

  return false;
}

/**
 * Fetch all locked/completed snapshot batches
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
 * Main Service: Fetch real-time dashboard data for Tabulasi Rekapitulasi
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

    let cycleMenuItems = await db
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
        asc(masterSiklusMenuTable.urutan),
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
          asc(masterSiklusMenuTable.urutan),
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
        if (matchPatientToDish(ap, m as any)) {
          if (ap.gedungType === 'GEDUNG BARU') {
            porsiBaru++;
          } else {
            porsiLama++;
          }
        }
      }

      const jm = (m.jenis_makanan || 'MENU').toUpperCase();
      const kl = (m.kelas || '').toUpperCase();
      let groupTitle = `${jm}`;
      if (kl === 'I' || kl.includes('1')) {
        groupTitle = `${jm} KELAS 1`;
      } else if (kl.includes('II') || kl.includes('2') || kl.includes('3')) {
        groupTitle = `${jm} KELAS 2 DAN 3`;
      } else if (kl.includes('VIP')) {
        groupTitle = `${jm} VIP`;
      } else {
        groupTitle = `${jm} SEMUA KELAS`;
      }

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
    const groupSortWeight = (catName: string): number => {
      const u = catName.toUpperCase();
      if (u.includes('POKOK') || u.includes('BERAS') || u.includes('NASI')) return 10;
      if (u.includes('HEWANI & NABATI')) return 25;
      if (u.includes('HEWANI')) return 20;
      if (u.includes('NABATI & SAYUR')) return 35;
      if (u.includes('NABATI')) return 30;
      if (u.includes('SAYUR')) return 40;
      if (u.includes('HEWANI & SAYUR')) return 45;
      if (u.includes('SARING')) return 50;
      if (u.includes('EXTRA') && !u.includes('TKTP')) return 60;
      if (u.includes('BUAH')) return 70;
      if (u.includes('SNACK')) return 80;
      if (u.includes('TKTP')) return 90;
      return 100;
    };

    categoryGroups.sort((a, b) => {
      const wA = groupSortWeight(a.kategori);
      const wB = groupSortWeight(b.kategori);
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
                ? Math.round((lamaPatients.length / totalFeedingPatients) * 100)
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
                ? Math.round((baruPatients.length / totalFeedingPatients) * 100)
                : 0,
          },
        ],
      },
    ];

    const dietCounts = new Map<string, number>();
    for (const ap of analyzed) {
      if (ap.isNpo) {
        dietCounts.set('NPO / Puasa', (dietCounts.get('NPO / Puasa') || 0) + 1);
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
      else if (it.kategori.includes('TKTP') || it.kategori.includes('EXTRA'))
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
    } catch (_) {}

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

/**
 * Server action to generate / refresh tabulasi snapshot
 */
export async function generateTabulasiAction(
  tanggal: string,
  waktuMakan: string,
): Promise<{ success: boolean; message: string; batchCode?: string }> {
  try {
    const cleanDate = tanggal
      ? tanggal.replace(/-/g, '')
      : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cleanWaktu = (waktuMakan || 'PAGI').toUpperCase();
    const batchCode = `BATCH-${cleanDate}-${cleanWaktu}`;

    revalidatePath('/dashboard/ag-katering/tabulasi');
    return {
      success: true,
      message: `Tabulasi untuk ${cleanWaktu} (${tanggal || 'Hari Ini'}) berhasil di-generate dengan kode ${batchCode}.`,
      batchCode,
    };
  } catch (error) {
    console.error('Error generating tabulasi:', error);
    return {
      success: false,
      message: 'Gagal melakukan generate tabulasi.',
    };
  }
}
