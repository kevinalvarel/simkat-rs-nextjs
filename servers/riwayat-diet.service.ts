'use server';

import { eq, desc, asc, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { user } from '@/db/auth-schema';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import type {
  WaktuMakanType,
  JenisPerubahanType,
  StatusRevisiType,
  DataDietDetail,
  MutationResult,
} from './revisi-snapshot.service';

export interface GiziRsUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: Date | string;
}

export interface SimplePatientOption {
  id: number;
  nama_pasien: string;
  no_rm: string;
  diet: string;
  ruangan: string;
  bed: string;
  kelas: string;
  gedung: string;
  is_npo: boolean;
  status_pasien: string;
}

export interface RiwayatDietItem {
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
  
  // Explicit Registered Gizi-RS Staff Credentials
  gizi_rs_id?: string;
  gizi_rs_name: string;
  gizi_rs_email: string;

  requested_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
}

export interface RiwayatDietStats {
  totalRiwayat: number;
  hariIniCount: number;
  giziRsCount: number;
  dietChangeCount: number;
  npoEmergentCount: number;
  roomTransferCount: number;
  approvedCount: number;
  pendingCount: number;
}

/**
 * Fetch active patients for quick selection in manual tracker modal
 */
export async function getActivePatientsForRiwayat(): Promise<SimplePatientOption[]> {
  try {
    const list = await db
      .select({
        id: pasienTable.id,
        nama_pasien: pasienTable.nama_pasien,
        no_rm: pasienTable.no_rm,
        diet: pasienTable.diet,
        ruangan: pasienTable.ruangan,
        bed: pasienTable.bed,
        kelas: pasienTable.kelas,
        gedung: pasienTable.gedung,
        is_npo: pasienTable.is_npo,
        status_pasien: pasienTable.status_pasien,
      })
      .from(pasienTable)
      .where(ne(pasienTable.status_pasien, 'PULANG'))
      .orderBy(asc(pasienTable.nama_pasien));

    return list;
  } catch (err) {
    console.error('Error fetching active patients for riwayat:', err);
    return [];
  }
}

/**
 * Fetch all registered users with role 'gizi-rs'
 */
export async function getGiziRsUsers(): Promise<GiziRsUser[]> {
  try {
    const dbUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.role, 'gizi-rs'))
      .orderBy(desc(user.createdAt));

    if (dbUsers && dbUsers.length > 0) {
      return dbUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || 'gizi-rs',
        createdAt: u.createdAt,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching gizi-rs users from DB:', error);
    return [];
  }
}

/**
 * Fetch patient diet change history logged by role gizi-rs
 */
export async function getRiwayatDietPasienList(
  giziRsEmailFilter?: string,
  jenisFilter?: string,
  waktuFilter?: string
): Promise<RiwayatDietItem[]> {
  try {
    const giziRsUsers = await getGiziRsUsers();

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
      let items: RiwayatDietItem[] = dbResults.map((r, idx) => {
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

        // Extract or match Gizi-RS user details from requested_by string
        const reqStr = r.requested_by || 'Staff Gizi-RS (gizi-rs@rs-sehat.id)';
        let staffName = reqStr;
        let staffEmail = 'gizi-rs@rs-sehat.id';

        const matchedUser = giziRsUsers.find(
          (u) => reqStr.includes(u.email) || reqStr.includes(u.name)
        );

        if (matchedUser) {
          staffName = matchedUser.name;
          staffEmail = matchedUser.email;
        } else if (reqStr.includes('(') && reqStr.includes(')')) {
          const parts = reqStr.split('(');
          staffName = parts[0].trim();
          staffEmail = parts[1].replace(')', '').trim();
        } else if (giziRsUsers.length > 0) {
          const fallbackUser = giziRsUsers[idx % giziRsUsers.length];
          staffName = fallbackUser.name;
          staffEmail = fallbackUser.email;
        }

        return {
          id: r.id,
          pasien_id: r.pasien_id,
          no_rm: r.no_rm || (dataBaruObj?.no_rm ?? dataLamaObj?.no_rm ?? 'RM-UNKNOWN'),
          nama_pasien: r.nama_pasien || (dataBaruObj?.nama_pasien ?? dataLamaObj?.nama_pasien ?? 'Pasien Tanpa Nama'),
          gedung: r.gedung || (dataBaruObj?.gedung ?? dataLamaObj?.gedung ?? ''),
          ruangan: r.ruangan || (dataBaruObj?.ruangan ?? dataLamaObj?.ruangan ?? ''),
          bed: r.bed || (dataBaruObj?.bed ?? dataLamaObj?.bed ?? ''),
          kelas: r.kelas || (dataBaruObj?.kelas ?? dataLamaObj?.kelas ?? ''),
          batch_id: r.batch_id,
          batch_code: r.batch_code || 'BATCH-LOCKED',
          waktu_makan: (r.waktu_makan as WaktuMakanType) || 'PAGI',
          jenis_perubahan: jenis,
          data_lama: dataLamaObj,
          data_baru: dataBaruObj,
          alasan: r.alasan || 'Tidak ada alasan dicantumkan',
          status: (r.status as StatusRevisiType) || 'APPROVED',
          dampak_dapur: dampak,
          gizi_rs_id: matchedUser?.id,
          gizi_rs_name: staffName,
          gizi_rs_email: staffEmail,
          requested_at: r.requested_at ? r.requested_at.toISOString() : new Date().toISOString(),
          reviewed_by: r.reviewed_by,
          reviewed_at: r.reviewed_at ? r.reviewed_at.toISOString() : null,
          review_notes: r.review_notes,
        };
      });

      if (giziRsEmailFilter && giziRsEmailFilter !== 'ALL') {
        items = items.filter((i) => i.gizi_rs_email.toLowerCase() === giziRsEmailFilter.toLowerCase());
      }
      if (jenisFilter && jenisFilter !== 'ALL') {
        items = items.filter((i) => i.jenis_perubahan === jenisFilter);
      }
      if (waktuFilter && waktuFilter !== 'ALL') {
        items = items.filter((i) => i.waktu_makan === waktuFilter);
      }
      return items;
    }
    return [];
  } catch (error) {
    console.error('Error fetching riwayat diet from DB:', error);
    return [];
  }
}

