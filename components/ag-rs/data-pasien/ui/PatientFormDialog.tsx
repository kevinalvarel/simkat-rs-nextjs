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

import { KELAS_FALLBACK } from '@/lib/kelas-utils';

export default function PatientFormDialog({
  isOpen,
  onClose,
  patient = null,
  defaultRuangan,
  defaultGedung,
  defaultKamar,
  initialBed = '',
  kelasList = [],
  gedungList = [],
  revisionContext,
  onSubmitOptimistic,
}: PatientFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = patient !== null;

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues: {
      nama_pasien: '',
      no_rm: '',
      diet: '',
      kelas: '',
      gedung: defaultKamar || defaultGedung || 'Kamar 1',
      ruangan: defaultRuangan,
      bed: '',
      status_pasien: 'AKTIF',
    },
  });

  const selectedGedungName = form.watch('gedung');
  const selectedRuanganName = form.watch('ruangan') || defaultRuangan;

  // Opsi Kelas murni dari sistem (DB) + nilai legacy pasien agar data lama tetap tampil
  const availableKelasOptions = useMemo(() => {
    const set = new Set<string>();
    kelasList.forEach((k) => set.add(k.namaKelas));
    if (patient?.kelas) set.add(patient.kelas);
    if (set.size === 0) set.add(KELAS_FALLBACK);
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
      (g) => g.namaGedung.toLowerCase() === (selectedGedungName || '').toLowerCase(),
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

  // Compute available Kamar options based on selected Ruangan
  const availableKamarOptions = useMemo(() => {
    const set = new Set<string>();
    const matchedRuangan = gedungList
      .flatMap((g) => g.ruanganList)
      .find(
        (r) =>
          r.namaRuangan.toLowerCase() ===
          (selectedRuanganName || defaultRuangan || '').toLowerCase(),
      );

    if (matchedRuangan?.kamarList && matchedRuangan.kamarList.length > 0) {
      matchedRuangan.kamarList.forEach((k) => set.add(k.nomorKamar));
    }
    if (defaultKamar) set.add(defaultKamar);
    if (set.size === 0) {
      set.add('Kamar 1');
      set.add('Kamar 2');
    }
    return Array.from(set);
  }, [gedungList, selectedRuanganName, defaultRuangan, defaultKamar]);

  // Compute configured default Kelas from Konfigurasi Ruangan
  const defaultRoomKelas = useMemo(() => {
    const matchedRuangan = gedungList
      .flatMap((g) => g.ruanganList)
      .find(
        (r) =>
          r.namaRuangan.toLowerCase() ===
          (selectedRuanganName || defaultRuangan || '').toLowerCase(),
      );
    const matchedKamar = matchedRuangan?.kamarList?.find(
      (k) =>
        k.nomorKamar.toLowerCase() === (defaultKamar || '').toLowerCase(),
    );
    return (
      matchedKamar?.kelas ||
      matchedRuangan?.kelas ||
      availableKelasOptions[0] ||
      KELAS_FALLBACK
    );
  }, [
    gedungList,
    selectedRuanganName,
    defaultRuangan,
    defaultKamar,
    availableKelasOptions,
  ]);

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
          kelas: defaultRoomKelas,
          gedung: defaultKamar || availableKamarOptions[0] || defaultGedung || 'Kamar 1',
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
    defaultKamar,
    initialBed,
    defaultRoomKelas,
    availableKelasOptions,
    availableKamarOptions,
    form,
  ]);

  async function onSubmit(data: PatientFormValues) {
    if (onSubmitOptimistic) {
      onSubmitOptimistic(data, isEditMode, patient?.id);
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const result =
        isEditMode && patient
          ? await updatePatient(patient.id, data, revisionContext)
          : await createPatient(data, revisionContext);

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

          {/* Ruangan & Nomor Kamar */}
          <div className='grid grid-cols-2 gap-3'>
            {/* Ruangan */}
            <div className='space-y-1.5'>
              <Label>Ruangan</Label>
              <Select
                value={form.watch('ruangan')}
                onValueChange={(val) => {
                  if (val !== null) {
                    form.setValue('ruangan', val, { shouldValidate: true });
                    const newRoom = gedungList
                      .flatMap((g) => g.ruanganList)
                      .find(
                        (r) => r.namaRuangan.toLowerCase() === val.toLowerCase(),
                      );
                    if (newRoom?.kelas) {
                      form.setValue('kelas', newRoom.kelas, {
                        shouldValidate: true,
                      });
                    }
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

            {/* Nomor Kamar */}
            <div className='space-y-1.5'>
              <Label>Nomor Kamar</Label>
              <Select
                value={form.watch('gedung')}
                onValueChange={(val) => {
                  if (val !== null) {
                    form.setValue('gedung', val, { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Pilih Nomor Kamar' />
                </SelectTrigger>
                <SelectContent>
                  {availableKamarOptions.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
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
