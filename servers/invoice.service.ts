'use server';

import { eq, desc, and, ne, asc, gte, lte } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import { isNpoPatient } from '@/lib/npo-utils';
import { formatIndo, formatIndoFull, getWibMinutes, getWibTodayKey, WIB_TIMEZONE } from '@/lib/wib';
import {
  getKelasSortWeight,
  normalizeKelasName as normalizeKelasKanonis,
} from '@/lib/kelas-utils';
import { kelasTable } from '@/db/schemas/master/kelas';
import type {
  InvoiceDailySummary,
  InvoiceClassConsumption,
  DietBreakdownItem,
  InvoiceRevisionPatient,
  AvailableSnapshotBatch,
  ClassEntry,
  TktpCounters,
  AggregationContext,
  GrandTotals
} from '@/types/invoicetypes';

// ═══════════════════════════════════════════════════════════════════════════════
// KELAS DINAMIS — daftar kelas diambil dari sistem (tabel kelas), bukan hardcoded
// ═══════════════════════════════════════════════════════════════════════════════

/** Ambil daftar kelas sistem untuk ordering & pemastian baris */
async function getSystemKelasList(): Promise<string[]> {
  try {
    const rows = await db
      .select({ namaKelas: kelasTable.nama_kelas })
      .from(kelasTable);
    if (rows.length > 0) return rows.map((r) => r.namaKelas);
  } catch (error) {
    console.error('Error fetching system kelas for invoice:', error);
  }
  return ['KELAS I', 'KELAS II', 'KELAS III'];
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Internal aggregation entry for a single patient class */


// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (Internal, non-exported)
// ═══════════════════════════════════════════════════════════════════════════════

function normalizeKelasName(rawKelas: string | null | undefined): string {
  // Kanonis KELAS I/II/III; legacy VIP/VVIP dipetakan ke KELAS I; kosong -> KELAS III (bucket lama)
  return normalizeKelasKanonis(rawKelas, 'KELAS III');
}

/**
 * Check if a patient has TKTP (Tinggi Kalori Tinggi Protein) diet.
 * NOTE: Synchronous — NOT async. Previously exported as async, which caused
 * a bug where calls without `await` (in Scenarios 2 & 3) always evaluated
 * to truthy (Promise object), counting all patients as TKTP.
 */
function isTktpDiet(
  d:
    | {
        kategori_diet?: string | null;
        diet_rs_raw?: string | null;
        bentuk_makanan?: string | null;
        diet?: string | null;
      }
    | null
    | undefined,
): boolean {
  if (!d) return false;
  const kat = (d.kategori_diet || '').toUpperCase();
  const raw = (d.diet_rs_raw || '').toUpperCase();
  const bentuk = (d.bentuk_makanan || '').toUpperCase();
  const diet = (d.diet || '').toUpperCase();
  return (
    kat.includes('TKTP') ||
    raw.includes('TKTP') ||
    bentuk.includes('TKTP') ||
    diet.includes('TKTP')
  );
}

function getDefaultMealtime(): 'PAGI' | 'SIANG' | 'MALAM' {
  const minutes = getWibMinutes(new Date());
  if (minutes < 10 * 60) return 'PAGI';
  if (minutes < 15 * 60) return 'SIANG';
  return 'MALAM';
}

/** Creates a fresh class entry with all counters zeroed out */
function createEmptyClassEntry(): ClassEntry {
  return {
    pagi: 0,
    siang: 0,
    malam: 0,
    extra: 0,
    baselinePorsi: 0,
    revisiTambahPorsi: 0,
    pasienSet: new Set<string>(),
    dietMap: new Map<string, number>(),
  };
}

/** Get or create a class entry in the map, normalizing the key */
function getOrCreateClassEntry(
  classMap: Map<string, ClassEntry>,
  kelasName: string | null | undefined,
): ClassEntry {
  const norm = normalizeKelasName(kelasName);
  if (!classMap.has(norm)) {
    classMap.set(norm, createEmptyClassEntry());
  }
  return classMap.get(norm)!;
}

/** Increment the meal count for a specific waktu makan */
function incrementMealCount(
  entry: ClassEntry,
  waktu: string,
): void {
  if (waktu === 'PAGI') entry.pagi++;
  else if (waktu === 'SIANG') entry.siang++;
  else if (waktu === 'MALAM' || waktu === 'SORE') entry.malam++;
}

/** Increment TKTP counters for a specific waktu makan */
function incrementTktpCount(counters: TktpCounters, waktu: string): void {
  if (waktu === 'PAGI') counters.pagi++;
  else if (waktu === 'SIANG') counters.siang++;
  else if (waktu === 'MALAM' || waktu === 'SORE') counters.malam++;
}

/** Track diet breakdown entry in the class map */
function trackDietEntry(
  entry: ClassEntry,
  bentuk: string | null | undefined,
  kategori: string | null | undefined,
): void {
  const b = bentuk || 'Biasa';
  const k = kategori || 'Standar';
  const dietKey = `${b} - ${k}`;
  entry.dietMap.set(dietKey, (entry.dietMap.get(dietKey) || 0) + 1);
}

/** Safely parse JSON from revision data_baru field */
function parseRevisionDataBaru(dataBaru: string | null | undefined): Record<string, any> {
  if (!dataBaru) return {};
  try {
    return JSON.parse(dataBaru);
  } catch {
    return {};
  }
}

/** Check if a detail has extras (extra, buah, or snack) */
function hasExtras(d: { extra?: string | null; buah?: string | null; snack?: string | null }): boolean {
  return !!(d.extra?.trim() || d.buah?.trim() || d.snack?.trim());
}

/** Pastikan semua kelas dari sistem muncul di peta (agar konsisten walau 0 porsi) */
function ensureStandardClasses(
  classMap: Map<string, ClassEntry>,
  systemKelas: string[],
): void {
  for (const stdClass of systemKelas) {
    if (!classMap.has(stdClass)) {
      classMap.set(stdClass, createEmptyClassEntry());
    }
  }
}

/** Convert a class map to a sorted InvoiceClassConsumption array */
function classMapToSortedArray(
  classMap: Map<string, ClassEntry>,
  isPerSnapshot: boolean = false,
  systemKelas: string[] = [],
): InvoiceClassConsumption[] {
  const classes: InvoiceClassConsumption[] = Array.from(
    classMap.entries(),
  ).map(([kelasName, data]) => {
    const baselinePorsi = data.baselinePorsi;
    const revisiTambahPorsi = data.revisiTambahPorsi;
    const totalPorsi = isPerSnapshot
      ? baselinePorsi + revisiTambahPorsi
      : data.pagi + data.siang + data.malam + data.extra;
    const totalPasien = data.pasienSet.size;

    const dietBreakdown: DietBreakdownItem[] = Array.from(
      data.dietMap.entries(),
    ).map(([key, count]) => {
      const [bentuk, kategori] = key.split(' - ');
      return {
        bentuk: bentuk || 'Biasa',
        kategori: kategori || 'Standar',
        count,
      };
    });

    return {
      kelas: kelasName,
      pagiCount: data.pagi,
      siangCount: data.siang,
      malamCount: data.malam,
      extraCount: data.extra,
      baselinePorsi,
      revisiTambahPorsi,
      totalPorsi,
      totalPasien,
      dietBreakdown,
    };
  });

  classes.sort((a, b) => {
    const orderA = getKelasSortWeight(a.kelas, systemKelas);
    const orderB = getKelasSortWeight(b.kelas, systemKelas);
    if (orderA !== orderB) return orderA - orderB;
    return a.kelas.localeCompare(b.kelas);
  });

  return classes;
}

/** Compute all grand totals from a classes array */
function computeGrandTotals(classes: InvoiceClassConsumption[]): GrandTotals {
  let grandTotalPagi = 0;
  let grandTotalSiang = 0;
  let grandTotalMalam = 0;
  let grandTotalExtra = 0;
  let grandTotalPorsi = 0;
  let grandTotalPasien = 0;
  let baselineTotalPorsi = 0;
  let revisiTambahPasienCount = 0;

  for (const c of classes) {
    grandTotalPagi += c.pagiCount;
    grandTotalSiang += c.siangCount;
    grandTotalMalam += c.malamCount;
    grandTotalExtra += c.extraCount;
    grandTotalPorsi += c.totalPorsi;
    grandTotalPasien += c.totalPasien;
    baselineTotalPorsi += c.baselinePorsi || 0;
    revisiTambahPasienCount += c.revisiTambahPorsi || 0;
  }

  return {
    grandTotalPagi,
    grandTotalSiang,
    grandTotalMalam,
    grandTotalExtra,
    grandTotalPorsi,
    grandTotalPasien,
    baselineTotalPorsi,
    revisiTambahPasienCount,
  };
}

/** Format a date string to Indonesian locale (e.g. "6 Agustus 2026") */
function formatDateIndo(dStr: string): string {
  return formatIndo(dStr);
}

/** Format a date string to Indonesian locale with weekday (e.g. "Sabtu, 29 Agustus 2026") */
function formatDateIndoFull(dStr: string): string {
  return formatIndoFull(dStr);
}

/** Build a revision patient record from a revision row and parsed data */
function buildRevisionPatient(
  rev: {
    id: number;
    nama_pasien: string | null;
    no_rm: string | null;
    ruangan?: string | null;
    bed?: string | null;
    diet?: string | null;
    waktu_makan?: string | null;
    alasan?: string | null;
    requested_by?: string | null;
    requested_at?: Date | string | null;
    reviewed_by?: string | null;
    reviewed_at?: Date | string | null;
  },
  dataBaruObj: Record<string, any>,
  normKelas: string,
  waktu: string,
): InvoiceRevisionPatient {
  return {
    id: rev.id,
    nama_pasien:
      rev.nama_pasien || dataBaruObj.nama_pasien || 'Pasien Susulan',
    no_rm: rev.no_rm || dataBaruObj.no_rm || '-',
    kelas: normKelas,
    ruangan: rev.ruangan || dataBaruObj.ruangan || '-',
    bed: rev.bed || dataBaruObj.bed || '-',
    diet: rev.diet || dataBaruObj.diet || 'Standar',
    waktu_makan: rev.waktu_makan || waktu,
    jenis_perubahan: 'NEW_PATIENT',
    alasan: rev.alasan || 'Pasien baru pasca-snapshot (Susulan)',
    requested_by: rev.requested_by || 'Ahli Gizi RS',
    requested_at: rev.requested_at
      ? new Date(rev.requested_at).toLocaleTimeString('id-ID', { timeZone: WIB_TIMEZONE })
      : undefined,
    reviewed_by: rev.reviewed_by || 'Supervisor Gizi',
    reviewed_at: rev.reviewed_at
      ? new Date(rev.reviewed_at).toLocaleTimeString('id-ID', { timeZone: WIB_TIMEZONE })
      : undefined,
  };
}

/** Build a default empty InvoiceDailySummary for error fallback */
function buildEmptyFallbackSummary(): InvoiceDailySummary {
  const today = getWibTodayKey();
  const emptyClass = (kelas: string): InvoiceClassConsumption => ({
    kelas,
    pagiCount: 0,
    siangCount: 0,
    malamCount: 0,
    extraCount: 0,
    baselinePorsi: 0,
    revisiTambahPorsi: 0,
    totalPorsi: 0,
    totalPasien: 0,
    dietBreakdown: [],
  });

  return {
    tanggal: today,
    tanggalFormatted: 'Hari Ini',
    invoiceNumber: `REKAP/GZ-RS/${today.replace(/-/g, '')}/001`,
    hospitalName: 'RSUD dr Slamet Garut',
    cateringVendor: 'INSTALASI GIZI & LAYANAN KATERING RS',
    statusBatch: 'LIVE_PREVIEW',
    availableDates: [today],
    availableBatches: [],
    waktuMakan: 'SIANG',
    isPerSnapshot: true,
    baselineTotalPorsi: 0,
    revisiTambahPasienCount: 0,
    revisiPatients: [],
    grandTotalPagi: 0,
    grandTotalSiang: 0,
    grandTotalMalam: 0,
    grandTotalExtra: 0,
    grandTotalPorsi: 0,
    grandTotalPasien: 0,
    classes: ['KELAS I', 'KELAS II', 'KELAS III'].map((k) => emptyClass(k)),
    tktpCounts: { pagi: 0, siang: 0, malam: 0, total: 0 },
    lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: WIB_TIMEZONE }),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO PROCESSORS (Internal)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SCENARIO 1: SINGLE SNAPSHOT MODE
 * Processes a specific snapshot batch (or live preview if no batch found).
 */
async function processSnapshotMode(
  ctx: AggregationContext,
  selectedDate: string,
  selectedWaktu: string,
  batchId?: number,
): Promise<void> {
  // Find matching batch
  let targetBatch = null;
  if (batchId) {
    const bList = await db
      .select()
      .from(snapshotBatchTable)
      .where(eq(snapshotBatchTable.id, batchId));
    targetBatch = bList[0] || null;
  } else {
    const bList = await db
      .select()
      .from(snapshotBatchTable)
      .where(
        and(
          eq(snapshotBatchTable.tanggal_produksi, selectedDate),
          eq(snapshotBatchTable.waktu_makan, selectedWaktu),
        ),
      );
    targetBatch = bList[0] || null;
  }

  if (targetBatch) {
    ctx.isOfficialLocked = true;
    ctx.resolvedBatchId = targetBatch.id;
    ctx.resolvedBatchCode = targetBatch.batch_code;
    ctx.resolvedCutoffTime = targetBatch.cutoff_time;

    // 1. Baseline portions from snapshot details
    const details = await db
      .select()
      .from(snapshotDetailTable)
      .where(eq(snapshotDetailTable.batch_id, targetBatch.id));

    for (const d of details) {
      if (isNpoPatient(d)) continue;

      const entry = getOrCreateClassEntry(ctx.classMap, d.kelas);
      entry.pasienSet.add(d.no_rm || d.nama_pasien);
      entry.baselinePorsi++;
      incrementMealCount(entry, selectedWaktu);

      if (isTktpDiet(d)) {
        incrementTktpCount(ctx.tktp, selectedWaktu);
      }

      if (hasExtras(d)) {
        entry.extra++;
      }

      trackDietEntry(entry, d.bentuk_makanan, d.kategori_diet);
    }

    // 2. Accumulate Approved Post-Snapshot Revisions (TAMBAH PASIEN)
    const revisions = await db
      .select({
        id: otorisasiPerubahanDietTable.id,
        pasien_id: otorisasiPerubahanDietTable.pasien_id,
        batch_id: otorisasiPerubahanDietTable.batch_id,
        waktu_makan: otorisasiPerubahanDietTable.waktu_makan,
        jenis_perubahan: otorisasiPerubahanDietTable.jenis_perubahan,
        data_lama: otorisasiPerubahanDietTable.data_lama,
        data_baru: otorisasiPerubahanDietTable.data_baru,
        alasan: otorisasiPerubahanDietTable.alasan,
        status: otorisasiPerubahanDietTable.status,
        requested_by: otorisasiPerubahanDietTable.requested_by,
        requested_at: otorisasiPerubahanDietTable.requested_at,
        reviewed_by: otorisasiPerubahanDietTable.reviewed_by,
        reviewed_at: otorisasiPerubahanDietTable.reviewed_at,
        nama_pasien: pasienTable.nama_pasien,
        no_rm: pasienTable.no_rm,
        ruangan: pasienTable.ruangan,
        bed: pasienTable.bed,
        kelas: pasienTable.kelas,
        diet: pasienTable.diet,
      })
      .from(otorisasiPerubahanDietTable)
      .leftJoin(
        pasienTable,
        eq(otorisasiPerubahanDietTable.pasien_id, pasienTable.id),
      )
      .where(
        and(
          eq(otorisasiPerubahanDietTable.batch_id, targetBatch.id),
          eq(otorisasiPerubahanDietTable.status, 'APPROVED'),
        ),
      );

    for (const rev of revisions) {
      // Hanya TAMBAH PASIEN (NEW_PATIENT) yang menambah porsi tagihan!
      // Perubahan diet sifatnya tetap (tidak menambah porsi).
      if (rev.jenis_perubahan !== 'NEW_PATIENT') continue;

      const dataBaruObj = parseRevisionDataBaru(rev.data_baru);

      if (
        isNpoPatient({
          is_npo: dataBaruObj.is_npo,
          status_pasien: dataBaruObj.status_pasien,
          diet: rev.diet || dataBaruObj.diet,
        })
      ) {
        continue;
      }

      const targetKelas = rev.kelas || dataBaruObj.kelas || 'KELAS III';
      const normKelas = normalizeKelasName(targetKelas);
      const entry = getOrCreateClassEntry(ctx.classMap, targetKelas);

      entry.revisiTambahPorsi++;
      incrementMealCount(entry, selectedWaktu);

      if (isTktpDiet({ diet: rev.diet || dataBaruObj.diet })) {
        incrementTktpCount(ctx.tktp, selectedWaktu);
      }

      entry.pasienSet.add(
        rev.no_rm || dataBaruObj.no_rm || rev.nama_pasien || `rev-${rev.id}`,
      );

      const dietStr = rev.diet || dataBaruObj.diet || 'Standar';
      entry.dietMap.set(dietStr, (entry.dietMap.get(dietStr) || 0) + 1);

      ctx.revisiPatients.push(
        buildRevisionPatient(rev, dataBaruObj, normKelas, selectedWaktu),
      );
    }
  } else {
    // Fallback: Live preview before snapshot cut-off
    ctx.isOfficialLocked = false;
    ctx.resolvedBatchCode = `LIVE-${selectedDate.replace(/-/g, '')}-${selectedWaktu}`;

    const activePatients = await db
      .select()
      .from(pasienTable)
      .where(
        and(
          ne(pasienTable.status_pasien, 'PULANG'),
          ne(pasienTable.status_pasien, 'PENDING_REVISI'),
        ),
      );

    for (const p of activePatients) {
      if (isNpoPatient(p)) continue;

      const entry = getOrCreateClassEntry(ctx.classMap, p.kelas);
      entry.baselinePorsi++;
      incrementMealCount(entry, selectedWaktu);

      if (isTktpDiet({ diet: p.diet })) {
        incrementTktpCount(ctx.tktp, selectedWaktu);
      }

      entry.pasienSet.add(p.no_rm || p.nama_pasien);
      const dietStr = p.diet || 'Standar';
      entry.dietMap.set(dietStr, (entry.dietMap.get(dietStr) || 0) + 1);
    }
  }
}

/**
 * SCENARIO 2: DATE RANGE QUERY
 * Processes all snapshots within a date range.
 * Returns optional dailySummaries and snapshotSummaries for sub-views.
 */
async function processRangeMode(
  ctx: AggregationContext,
  start: string,
  end: string,
  selectedWaktu: string,
  availableDates: string[],
): Promise<{
  dailySummaries?: InvoiceDailySummary[];
  snapshotSummaries?: InvoiceDailySummary[];
}> {
  const systemKelas = await getSystemKelasList();
  const batchConditions = [
    gte(snapshotBatchTable.tanggal_produksi, start),
    lte(snapshotBatchTable.tanggal_produksi, end),
  ];
  if (selectedWaktu !== 'ALL') {
    batchConditions.push(eq(snapshotBatchTable.waktu_makan, selectedWaktu));
  }

  const rangeBatches = await db
    .select()
    .from(snapshotBatchTable)
    .where(and(...batchConditions))
    .orderBy(
      asc(snapshotBatchTable.tanggal_produksi),
      asc(snapshotBatchTable.id),
    );

  // Track per-day and per-batch breakdowns
  const dailyMap = new Map<string, Map<string, ClassEntry>>();
  const batchMap = new Map<
    number,
    {
      batch: (typeof rangeBatches)[0];
      classMap: Map<string, ClassEntry>;
      revisiPatients: InvoiceRevisionPatient[];
    }
  >();

  if (!rangeBatches || rangeBatches.length === 0) {
    return {};
  }

  ctx.isOfficialLocked = true;

  for (const b of rangeBatches) {
    batchMap.set(b.id, {
      batch: b,
      classMap: new Map(),
      revisiPatients: [],
    });
  }

  // Fetch all details in range with a single query
  const details = await db
    .select({
      batch_id: snapshotDetailTable.batch_id,
      waktu_makan: snapshotBatchTable.waktu_makan,
      tanggal_produksi: snapshotBatchTable.tanggal_produksi,
      kelas: snapshotDetailTable.kelas,
      no_rm: snapshotDetailTable.no_rm,
      nama_pasien: snapshotDetailTable.nama_pasien,
      status_saat_snapshot: snapshotDetailTable.status_saat_snapshot,
      diet_rs_raw: snapshotDetailTable.diet_rs_raw,
      bentuk_makanan: snapshotDetailTable.bentuk_makanan,
      kategori_diet: snapshotDetailTable.kategori_diet,
      extra: snapshotDetailTable.extra,
      buah: snapshotDetailTable.buah,
      snack: snapshotDetailTable.snack,
    })
    .from(snapshotDetailTable)
    .innerJoin(
      snapshotBatchTable,
      eq(snapshotDetailTable.batch_id, snapshotBatchTable.id),
    )
    .where(
      and(
        gte(snapshotBatchTable.tanggal_produksi, start),
        lte(snapshotBatchTable.tanggal_produksi, end),
        selectedWaktu !== 'ALL'
          ? eq(snapshotBatchTable.waktu_makan, selectedWaktu)
          : undefined,
      ),
    );

  for (const d of details) {
    if (isNpoPatient(d)) continue;

    const waktu = (d.waktu_makan || 'PAGI').toUpperCase();
    const normKelas = normalizeKelasName(d.kelas);

    // Global aggregation
    const entry = getOrCreateClassEntry(ctx.classMap, d.kelas);
    const patientDayKey = `${d.tanggal_produksi}_${d.no_rm || d.nama_pasien}`;
    entry.pasienSet.add(patientDayKey);
    entry.baselinePorsi++;
    incrementMealCount(entry, waktu);

    if (isTktpDiet(d)) {
      incrementTktpCount(ctx.tktp, waktu);
    }

    if (hasExtras(d)) {
      entry.extra++;
    }

    trackDietEntry(entry, d.bentuk_makanan, d.kategori_diet);

    // Per-day tracking (for "Cetak Harian")
    const dayDateKey = d.tanggal_produksi;
    if (dayDateKey) {
      if (!dailyMap.has(dayDateKey)) {
        dailyMap.set(dayDateKey, new Map());
      }
      const dayEntry = getOrCreateClassEntry(dailyMap.get(dayDateKey)!, d.kelas);
      dayEntry.pasienSet.add(d.no_rm || d.nama_pasien);
      dayEntry.baselinePorsi++;
      incrementMealCount(dayEntry, waktu);

      if (hasExtras(d)) {
        dayEntry.extra++;
      }

      trackDietEntry(dayEntry, d.bentuk_makanan, d.kategori_diet);
    }

    // Per-batch tracking (for "Cetak 1 Snapshot 1 Lembar")
    if (d.batch_id && batchMap.has(d.batch_id)) {
      const bEntry = batchMap.get(d.batch_id)!;
      const bClassEntry = getOrCreateClassEntry(bEntry.classMap, d.kelas);
      bClassEntry.pasienSet.add(d.no_rm || d.nama_pasien);
      bClassEntry.baselinePorsi++;
      incrementMealCount(bClassEntry, waktu);

      if (hasExtras(d)) {
        bClassEntry.extra++;
      }

      trackDietEntry(bClassEntry, d.bentuk_makanan, d.kategori_diet);
    }
  }

  // Process revisions in range
  const batchIds = rangeBatches.map((b) => b.id);
  const rangeRevisions = await db
    .select({
      id: otorisasiPerubahanDietTable.id,
      pasien_id: otorisasiPerubahanDietTable.pasien_id,
      batch_id: otorisasiPerubahanDietTable.batch_id,
      waktu_makan: otorisasiPerubahanDietTable.waktu_makan,
      jenis_perubahan: otorisasiPerubahanDietTable.jenis_perubahan,
      data_baru: otorisasiPerubahanDietTable.data_baru,
      alasan: otorisasiPerubahanDietTable.alasan,
      requested_at: otorisasiPerubahanDietTable.requested_at,
      reviewed_by: otorisasiPerubahanDietTable.reviewed_by,
      reviewed_at: otorisasiPerubahanDietTable.reviewed_at,
      nama_pasien: pasienTable.nama_pasien,
      no_rm: pasienTable.no_rm,
      ruangan: pasienTable.ruangan,
      bed: pasienTable.bed,
      kelas: pasienTable.kelas,
      diet: pasienTable.diet,
    })
    .from(otorisasiPerubahanDietTable)
    .leftJoin(
      pasienTable,
      eq(otorisasiPerubahanDietTable.pasien_id, pasienTable.id),
    )
    .where(
      and(
        eq(otorisasiPerubahanDietTable.status, 'APPROVED'),
        eq(otorisasiPerubahanDietTable.jenis_perubahan, 'NEW_PATIENT'),
        selectedWaktu !== 'ALL'
          ? eq(otorisasiPerubahanDietTable.waktu_makan, selectedWaktu)
          : undefined,
      ),
    );

  for (const rev of rangeRevisions) {
    const dataBaruObj = parseRevisionDataBaru(rev.data_baru);

    if (
      isNpoPatient({
        is_npo: dataBaruObj.is_npo,
        status_pasien: dataBaruObj.status_pasien,
        diet: rev.diet || dataBaruObj.diet,
      })
    ) {
      continue;
    }

    if (!rev.batch_id || !batchIds.includes(rev.batch_id)) continue;

    const matchingBatch = rangeBatches.find((b) => b.id === rev.batch_id);
    const targetKelas = rev.kelas || 'KELAS III';
    const normKelas = normalizeKelasName(targetKelas);
    const waktu = (rev.waktu_makan || 'PAGI').toUpperCase();

    // Global aggregation
    const entry = getOrCreateClassEntry(ctx.classMap, normKelas);
    entry.revisiTambahPorsi++;
    incrementMealCount(entry, waktu);

    if (isTktpDiet({ diet: rev.diet || dataBaruObj.diet })) {
      incrementTktpCount(ctx.tktp, waktu);
    }

    // Per-day tracking
    if (matchingBatch?.tanggal_produksi) {
      const dayClassMap = dailyMap.get(matchingBatch.tanggal_produksi);
      if (dayClassMap) {
        const dayEntry = dayClassMap.get(normKelas);
        if (dayEntry) {
          dayEntry.revisiTambahPorsi++;
          incrementMealCount(dayEntry, waktu);
        }
      }
    }

    // Per-batch tracking
    if (batchMap.has(rev.batch_id)) {
      const bEntry = batchMap.get(rev.batch_id)!;
      const bClassEntry = getOrCreateClassEntry(bEntry.classMap, normKelas);
      bClassEntry.revisiTambahPorsi++;
      bClassEntry.pasienSet.add(
        rev.no_rm || rev.nama_pasien || `rev-${rev.id}`,
      );
      incrementMealCount(bClassEntry, waktu);

      bEntry.revisiPatients.push(
        buildRevisionPatient(rev, dataBaruObj, normKelas, waktu),
      );
    }
  }

  // Build snapshotSummaries from batchMap
  const snapshotSummaries: InvoiceDailySummary[] = [];
  for (const [, bData] of batchMap.entries()) {
    const b = bData.batch;
    ensureStandardClasses(bData.classMap, systemKelas);

    const bClasses = classMapToSortedArray(bData.classMap, true, systemKelas);
    const bTotals = computeGrandTotals(bClasses);

    snapshotSummaries.push({
      tanggal: String(b.tanggal_produksi),
      tanggalFormatted: formatDateIndoFull(String(b.tanggal_produksi)),
      invoiceNumber: `INVOICE/GZ-RS/${String(b.tanggal_produksi).replace(/-/g, '')}-${b.waktu_makan}/BATCH-${b.id}`,
      hospitalName: 'RSUD dr Slamet Garut',
      cateringVendor: 'INSTALASI GIZI & LAYANAN KATERING RS',
      statusBatch: 'OFFICIAL_LOCKED',
      availableDates,
      batchId: b.id,
      batchCode: b.batch_code,
      waktuMakan: b.waktu_makan,
      isPerSnapshot: true,
      cutoffTime: b.cutoff_time,
      ...bTotals,
      revisiPatients: bData.revisiPatients,
      classes: bClasses,
      lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: WIB_TIMEZONE }),
      isRange: false,
    });
  }

  // Build dailySummaries from dailyMap
  let dailySummaries: InvoiceDailySummary[] | undefined = undefined;
  if (dailyMap.size > 0) {
    dailySummaries = [];
    const sortedDates = Array.from(dailyMap.keys()).sort();

    for (const dayStr of sortedDates) {
      const dayClassMap = dailyMap.get(dayStr)!;
      ensureStandardClasses(dayClassMap, systemKelas);

      const dayClasses = classMapToSortedArray(dayClassMap, false, systemKelas);
      const dayTotals = computeGrandTotals(dayClasses);

      dailySummaries.push({
        tanggal: dayStr,
        tanggalFormatted: formatDateIndoFull(dayStr),
        invoiceNumber: `REKAP/GZ-RS/${dayStr.replace(/-/g, '')}/001`,
        hospitalName: 'RSUD dr Slamet Garut',
        cateringVendor: 'INSTALASI GIZI & LAYANAN KATERING RS',
        statusBatch: 'OFFICIAL_LOCKED',
        availableDates,
        ...dayTotals,
        classes: dayClasses,
        lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: WIB_TIMEZONE }),
        isRange: false,
      });
    }
  }

  return { dailySummaries, snapshotSummaries };
}

