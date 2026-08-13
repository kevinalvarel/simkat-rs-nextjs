'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import type { PatientFormDialogProps } from '@/types/data-pasien';
import { createPatient, updatePatient } from '@/servers/patient.service';
import {
  PatientFormSchema,
  type PatientFormValues,
} from '@/validations/PatientFormSchema';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS = [
  'AKTIF',
  'PASIEN_BARU',
  'PERUBAHAN_DIET',
  'PINDAH_RUANGAN',
  'NPO',
  'PULANG',
];

const DEFAULT_KELAS_FALLBACK = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'VIP'];

export default function PatientFormDialog({
  isOpen,
  onClose,
  patient = null,
  defaultRuangan,
  defaultGedung,
  initialBed = '',
  kelasList = [],
  gedungList = [],
}: PatientFormDialogProps & { initialBed?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = patient !== null;

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues: {
      nama_pasien: '',
      no_rm: '',
      diet: '',
      kelas: '',
      gedung: defaultGedung,
      ruangan: defaultRuangan,
      bed: '',
      status_pasien: 'AKTIF',
    },
  });

  const selectedGedungName = form.watch('gedung');

  // Compute available Kelas options
  const availableKelasOptions = useMemo(() => {
    const set = new Set<string>();
    kelasList.forEach((k) => set.add(k.namaKelas));
    DEFAULT_KELAS_FALLBACK.forEach((k) => set.add(k));
    if (patient?.kelas) set.add(patient.kelas);
    return Array.from(set);
  }, [kelasList, patient?.kelas]);

  // Compute available Gedung options
  const availableGedungOptions = useMemo(() => {
    const set = new Set<string>();
    gedungList.forEach((g) => set.add(g.namaGedung));
    if (defaultGedung) set.add(defaultGedung);
    if (patient?.gedung) set.add(patient.gedung);
    if (set.size === 0) {
      set.add('Gedung Baru');
      set.add('Gedung Lama');
    }
    return Array.from(set);
  }, [gedungList, defaultGedung, patient?.gedung]);

  // Compute available Ruangan options based on selected Gedung
  const availableRuanganOptions = useMemo(() => {
    const set = new Set<string>();
    const matchedGedung = gedungList.find(
      (g) => g.namaGedung.toLowerCase() === selectedGedungName.toLowerCase(),
    );

    if (matchedGedung && matchedGedung.ruanganList.length > 0) {
      matchedGedung.ruanganList.forEach((r) => set.add(r.namaRuangan));
    } else {
      gedungList.forEach((g) =>
        g.ruanganList.forEach((r) => set.add(r.namaRuangan)),
      );
    }

    if (defaultRuangan) set.add(defaultRuangan);
    if (patient?.ruangan) set.add(patient.ruangan);

    return Array.from(set);
  }, [gedungList, selectedGedungName, defaultRuangan, patient?.ruangan]);

  // Reset form when dialog opens/closes or patient changes
  useEffect(() => {
    if (isOpen) {
      if (patient) {
        form.reset({
          nama_pasien: patient.nama_pasien,
          no_rm: patient.no_rm,
          diet: patient.diet,
          kelas: patient.kelas,
          gedung: patient.gedung,
          ruangan: patient.ruangan,
          bed: patient.bed,
          status_pasien: patient.status_pasien,
          is_npo: patient.is_npo,
        });
      } else {
        form.reset({
          nama_pasien: '',
          no_rm: '',
          diet: '',
          kelas: availableKelasOptions[0] || 'Kelas 1',
          gedung: defaultGedung,
          ruangan: defaultRuangan,
          bed: initialBed,
          status_pasien: 'AKTIF',
          is_npo: false,
        });
      }
    }
  }, [
    isOpen,
    patient,
    defaultRuangan,
    defaultGedung,
    initialBed,
    availableKelasOptions,
    form,
  ]);

  async function onSubmit(data: PatientFormValues) {
    setIsSubmitting(true);
    try {
      const result =
        isEditMode && patient
          ? await updatePatient(patient.id, data)
          : await createPatient(data);

      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Data Pasien' : 'Tambah Pasien Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Perbarui informasi pasien di bawah ini.'
              : 'Isi data pasien baru untuk ruangan ini.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4 max-h-[60vh] overflow-y-auto pr-1'
        >
          {/* Nama Pasien */}
          <div className='space-y-1.5'>
            <Label htmlFor='nama_pasien'>Nama Pasien</Label>
            <Input
              id='nama_pasien'
              placeholder='Masukkan nama pasien'
              {...form.register('nama_pasien')}
            />
            {form.formState.errors.nama_pasien && (
              <p className='text-xs text-destructive'>
                {form.formState.errors.nama_pasien.message}
              </p>
            )}
          </div>

          {/* No. RM */}
          <div className='space-y-1.5'>
            <Label htmlFor='no_rm'>No. RM</Label>
            <Input
              id='no_rm'
              placeholder='Masukkan nomor rekam medis'
              {...form.register('no_rm')}
            />
            {form.formState.errors.no_rm && (
              <p className='text-xs text-destructive'>
                {form.formState.errors.no_rm.message}
              </p>
            )}
          </div>

          {/* Diet */}
          <div className='space-y-1.5'>
            <Label htmlFor='diet'>Diet</Label>
            <Input
              id='diet'
              placeholder='Contoh: MB, ML, MK, DM, Rendah Garam'
              {...form.register('diet')}
            />
            {form.formState.errors.diet && (
              <p className='text-xs text-destructive'>
                {form.formState.errors.diet.message}
              </p>
            )}
          </div>

          {/* Kelas (Dropdown / Select) */}
          <div className='space-y-1.5'>
            <Label>Kelas</Label>
            <Select
              value={form.watch('kelas')}
              onValueChange={(val) => {
                if (val !== null) {
                  form.setValue('kelas', val, { shouldValidate: true });
                }
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Pilih Kelas' />
              </SelectTrigger>
              <SelectContent>
                {availableKelasOptions.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.kelas && (
              <p className='text-xs text-destructive'>
                {form.formState.errors.kelas.message}
              </p>
            )}
          </div>

          {/* Bed */}
          <div className='space-y-1.5'>
            <Label htmlFor='bed'>Bed</Label>
            <Input
              id='bed'
              placeholder='Contoh: Bed 1, Bed 2A'
              {...form.register('bed')}
            />
            {form.formState.errors.bed && (
              <p className='text-xs text-destructive'>
                {form.formState.errors.bed.message}
              </p>
            )}
          </div>

          {/* Gedung & Ruangan (Dropdown / Select) */}
          <div className='grid grid-cols-2 gap-3'>
            {/* Gedung */}
            <div className='space-y-1.5'>
              <Label>Gedung</Label>
              <Select
                value={form.watch('gedung')}
                onValueChange={(val) => {
                  if (val !== null) {
                    form.setValue('gedung', val, { shouldValidate: true });
                    // Auto-select first room of new building if current room is not in it
                    const newMatched = gedungList.find(
                      (g) => g.namaGedung.toLowerCase() === val.toLowerCase(),
                    );
                    if (
                      newMatched &&
                      newMatched.ruanganList.length > 0 &&
                      !newMatched.ruanganList.some(
                        (r) => r.namaRuangan === form.getValues('ruangan'),
                      )
                    ) {
                      form.setValue(
                        'ruangan',
                        newMatched.ruanganList[0].namaRuangan,
                        { shouldValidate: true },
                      );
                    }
                  }
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Pilih Gedung' />
                </SelectTrigger>
                <SelectContent>
                  {availableGedungOptions.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.gedung && (
                <p className='text-xs text-destructive'>
                  {form.formState.errors.gedung.message}
                </p>
              )}
            </div>

            {/* Ruangan */}
            <div className='space-y-1.5'>
              <Label>Ruangan</Label>
              <Select
                value={form.watch('ruangan')}
                onValueChange={(val) => {
                  if (val !== null) {
                    form.setValue('ruangan', val, { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Pilih Ruangan' />
                </SelectTrigger>
                <SelectContent>
                  {availableRuanganOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.ruangan && (
                <p className='text-xs text-destructive'>
                  {form.formState.errors.ruangan.message}
                </p>
              )}
            </div>
          </div>

          {/* Status Pasien */}
          <div className='space-y-1.5'>
            <Label>Status Pasien</Label>
            <Select
              value={form.watch('status_pasien')}
              onValueChange={(val) => {
                if (val !== null) {
                  form.setValue('status_pasien', val, {
                    shouldValidate: true,
                  });
                }
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Pilih status' />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.status_pasien && (
              <p className='text-xs text-destructive'>
                {form.formState.errors.status_pasien.message}
              </p>
            )}
          </div>

          {/* NPO */}
          <div className='flex items-center gap-3'>
            <input
              type='checkbox'
              id='is_npo'
              checked={form.watch('is_npo')}
              onChange={(e) =>
                form.setValue('is_npo', e.target.checked, {
                  shouldValidate: true,
                })
              }
              className='h-4 w-4 rounded border-input accent-primary'
            />
            <Label htmlFor='is_npo' className='cursor-pointer'>
              NPO (Nil Per Os — tidak boleh makan/minum)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Menyimpan...
                </>
              ) : isEditMode ? (
                'Simpan Perubahan'
              ) : (
                'Tambah Pasien'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
