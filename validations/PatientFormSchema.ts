import { z } from 'zod';

export const PatientFormSchema = z.object({
  nama_pasien: z.string().min(1, 'Nama pasien wajib diisi'),
  no_rm: z.string().min(1, 'No. RM wajib diisi'),
  diet: z.string().min(1, 'Diet wajib diisi'),
  kelas: z.string().min(1, 'Kelas wajib diisi'),
  gedung: z.string().min(1, 'Gedung wajib diisi'),
  ruangan: z.string().min(1, 'Ruangan wajib diisi'),
  bed: z.string().min(1, 'Bed wajib diisi'),
  status_pasien: z.string().min(1, 'Status pasien wajib diisi'),
  is_npo: z.boolean(),
});

export type PatientFormValues = z.infer<typeof PatientFormSchema>;
