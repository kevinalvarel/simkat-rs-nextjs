'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  UnmappedDietItem,
  KategoriMenuOption,
} from '@/servers/mapping-diet.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, FileText, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { saveDietMapping } from '@/servers/mapping-diet.service';
import { toast } from 'sonner';
import { SelectField, KATEGORI_LABEL } from './ui/SelectField';

interface MappingDietDialogProps {
  item: UnmappedDietItem | null;
  options: KategoriMenuOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Group options by namaKategori
function groupByKategori(
  options: KategoriMenuOption[],
): Record<string, KategoriMenuOption[]> {
  return options.reduce(
    (acc, opt) => {
      if (!acc[opt.namaKategori]) acc[opt.namaKategori] = [];
      acc[opt.namaKategori].push(opt);
      return acc;
    },
    {} as Record<string, KategoriMenuOption[]>,
  );
}

// React Hook Form Zod Schema
const MappingFormSchema = z.object({
  karbo: z.string().min(1, 'Karbohidrat wajib diisi.'),
  hewani: z.string().min(1, 'Lauk Hewani wajib diisi.'),
  nabati: z.string().optional(),
  sayur: z.string().optional(),
  buah: z.string().optional(),
  snack: z.string().optional(),
});

type MappingFormValues = z.infer<typeof MappingFormSchema>;

export default function MappingDietDialog({
  item,
  options,
  open,
  onOpenChange,
  onSuccess,
}: MappingDietDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MappingFormValues>({
    resolver: zodResolver(MappingFormSchema),
    defaultValues: {
      karbo: '',
      hewani: '',
      nabati: '',
      sayur: '',
      buah: '',
      snack: '',
    },
  });

  const watchKarbo = watch('karbo');
  const watchHewani = watch('hewani');
  const watchNabati = watch('nabati');
  const watchSayur = watch('sayur');
  const watchBuah = watch('buah');
  const watchSnack = watch('snack');

  const grouped = useMemo(() => groupByKategori(options), [options]);

  // Pre-fill on item change or dialog open
  useEffect(() => {
    if (open && item) {
      reset({
        karbo: item.bentuk_makanan ?? '',
        hewani: item.kategori_diet ?? '',
        nabati: item.extra ?? '',
        sayur: '',
        buah: item.buah ?? '',
        snack: item.snack ?? '',
      });
    }
  }, [open, item, reset]);

  function handleReset() {
    reset({
      karbo: '',
      hewani: '',
      nabati: '',
      sayur: '',
      buah: '',
      snack: '',
    });
  }

  async function onSubmit(data: MappingFormValues) {
    if (!item) return;

    try {
      const extraCombined = [data.nabati, data.sayur]
        .filter(Boolean)
        .join(', ');

      const res = await saveDietMapping({
        diet_rs_raw: item.diet_rs_raw,
        bentuk_makanan: data.karbo,
        kategori_diet: data.hewani,
        extra: extraCombined || undefined,
        buah: data.buah || undefined,
        snack: data.snack || undefined,
        mapped_by: 'Admin Gizi',
      });

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan mapping diet.');
    }
  }

  if (!item) return null;

  const isEdit = item.status_mapping !== 'UNMAPPED';

  // Option lists with fallback for backward compatibility
  const karboOptions = grouped['KARBO'] ?? grouped['BENTUK_MAKANAN'] ?? [];
  const hewaniOptions = grouped['HEWANI'] ?? grouped['DIIT'] ?? [];
  const nabatiOptions = grouped['NABATI'] ?? grouped['EXTRA'] ?? [];
  const sayurOptions = grouped['SAYUR'] ?? [];
  const buahOptions = grouped['BUAH'] ?? [];
  const snackOptions = grouped['SNACK'] ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg max-h-[92vh] overflow-y-auto p-6'>
        <DialogHeader className='gap-1 border-b pb-4'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Badge
              variant='outline'
              className='font-mono text-[11px] bg-muted/60'
            >
              {isEdit ? 'EDIT MAPPING' : 'NEW MAPPING'}
            </Badge>
            {item.status_mapping === 'PARTIAL' && (
              <span className='inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'>
                <AlertTriangle className='w-3 h-3' /> Partial
              </span>
            )}
          </div>
          <DialogTitle className='text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mt-1'>
            <FileText className='w-5 h-5 text-primary' />
            {isEdit ? 'Edit Mapping Diet' : 'Buat Mapping Diet'}
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Petakan diet free-text RS ke standar kategori diet katering.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-5 py-2'>
          {/* Diet Raw Info */}
          <div className='bg-muted/40 p-3.5 rounded-xl border space-y-2'>
            <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider'>
              Diet RS Raw (Free Text Dokter / Perawat)
            </p>
            <p className='font-mono text-sm font-bold text-foreground bg-background px-3 py-2 rounded-lg border'>
              {item.diet_rs_raw}
            </p>
            <div className='flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap'>
              <div className='flex items-center gap-1.5'>
                <Users className='w-3.5 h-3.5' />
                <span>
                  Mempengaruhi{' '}
                  <strong className='text-foreground'>
                    {item.jumlah_pasien} pasien
                  </strong>{' '}
                  aktif
                </span>
              </div>
              {item.kelas_list && item.kelas_list.length > 0 && (
                <div className='flex items-center gap-1 flex-wrap'>
                  <span className='text-[10px] text-muted-foreground'>Kelas:</span>
                  {item.kelas_list.map((k) => (
                    <Badge
                      key={k}
                      variant='outline'
                      className='text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    >
                      {k}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info Banner */}
          <div className='flex items-start gap-2 bg-blue-500/5 p-3 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200'>
            <AlertTriangle className='w-4 h-4 text-blue-500 shrink-0 mt-0.5' />
            <p>
              Mapping ini akan digunakan untuk standarisasi diet pada laporan
              dan etiket katering. Wajib minimal isi{' '}
              <strong>Karbohidrat</strong> dan <strong>Lauk Hewani</strong>.
            </p>
          </div>

          {/* Mapping Form Fields in Order: KARBO, HEWANI, NABATI, SAYUR, BUAH, SNACK */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* 1. KARBO — Required */}
            <Controller
              name='karbo'
              control={control}
              render={({ field }) => (
                <SelectField
                  label={KATEGORI_LABEL['KARBO']}
                  required
                  value={field.value}
                  onChange={field.onChange}
                  placeholder='Pilih Karbohidrat...'
                  options={karboOptions}
                  error={errors.karbo?.message}
                />
              )}
            />

            {/* 2. HEWANI — Required */}
            <Controller
              name='hewani'
              control={control}
              render={({ field }) => (
                <SelectField
                  label={KATEGORI_LABEL['HEWANI']}
                  required
                  value={field.value}
                  onChange={field.onChange}
                  placeholder='Pilih Lauk Hewani...'
                  options={hewaniOptions}
                  error={errors.hewani?.message}
                />
              )}
            />

            {/* 3. NABATI — Optional */}
            <Controller
              name='nabati'
              control={control}
              render={({ field }) => (
                <SelectField
                  label={KATEGORI_LABEL['NABATI'] + ' (Opsional)'}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder='Pilih Lauk Nabati...'
                  options={nabatiOptions}
                  error={errors.nabati?.message}
                />
              )}
            />

            {/* 4. SAYUR — Optional */}
            <Controller
              name='sayur'
              control={control}
              render={({ field }) => (
                <SelectField
                  label={KATEGORI_LABEL['SAYUR'] + ' (Opsional)'}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder='Pilih Sayur...'
                  options={sayurOptions}
                  error={errors.sayur?.message}
                />
              )}
            />

            {/* 5. BUAH — Optional */}
            <Controller
              name='buah'
              control={control}
              render={({ field }) => (
                <SelectField
                  label={KATEGORI_LABEL['BUAH'] + ' (Opsional)'}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder='Pilih Buah...'
                  options={buahOptions}
                  error={errors.buah?.message}
                />
              )}
            />

            {/* 6. SNACK — Optional */}
            <Controller
              name='snack'
              control={control}
              render={({ field }) => (
                <SelectField
                  label={KATEGORI_LABEL['SNACK'] + ' (Opsional)'}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder='Pilih Snack...'
                  options={snackOptions}
                  error={errors.snack?.message}
                />
              )}
            />
          </div>

          {/* Preview Hasil Mapping */}
          {(watchKarbo || watchHewani) && (
            <div className='bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-2'>
              <p className='text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider'>
                Preview Mapping Hasil
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {watchKarbo && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200'>
                    🍚 {watchKarbo}
                  </span>
                )}
                {watchHewani && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200'>
                    🍗 {watchHewani}
                  </span>
                )}
                {watchNabati && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200'>
                    🫘 {watchNabati}
                  </span>
                )}
                {watchSayur && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200'>
                    🥦 {watchSayur}
                  </span>
                )}
                {watchBuah && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200'>
                    🍊 {watchBuah}
                  </span>
                )}
                {watchSnack && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200'>
                    🍪 {watchSnack}
                  </span>
                )}
              </div>
            </div>
          )}

          <DialogFooter className='gap-2 flex-wrap pt-2 border-t'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleReset}
              disabled={isSubmitting}
              className='text-xs text-muted-foreground'
            >
              Reset Form
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type='submit'
              size='sm'
              disabled={isSubmitting}
              className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4' />
                  Simpan Mapping
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
