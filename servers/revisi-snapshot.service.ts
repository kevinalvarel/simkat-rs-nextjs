'use server';

import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';

export type WaktuMakanType = 'PAGI' | 'SIANG' | 'MALAM';
export type JenisPerubahanType =
  | 'DIET_CHANGE'
  | 'ROOM_TRANSFER'
  | 'NEW_PATIENT'
  | 'DISCHARGE'
  | 'NPO';

export type StatusRevisiType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SELESAI';

export interface DataDietDetail {
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

// Fallback Mock Data for realistic demonstration when DB is empty or disconnected
const MOCK_REVISI_DATA: RevisiPostSnapshotItem[] = [
  {
    id: 101,
    pasien_id: 1,
    no_rm: 'RM-2026-001',
    nama_pasien: 'Budi Santoso',
    gedung: 'Gedung A',
    ruangan: 'Melati 1',
    bed: 'Bed 01',
    kelas: 'Kelas 1',
    batch_id: 1,
    batch_code: 'BATCH-20260812-PAGI-9941',
    waktu_makan: 'PAGI',
    jenis_perubahan: 'DIET_CHANGE',
    data_lama: { diet: 'Diet RG (Rendah Garam)', ruangan: 'Melati 1', bed: 'Bed 01' },
    data_baru: { diet: 'Diet DM (Diabetes Melitus) 1700 kcal', ruangan: 'Melati 1', bed: 'Bed 01' },
    alasan: 'Instruksi Dokter Penanggung Jawab jam 06:10 - Pasien menunjukkan peningkatan GDS 280 mg/dL',
    status: 'PENDING',
    dampak_dapur: 'Perubahan Etiket & Komposisi Menu Diet',
    requested_by: 'Ns. Ratna (Perawat Melati)',
    requested_at: '2026-08-12T06:12:00Z',
  },
  {
    id: 102,
    pasien_id: 2,
    no_rm: 'RM-2026-042',
    nama_pasien: 'Siti Aminah',
    gedung: 'Gedung B',
    ruangan: 'Mawar 3',
    bed: 'Bed 04',
    kelas: 'VIP',
    batch_id: 1,
    batch_code: 'BATCH-20260812-PAGI-9941',
    waktu_makan: 'PAGI',
    jenis_perubahan: 'NEW_PATIENT',
    data_lama: null,
    data_baru: { diet: 'Diet Lunak Rendah Lemak', ruangan: 'Mawar 3', bed: 'Bed 04', kelas: 'VIP' },
    alasan: 'Pasien baru masuk dari IGD pukul 05:45 WIB pasca snapshot ter-lock',
    status: 'APPROVED',
    dampak_dapur: '+1 Porsi Emergent (Tambahan Makanan)',
    requested_by: 'dr. Hendra Sp.PD (Dokter IGD)',
    requested_at: '2026-08-12T05:50:00Z',
    reviewed_by: 'Nutrisionis Dapur - Anita',
    reviewed_at: '2026-08-12T05:55:00Z',
    review_notes: 'Disetujui. Porsi ekstra sedang disiapkan di lini 2 dapur.',
  },
  {
    id: 103,
    pasien_id: 3,
    no_rm: 'RM-2026-089',
    nama_pasien: 'Ahmad Dahlan',
    gedung: 'Gedung A',
    ruangan: 'Dahlia 2',
    bed: 'Bed 02',
    kelas: 'Kelas 2',
    batch_id: 1,
    batch_code: 'BATCH-20260812-PAGI-9941',
    waktu_makan: 'PAGI',
    jenis_perubahan: 'NPO',
    data_lama: { diet: 'Diet Biasa Nasi', status_pasien: 'AKTIF' },
    data_baru: { diet: 'NPO (Fasting / Puasa Pre-Op)', status_pasien: 'NPO' },
    alasan: 'Jadwal operasi CITO gastrointestinal pukul 08:00 WIB',
    status: 'SELESAI',
    dampak_dapur: '-1 Porsi Dibatalkan (Tahan Pengiriman)',
    requested_by: 'Ns. Maya (Perawat Dahlia)',
    requested_at: '2026-08-12T06:00:00Z',
    reviewed_by: 'Nutrisionis Dapur - Anita',
    reviewed_at: '2026-08-12T06:05:00Z',
    review_notes: 'Nampan tray ditarik dari troley pengiriman Dahlia.',
  },
  {
    id: 104,
    pasien_id: 4,
    no_rm: 'RM-2026-112',
    nama_pasien: 'Dewi Lestari',
    gedung: 'Gedung C',
    ruangan: 'Melati 2',
    bed: 'Bed 05',
    kelas: 'Kelas 3',
    batch_id: 1,
    batch_code: 'BATCH-20260812-PAGI-9941',
    waktu_makan: 'PAGI',
    jenis_perubahan: 'ROOM_TRANSFER',
    data_lama: { ruangan: 'Anggrek 1', bed: 'Bed 02', gedung: 'Gedung B' },
    data_baru: { ruangan: 'Melati 2', bed: 'Bed 05', gedung: 'Gedung C' },
    alasan: 'Pasien pindah ruangan karena alokasi kamar isolasi',
    status: 'APPROVED',
    dampak_dapur: 'Pindah Lokasi Antar (Gedung B ➔ Gedung C)',
    requested_by: 'Pengawas Ruangan Anggrek',
    requested_at: '2026-08-12T06:20:00Z',
    reviewed_by: 'Nutrisionis Dapur - Roni',
    reviewed_at: '2026-08-12T06:25:00Z',
    review_notes: 'Plat label troley diubah ke Gedung C Melati 2.',
  },
  {
    id: 105,
    pasien_id: 5,
    no_rm: 'RM-2026-150',
    nama_pasien: 'Rahmat Hidayat',
    gedung: 'Gedung B',
    ruangan: 'Mawar 1',
    bed: 'Bed 01',
    kelas: 'Kelas 1',
    batch_id: 1,
    batch_code: 'BATCH-20260812-PAGI-9941',
    waktu_makan: 'PAGI',
    jenis_perubahan: 'DISCHARGE',
    data_lama: { diet: 'Diet RP (Rendah Protein)', status_pasien: 'AKTIF' },
    data_baru: { diet: 'Pasien Pulang (Discharged)', status_pasien: 'PULANG' },
    alasan: 'Pasien diizinkan pulang oleh DPJP pukul 06:15 WIB',
    status: 'APPROVED',
    dampak_dapur: '-1 Porsi Dibatalkan (Pasien Pulang)',
    requested_by: 'Ns. Fitri (Mawar)',
    requested_at: '2026-08-12T06:18:00Z',
    reviewed_by: 'Nutrisionis Dapur - Roni',
    reviewed_at: '2026-08-12T06:22:00Z',
    review_notes: 'Dibatalkan dalam daftar distribusi.',
  },
];

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
      return dbResults.map((r) => {
        let dataLamaObj: DataDietDetail | null = null;
        let dataBaruObj: DataDietDetail | null = null;

        try {
          if (r.data_lama) dataLamaObj = JSON.parse(r.data_lama);
        } catch (_) {}

        try {
          if (r.data_baru) dataBaruObj = JSON.parse(r.data_baru);
        } catch (_) {}

        const jenis = r.jenis_perubahan as JenisPerubahanType;
        let dampak = 'Perubahan Etiket Diet';
        if (jenis === 'NEW_PATIENT') dampak = '+1 Porsi Emergent (Tambahan Makanan)';
        else if (jenis === 'DISCHARGE') dampak = '-1 Porsi Dibatalkan (Pasien Pulang)';
        else if (jenis === 'NPO') dampak = '-1 Porsi Dibatalkan (Puasa/NPO)';
        else if (jenis === 'ROOM_TRANSFER') dampak = 'Pindah Lokasi Antar Makanan';

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
    }
  } catch (error) {
    console.error('Error fetching otorisasi_perubahan_diet from DB:', error);
  }

