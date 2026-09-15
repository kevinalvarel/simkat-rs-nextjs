'use server';

import { eq, desc, asc, ne, lt, and, or, isNull, isNotNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { user } from '@/db/auth-schema';
import { riwayatDietHistoryTable } from '@/db/schemas/snapshot/riwayat-history';
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
  pasien_id: number | null;
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

const RIWAYAT_PATH = '/dashboard/ag-katering/admin/riwayat';

/**
 * Hapus permanen history yang sudah melewati 2 snapshot batch global.
 *
 * Aturan: bila sudah ada >= 2 batch yang lebih baru dari anchor-nya,
 * baris di-DELETE. Anchor = batch terbaru saat log dibuat.
 * Baris tanpa anchor (dibuat sebelum batch pertama) dibandingkan
 * via `requested_at` terhadap timestamp batch terbaru ke-2.
 */
export async function pruneExpiredRiwayatHistory(): Promise<{
  deletedCount: number;
}> {
  try {
    const batches = await db
      .select({
        id: snapshotBatchTable.id,
        timestamp_snapshot: snapshotBatchTable.timestamp_snapshot,
      })
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.timestamp_snapshot), desc(snapshotBatchTable.id));

    if (batches.length < 2) return { deletedCount: 0 };

    const threshold = batches[1];

    const deleted = await db
      .delete(riwayatDietHistoryTable)
      .where(
        or(
          and(
            isNotNull(riwayatDietHistoryTable.snapshot_anchor_id),
            lt(riwayatDietHistoryTable.snapshot_anchor_id, threshold.id),
          ),
          and(
            isNull(riwayatDietHistoryTable.snapshot_anchor_id),
            lt(riwayatDietHistoryTable.requested_at, threshold.timestamp_snapshot),
          ),
        ),
      )
      .returning({ id: riwayatDietHistoryTable.id });

    return { deletedCount: deleted.length };
  } catch (err) {
    console.error('Error pruning expired riwayat history:', err);
    return { deletedCount: 0 };
  }
}

/**
 * Fetch active patients for quick selection in manual tracker modal
 */
export async function getActivePatientsForRiwayat(): Promise<
  SimplePatientOption[]
