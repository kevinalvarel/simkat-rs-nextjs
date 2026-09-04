'use server';

import { eq, desc, and, ne, asc, gte, lte } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import { isNpoPatient } from '@/lib/npo-utils';
import type {
  InvoiceDailySummary,
  InvoiceClassConsumption,
  DietBreakdownItem,
  InvoiceRevisionPatient,
  AvailableSnapshotBatch,
} from '@/types/invoicetypes';

// Standard class ordering priority
const KELAS_ORDER: Record<string, number> = {
  VIP: 1,
  'KELAS 1': 2,
  'KELAS I': 2,
  'KELAS 2': 3,
  'KELAS II': 3,
  'KELAS 3': 4,
  'KELAS III': 4,
  'KELAS 2 - 3': 3.5,
  'KELAS 2-3': 3.5,
  ICU: 5,
  HCU: 5,
  NICU: 5,
  PICU: 5,
};

function normalizeKelasName(rawKelas: string | null | undefined): string {
  if (!rawKelas || !rawKelas.trim()) return 'Kelas 3';
  const k = rawKelas.trim();
  const upper = k.toUpperCase();
  if (upper === '1' || upper === 'I') return 'Kelas 1';
  if (upper === '2' || upper === 'II') return 'Kelas 2';
  if (upper === '3' || upper === 'III') return 'Kelas 3';
  if (upper.includes('VIP')) return 'VIP';
  if (upper.includes('1') || upper.includes('I')) return 'Kelas 1';
  if (upper.includes('2') && upper.includes('3')) return 'Kelas 2 - 3';
  if (upper.includes('2')) return 'Kelas 2';
  if (upper.includes('3')) return 'Kelas 3';
  return k;
}