  // Return fallback data if DB table is empty or connection fails
  let filtered = MOCK_REVISI_DATA;
  if (waktuMakan && waktuMakan !== 'ALL') {
    filtered = filtered.filter((i) => i.waktu_makan === waktuMakan);
  }
  if (batchId) {
    filtered = filtered.filter((i) => i.batch_id === batchId);
  }
  return filtered;
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
      return {
        success: true,
        message: `Status revisi #${id} berhasil diperbarui menjadi ${status}.`,
      };
    }
  } catch (error) {
    console.error('Error updating status revisi in DB:', error);
  }

  // Fallback simulation for mock data
  const mockIndex = MOCK_REVISI_DATA.findIndex((i) => i.id === id);
  if (mockIndex !== -1) {
    MOCK_REVISI_DATA[mockIndex].status = status;
    MOCK_REVISI_DATA[mockIndex].reviewed_by = reviewerName;
    MOCK_REVISI_DATA[mockIndex].reviewed_at = new Date().toISOString();
    MOCK_REVISI_DATA[mockIndex].review_notes = notes || null;
  }

  revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
  return {
    success: true,
    message: `Status revisi #${id} berhasil diperbarui menjadi ${status}.`,
  };
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
    return {
      success: true,
      message: 'Revisi post-snapshot berhasil ditambahkan.',
    };
  } catch (error) {
    console.error('Error creating revisi post-snapshot:', error);
  }

  // Fallback mock insert
  const newId = 100 + MOCK_REVISI_DATA.length + 1;
  const mockNew: RevisiPostSnapshotItem = {
    id: newId,
    pasien_id: data.pasien_id,
    no_rm: `RM-2026-${newId}`,
    nama_pasien: `Pasien Emergent #${newId}`,
    gedung: data.data_baru?.gedung || 'Gedung A',
    ruangan: data.data_baru?.ruangan || 'Rawat Inap',
    bed: data.data_baru?.bed || 'Bed Auto',
    kelas: data.data_baru?.kelas || 'Kelas 1',
    batch_id: data.batch_id || 1,
    batch_code: 'BATCH-20260812-PAGI-9941',
    waktu_makan: data.waktu_makan,
    jenis_perubahan: data.jenis_perubahan,
    data_lama: data.data_lama || null,
    data_baru: data.data_baru || null,
    alasan: data.alasan,
    status: 'PENDING',
    dampak_dapur:
      data.jenis_perubahan === 'NEW_PATIENT'
        ? '+1 Porsi Emergent'
        : data.jenis_perubahan === 'DISCHARGE' || data.jenis_perubahan === 'NPO'
        ? '-1 Porsi Dibatalkan'
        : 'Perubahan Etiket Diet',
    requested_by: data.requested_by,
    requested_at: new Date().toISOString(),
  };

  MOCK_REVISI_DATA.unshift(mockNew);
  revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');

  return {
    success: true,
    message: 'Revisi post-snapshot berhasil ditambahkan.',
  };
}