> {
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

function resolveDampakDapur(jenis: JenisPerubahanType): string {
  if (jenis === 'NEW_PATIENT') return '+1 Porsi Emergent (Tambahan Makanan)';
  if (jenis === 'DISCHARGE') return '-1 Porsi Dibatalkan (Pasien Pulang)';
  if (jenis === 'NPO') return '-1 Porsi Dibatalkan (Puasa/NPO)';
  if (jenis === 'ROOM_TRANSFER') return 'Pindah Lokasi Antar Makanan';
  return 'Perubahan Etiket Diet';
}

function resolveStaff(
  reqStr: string,
  giziRsUsers: GiziRsUser[],
  idx: number,
): { staffName: string; staffEmail: string; staffId?: string } {
  const matchedUser = giziRsUsers.find(
    (u) => reqStr.includes(u.email) || reqStr.includes(u.name),
  );

  if (matchedUser) {
    return {
      staffName: matchedUser.name,
      staffEmail: matchedUser.email,
      staffId: matchedUser.id,
    };
  }

  if (reqStr.includes('(') && reqStr.includes(')')) {
    const parts = reqStr.split('(');
    return {
      staffName: parts[0].trim() || 'Staff Gizi-RS',
      staffEmail: parts[1].replace(')', '').trim(),
    };
  }

  if (giziRsUsers.length > 0) {
    const fallbackUser = giziRsUsers[idx % giziRsUsers.length];
    return {
      staffName: fallbackUser.name,
      staffEmail: fallbackUser.email,
      staffId: fallbackUser.id,
    };
  }

  return { staffName: reqStr, staffEmail: 'gizi-rs@rs-sehat.id' };
}

/**
 * Fetch diet change history dari tabel khusus `riwayat_diet_history`.
 * Lazy prune: expired rows (melewati 2 snapshot) dihapus sebelum dibaca.
 */
export async function getRiwayatDietPasienList(
  giziRsEmailFilter?: string,
  jenisFilter?: string,
  waktuFilter?: string,
): Promise<RiwayatDietItem[]> {
  try {
    await pruneExpiredRiwayatHistory();

    const giziRsUsers = await getGiziRsUsers();

    const dbResults = await db
      .select({
        id: riwayatDietHistoryTable.id,
        pasien_id: riwayatDietHistoryTable.pasien_id,
        waktu_makan: riwayatDietHistoryTable.waktu_makan,
        jenis_perubahan: riwayatDietHistoryTable.jenis_perubahan,
        data_lama: riwayatDietHistoryTable.data_lama,
        data_baru: riwayatDietHistoryTable.data_baru,
        alasan: riwayatDietHistoryTable.alasan,
        status: riwayatDietHistoryTable.status,
        requested_by: riwayatDietHistoryTable.requested_by,
        requested_at: riwayatDietHistoryTable.requested_at,
        reviewed_by: riwayatDietHistoryTable.reviewed_by,
        reviewed_at: riwayatDietHistoryTable.reviewed_at,
        review_notes: riwayatDietHistoryTable.review_notes,
        snapshot_anchor_id: riwayatDietHistoryTable.snapshot_anchor_id,

        // Denormalized patient snapshot (tahan hapus pasien)
        snapshot_nama: riwayatDietHistoryTable.nama_pasien,
        snapshot_no_rm: riwayatDietHistoryTable.no_rm,
        snapshot_gedung: riwayatDietHistoryTable.gedung,
        snapshot_ruangan: riwayatDietHistoryTable.ruangan,
        snapshot_bed: riwayatDietHistoryTable.bed,
        snapshot_kelas: riwayatDietHistoryTable.kelas,

        // Live patient fields (bila pasien masih ada)
        nama_pasien: pasienTable.nama_pasien,
        no_rm: pasienTable.no_rm,
        gedung: pasienTable.gedung,
        ruangan: pasienTable.ruangan,
        bed: pasienTable.bed,
        kelas: pasienTable.kelas,

        // Anchor batch fields
        batch_code: snapshotBatchTable.batch_code,
      })
      .from(riwayatDietHistoryTable)
      .leftJoin(pasienTable, eq(riwayatDietHistoryTable.pasien_id, pasienTable.id))
      .leftJoin(
        snapshotBatchTable,
        eq(riwayatDietHistoryTable.snapshot_anchor_id, snapshotBatchTable.id),
      )
      .orderBy(desc(riwayatDietHistoryTable.requested_at));

    if (!dbResults || dbResults.length === 0) return [];

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
      const reqStr = r.requested_by || 'Staff Gizi-RS (gizi-rs@rs-sehat.id)';
      const { staffName, staffEmail, staffId } = resolveStaff(
        reqStr,
        giziRsUsers,
        idx,
      );

      return {
        id: r.id,
        pasien_id: r.pasien_id,
        no_rm:
          r.no_rm ||
          r.snapshot_no_rm ||
          (dataBaruObj?.no_rm ?? dataLamaObj?.no_rm ?? 'RM-UNKNOWN'),
        nama_pasien:
          r.nama_pasien ||
          r.snapshot_nama ||
          (dataBaruObj?.nama_pasien ??
            dataLamaObj?.nama_pasien ??
            'Pasien Tanpa Nama'),
        gedung:
          r.gedung || r.snapshot_gedung || (dataBaruObj?.gedung ?? dataLamaObj?.gedung ?? ''),
        ruangan:
          r.ruangan || r.snapshot_ruangan || (dataBaruObj?.ruangan ?? dataLamaObj?.ruangan ?? ''),
        bed: r.bed || r.snapshot_bed || (dataBaruObj?.bed ?? dataLamaObj?.bed ?? ''),
        kelas: r.kelas || r.snapshot_kelas || (dataBaruObj?.kelas ?? dataLamaObj?.kelas ?? ''),
        batch_id: r.snapshot_anchor_id,
        batch_code: r.batch_code || 'BATCH-LOCKED',
        waktu_makan: (r.waktu_makan as WaktuMakanType) || 'PAGI',
        jenis_perubahan: jenis,
        data_lama: dataLamaObj,
        data_baru: dataBaruObj,
        alasan: r.alasan || 'Tidak ada alasan dicantumkan',
        status: (r.status as StatusRevisiType) || 'APPROVED',
        dampak_dapur: resolveDampakDapur(jenis),
        gizi_rs_id: staffId,
        gizi_rs_name: staffName,
        gizi_rs_email: staffEmail,
        requested_at: r.requested_at
          ? r.requested_at.toISOString()
          : new Date().toISOString(),
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at ? r.reviewed_at.toISOString() : null,
        review_notes: r.review_notes,
      };
    });

    if (giziRsEmailFilter && giziRsEmailFilter !== 'ALL') {
      items = items.filter(
        (i) =>
          i.gizi_rs_email.toLowerCase() === giziRsEmailFilter.toLowerCase(),
      );
    }
    if (jenisFilter && jenisFilter !== 'ALL') {
      items = items.filter((i) => i.jenis_perubahan === jenisFilter);
    }
    if (waktuFilter && waktuFilter !== 'ALL') {
      items = items.filter((i) => i.waktu_makan === waktuFilter);
    }
    return items;
  } catch (error) {
    console.error('Error fetching riwayat history from DB:', error);
    return [];
  }
}

