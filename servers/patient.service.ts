'use server';

import { eq, ne, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/drizzle';
import { pasienTable } from '@/db/schemas/patient/pasien';
import {
  PatientFormSchema,
  type PatientFormValues,
} from '@/validations/PatientFormSchema';
import { kelasTable } from '@/db/schemas/master/kelas';

import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';

export type Patient = typeof pasienTable.$inferSelect;

export interface RevisionContext {
  isRevisiMode?: boolean;
  waktuMakan?: 'PAGI' | 'SIANG' | 'MALAM';
  batchId?: number | null;
  alasan?: string;
  requestedBy?: string;
}

export async function getPatientsByRoom(ruangan: string): Promise<Patient[]> {
  try {
    const patients = await db
      .select()
      .from(pasienTable)
      .where(
        and(
          eq(pasienTable.ruangan, ruangan),
          ne(pasienTable.status_pasien, 'PULANG'),
        ),
      )
      .orderBy(pasienTable.nama_pasien);

    return patients;
  } catch (error) {
    console.error('Error fetching patients by room:', error);
    return [];
  }
}

export type KelasOption = {
  idKelas: number;
  namaKelas: string;
};

export async function getKelas(): Promise<KelasOption[]> {
  try {
    const result = await db
      .select({
        idKelas: kelasTable.id,
        namaKelas: kelasTable.nama_kelas,
      })
      .from(kelasTable);

    return result as KelasOption[];
  } catch (error) {
    console.error('Error fetching kelas:', error);
    return [];
  }
}

type MutationResult = {
  success: boolean;
  message: string;
};

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

async function getActorString(fallback = 'Ahli Gizi RS') {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user?.name && session?.user?.email) {
      return `${session.user.name} (${session.user.email})`;
    }
  } catch (_) {}
  return fallback;
}

export async function createPatient(
  data: PatientFormValues,
  revisionContext?: RevisionContext,
): Promise<MutationResult> {
  const parsed = PatientFormSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message:
        'Validasi gagal: ' +
        parsed.error.issues.map((i) => i.message).join(', '),
    };
  }

  try {
    const isRevisi = Boolean(revisionContext?.isRevisiMode);
    const actor = await getActorString(
      revisionContext?.requestedBy || 'Ahli Gizi RS',
    );

    const [inserted] = await db
      .insert(pasienTable)
      .values({
        nama_pasien: parsed.data.nama_pasien,
        no_rm: parsed.data.no_rm,
        diet: parsed.data.diet,
        kelas: parsed.data.kelas,
        gedung: parsed.data.gedung,
        ruangan: parsed.data.ruangan,
        bed: parsed.data.bed,
        // If created under Mode Revisi, keep as PENDING_REVISI until supervisor approves
        status_pasien: isRevisi ? 'PENDING_REVISI' : parsed.data.status_pasien,
        is_npo: parsed.data.is_npo,
      })
      .returning();

    // Record into otorisasiPerubahanDietTable (Tracker)
    if (inserted) {
      await db.insert(otorisasiPerubahanDietTable).values({
        pasien_id: inserted.id,
        batch_id: revisionContext?.batchId || null,
        waktu_makan: revisionContext?.waktuMakan || 'PAGI',
        jenis_perubahan: 'NEW_PATIENT',
        data_baru: JSON.stringify(parsed.data),
        alasan:
          revisionContext?.alasan ||
          (isRevisi
            ? 'Pasien baru ditambahkan pasca-snapshot (Emergent)'
            : 'Pendaftaran pasien baru oleh Ahli Gizi RS'),
        status: isRevisi ? 'PENDING' : 'APPROVED',
        requested_by: actor,
        requested_at: new Date(),
        reviewed_by: isRevisi ? null : 'Sistem Terverifikasi',
        reviewed_at: isRevisi ? null : new Date(),
        review_notes: isRevisi ? null : 'Pasien baru terdaftar oleh ' + actor,
      });

      if (isRevisi) {
        revalidatePath('/dashboard/ag-katering/admin/otorisasi-perubahan-diet');
        revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
      }
    }

    revalidatePath('/dashboard/ag-rs/data-pasien');
    revalidatePath('/dashboard/ag-katering/admin/riwayat');
    revalidatePath('/dashboard/ag-katering/overview');
    revalidatePath('/dashboard/ag-katering/overview/produksi');
    revalidatePath('/dashboard/ag-katering/overview/pemorsian');
    revalidatePath('/dashboard/ag-katering/mapping-diet');
    return {
      success: true,
      message: isRevisi
        ? 'Pasien baru diajukan sebagai Revisi Emergent (Menunggu Otorisasi Supervisor).'
        : 'Pasien berhasil ditambahkan.',
    };
  } catch (error) {
    console.error('Error creating patient:', error);
    return { success: false, message: 'Gagal menambahkan pasien.' };
  }
}

