'use server';

import { eq, desc, inArray, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
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

      if (statusFilter && statusFilter !== 'ALL') {
        mapped = mapped.filter((i) => i.status === statusFilter);
      }
      if (waktuFilter && waktuFilter !== 'ALL') {
        mapped = mapped.filter((i) => i.waktu_makan === waktuFilter);
      }
      return mapped;
    }
    return [];
  } catch (error) {
    console.error('Error fetching otorisasi list from DB:', error);
    return [];
  }
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

async function applyApprovedRevisionToSnapshot(revisi: typeof otorisasiPerubahanDietTable.$inferSelect) {
  try {
    const [patient] = await db
      .select()
      .from(pasienTable)
      .where(eq(pasienTable.id, revisi.pasien_id));

    let dataBaru: Record<string, any> = {};
    try {
      if (revisi.data_baru) dataBaru = JSON.parse(revisi.data_baru);
    } catch (_) {}

    if (revisi.jenis_perubahan === 'NEW_PATIENT') {
      const targetNoRm = dataBaru.no_rm || patient?.no_rm || '';

      if (revisi.batch_id) {
        const [existingDetail] = await db
          .select()
          .from(snapshotDetailTable)
          .where(
            and(
              eq(snapshotDetailTable.batch_id, revisi.batch_id),
              eq(snapshotDetailTable.no_rm, targetNoRm)
            )
          );

        if (!existingDetail) {
          await db.insert(snapshotDetailTable).values({
            batch_id: revisi.batch_id,
            no_rm: dataBaru.no_rm || patient?.no_rm || 'RM-NEW',
            nama_pasien: dataBaru.nama_pasien || patient?.nama_pasien || 'Pasien Baru',
            gedung: dataBaru.gedung || patient?.gedung || '',
            ruangan: dataBaru.ruangan || patient?.ruangan || '',
            no_bed: dataBaru.bed || patient?.bed || '-',
            kelas: dataBaru.kelas || patient?.kelas || 'Kelas 1',
            diet_rs_raw: dataBaru.diet || patient?.diet || 'Diet Biasa',
            status_saat_snapshot: dataBaru.status_pasien || 'AKTIF',
            is_emergent: true,
          });
        }
      }

      // Activate in master pasien table
      await db
        .update(pasienTable)
        .set({ status_pasien: 'AKTIF', updated_at: new Date() })
        .where(eq(pasienTable.id, revisi.pasien_id));

    } else if (revisi.jenis_perubahan === 'DIET_CHANGE' || revisi.jenis_perubahan === 'NPO') {
      const targetNoRm = dataBaru.no_rm || patient?.no_rm;
      if (revisi.batch_id && targetNoRm) {
        await db
          .update(snapshotDetailTable)
          .set({
            diet_rs_raw: dataBaru.diet || (revisi.jenis_perubahan === 'NPO' ? 'NPO' : undefined),
            status_saat_snapshot: revisi.jenis_perubahan === 'NPO' ? 'NPO' : 'AKTIF',
          })
          .where(
            and(
              eq(snapshotDetailTable.batch_id, revisi.batch_id),
              eq(snapshotDetailTable.no_rm, targetNoRm)
            )
          );
      }

      // Apply new diet to master pasien table
      await db
        .update(pasienTable)
        .set({
          diet: dataBaru.diet || (revisi.jenis_perubahan === 'NPO' ? 'NPO' : undefined),
          is_npo: revisi.jenis_perubahan === 'NPO' ? true : Boolean(dataBaru.is_npo),
          status_pasien: revisi.jenis_perubahan === 'NPO' ? 'NPO' : dataBaru.status_pasien || 'AKTIF',
          updated_at: new Date(),
        })
        .where(eq(pasienTable.id, revisi.pasien_id));

    } else if (revisi.jenis_perubahan === 'ROOM_TRANSFER') {
      const targetNoRm = dataBaru.no_rm || patient?.no_rm;
      if (revisi.batch_id && targetNoRm) {
        await db
          .update(snapshotDetailTable)
          .set({
            gedung: dataBaru.gedung || undefined,
            ruangan: dataBaru.ruangan || undefined,
            no_bed: dataBaru.bed || undefined,
          })
          .where(
            and(
              eq(snapshotDetailTable.batch_id, revisi.batch_id),
              eq(snapshotDetailTable.no_rm, targetNoRm)
            )
          );
      }

      // Apply new room to master pasien table
      await db
        .update(pasienTable)
        .set({
          gedung: dataBaru.gedung || undefined,
          ruangan: dataBaru.ruangan || undefined,
          bed: dataBaru.bed || undefined,
          updated_at: new Date(),
        })
        .where(eq(pasienTable.id, revisi.pasien_id));

    } else if (revisi.jenis_perubahan === 'DISCHARGE') {
      const targetNoRm = dataBaru.no_rm || patient?.no_rm;
      if (revisi.batch_id && targetNoRm) {
        await db
          .update(snapshotDetailTable)
          .set({
            status_saat_snapshot: 'PULANG',
          })
          .where(
            and(
              eq(snapshotDetailTable.batch_id, revisi.batch_id),
              eq(snapshotDetailTable.no_rm, targetNoRm)
            )
          );
      }
      // Mark as PULANG in master pasien table
      await db
        .update(pasienTable)
        .set({ status_pasien: 'PULANG', updated_at: new Date() })
        .where(eq(pasienTable.id, revisi.pasien_id));
    }
  } catch (err) {
    console.error('Error applying approved revision to snapshot_detail / pasien:', err);
  }
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
      const revisi = existing[0];

      await db
        .update(otorisasiPerubahanDietTable)
        .set({
          status: 'APPROVED',
          reviewed_by: reviewerName,
          reviewed_at: new Date(),
          review_notes: reviewNotes || 'Otorisasi disetujui oleh Supervisor / Admin Head Gizi.',
        })
        .where(eq(otorisasiPerubahanDietTable.id, id));

      // Apply changes directly to snapshot_detail table for this batch
      await applyApprovedRevisionToSnapshot(revisi);

      revalidatePath('/dashboard/ag-rs/data-pasien');
      revalidatePath('/dashboard/ag-katering/admin/otorisasi-perubahan-diet');
      revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
      revalidatePath('/dashboard/ag-katering/overview/pemorsian');
      revalidatePath('/dashboard/ag-katering/overview/produksi');
      revalidatePath('/dashboard/ag-katering/overview');
      return {
        success: true,
        message: `Permintaan otorisasi #${id} berhasil disetujui dan disinkronkan ke batch produksi.`,
      };
    }

    return {
      success: false,
      message: `Permintaan otorisasi #${id} tidak ditemukan.`,
    };
  } catch (error) {
    console.error('Error approving revisi diet in DB:', error);
    return {
      success: false,
      message: 'Gagal menyetujui permintaan otorisasi di database.',
    };
  }
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
      const revisi = existing[0];

      await db
        .update(otorisasiPerubahanDietTable)
        .set({
          status: 'REJECTED',
          reviewed_by: reviewerName,
          reviewed_at: new Date(),
          review_notes: reviewNotes,
        })
        .where(eq(otorisasiPerubahanDietTable.id, id));

      // If it was a rejected NEW_PATIENT, remove the unapproved draft from pasienTable
      if (revisi.jenis_perubahan === 'NEW_PATIENT') {
        await db
          .delete(pasienTable)
          .where(
            and(
              eq(pasienTable.id, revisi.pasien_id),
              eq(pasienTable.status_pasien, 'PENDING_REVISI'),
            ),
          );
      }

      revalidatePath('/dashboard/ag-rs/data-pasien');
      revalidatePath('/dashboard/ag-katering/admin/otorisasi-perubahan-diet');
      revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
      revalidatePath('/dashboard/ag-katering/overview/pemorsian');
      revalidatePath('/dashboard/ag-katering/overview/produksi');
      revalidatePath('/dashboard/ag-katering/mapping-diet');
      revalidatePath('/dashboard/ag-katering/overview');
      return {
        success: true,
        message: `Permintaan otorisasi #${id} telah ditolak.`,
      };
    }

    return {
      success: false,
      message: `Permintaan otorisasi #${id} tidak ditemukan.`,
    };
  } catch (error) {
    console.error('Error rejecting revisi diet in DB:', error);
    return {
      success: false,
      message: 'Gagal menolak permintaan otorisasi di database.',
    };
  }
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
    const items = await db
      .select()
      .from(otorisasiPerubahanDietTable)
      .where(inArray(otorisasiPerubahanDietTable.id, ids));

    await db
      .update(otorisasiPerubahanDietTable)
      .set({
        status: 'APPROVED',
        reviewed_by: reviewerName,
        reviewed_at: new Date(),
        review_notes: reviewNotes,
      })
      .where(inArray(otorisasiPerubahanDietTable.id, ids));

    for (const item of items) {
      await applyApprovedRevisionToSnapshot(item);
    }

    revalidatePath('/dashboard/ag-rs/data-pasien');
    revalidatePath('/dashboard/ag-katering/admin/otorisasi-perubahan-diet');
    revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
    revalidatePath('/dashboard/ag-katering/overview/pemorsian');
    revalidatePath('/dashboard/ag-katering/overview/produksi');
    revalidatePath('/dashboard/ag-katering/overview');
    return {
      success: true,
      message: `${ids.length} permintaan otorisasi berhasil disetujui dan disinkronkan ke batch produksi.`,
    };
  } catch (error) {
    console.error('Error bulk approving revisi diet in DB:', error);
    return {
      success: false,
      message: 'Gagal melakukan persetujuan massal di database.',
    };
  }
}