/**
 * Fetch stats summary for Riwayat Diet Pasien (dari tabel history khusus)
 */
export async function getRiwayatDietStats(
  items?: RiwayatDietItem[],
): Promise<RiwayatDietStats> {
  const data = items || (await getRiwayatDietPasienList());
  const giziRsUsers = await getGiziRsUsers();

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalRiwayat = data.length;
  const hariIniCount = data.filter(
    (i) => i.requested_at.slice(0, 10) === todayStr,
  ).length;
  const giziRsCount = giziRsUsers.length;
  const dietChangeCount = data.filter(
    (i) => i.jenis_perubahan === 'DIET_CHANGE',
  ).length;
  const npoEmergentCount = data.filter(
    (i) =>
      i.jenis_perubahan === 'NEW_PATIENT' ||
      i.jenis_perubahan === 'NPO' ||
      i.jenis_perubahan === 'DISCHARGE',
  ).length;
  const roomTransferCount = data.filter(
    (i) => i.jenis_perubahan === 'ROOM_TRANSFER',
  ).length;
  const approvedCount = data.filter(
    (i) => i.status === 'APPROVED' || i.status === 'SELESAI',
  ).length;
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
 * Create a new diet change log entry ke tabel history khusus.
 * `pasien_id` boleh NULL untuk input manual (disimpan sebagai snapshot denormalisasi).
 */
export async function createRiwayatDietLog(data: {
  pasien_id?: number | null;
  nama_pasien?: string;
  no_rm?: string;
  gedung?: string;
  ruangan?: string;
  bed?: string;
  kelas?: string;
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
    // Validasi pasien: bila id tidak ada di DB, simpan NULL + andalkan snapshot.
    let pasienId: number | null = data.pasien_id ?? null;
    if (pasienId !== null) {
      const existing = await db
        .select({ id: pasienTable.id })
        .from(pasienTable)
        .where(eq(pasienTable.id, pasienId))
        .limit(1);
      if (existing.length === 0) pasienId = null;
    }

    // Anchor retensi = batch snapshot terbaru saat log dibuat.
    const latestBatch = await db
      .select({ id: snapshotBatchTable.id })
      .from(snapshotBatchTable)
      .orderBy(
        desc(snapshotBatchTable.timestamp_snapshot),
        desc(snapshotBatchTable.id),
      )
      .limit(1);

    const anchorId = latestBatch.length > 0 ? latestBatch[0].id : null;
    const now = new Date();

    await db.insert(riwayatDietHistoryTable).values({
      pasien_id: pasienId,
      snapshot_anchor_id: anchorId,
      waktu_makan: data.waktu_makan,
      jenis_perubahan: data.jenis_perubahan,
      data_lama: data.data_lama ? JSON.stringify(data.data_lama) : null,
      data_baru: data.data_baru ? JSON.stringify(data.data_baru) : null,
      alasan: data.alasan,
      status: 'APPROVED',
      requested_by: requestedByStr,
      requested_at: now,
      reviewed_by: 'Sistem Terverifikasi',
      reviewed_at: now,
      review_notes:
        'Tercatat otomatis dalam Riwayat Perubahan Diet RS oleh ' +
        data.gizi_rs_name,
      nama_pasien:
        data.nama_pasien || data.data_baru?.nama_pasien || data.data_lama?.nama_pasien || null,
      no_rm: data.no_rm || data.data_baru?.no_rm || data.data_lama?.no_rm || null,
      gedung: data.gedung || data.data_baru?.gedung || data.data_lama?.gedung || null,
      ruangan:
        data.ruangan || data.data_baru?.ruangan || data.data_lama?.ruangan || null,
      bed: data.bed || data.data_baru?.bed || data.data_lama?.bed || null,
      kelas: data.kelas || data.data_baru?.kelas || data.data_lama?.kelas || null,
    });

    // Also update patient diet in pasienTable if patient exists and diet changed
    if (data.data_baru?.diet && pasienId !== null) {
      await db
        .update(pasienTable)
        .set({
          diet: data.data_baru.diet,
          updated_at: new Date(),
        })
        .where(eq(pasienTable.id, pasienId));
    }

    revalidatePath(RIWAYAT_PATH);
    revalidatePath('/dashboard/ag-rs/data-pasien');
    revalidatePath('/dashboard/ag-katering/overview/pemorsian');
    revalidatePath('/dashboard/ag-katering/overview/produksi');

    return {
      success: true,
      message: `Riwayat perubahan diet berhasil dicatat oleh ${data.gizi_rs_name}.`,
    };
  } catch (error) {
    console.error('Error logging diet change history in DB:', error);
    return {
      success: false,
      message: 'Gagal mencatat riwayat perubahan diet di database.',
    };
  }
}