function getDefaultMealtime(): 'PAGI' | 'SIANG' | 'MALAM' {
  const hour = new Date().getHours();
  if (hour < 10) return 'PAGI';
  if (hour < 15) return 'SIANG';
  return 'MALAM';
}

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

    const todayStr = new Date().toISOString().slice(0, 10);
    const dateSet = new Set<string>([todayStr]);

    for (const b of batches) {
      if (b.tanggal_produksi) {
        dateSet.add(b.tanggal_produksi);
      }
    }

    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  } catch (error) {
    console.error('Error fetching available invoice dates:', error);
    return [new Date().toISOString().slice(0, 10)];
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
    const todayStr = new Date().toISOString().slice(0, 10);
    const selectedDate = targetDateStr || todayStr;
    const availableDates = await getAvailableInvoiceDates();
    const availableBatches = await getAvailableInvoiceBatches();

    // Check if user explicitly requested a Date Range
    const isRange = Boolean(endDateStr && endDateStr !== selectedDate);

    // Determine target mealtime: supports specific mealtime even in range queries
    const selectedWaktu = isRange
      ? waktuMakan && waktuMakan !== 'ALL'
        ? waktuMakan.toUpperCase()
        : 'ALL'
      : (waktuMakan as string) || getDefaultMealtime();
    const isPerSnapshot = !isRange && selectedWaktu !== 'ALL';

    const start = isRange
      ? selectedDate < endDateStr!
        ? selectedDate
        : endDateStr!
      : selectedDate;
    const end = isRange
      ? selectedDate < endDateStr!
        ? endDateStr!
        : selectedDate
      : selectedDate;

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const diffDays =
      Math.round(
        (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    const totalDays = isRange ? Math.max(1, diffDays) : 1;

    const formatIndo = (dStr: string) => {
      const d = new Date(dStr);
      return !isNaN(d.getTime())
        ? d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : dStr;
    };

    const tanggalFormatted = isRange
      ? `${formatIndo(start)} – ${formatIndo(end)} (${totalDays} Hari${selectedWaktu !== 'ALL' ? ` • Snapshot ${selectedWaktu}` : ''})`
      : !isNaN(startDateObj.getTime())
        ? startDateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : selectedDate;

    // Data structures for aggregation
    const classMap = new Map<
      string,
      {
        pagi: number;
        siang: number;
        malam: number;
        extra: number;
        baselinePorsi: number;
        revisiTambahPorsi: number;
        pasienSet: Set<string>;
        dietMap: Map<string, number>;
      }
    >();

    function getOrCreateClassEntry(kelasName: string) {
      const norm = normalizeKelasName(kelasName);
      if (!classMap.has(norm)) {
        classMap.set(norm, {
          pagi: 0,
          siang: 0,
          malam: 0,
          extra: 0,
          baselinePorsi: 0,
          revisiTambahPorsi: 0,
          pasienSet: new Set<string>(),
          dietMap: new Map<string, number>(),
        });
      }
      return classMap.get(norm)!;
    }

    let isOfficialLocked = false;
    let resolvedBatchId: number | null = null;
    let resolvedBatchCode: string | null = null;
    let resolvedCutoffTime: string | null = null;
    const revisiPatients: InvoiceRevisionPatient[] = [];

    // Map for multi-day breakdown (used in 'Harian')
    const dailyMap = new Map<
      string,
      Map<
        string,
        {
          pagi: number;
          siang: number;
          malam: number;
          extra: number;
          baselinePorsi: number;
          revisiTambahPorsi: number;
          pasienSet: Set<string>;
          dietMap: Map<string, number>;
        }
      >
    >();

    // Map for multi-snapshot breakdown (used in 'Cetak 1 Snapshot 1 Lembar')
    let snapshotSummaries: InvoiceDailySummary[] | undefined = undefined;

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 1: SINGLE SNAPSHOT MODE (Default / Waktu Makan spesifik)
    // ─────────────────────────────────────────────────────────────────────────
    if (isPerSnapshot) {
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
        isOfficialLocked = true;
        resolvedBatchId = targetBatch.id;
        resolvedBatchCode = targetBatch.batch_code;
        resolvedCutoffTime = targetBatch.cutoff_time;

        // 1. Baseline portions from snapshot details
        const details = await db
          .select()
          .from(snapshotDetailTable)
          .where(eq(snapshotDetailTable.batch_id, targetBatch.id));

        for (const d of details) {
          if (isNpoPatient(d)) {
            continue;
          }

          const entry = getOrCreateClassEntry(d.kelas);
          entry.pasienSet.add(d.no_rm || d.nama_pasien);
          entry.baselinePorsi++;
          if (selectedWaktu === 'PAGI') entry.pagi++;
          else if (selectedWaktu === 'SIANG') entry.siang++;
          else if (selectedWaktu === 'MALAM') entry.malam++;

          if (d.extra?.trim() || d.buah?.trim() || d.snack?.trim()) {
            entry.extra++;
          }

          const bentuk = d.bentuk_makanan || 'Biasa';
          const kategori = d.kategori_diet || 'Standar';
          const dietKey = `${bentuk} - ${kategori}`;
          entry.dietMap.set(dietKey, (entry.dietMap.get(dietKey) || 0) + 1);
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
          if (rev.jenis_perubahan === 'NEW_PATIENT') {
            let dataBaruObj: any = {};
            try {
              if (rev.data_baru) dataBaruObj = JSON.parse(rev.data_baru);
            } catch (_) {}

            if (
              isNpoPatient({
                is_npo: dataBaruObj.is_npo,
                status_pasien: dataBaruObj.status_pasien,
                diet: rev.diet || dataBaruObj.diet,
              })
            ) {
              continue;
            }

            const targetKelas = rev.kelas || dataBaruObj.kelas || 'Kelas 3';
            const entry = getOrCreateClassEntry(targetKelas);

            // Tambahkan porsi susulan
            entry.revisiTambahPorsi++;
            if (selectedWaktu === 'PAGI') entry.pagi++;
            else if (selectedWaktu === 'SIANG') entry.siang++;
            else if (selectedWaktu === 'MALAM') entry.malam++;

            entry.pasienSet.add(
              rev.no_rm ||
                dataBaruObj.no_rm ||
                rev.nama_pasien ||
                `rev-${rev.id}`,
            );

            const dietStr = rev.diet || dataBaruObj.diet || 'Standar';
            entry.dietMap.set(dietStr, (entry.dietMap.get(dietStr) || 0) + 1);

            revisiPatients.push({
              id: rev.id,
              nama_pasien:
                rev.nama_pasien || dataBaruObj.nama_pasien || 'Pasien Susulan',
              no_rm: rev.no_rm || dataBaruObj.no_rm || '-',
              kelas: normalizeKelasName(targetKelas),
              ruangan: rev.ruangan || dataBaruObj.ruangan || '-',
              bed: rev.bed || dataBaruObj.bed || '-',
              diet: dietStr,
              waktu_makan: rev.waktu_makan || selectedWaktu,
              jenis_perubahan: 'NEW_PATIENT',
              alasan: rev.alasan || 'Pasien baru pasca-snapshot (Susulan)',
              requested_by: rev.requested_by || 'Ahli Gizi RS',
              requested_at: rev.requested_at
                ? new Date(rev.requested_at).toLocaleTimeString('id-ID')
                : undefined,
              reviewed_by: rev.reviewed_by || 'Supervisor Gizi',
              reviewed_at: rev.reviewed_at
                ? new Date(rev.reviewed_at).toLocaleTimeString('id-ID')
                : undefined,
            });
          }
        }
      } else {
        // Fallback: Live preview before snapshot cut-off
        isOfficialLocked = false;
        resolvedBatchCode = `LIVE-${selectedDate.replace(/-/g, '')}-${selectedWaktu}`;

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
          if (!isNpoPatient(p)) {
            const entry = getOrCreateClassEntry(p.kelas);
            entry.baselinePorsi++;
            if (selectedWaktu === 'PAGI') entry.pagi++;
            else if (selectedWaktu === 'SIANG') entry.siang++;
            else if (selectedWaktu === 'MALAM') entry.malam++;
            entry.pasienSet.add(p.no_rm || p.nama_pasien);

            const dietStr = p.diet || 'Standar';
            entry.dietMap.set(dietStr, (entry.dietMap.get(dietStr) || 0) + 1);
          }
        }
      }
    } else if (isRange) {
      // ───────────────────────────────────────────────────────────────────────
      // SCENARIO 2: DATE RANGE QUERY (Semua Snapshot dalam Rentang Tanggal)
      // ───────────────────────────────────────────────────────────────────────
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

      if (rangeBatches && rangeBatches.length > 0) {
        isOfficialLocked = true;

        // Structure to track per-batch details for "Cetak 1 Snapshot 1 Lembar"
        const batchMap = new Map<
          number,
          {
            batch: (typeof rangeBatches)[0];
            classMap: Map<
              string,
              {
                pagi: number;
                siang: number;
                malam: number;
                extra: number;
                baselinePorsi: number;
                revisiTambahPorsi: number;
                pasienSet: Set<string>;
                dietMap: Map<string, number>;
              }
            >;
            revisiPatients: InvoiceRevisionPatient[];
          }
        >();

        for (const b of rangeBatches) {
          batchMap.set(b.id, {
            batch: b,
            classMap: new Map(),
            revisiPatients: [],
          });
        }

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
          if (isNpoPatient(d)) {
            continue;
          }

          const waktu = (d.waktu_makan || 'PAGI').toUpperCase();
          const entry = getOrCreateClassEntry(d.kelas);
          const patientDayKey = `${d.tanggal_produksi}_${d.no_rm || d.nama_pasien}`;
          entry.pasienSet.add(patientDayKey);
          entry.baselinePorsi++;
          if (waktu === 'PAGI') entry.pagi++;
          else if (waktu === 'SIANG') entry.siang++;
          else if (waktu === 'MALAM' || waktu === 'SORE') entry.malam++;

          if (d.extra?.trim() || d.buah?.trim() || d.snack?.trim()) {
            entry.extra++;
          }

          const bentuk = d.bentuk_makanan || 'Biasa';
          const kategori = d.kategori_diet || 'Standar';
          const dietKey = `${bentuk} - ${kategori}`;
          entry.dietMap.set(dietKey, (entry.dietMap.get(dietKey) || 0) + 1);

          // Track per-day for "Cetak Harian"
          const dayDateKey = d.tanggal_produksi;
          if (dayDateKey) {
            if (!dailyMap.has(dayDateKey)) {
              dailyMap.set(dayDateKey, new Map());
            }
            const dayClassMap = dailyMap.get(dayDateKey)!;
            const normKelas = normalizeKelasName(d.kelas);
            if (!dayClassMap.has(normKelas)) {
              dayClassMap.set(normKelas, {
                pagi: 0,
                siang: 0,
                malam: 0,
                extra: 0,
                baselinePorsi: 0,
                revisiTambahPorsi: 0,
                pasienSet: new Set<string>(),
                dietMap: new Map<string, number>(),
              });
            }
            const dayEntry = dayClassMap.get(normKelas)!;
            dayEntry.pasienSet.add(d.no_rm || d.nama_pasien);
            dayEntry.baselinePorsi++;
            if (waktu === 'PAGI') dayEntry.pagi++;
            else if (waktu === 'SIANG') dayEntry.siang++;
            else if (waktu === 'MALAM' || waktu === 'SORE') dayEntry.malam++;

            if (d.extra?.trim() || d.buah?.trim() || d.snack?.trim()) {
              dayEntry.extra++;
            }
            dayEntry.dietMap.set(
              dietKey,
              (dayEntry.dietMap.get(dietKey) || 0) + 1,
            );
          }

          // Track per-batch for "Cetak 1 Snapshot 1 Lembar"
          if (d.batch_id && batchMap.has(d.batch_id)) {
            const bEntry = batchMap.get(d.batch_id)!;
            const bNorm = normalizeKelasName(d.kelas);
            if (!bEntry.classMap.has(bNorm)) {
              bEntry.classMap.set(bNorm, {
                pagi: 0,
                siang: 0,
                malam: 0,
                extra: 0,
                baselinePorsi: 0,
                revisiTambahPorsi: 0,
                pasienSet: new Set(),
                dietMap: new Map(),
              });
            }
            const bClassData = bEntry.classMap.get(bNorm)!;
            bClassData.pasienSet.add(d.no_rm || d.nama_pasien);
            bClassData.baselinePorsi++;
            if (waktu === 'PAGI') bClassData.pagi++;
            else if (waktu === 'SIANG') bClassData.siang++;
            else if (waktu === 'MALAM' || waktu === 'SORE')
              bClassData.malam++;

            if (d.extra?.trim() || d.buah?.trim() || d.snack?.trim()) {
              bClassData.extra++;
            }
            bClassData.dietMap.set(
              dietKey,
              (bClassData.dietMap.get(dietKey) || 0) + 1,
            );
          }
        }

        // Revisions in range
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
          let dataBaruObj: any = {};
          try {
            if (rev.data_baru) dataBaruObj = JSON.parse(rev.data_baru);
          } catch (_) {}

          if (
            isNpoPatient({
              is_npo: dataBaruObj.is_npo,
              status_pasien: dataBaruObj.status_pasien,
              diet: rev.diet || dataBaruObj.diet,
            })
          ) {
            continue;
          }

          if (rev.batch_id && batchIds.includes(rev.batch_id)) {
            const matchingBatch = rangeBatches.find(
              (b) => b.id === rev.batch_id,
            );
            const targetKelas = rev.kelas || 'Kelas 3';
            const normKelas = normalizeKelasName(targetKelas);
            const entry = getOrCreateClassEntry(normKelas);
            entry.revisiTambahPorsi++;

            const waktu = (rev.waktu_makan || 'PAGI').toUpperCase();
            if (waktu === 'PAGI') entry.pagi++;
            else if (waktu === 'SIANG') entry.siang++;
            else if (waktu === 'MALAM') entry.malam++;

            // Track into dailyMap
            if (matchingBatch?.tanggal_produksi) {
              const dayClassMap = dailyMap.get(matchingBatch.tanggal_produksi);
              if (dayClassMap) {
                const dayEntry = dayClassMap.get(normKelas);
                if (dayEntry) {
                  dayEntry.revisiTambahPorsi++;
                  if (waktu === 'PAGI') dayEntry.pagi++;
                  else if (waktu === 'SIANG') dayEntry.siang++;
                  else if (waktu === 'MALAM') dayEntry.malam++;
                }
              }
            }

            // Track into batchMap
            if (batchMap.has(rev.batch_id)) {
              const bEntry = batchMap.get(rev.batch_id)!;
              if (!bEntry.classMap.has(normKelas)) {
                bEntry.classMap.set(normKelas, {
                  pagi: 0,
                  siang: 0,
                  malam: 0,
                  extra: 0,
                  baselinePorsi: 0,
                  revisiTambahPorsi: 0,
                  pasienSet: new Set(),
                  dietMap: new Map(),
                });
              }
              const bClassData = bEntry.classMap.get(normKelas)!;
              bClassData.revisiTambahPorsi++;
              bClassData.pasienSet.add(
                rev.no_rm || rev.nama_pasien || `rev-${rev.id}`,
              );
              if (waktu === 'PAGI') bClassData.pagi++;
              else if (waktu === 'SIANG') bClassData.siang++;
              else if (waktu === 'MALAM') bClassData.malam++;

              let dataBaruObj: any = {};
              try {
                if (rev.data_baru) dataBaruObj = JSON.parse(rev.data_baru);
              } catch (_) {}

              bEntry.revisiPatients.push({
                id: rev.id,
                nama_pasien:
                  rev.nama_pasien ||
                  dataBaruObj.nama_pasien ||
                  'Pasien Susulan',
                no_rm: rev.no_rm || dataBaruObj.no_rm || '-',
                kelas: normKelas,
                ruangan: rev.ruangan || dataBaruObj.ruangan || '-',
                bed: rev.bed || dataBaruObj.bed || '-',
                diet: rev.diet || dataBaruObj.diet || 'Standar',
                waktu_makan: waktu,
                jenis_perubahan: 'NEW_PATIENT',
                alasan: rev.alasan || 'Pasien baru pasca-cut-off (Susulan)',
                requested_by: 'Ahli Gizi RS',
                requested_at: rev.requested_at
                  ? new Date(rev.requested_at).toLocaleTimeString('id-ID')
                  : undefined,
                reviewed_by: rev.reviewed_by || 'Supervisor Gizi',
                reviewed_at: rev.reviewed_at
                  ? new Date(rev.reviewed_at).toLocaleTimeString('id-ID')
                  : undefined,
              });
            }
          }
        }

        // Build snapshotSummaries from batchMap for "Cetak 1 Snapshot 1 Lembar"
        snapshotSummaries = [];
        for (const [bId, bData] of batchMap.entries()) {
          const b = bData.batch;
          const bClassMap = bData.classMap;

          for (const stdClass of ['VIP', 'Kelas 1', 'Kelas 2', 'Kelas 3']) {
            if (!bClassMap.has(stdClass)) {
              bClassMap.set(stdClass, {
                pagi: 0,
                siang: 0,
                malam: 0,
                extra: 0,
                baselinePorsi: 0,
                revisiTambahPorsi: 0,
                pasienSet: new Set(),
                dietMap: new Map(),
              });
            }
          }

          const bClasses: InvoiceClassConsumption[] = Array.from(
            bClassMap.entries(),
          ).map(([kName, kData]) => {
            const baselinePorsi = kData.baselinePorsi;
            const revisiTambahPorsi = kData.revisiTambahPorsi;
            const totalPorsi = baselinePorsi + revisiTambahPorsi;
            const totalPasien = kData.pasienSet.size;

            const dietBreakdown: DietBreakdownItem[] = Array.from(
              kData.dietMap.entries(),
            ).map(([key, count]) => {
              const [bentuk, kategori] = key.split(' - ');
              return {
                bentuk: bentuk || 'Biasa',
                kategori: kategori || 'Standar',
                count,
              };
            });

            return {
              kelas: kName,
              pagiCount: kData.pagi,
              siangCount: kData.siang,
              malamCount: kData.malam,
              extraCount: kData.extra,
              baselinePorsi,
              revisiTambahPorsi,
              totalPorsi,
              totalPasien,
              dietBreakdown,
            };
          });

          bClasses.sort((a, b) => {
            const orderA = KELAS_ORDER[a.kelas.toUpperCase()] || 99;
            const orderB = KELAS_ORDER[b.kelas.toUpperCase()] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return a.kelas.localeCompare(b.kelas);
          });

          let bPagi = 0,
            bSiang = 0,
            bMalam = 0,
            bExtra = 0,
            bPorsi = 0,
            bPasien = 0,
            bBaseline = 0,
            bRevisiCount = 0;

          for (const c of bClasses) {
            bPagi += c.pagiCount;
            bSiang += c.siangCount;
            bMalam += c.malamCount;
            bExtra += c.extraCount;
            bPorsi += c.totalPorsi;
            bPasien += c.totalPasien;
            bBaseline += c.baselinePorsi || 0;
            bRevisiCount += c.revisiTambahPorsi || 0;
          }

          const dDateObj = new Date(String(b.tanggal_produksi));
          const dayFormatted = !isNaN(dDateObj.getTime())
            ? dDateObj.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : String(b.tanggal_produksi);

          snapshotSummaries.push({
            tanggal: String(b.tanggal_produksi),
            tanggalFormatted: dayFormatted,
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
            baselineTotalPorsi: bBaseline,
            revisiTambahPasienCount: bRevisiCount,
            revisiPatients: bData.revisiPatients,
            grandTotalPagi: bPagi,
            grandTotalSiang: bSiang,
            grandTotalMalam: bMalam,
            grandTotalExtra: bExtra,
            grandTotalPorsi: bPorsi,
            grandTotalPasien: bPasien,
            classes: bClasses,
            lastUpdated: new Date().toLocaleTimeString('id-ID'),
            isRange: false,
          });
        }
      }
    } else {
      // ───────────────────────────────────────────────────────────────────────
      // SCENARIO 3: SINGLE DATE, ALL MEALTIMES COMBINED ('ALL')
      // ───────────────────────────────────────────────────────────────────────
      const dateBatches = await db
        .select()
        .from(snapshotBatchTable)
        .where(eq(snapshotBatchTable.tanggal_produksi, selectedDate));

      if (dateBatches && dateBatches.length > 0) {
        isOfficialLocked = true;

        for (const batch of dateBatches) {
          const waktu = (batch.waktu_makan || 'PAGI').toUpperCase();
          const details = await db
            .select()
            .from(snapshotDetailTable)
            .where(eq(snapshotDetailTable.batch_id, batch.id));

          for (const d of details) {
            const isNpo =
              d.status_saat_snapshot === 'NPO' ||
              (d.diet_rs_raw || '').toLowerCase() === 'npo' ||
              (d.diet_rs_raw || '').toLowerCase() === 'puasa';

            const entry = getOrCreateClassEntry(d.kelas);
            entry.pasienSet.add(d.no_rm || d.nama_pasien);

            if (!isNpo) {
              entry.baselinePorsi++;
              if (waktu === 'PAGI') entry.pagi++;
              else if (waktu === 'SIANG') entry.siang++;
              else if (waktu === 'MALAM' || waktu === 'SORE') entry.malam++;

              if (d.extra?.trim() || d.buah?.trim() || d.snack?.trim()) {
                entry.extra++;
              }

              const bentuk = d.bentuk_makanan || 'Biasa';
              const kategori = d.kategori_diet || 'Standar';
              const dietKey = `${bentuk} - ${kategori}`;
              entry.dietMap.set(dietKey, (entry.dietMap.get(dietKey) || 0) + 1);
            }
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
            const entry = getOrCreateClassEntry(rev.kelas || 'Kelas 3');
            entry.revisiTambahPorsi++;
            if (waktu === 'PAGI') entry.pagi++;
            else if (waktu === 'SIANG') entry.siang++;
            else if (waktu === 'MALAM') entry.malam++;
          }
        }
      }
    }

    // Ensure standard classes exist for visual consistency
    for (const standardClass of ['VIP', 'Kelas 1', 'Kelas 2', 'Kelas 3']) {
      if (!classMap.has(standardClass)) {
        classMap.set(standardClass, {
          pagi: 0,
          siang: 0,
          malam: 0,
          extra: 0,
          baselinePorsi: 0,
          revisiTambahPorsi: 0,
          pasienSet: new Set<string>(),
          dietMap: new Map<string, number>(),
        });
      }
    }

    // Convert classMap to sorted list
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
      const orderA = KELAS_ORDER[a.kelas.toUpperCase()] || 99;
      const orderB = KELAS_ORDER[b.kelas.toUpperCase()] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.kelas.localeCompare(b.kelas);
    });

    // Compute Grand Totals
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

    // If range query, build per-day summaries for "Cetak Harian"
    let dailySummaries: InvoiceDailySummary[] | undefined = undefined;

    if (isRange && dailyMap.size > 0) {
      dailySummaries = [];
      const sortedDates = Array.from(dailyMap.keys()).sort();

      for (const dayStr of sortedDates) {
        const dayClassMap = dailyMap.get(dayStr)!;

        for (const stdClass of ['VIP', 'Kelas 1', 'Kelas 2', 'Kelas 3']) {
          if (!dayClassMap.has(stdClass)) {
            dayClassMap.set(stdClass, {
              pagi: 0,
              siang: 0,
              malam: 0,
              extra: 0,
              baselinePorsi: 0,
              revisiTambahPorsi: 0,
              pasienSet: new Set(),
              dietMap: new Map(),
            });
          }
        }

        const dayClasses: InvoiceClassConsumption[] = Array.from(
          dayClassMap.entries(),
        ).map(([kName, kData]) => {
          const totalPorsi =
            kData.pagi + kData.siang + kData.malam + kData.extra;
          const totalPasien = kData.pasienSet.size;

          const dietBreakdown: DietBreakdownItem[] = Array.from(
            kData.dietMap.entries(),
          ).map(([key, count]) => {
            const [b, k] = key.split(' - ');
            return {
              bentuk: b || 'Biasa',
              kategori: k || 'Standar',
              count,
            };
          });

          return {
            kelas: kName,
            pagiCount: kData.pagi,
            siangCount: kData.siang,
            malamCount: kData.malam,
            extraCount: kData.extra,
            baselinePorsi: kData.baselinePorsi,
            revisiTambahPorsi: kData.revisiTambahPorsi,
            totalPorsi,
            totalPasien,
            dietBreakdown,
          };
        });

        dayClasses.sort((a, b) => {
          const orderA = KELAS_ORDER[a.kelas.toUpperCase()] || 99;
          const orderB = KELAS_ORDER[b.kelas.toUpperCase()] || 99;
          if (orderA !== orderB) return orderA - orderB;
          return a.kelas.localeCompare(b.kelas);
        });

        let dPagi = 0,
          dSiang = 0,
          dMalam = 0,
          dExtra = 0,
          dPorsi = 0,
          dPasien = 0,
          dBaseline = 0,
          dRevisi = 0;

        for (const c of dayClasses) {
          dPagi += c.pagiCount;
          dSiang += c.siangCount;
          dMalam += c.malamCount;
          dExtra += c.extraCount;
          dPorsi += c.totalPorsi;
          dPasien += c.totalPasien;
          dBaseline += c.baselinePorsi || 0;
          dRevisi += c.revisiTambahPorsi || 0;
        }

        const dDateObj = new Date(dayStr);
        const dayFormatted = !isNaN(dDateObj.getTime())
          ? dDateObj.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : dayStr;

        dailySummaries.push({
          tanggal: dayStr,
          tanggalFormatted: dayFormatted,
          invoiceNumber: `REKAP/GZ-RS/${dayStr.replace(/-/g, '')}/001`,
          hospitalName: 'RSUD dr Slamet Garut',
          cateringVendor: 'INSTALASI GIZI & LAYANAN KATERING RS',
          statusBatch: 'OFFICIAL_LOCKED',
          availableDates,
          baselineTotalPorsi: dBaseline,
          revisiTambahPasienCount: dRevisi,
          grandTotalPagi: dPagi,
          grandTotalSiang: dSiang,
          grandTotalMalam: dMalam,
          grandTotalExtra: dExtra,
          grandTotalPorsi: dPorsi,
          grandTotalPasien: dPasien,
          classes: dayClasses,
          lastUpdated: new Date().toLocaleTimeString('id-ID'),
          isRange: false,
        });
      }
    }

    const invoiceNumber = isRange
      ? `REKAP/GZ-RS/PERIODE/${start.replace(/-/g, '')}-${end.replace(/-/g, '')}/001`
      : isPerSnapshot
        ? `INVOICE/GZ-RS/${selectedDate.replace(/-/g, '')}-${selectedWaktu}/BATCH-${resolvedBatchId || 'LIVE'}`
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
      statusBatch: isOfficialLocked ? 'OFFICIAL_LOCKED' : 'LIVE_PREVIEW',
      availableDates,
      availableBatches,

      batchId: resolvedBatchId,
      batchCode: resolvedBatchCode,
      waktuMakan: selectedWaktu,
      isPerSnapshot,
      cutoffTime: resolvedCutoffTime,

      baselineTotalPorsi,
      revisiTambahPasienCount,
      revisiPatients,

      grandTotalPagi,
      grandTotalSiang,
      grandTotalMalam,
      grandTotalExtra,
      grandTotalPorsi,
      grandTotalPasien,

      classes,
      lastUpdated: new Date().toLocaleTimeString('id-ID'),

      isRange,
      startDate: start,
      endDate: end,
      totalDays,
      dailySummaries,
      snapshotSummaries,
    };
  } catch (error) {
    console.error('Error fetching invoice snapshot data:', error);
    const today = new Date().toISOString().slice(0, 10);
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

      classes: [
        {
          kelas: 'VIP',
          pagiCount: 0,
          siangCount: 0,
          malamCount: 0,
          extraCount: 0,
          baselinePorsi: 0,
          revisiTambahPorsi: 0,
          totalPorsi: 0,
          totalPasien: 0,
          dietBreakdown: [],
        },
        {
          kelas: 'Kelas 1',
          pagiCount: 0,
          siangCount: 0,
          malamCount: 0,
          extraCount: 0,
          baselinePorsi: 0,
          revisiTambahPorsi: 0,
          totalPorsi: 0,
          totalPasien: 0,
          dietBreakdown: [],
        },
        {
          kelas: 'Kelas 2',
          pagiCount: 0,
          siangCount: 0,
          malamCount: 0,
          extraCount: 0,
          baselinePorsi: 0,
          revisiTambahPorsi: 0,
          totalPorsi: 0,
          totalPasien: 0,
          dietBreakdown: [],
        },
        {
          kelas: 'Kelas 3',
          pagiCount: 0,
          siangCount: 0,
          malamCount: 0,
          extraCount: 0,
          baselinePorsi: 0,
          revisiTambahPorsi: 0,
          totalPorsi: 0,
          totalPasien: 0,
          dietBreakdown: [],
        },
      ],
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  }
}