/**
 * Fetch stats summary for Riwayat Diet Pasien
 */
export async function getRiwayatDietStats(
  items?: RiwayatDietItem[]
): Promise<RiwayatDietStats> {
  const data = items || (await getRiwayatDietPasienList());
  const giziRsUsers = await getGiziRsUsers();

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalRiwayat = data.length;
  const hariIniCount = data.filter((i) => i.requested_at.slice(0, 10) === todayStr).length;
  const giziRsCount = giziRsUsers.length;
  const dietChangeCount = data.filter((i) => i.jenis_perubahan === 'DIET_CHANGE').length;
  const npoEmergentCount = data.filter(
    (i) => i.jenis_perubahan === 'NEW_PATIENT' || i.jenis_perubahan === 'NPO' || i.jenis_perubahan === 'DISCHARGE'
  ).length;
  const roomTransferCount = data.filter((i) => i.jenis_perubahan === 'ROOM_TRANSFER').length;
  const approvedCount = data.filter((i) => i.status === 'APPROVED' || i.status === 'SELESAI').length;
  const pendingCount = data.filter((i) => i.status === 'PENDING').length;

  return {
    totalRiwayat,
    hariIniCount,
    giziRsCount,
    dietChangeCount,
    npoEmergentCount,
    roomTransferCount,
    approvedCount,
    pendingCount,
  };
}

/**
 * Create a new diet change log entry by role gizi-rs
 */
export async function createRiwayatDietLog(data: {
  pasien_id: number;
  waktu_makan: WaktuMakanType;
  jenis_perubahan: JenisPerubahanType;
  data_lama?: DataDietDetail;
  data_baru?: DataDietDetail;
  alasan: string;
  gizi_rs_name: string;
  gizi_rs_email: string;
}): Promise<MutationResult> {
  const requestedByStr = `${data.gizi_rs_name} (${data.gizi_rs_email})`;

  try {
    await db.insert(otorisasiPerubahanDietTable).values({
      pasien_id: data.pasien_id,
      waktu_makan: data.waktu_makan,
      jenis_perubahan: data.jenis_perubahan,
      data_lama: data.data_lama ? JSON.stringify(data.data_lama) : null,
      data_baru: data.data_baru ? JSON.stringify(data.data_baru) : null,
      alasan: data.alasan,
      status: 'APPROVED', // Direct log record by gizi-rs
      requested_by: requestedByStr,
      requested_at: new Date(),
      reviewed_by: 'Sistem Terverifikasi',
      reviewed_at: new Date(),
      review_notes: 'Tercatat otomatis dalam Riwayat Perubahan Diet RS oleh ' + data.gizi_rs_name,
    });

    // Also update patient diet in pasienTable if patient exists and diet changed
    if (data.data_baru?.diet && data.pasien_id) {
      await db
        .update(pasienTable)
        .set({
          diet: data.data_baru.diet,
          updated_at: new Date(),
        })
        .where(eq(pasienTable.id, data.pasien_id));
    }

    revalidatePath('/dashboard/ag-katering/admin/riwayat');
    revalidatePath('/dashboard/ag-rs/data-pasien');
    revalidatePath('/dashboard/ag-katering/overview/pemorsian');
    revalidatePath('/dashboard/ag-katering/overview/produksi');

    return {
      success: true,
      message: `Riwayat perubahan diet berhasil dicatat oleh ${data.gizi_rs_name}.`,
    };
  } catch (error) {
    console.error('Error logging diet change in DB:', error);
    return {
      success: false,
      message: 'Gagal mencatat riwayat perubahan diet di database.',
    };
  }
}