export async function updatePatient(
  id: number,
  data: PatientFormValues,
  revisionContext?: RevisionContext,
): Promise<MutationResult> {
  const parsed = PatientFormSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message:
        'Validasi gagal: ' +
        parsed.error.issues.map((i) => i.message).join(', '),
    };
  }

  try {
    const [oldPatient] = await db
      .select()
      .from(pasienTable)
      .where(eq(pasienTable.id, id));

    const isRevisi = Boolean(revisionContext?.isRevisiMode);
    const actor = await getActorString(
      revisionContext?.requestedBy || 'Ahli Gizi RS',
    );

    if (isRevisi && oldPatient) {
      let jenisPerubahan:
        | 'DIET_CHANGE'
        | 'ROOM_TRANSFER'
        | 'DISCHARGE'
        | 'NPO' = 'DIET_CHANGE';

      if (parsed.data.is_npo || parsed.data.status_pasien === 'NPO') {
        jenisPerubahan = 'NPO';
      } else if (parsed.data.status_pasien === 'PULANG') {
        jenisPerubahan = 'DISCHARGE';
      } else if (
        parsed.data.ruangan !== oldPatient.ruangan ||
        parsed.data.gedung !== oldPatient.gedung
      ) {
        jenisPerubahan = 'ROOM_TRANSFER';
      }

      await db.insert(otorisasiPerubahanDietTable).values({
        pasien_id: id,
        batch_id: revisionContext?.batchId || null,
        waktu_makan: revisionContext?.waktuMakan || 'PAGI',
        jenis_perubahan: jenisPerubahan,
        data_lama: JSON.stringify(oldPatient),
        data_baru: JSON.stringify(parsed.data),
        alasan:
          revisionContext?.alasan ||
          'Perubahan data pasien pada mode revisi pasca-snapshot',
        status: 'PENDING',
        requested_by: actor,
      });

      revalidatePath('/dashboard/ag-katering/admin/otorisasi-perubahan-diet');
      revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
      revalidatePath('/dashboard/ag-katering/overview/pemorsian');
      return {
        success: true,
        message:
          'Perubahan diajukan ke Otorisasi Supervisor (Menunggu Persetujuan).',
      };
    }

    // Normal mode (non-revisi): Check if diet or significant field changed to log in Tracker
    if (oldPatient) {
      const hasDietChange = oldPatient.diet !== parsed.data.diet;
      const hasRoomChange =
        oldPatient.ruangan !== parsed.data.ruangan ||
        oldPatient.bed !== parsed.data.bed;
      const hasNpoChange = oldPatient.is_npo !== parsed.data.is_npo;
      const hasStatusChange =
        oldPatient.status_pasien !== parsed.data.status_pasien;

      if (hasDietChange || hasRoomChange || hasNpoChange || hasStatusChange) {
        let jenis: 'DIET_CHANGE' | 'ROOM_TRANSFER' | 'DISCHARGE' | 'NPO' =
          'DIET_CHANGE';
        let alasan = `Perubahan diet: ${oldPatient.diet} ➔ ${parsed.data.diet}`;

        if (parsed.data.is_npo || parsed.data.status_pasien === 'NPO') {
          jenis = 'NPO';
          alasan = 'Instruksi Pasien Puasa / NPO';
        } else if (parsed.data.status_pasien === 'PULANG') {
          jenis = 'DISCHARGE';
          alasan = 'Pasien Pulang / Selesai Rawat';
        } else if (hasRoomChange) {
          jenis = 'ROOM_TRANSFER';
          alasan = `Pindah ruangan dari ${oldPatient.ruangan || '-'} (${oldPatient.bed || '-'}) ke ${parsed.data.ruangan} (${parsed.data.bed})`;
        }

        await db.insert(otorisasiPerubahanDietTable).values({
          pasien_id: id,
          batch_id: null,
          waktu_makan: 'PAGI',
          jenis_perubahan: jenis,
          data_lama: JSON.stringify(oldPatient),
          data_baru: JSON.stringify(parsed.data),
          alasan: alasan,
          status: 'APPROVED',
          requested_by: actor,
          requested_at: new Date(),
          reviewed_by: 'Sistem Terverifikasi',
          reviewed_at: new Date(),
          review_notes: 'Pembaruan data pasien oleh ' + actor,
        });
      }
    }

    // Update patient record in database
    await db
      .update(pasienTable)
      .set({
        nama_pasien: parsed.data.nama_pasien,
        no_rm: parsed.data.no_rm,
        diet: parsed.data.diet,
        kelas: parsed.data.kelas,
        gedung: parsed.data.gedung,
        ruangan: parsed.data.ruangan,
        bed: parsed.data.bed,
        status_pasien: parsed.data.status_pasien,
        is_npo: parsed.data.is_npo,
        updated_at: new Date(),
      })
      .where(eq(pasienTable.id, id));

    revalidatePath('/dashboard/ag-rs/data-pasien');
    revalidatePath('/dashboard/ag-katering/admin/riwayat');
    revalidatePath('/dashboard/ag-katering/overview');
    revalidatePath('/dashboard/ag-katering/overview/produksi');
    revalidatePath('/dashboard/ag-katering/overview/pemorsian');
    return {
      success: true,
      message: 'Data pasien berhasil diperbarui.',
    };
  } catch (error) {
    console.error('Error updating patient:', error);
    return { success: false, message: 'Gagal memperbarui data pasien.' };
  }
}