/**
 * SCENARIO 3: SINGLE DATE, ALL MEALTIMES COMBINED ('ALL')
 * Processes all batches for a single date, combining all meal times.
 */
async function processAllMealtimesMode(
  ctx: AggregationContext,
  selectedDate: string,
): Promise<void> {
  const dateBatches = await db
    .select()
    .from(snapshotBatchTable)
    .where(eq(snapshotBatchTable.tanggal_produksi, selectedDate));

  if (!dateBatches || dateBatches.length === 0) return;

  ctx.isOfficialLocked = true;

  for (const batch of dateBatches) {
    const waktu = (batch.waktu_makan || 'PAGI').toUpperCase();

    const details = await db
      .select()
      .from(snapshotDetailTable)
      .where(eq(snapshotDetailTable.batch_id, batch.id));

    for (const d of details) {
      // Fixed: was inline NPO check, now uses centralized isNpoPatient()
      if (isNpoPatient(d)) continue;

      const entry = getOrCreateClassEntry(ctx.classMap, d.kelas);
      entry.pasienSet.add(d.no_rm || d.nama_pasien);
      entry.baselinePorsi++;
      incrementMealCount(entry, waktu);

      if (isTktpDiet(d)) {
        incrementTktpCount(ctx.tktp, waktu);
      }

      if (hasExtras(d)) {
        entry.extra++;
      }

      trackDietEntry(entry, d.bentuk_makanan, d.kategori_diet);
    }

    // Approved revisions for this batch
    const batchRevisions = await db
      .select({
        id: otorisasiPerubahanDietTable.id,
        pasien_id: otorisasiPerubahanDietTable.pasien_id,
        batch_id: otorisasiPerubahanDietTable.batch_id,
        waktu_makan: otorisasiPerubahanDietTable.waktu_makan,
        jenis_perubahan: otorisasiPerubahanDietTable.jenis_perubahan,
        nama_pasien: pasienTable.nama_pasien,
        no_rm: pasienTable.no_rm,
        kelas: pasienTable.kelas,
        diet: pasienTable.diet,
      })
      .from(otorisasiPerubahanDietTable)
      .leftJoin(
        pasienTable,
        eq(otorisasiPerubahanDietTable.pasien_id, pasienTable.id),
      )
      .where(
        and(
          eq(otorisasiPerubahanDietTable.batch_id, batch.id),
          eq(otorisasiPerubahanDietTable.status, 'APPROVED'),
          eq(otorisasiPerubahanDietTable.jenis_perubahan, 'NEW_PATIENT'),
        ),
      );

    for (const rev of batchRevisions) {
      const entry = getOrCreateClassEntry(ctx.classMap, rev.kelas || 'KELAS III');
      entry.revisiTambahPorsi++;
      incrementMealCount(entry, waktu);

      if (isTktpDiet({ diet: rev.diet })) {
        incrementTktpCount(ctx.tktp, waktu);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTED SERVER ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch list of all dates that have recorded batches
 */
export async function getAvailableInvoiceDates(): Promise<string[]> {
  try {
    const batches = await db
      .select({
        tanggal_produksi: snapshotBatchTable.tanggal_produksi,
      })
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.tanggal_produksi));

    const todayStr = getWibTodayKey();
    const dateSet = new Set<string>([todayStr]);

    for (const b of batches) {
      if (b.tanggal_produksi) {
        dateSet.add(b.tanggal_produksi);
      }
    }

    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  } catch (error) {
    console.error('Error fetching available invoice dates:', error);
    return [getWibTodayKey()];
  }
}

/**
 * Fetch all available snapshot batches for snapshot toggle and batch selection
 */
export async function getAvailableInvoiceBatches(): Promise<
  AvailableSnapshotBatch[]
> {
  try {
    const batches = await db
      .select({
        id: snapshotBatchTable.id,
        batch_code: snapshotBatchTable.batch_code,
        tanggal_produksi: snapshotBatchTable.tanggal_produksi,
        waktu_makan: snapshotBatchTable.waktu_makan,
        status_batch: snapshotBatchTable.status_batch,
        total_pasien: snapshotBatchTable.total_pasien,
        cutoff_time: snapshotBatchTable.cutoff_time,
      })
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.timestamp_snapshot));

    return batches.map((b) => ({
      ...b,
      tanggal_produksi: String(b.tanggal_produksi),
    }));
  } catch (err) {
    console.error('Error fetching available batches for invoice:', err);
    return [];
  }
}

