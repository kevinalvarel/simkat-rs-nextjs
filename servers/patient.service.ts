'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/drizzle';
import { pasienTable } from '@/db/schemas/patient/pasien';
import {
  PatientFormSchema,
  type PatientFormValues,
} from '@/validations/PatientFormSchema';
import { kelasTable } from '@/db/schemas/master/kelas';

export type Patient = typeof pasienTable.$inferSelect;

export async function getPatientsByRoom(ruangan: string): Promise<Patient[]> {
  try {
    const patients = await db
      .select()
      .from(pasienTable)
      .where(eq(pasienTable.ruangan, ruangan))
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

export async function createPatient(
  data: PatientFormValues,
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
    await db.insert(pasienTable).values({
      nama_pasien: parsed.data.nama_pasien,
      no_rm: parsed.data.no_rm,
      diet: parsed.data.diet,
      kelas: parsed.data.kelas,
      gedung: parsed.data.gedung,
      ruangan: parsed.data.ruangan,
      bed: parsed.data.bed,
      status_pasien: parsed.data.status_pasien,
      is_npo: parsed.data.is_npo,
    });

    revalidatePath('/dashboard/ag-rs/data-pasien');
    revalidatePath('/dashboard/ag-katering/overview');
    return { success: true, message: 'Pasien berhasil ditambahkan.' };
  } catch (error) {
    console.error('Error creating patient:', error);
    return { success: false, message: 'Gagal menambahkan pasien.' };
  }
}

export async function updatePatient(
  id: number,
  data: PatientFormValues,
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
    revalidatePath('/dashboard/ag-katering/overview');
    return { success: true, message: 'Data pasien berhasil diperbarui.' };
  } catch (error) {
    console.error('Error updating patient:', error);
    return { success: false, message: 'Gagal memperbarui data pasien.' };
  }
}

export async function updatePatientField(
  id: number,
  fields: Partial<PatientFormValues>,
): Promise<MutationResult> {
  try {
    await db
      .update(pasienTable)
      .set({
        ...fields,
        updated_at: new Date(),
      })
      .where(eq(pasienTable.id, id));

    revalidatePath('/dashboard/ag-rs/data-pasien');
    revalidatePath('/dashboard/ag-katering/overview');
    return { success: true, message: 'Berhasil diperbarui.' };
  } catch (error) {
    console.error('Error updating patient field:', error);
    return { success: false, message: 'Gagal memperbarui data.' };
  }
}

export async function deletePatient(id: number): Promise<MutationResult> {
  try {
    await db.delete(pasienTable).where(eq(pasienTable.id, id));

    revalidatePath('/dashboard/ag-rs/data-pasien');
    revalidatePath('/dashboard/ag-katering/overview');
    return { success: true, message: 'Pasien berhasil dihapus.' };
  } catch (error) {
    console.error('Error deleting patient:', error);
    return { success: false, message: 'Gagal menghapus pasien.' };
  }
}