export async function updatePatientField(
  id: number,
  fields: Partial<PatientFormValues>,
  revisionContext?: RevisionContext,
): Promise<MutationResult> {
  try {
    const [oldPatient] = await db
      .select()
      .from(pasienTable)
      .where(eq(pasienTable.id, id));

    const isRevisi = Boolean(revisionContext?.isRevisiMode);
    const actor = await getActorString(
      revisionContext?.requestedBy || 'Ahli Gizi RS',
    );

    if (isRevisi && oldPatient) {
      let jenisPerubahan:
        | 'DIET_CHANGE'
        | 'ROOM_TRANSFER'
        | 'DISCHARGE'
        | 'NPO' = 'DIET_CHANGE';

      if (fields.is_npo || fields.status_pasien === 'NPO') {
        jenisPerubahan = 'NPO';
      } else if (fields.status_pasien === 'PULANG') {
        jenisPerubahan = 'DISCHARGE';
      } else if (fields.ruangan || fields.gedung) {
        jenisPerubahan = 'ROOM_TRANSFER';
      }

      await db.insert(otorisasiPerubahanDietTable).values({
        pasien_id: id,
        batch_id: revisionContext?.batchId || null,
        waktu_makan: revisionContext?.waktuMakan || 'PAGI',
        jenis_perubahan: jenisPerubahan,
        data_lama: JSON.stringify(oldPatient),
        data_baru: JSON.stringify({ ...oldPatient, ...fields }),
        alasan:
          revisionContext?.alasan ||
          `Revisi ${Object.keys(fields).join(', ')} pasca-snapshot`,
        status: 'PENDING',
        requested_by: actor,
      });

      revalidatePath('/dashboard/ag-katering/admin/otorisasi-perubahan-diet');
      revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
      revalidatePath('/dashboard/ag-katering/overview/pemorsian');
      revalidatePath('/dashboard/ag-katering/overview/produksi');
      return {
        success: true,
        message:
          'Perubahan diajukan ke Otorisasi Supervisor (Menunggu Persetujuan).',
      };
    }

    // Normal mode: check if diet or significant field changed
    if (oldPatient && (fields.diet || fields.is_npo !== undefined || fields.ruangan || fields.status_pasien)) {
      let jenis: 'DIET_CHANGE' | 'ROOM_TRANSFER' | 'DISCHARGE' | 'NPO' = 'DIET_CHANGE';
      let alasan = `Pembaruan kolom: ${Object.keys(fields).join(', ')}`;

      if (fields.is_npo || fields.status_pasien === 'NPO') {
        jenis = 'NPO';
        alasan = 'Instruksi Pasien Puasa / NPO';
      } else if (fields.status_pasien === 'PULANG') {
        jenis = 'DISCHARGE';
        alasan = 'Pasien Pulang / Selesai Rawat';
      } else if (fields.ruangan || fields.bed) {
        jenis = 'ROOM_TRANSFER';
        alasan = `Pindah ruangan ke ${fields.ruangan || oldPatient.ruangan} (${fields.bed || oldPatient.bed})`;
      } else if (fields.diet) {
        alasan = `Perubahan diet: ${oldPatient.diet} ➔ ${fields.diet}`;
      }

      await db.insert(otorisasiPerubahanDietTable).values({
        pasien_id: id,
        batch_id: null,
        waktu_makan: 'PAGI',
        jenis_perubahan: jenis,
        data_lama: JSON.stringify(oldPatient),
        data_baru: JSON.stringify({ ...oldPatient, ...fields }),
        alasan: alasan,
        status: 'APPROVED',
        requested_by: actor,
        requested_at: new Date(),
        reviewed_by: 'Sistem Terverifikasi',
        reviewed_at: new Date(),
        review_notes: 'Pembaruan data pasien oleh ' + actor,
      });
    }

    // Normal mode (non-revisi): Update immediately
    await db
      .update(pasienTable)
      .set({
        ...fields,
        updated_at: new Date(),
      })
      .where(eq(pasienTable.id, id));

    revalidatePath('/dashboard/ag-rs/data-pasien');
    revalidatePath('/dashboard/ag-katering/admin/riwayat');
    revalidatePath('/dashboard/ag-katering/overview');
    revalidatePath('/dashboard/ag-katering/overview/produksi');
    revalidatePath('/dashboard/ag-katering/overview/pemorsian');
    return {
      success: true,
      message: 'Berhasil diperbarui.',
    };
  } catch (error) {
    console.error('Error updating patient field:', error);
    return { success: false, message: 'Gagal memperbarui data.' };
  }
}

