'use server';

import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { dampakDapurForJenis } from '@/lib/revisi-jenis';

export type WaktuMakanType = 'PAGI' | 'SIANG' | 'MALAM';
export type JenisPerubahanType =
  | 'DIET_CHANGE'
  | 'ROOM_TRANSFER'
  | 'NEW_PATIENT'
  | 'DISCHARGE'
  | 'NPO'
  | 'KOREKSI_NAMA'
  | 'KOREKSI_NO_RM'
  | 'KOREKSI_KELAS'
  | 'KOREKSI_KAMAR'
  | 'KOREKSI_BED';

export type StatusRevisiType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SELESAI';

export interface DataDietDetail {
  nama_pasien?: string;
  no_rm?: string;
  diet?: string;
  gedung?: string;
  ruangan?: string;
  bed?: string;
  kelas?: string;
  status_pasien?: string;
}

export interface RevisiPostSnapshotItem {
  id: number;
  pasien_id: number;
  no_rm: string;
  nama_pasien: string;
  gedung: string;
  ruangan: string;
  bed: string;
  kelas: string;
  batch_id?: number | null;
  batch_code?: string | null;
  waktu_makan: WaktuMakanType;
  jenis_perubahan: JenisPerubahanType;
  data_lama?: DataDietDetail | null;
  data_baru?: DataDietDetail | null;
  alasan: string;
  status: StatusRevisiType;
  dampak_dapur: string;
  requested_by: string;
  requested_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
}

export interface RevisiStats {
  totalRevisi: number;
  porsiEmergent: number; // +1 porsi
  porsiDibatalkan: number; // -1 porsi
  pendingCount: number;
  approvedCount: number;
  selesaiCount: number;
}

export interface MutationResult {
  success: boolean;
  message: string;
}

/**
 * Fetch all post-snapshot diet revisions with optional filtering
 */
export async function getRevisiPostSnapshot(
  waktuMakan?: string,
  batchId?: number,
): Promise<RevisiPostSnapshotItem[]> {
  try {
    const query = db
      .select({
        id: otorisasiPerubahanDietTable.id,
        pasien_id: otorisasiPerubahanDietTable.pasien_id,
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
        review_notes: otorisasiPerubahanDietTable.review_notes,
        batch_id: otorisasiPerubahanDietTable.batch_id,

        // Patient fields
        nama_pasien: pasienTable.nama_pasien,
        no_rm: pasienTable.no_rm,
        gedung: pasienTable.gedung,
        ruangan: pasienTable.ruangan,
        bed: pasienTable.bed,
        kelas: pasienTable.kelas,

        // Batch fields
        batch_code: snapshotBatchTable.batch_code,
      })
      .from(otorisasiPerubahanDietTable)
      .leftJoin(pasienTable, eq(otorisasiPerubahanDietTable.pasien_id, pasienTable.id))
      .leftJoin(snapshotBatchTable, eq(otorisasiPerubahanDietTable.batch_id, snapshotBatchTable.id))
      .orderBy(desc(otorisasiPerubahanDietTable.requested_at));

    const dbResults = await query;

    if (dbResults && dbResults.length > 0) {
      let mapped = dbResults.map((r) => {
        let dataLamaObj: DataDietDetail | null = null;
        let dataBaruObj: DataDietDetail | null = null;

        try {
          if (r.data_lama) dataLamaObj = JSON.parse(r.data_lama);
        } catch (_) {}

        try {
          if (r.data_baru) dataBaruObj = JSON.parse(r.data_baru);
        } catch (_) {}

        const jenis = r.jenis_perubahan as JenisPerubahanType;
        const dampak =
          jenis === 'NEW_PATIENT'
            ? '+1 Porsi Emergent (Tambahan Makanan)'
            : dampakDapurForJenis(jenis);

        return {
          id: r.id,
          pasien_id: r.pasien_id,
          no_rm: r.no_rm || 'RM-UNKNOWN',
          nama_pasien: r.nama_pasien || 'Pasien Tanpa Nama',
          gedung: r.gedung || '',
          ruangan: r.ruangan || '',
          bed: r.bed || '',
          kelas: r.kelas || '',
          batch_id: r.batch_id,
          batch_code: r.batch_code || 'BATCH-LOCKED',
          waktu_makan: (r.waktu_makan as WaktuMakanType) || 'PAGI',
          jenis_perubahan: jenis,
          data_lama: dataLamaObj,
          data_baru: dataBaruObj,
          alasan: r.alasan || 'Tidak ada alasan dicantumkan',
          status: (r.status as StatusRevisiType) || 'PENDING',
          dampak_dapur: dampak,
          requested_by: r.requested_by || 'Staf RS',
          requested_at: r.requested_at ? r.requested_at.toISOString() : new Date().toISOString(),
          reviewed_by: r.reviewed_by,
          reviewed_at: r.reviewed_at ? r.reviewed_at.toISOString() : null,
          review_notes: r.review_notes,
        };
      });

      if (waktuMakan && waktuMakan !== 'ALL') {
        mapped = mapped.filter((i) => i.waktu_makan === waktuMakan);
      }
      if (batchId) {
        mapped = mapped.filter((i) => i.batch_id === batchId);
      }
      return mapped;
    }
    return [];
  } catch (error) {
    console.error('Error fetching otorisasi_perubahan_diet from DB:', error);
    return [];
  }
}

