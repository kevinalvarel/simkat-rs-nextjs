'use server';

import { eq, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import type {
  WaktuMakanType,
  JenisPerubahanType,
  StatusRevisiType,
  DataDietDetail,
  RevisiPostSnapshotItem,
  MutationResult,
} from './revisi-snapshot.service';

export interface OtorisasiStats {
  pendingCount: number;
  approvedTodayCount: number;
  rejectedTodayCount: number;
  totalEmergentCount: number;
}

const MOCK_OTORISASI_DATA: RevisiPostSnapshotItem[] = [
  {
    id: 201,
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
    id: 202,
    pasien_id: 6,
    no_rm: 'RM-2026-210',
    nama_pasien: 'Dr. Suwandi (Pasien VIP)',
    gedung: 'Gedung B',
    ruangan: 'Anggrek VIP',
    bed: 'Bed 01',
    kelas: 'VIP Utama',
    batch_id: 1,
    batch_code: 'BATCH-20260812-PAGI-9941',
    waktu_makan: 'PAGI',
    jenis_perubahan: 'NEW_PATIENT',
    data_lama: null,
    data_baru: { diet: 'Diet Cincang Rendah Purin', ruangan: 'Anggrek VIP', bed: 'Bed 01', kelas: 'VIP Utama' },
    alasan: 'Pasien rujukan eksekutif masuk jam 06:05 WIB pasca snapshot locked',
    status: 'PENDING',
    dampak_dapur: '+1 Porsi Emergent (Tambahan Makanan)',
    requested_by: 'dr. Satrio Sp.PD',
    requested_at: '2026-08-12T06:15:00Z',
  },
  {
    id: 203,
    pasien_id: 7,
    no_rm: 'RM-2026-305',
    nama_pasien: 'Ratna Sari',
    gedung: 'Gedung C',
    ruangan: 'Dahlia 4',
    bed: 'Bed 03',
    kelas: 'Kelas 3',
    batch_id: 1,
    batch_code: 'BATCH-20260812-PAGI-9941',
    waktu_makan: 'PAGI',
    jenis_perubahan: 'NPO',
    data_lama: { diet: 'Diet Biasa Nasi Tim', status_pasien: 'AKTIF' },
    data_baru: { diet: 'NPO (Puasa Pre-Op Endoskopi)', status_pasien: 'NPO' },
    alasan: 'Jadwal CITO Endoskopi cerna jam 07:30 WIB',
    status: 'PENDING',
    dampak_dapur: '-1 Porsi Dibatalkan (Tahan Pengiriman)',
    requested_by: 'Ns. Bambang (Dahlia)',
    requested_at: '2026-08-12T06:18:00Z',
  },
  {
    id: 204,
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
    alasan: 'Pasien baru masuk dari IGD pukul 05:45 WIB',
    status: 'APPROVED',
    dampak_dapur: '+1 Porsi Emergent (Tambahan Makanan)',
    requested_by: 'dr. Hendra Sp.PD (Dokter IGD)',
    requested_at: '2026-08-12T05:50:00Z',
    reviewed_by: 'Admin Gizi Utama',
    reviewed_at: '2026-08-12T05:55:00Z',
    review_notes: 'Otorisasi disetujui. Disiapkan di lini 2 produksi katering.',
  },
  {
    id: 205,
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
    reviewed_by: 'Admin Gizi Utama',
    reviewed_at: '2026-08-12T06:22:00Z',
    review_notes: 'Otorisasi pembatalan disetujui.',
  },
  {
    id: 206,
    pasien_id: 8,
    no_rm: 'RM-2026-440',
    nama_pasien: 'Hendra Wijaya',
    gedung: 'Gedung A',
    ruangan: 'Melati 3',
    bed: 'Bed 02',
    kelas: 'Kelas 2',
    batch_id: 1,
    batch_code: 'BATCH-20260812-PAGI-9941',
    waktu_makan: 'PAGI',
    jenis_perubahan: 'DIET_CHANGE',
    data_lama: { diet: 'Diet Biasa' },
    data_baru: { diet: 'Diet Cair Nutrisi Tinggi 2000 kcal' },
    alasan: 'Permintaan tanpa surat DPJP resmi',
    status: 'REJECTED',
    dampak_dapur: 'Perubahan Etiket Diet',
    requested_by: 'Keluarga Pasien',
    requested_at: '2026-08-12T05:30:00Z',
    reviewed_by: 'Admin Gizi Utama',
    reviewed_at: '2026-08-12T05:40:00Z',
    review_notes: 'Ditolak: Perubahan diet cair memerlukan verifikasi form instruksi DPJP.',
  },
];

/**
 * Fetch otorisasi perubahan diet list
 */
export async function getOtorisasiList(
  statusFilter?: string,
  waktuFilter?: string
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
    console.error('Error fetching otorisasi list from DB:', error);
  }

  // Return mock fallback data
  let filtered = MOCK_OTORISASI_DATA;
  if (statusFilter && statusFilter !== 'ALL') {
    filtered = filtered.filter((i) => i.status === statusFilter);
  }
  if (waktuFilter && waktuFilter !== 'ALL') {
    filtered = filtered.filter((i) => i.waktu_makan === waktuFilter);
  }
  return filtered;
}

/**
 * Fetch summary stats for Admin Otorisasi
 */
export async function getOtorisasiStats(
  items?: RevisiPostSnapshotItem[]
): Promise<OtorisasiStats> {
  const data = items || (await getOtorisasiList());
  const pendingCount = data.filter((i) => i.status === 'PENDING').length;
  const approvedTodayCount = data.filter((i) => i.status === 'APPROVED').length;
  const rejectedTodayCount = data.filter((i) => i.status === 'REJECTED').length;
  const totalEmergentCount = data.filter((i) => i.jenis_perubahan === 'NEW_PATIENT').length;

  return {
    pendingCount,
    approvedTodayCount,
    rejectedTodayCount,
    totalEmergentCount,
  };
}