export async function deletePatient(
  id: number,
  revisionContext?: RevisionContext,
): Promise<MutationResult> {
  try {
    const [oldPatient] = await db
      .select()
      .from(pasienTable)
      .where(eq(pasienTable.id, id));

    const isRevisi = Boolean(revisionContext?.isRevisiMode);
    const actor = await getActorString(
      revisionContext?.requestedBy || 'Ahli Gizi RS',
    );

    if (isRevisi && oldPatient) {
      await db.insert(otorisasiPerubahanDietTable).values({
        pasien_id: id,
        batch_id: revisionContext?.batchId || null,
        waktu_makan: revisionContext?.waktuMakan || 'PAGI',
        jenis_perubahan: 'DISCHARGE',
        data_lama: JSON.stringify(oldPatient),
        data_baru: JSON.stringify({ ...oldPatient, status_pasien: 'PULANG' }),
        alasan: revisionContext?.alasan || 'Pasien dipulangkan pasca-snapshot',
        status: 'PENDING',
        requested_by: actor,
      });

      revalidatePath('/dashboard/ag-katering/admin/otorisasi-perubahan-diet');
      revalidatePath('/dashboard/ag-katering/revisi-post-snapshot');
      revalidatePath('/dashboard/ag-katering/overview/pemorsian');
      revalidatePath('/dashboard/ag-katering/overview/produksi');
      return {
        success: true,
        message:
          'Pengajuan kepulangan pasien dikirim ke Otorisasi Supervisor (Menunggu Persetujuan).',
      };
    }

    if (oldPatient) {
      await db.insert(otorisasiPerubahanDietTable).values({
        pasien_id: id,
        batch_id: null,
        waktu_makan: 'PAGI',
        jenis_perubahan: 'DISCHARGE',
        data_lama: JSON.stringify(oldPatient),
        data_baru: JSON.stringify({ ...oldPatient, status_pasien: 'PULANG' }),
        alasan: 'Pasien dipulangkan / dihapus dari rawat inap',
        status: 'APPROVED',
        requested_by: actor,
        requested_at: new Date(),
        reviewed_by: 'Sistem Terverifikasi',
        reviewed_at: new Date(),
        review_notes: 'Pasien dipulangkan oleh ' + actor,
      });
    }

    // Normal mode: Delete from database
    await db.delete(pasienTable).where(eq(pasienTable.id, id));

    revalidatePath('/dashboard/ag-rs/data-pasien');
    revalidatePath('/dashboard/ag-katering/admin/riwayat');
    revalidatePath('/dashboard/ag-katering/overview');
    revalidatePath('/dashboard/ag-katering/overview/produksi');
    revalidatePath('/dashboard/ag-katering/overview/pemorsian');
    return { success: true, message: 'Pasien berhasil dihapus.' };
  } catch (error) {
    console.error('Error deleting patient:', error);
    return { success: false, message: 'Gagal menghapus pasien.' };
  }
}