/**
 * Fetch summary stats for post-snapshot revisions
 */
export async function getRevisiStats(items?: RevisiPostSnapshotItem[]): Promise<RevisiStats> {
  const data = items || (await getRevisiPostSnapshot());
  const totalRevisi = data.length;
  const porsiEmergent = data.filter((i) => i.jenis_perubahan === 'NEW_PATIENT').length;
  const porsiDibatalkan = data.filter(
    (i) => i.jenis_perubahan === 'DISCHARGE' || i.jenis_perubahan === 'NPO'
  ).length;
  const pendingCount = data.filter((i) => i.status === 'PENDING').length;
  const approvedCount = data.filter((i) => i.status === 'APPROVED').length;
  const selesaiCount = data.filter((i) => i.status === 'SELESAI').length;

  return {
    totalRevisi,
    porsiEmergent,
    porsiDibatalkan,
    pendingCount,
    approvedCount,
    selesaiCount,
  };
}

/**
 * Update the status of a post-snapshot revision (e.g. APPROVED, REJECTED, SELESAI)
 */
export async function updateStatusRevisi(
  id: number,
  status: StatusRevisiType,
  notes?: string,
  reviewerName: string = 'Ahli Gizi Katering'
): Promise<MutationResult> {
  try {
    const existing = await db
      .select()
      .from(otorisasiPerubahanDietTable)
      .where(eq(otorisasiPerubahanDietTable.id, id));

    if (existing && existing.length > 0) {
      await db
        .update(otorisasiPerubahanDietTable)
        .set({
          status: status,
          reviewed_by: reviewerName,
          reviewed_at: new Date(),
          review_notes: notes || null,
        })
        .where(eq(otorisasiPerubahanDietTable.id, id));

      revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
      revalidatePath('/dashboard/ag-katering/overview');
      revalidatePath('/dashboard/ag-katering/overview/produksi');
      revalidatePath('/dashboard/ag-katering/overview/pemorsian');
      return {
        success: true,
        message: `Status revisi #${id} berhasil diperbarui menjadi ${status}.`,
      };
    }

    return {
      success: false,
      message: `Revisi #${id} tidak ditemukan.`,
    };
  } catch (error) {
    console.error('Error updating status revisi in DB:', error);
    return {
      success: false,
      message: 'Gagal memperbarui status revisi di database.',
    };
  }
}

/**
 * Create an emergency post-snapshot revision record
 */
export async function createRevisiPostSnapshot(data: {
  pasien_id: number;
  waktu_makan: WaktuMakanType;
  jenis_perubahan: JenisPerubahanType;
  data_lama?: DataDietDetail;
  data_baru?: DataDietDetail;
  alasan: string;
  requested_by: string;
  batch_id?: number;
}): Promise<MutationResult> {
  try {
    await db.insert(otorisasiPerubahanDietTable).values({
      pasien_id: data.pasien_id,
      batch_id: data.batch_id || null,
      waktu_makan: data.waktu_makan,
      jenis_perubahan: data.jenis_perubahan,
      data_lama: data.data_lama ? JSON.stringify(data.data_lama) : null,
      data_baru: data.data_baru ? JSON.stringify(data.data_baru) : null,
      alasan: data.alasan,
      status: 'PENDING',
      requested_by: data.requested_by,
      requested_at: new Date(),
    });

    revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
    revalidatePath('/dashboard/ag-katering/overview');
    revalidatePath('/dashboard/ag-katering/overview/produksi');
    revalidatePath('/dashboard/ag-katering/overview/pemorsian');
    return {
      success: true,
      message: 'Revisi post-snapshot berhasil ditambahkan.',
    };
  } catch (error) {
    console.error('Error creating revisi post-snapshot:', error);
    return {
      success: false,
      message: 'Gagal menambahkan revisi post-snapshot ke database.',
    };
  }
}