/**
 * Fetch food consumption invoice per snapshot or per date range,
 * accumulating baseline portions and approved post-snapshot Tambah Pasien revisions.
 */
export async function getInvoiceDailyData(
  targetDateStr?: string,
  endDateStr?: string,
  waktuMakan?: string,
  batchId?: number,
): Promise<InvoiceDailySummary> {
  try {
    const todayStr = getWibTodayKey();
    const selectedDate = targetDateStr || todayStr;
    const availableDates = await getAvailableInvoiceDates();
    const availableBatches = await getAvailableInvoiceBatches();

    // Determine query mode
    const isRange = Boolean(endDateStr && endDateStr !== selectedDate);
    const selectedWaktu = isRange
      ? waktuMakan && waktuMakan !== 'ALL'
        ? waktuMakan.toUpperCase()
        : 'ALL'
      : (waktuMakan as string) || getDefaultMealtime();
    const isPerSnapshot = !isRange && selectedWaktu !== 'ALL';

    // Normalize date range
    const start = isRange
      ? selectedDate < endDateStr! ? selectedDate : endDateStr!
      : selectedDate;
    const end = isRange
      ? selectedDate < endDateStr! ? endDateStr! : selectedDate
      : selectedDate;

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const diffDays =
      Math.round(
        (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    const totalDays = isRange ? Math.max(1, diffDays) : 1;

    // Format display date
    const tanggalFormatted = isRange
      ? `${formatDateIndo(start)} – ${formatDateIndo(end)} (${totalDays} Hari${selectedWaktu !== 'ALL' ? ` • Snapshot ${selectedWaktu}` : ''})`
      : !isNaN(startDateObj.getTime())
        ? formatDateIndoFull(selectedDate)
        : selectedDate;

    // Initialize aggregation context
    const ctx: AggregationContext = {
      classMap: new Map<string, ClassEntry>(),
      tktp: { pagi: 0, siang: 0, malam: 0 },
      revisiPatients: [],
      isOfficialLocked: false,
      resolvedBatchId: null,
      resolvedBatchCode: null,
      resolvedCutoffTime: null,
    };

    let dailySummaries: InvoiceDailySummary[] | undefined = undefined;
    let snapshotSummaries: InvoiceDailySummary[] | undefined = undefined;

    // Dispatch to appropriate scenario processor
    if (isPerSnapshot) {
      await processSnapshotMode(ctx, selectedDate, selectedWaktu, batchId);
    } else if (isRange) {
      const rangeResult = await processRangeMode(
        ctx, start, end, selectedWaktu, availableDates,
      );
      dailySummaries = rangeResult.dailySummaries;
      snapshotSummaries = rangeResult.snapshotSummaries;
    } else {
      await processAllMealtimesMode(ctx, selectedDate);
    }

    // Pastikan semua kelas sistem muncul (data dari DB, bukan hardcoded)
    const systemKelas = await getSystemKelasList();
    ensureStandardClasses(ctx.classMap, systemKelas);

    // Convert to sorted array and compute totals
    const classes = classMapToSortedArray(ctx.classMap, isPerSnapshot, systemKelas);
    const totals = computeGrandTotals(classes);

    // Generate invoice number
    const invoiceNumber = isRange
      ? `REKAP/GZ-RS/PERIODE/${start.replace(/-/g, '')}-${end.replace(/-/g, '')}/001`
      : isPerSnapshot
        ? `INVOICE/GZ-RS/${selectedDate.replace(/-/g, '')}-${selectedWaktu}/BATCH-${ctx.resolvedBatchId || 'LIVE'}`
        : `REKAP/GZ-RS/${selectedDate.replace(/-/g, '')}/001`;

    return {
      tanggal: isRange
        ? `${start} s/d ${end}`
        : isPerSnapshot
          ? `${selectedDate} (${selectedWaktu})`
          : selectedDate,
      tanggalFormatted,
      invoiceNumber,
      hospitalName: 'RSUD dr Slamet Garut',
      cateringVendor: 'INSTALASI GIZI & LAYANAN KATERING RS',
      statusBatch: ctx.isOfficialLocked ? 'OFFICIAL_LOCKED' : 'LIVE_PREVIEW',
      availableDates,
      availableBatches,

      batchId: ctx.resolvedBatchId,
      batchCode: ctx.resolvedBatchCode,
      waktuMakan: selectedWaktu,
      isPerSnapshot,
      cutoffTime: ctx.resolvedCutoffTime,

      ...totals,
      revisiPatients: ctx.revisiPatients,

      classes,
      tktpCounts: {
        pagi: ctx.tktp.pagi,
        siang: ctx.tktp.siang,
        malam: ctx.tktp.malam,
        total: ctx.tktp.pagi + ctx.tktp.siang + ctx.tktp.malam,
      },
      lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: WIB_TIMEZONE }),

      isRange,
      startDate: start,
      endDate: end,
      totalDays,
      dailySummaries,
      snapshotSummaries,
    };
  } catch (error) {
    console.error('Error fetching invoice snapshot data:', error);
    return buildEmptyFallbackSummary();
  }
}