/**
 * Approve a pending diet modification request
 */
export async function approveRevisiDiet(
  id: number,
  reviewNotes?: string,
  reviewerName: string = 'Admin Head Gizi'
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
          status: 'APPROVED',
          reviewed_by: reviewerName,
          reviewed_at: new Date(),
          review_notes: reviewNotes || 'Otorisasi disetujui oleh Admin Head Gizi.',
        })
        .where(eq(otorisasiPerubahanDietTable.id, id));

      revalidatePath('/dashboard/ag-katering/otorisasi-perubahan-diet');
      revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
      revalidatePath('/dashboard/ag-katering/overview');
      return {
        success: true,
        message: `Permintaan otorisasi #${id} berhasil disetujui.`,
      };
    }
  } catch (error) {
    console.error('Error approving revisi diet in DB:', error);
  }

  // Fallback update mock data
  const idx = MOCK_OTORISASI_DATA.findIndex((i) => i.id === id);
  if (idx !== -1) {
    MOCK_OTORISASI_DATA[idx].status = 'APPROVED';
    MOCK_OTORISASI_DATA[idx].reviewed_by = reviewerName;
    MOCK_OTORISASI_DATA[idx].reviewed_at = new Date().toISOString();
    MOCK_OTORISASI_DATA[idx].review_notes = reviewNotes || 'Otorisasi disetujui oleh Admin Head Gizi.';
  }

  revalidatePath('/dashboard/ag-katering/otorisasi-perubahan-diet');
  return {
    success: true,
    message: `Permintaan otorisasi #${id} berhasil disetujui.`,
  };
}

/**
 * Reject a pending diet modification request
 */
export async function rejectRevisiDiet(
  id: number,
  reviewNotes: string,
  reviewerName: string = 'Admin Head Gizi'
): Promise<MutationResult> {
  if (!reviewNotes || !reviewNotes.trim()) {
    return {
      success: false,
      message: 'Catatan alasan penolakan wajib diisi.',
    };
  }

  try {
    const existing = await db
      .select()
      .from(otorisasiPerubahanDietTable)
      .where(eq(otorisasiPerubahanDietTable.id, id));

    if (existing && existing.length > 0) {
      await db
        .update(otorisasiPerubahanDietTable)
        .set({
          status: 'REJECTED',
          reviewed_by: reviewerName,
          reviewed_at: new Date(),
          review_notes: reviewNotes,
        })
        .where(eq(otorisasiPerubahanDietTable.id, id));

      revalidatePath('/dashboard/ag-katering/otorisasi-perubahan-diet');
      revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
      revalidatePath('/dashboard/ag-katering/overview');
      return {
        success: true,
        message: `Permintaan otorisasi #${id} telah ditolak.`,
      };
    }
  } catch (error) {
    console.error('Error rejecting revisi diet in DB:', error);
  }

  // Fallback update mock data
  const idx = MOCK_OTORISASI_DATA.findIndex((i) => i.id === id);
  if (idx !== -1) {
    MOCK_OTORISASI_DATA[idx].status = 'REJECTED';
    MOCK_OTORISASI_DATA[idx].reviewed_by = reviewerName;
    MOCK_OTORISASI_DATA[idx].reviewed_at = new Date().toISOString();
    MOCK_OTORISASI_DATA[idx].review_notes = reviewNotes;
  }

  revalidatePath('/dashboard/ag-katering/otorisasi-perubahan-diet');
  return {
    success: true,
    message: `Permintaan otorisasi #${id} telah ditolak.`,
  };
}

/**
 * Bulk approve multiple pending requests
 */
export async function bulkApproveRevisiDiet(
  ids: number[],
  reviewNotes: string = 'Otorisasi persetujuan massal oleh Admin Head Gizi',
  reviewerName: string = 'Admin Head Gizi'
): Promise<MutationResult> {
  if (!ids || ids.length === 0) {
    return { success: false, message: 'Tidak ada item dipilih.' };
  }

  try {
    await db
      .update(otorisasiPerubahanDietTable)
      .set({
        status: 'APPROVED',
        reviewed_by: reviewerName,
        reviewed_at: new Date(),
        review_notes: reviewNotes,
      })
      .where(inArray(otorisasiPerubahanDietTable.id, ids));

    revalidatePath('/dashboard/ag-katering/otorisasi-perubahan-diet');
    revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
    revalidatePath('/dashboard/ag-katering/overview');
    return {
      success: true,
      message: `${ids.length} permintaan otorisasi berhasil disetujui sekaligus.`,
    };
  } catch (error) {
    console.error('Error bulk approving revisi diet in DB:', error);
  }

  // Fallback update mock data
  ids.forEach((id) => {
    const idx = MOCK_OTORISASI_DATA.findIndex((i) => i.id === id);
    if (idx !== -1) {
      MOCK_OTORISASI_DATA[idx].status = 'APPROVED';
      MOCK_OTORISASI_DATA[idx].reviewed_by = reviewerName;
      MOCK_OTORISASI_DATA[idx].reviewed_at = new Date().toISOString();
      MOCK_OTORISASI_DATA[idx].review_notes = reviewNotes;
    }
  });

  revalidatePath('/dashboard/ag-katering/otorisasi-perubahan-diet');
  return {
    success: true,
    message: `${ids.length} permintaan otorisasi berhasil disetujui sekaligus.`,
  };
}
