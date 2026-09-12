'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Edit,
  Save,
  Sparkles,
  Send,
  Utensils,
  Info,
} from 'lucide-react';
import { SelectField, KATEGORI_LABEL } from './ui/SelectField';
import MappingDietConfirmDialog from './MappingDietConfirmDialog';
import { saveDietMapping } from '@/servers/mapping-diet.service';
import { broadcastProductionUpdate } from '@/lib/realtime-sync';
import { toast } from 'sonner';

export interface MappingDietEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: UnmappedDietItem | null;
  options: KategoriMenuOption[];
  onSuccess: () => void;
}

const MappingEditSchema = z
  .object({
    mode: z.enum(['STANDARD', 'NPO', 'KATERING']),
    karbo: z.string().optional(),
    hewani: z.string().optional(),
    nabati: z.string().optional(),
    sayur: z.string().optional(),
    buah: z.string().optional(),
    snack: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === 'STANDARD') {
      if (!val.karbo?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Karbohidrat wajib dipilih.',
          path: ['karbo'],
        });
      }
      if (!val.hewani?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lauk Hewani wajib dipilih.',
          path: ['hewani'],
        });
      }
      if (!val.nabati?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lauk Nabati wajib dipilih.',
          path: ['nabati'],
        });
      }
      if (!val.sayur?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Sayur wajib dipilih.',
          path: ['sayur'],
        });
      }
      if (!val.buah?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Buah wajib dipilih.',
          path: ['buah'],
        });
      }
      if (!val.snack?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Snack wajib dipilih.',
          path: ['snack'],
        });
      }
    }
  });

type MappingEditValues = z.infer<typeof MappingEditSchema>;

export default function MappingDietEditDialog({
  open,
  onOpenChange,
  item,
  options,
  onSuccess,
}: MappingDietEditDialogProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group options strictly from DB kategori_menu table
  const karboOptions = useMemo(
    () =>
      options.filter(
        (o) =>
          o.namaKategori === 'KARBO' || o.namaKategori === 'BENTUK_MAKANAN',
      ),
    [options],
  );

  const hewaniOptions = useMemo(
    () =>
      options.filter(
        (o) => o.namaKategori === 'HEWANI' || o.namaKategori === 'DIIT',
      ),
    [options],
  );

  const nabatiOptions = useMemo(() => {
    const list = [
      ...options.filter(
        (o) =>
          o.namaKategori === 'NABATI' ||
          o.namaKategori === 'DIIT' ||
          o.namaKategori === 'EXTRA' ||
          o.kodeItem === 'B',
      ),
    ];
    const seen = new Set<string>();
    return list.filter((o) => {
      if (seen.has(o.kodeItem)) return false;
      seen.add(o.kodeItem);
      return true;
    });
  }, [options]);

  const sayurOptions = useMemo(() => {
    const list = [
      ...options.filter(
        (o) =>
          o.namaKategori === 'SAYUR' ||
          o.namaKategori === 'DIIT' ||
          o.kodeItem === 'B',
      ),
    ];
    const seen = new Set<string>();
    return list.filter((o) => {
      if (seen.has(o.kodeItem)) return false;
      seen.add(o.kodeItem);
      return true;
    });
  }, [options]);

  const buahOptions = useMemo(
    () => options.filter((o) => o.namaKategori === 'BUAH'),
    [options],
  );

  const snackOptions = useMemo(
    () => options.filter((o) => o.namaKategori === 'SNACK'),
    [options],
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MappingEditValues>({
    resolver: zodResolver(MappingEditSchema),
    defaultValues: {
      mode: 'STANDARD',
      karbo: '',
      hewani: '',
      nabati: '',
      sayur: '',
      buah: '',
      snack: '',
    },
  });

  const mode = watch('mode');
  const karbo = watch('karbo') || '';
  const hewani = watch('hewani') || '';
  const nabati = watch('nabati') || '';
  const sayur = watch('sayur') || '';
  const buah = watch('buah') || '';
  const snack = watch('snack') || '';

  // Initialize form when item changes
  useEffect(() => {
    if (!item) return;

    let initNabati = item.nabati ?? '';
    let initSayur = item.sayur ?? '';
    if (!initNabati && !initSayur && item.extra) {
      const parts = item.extra.split(',').map((s) => s.trim());
      if (parts.length >= 2) {
        initNabati = parts[0];
        initSayur = parts[1];
      } else if (parts.length === 1 && parts[0]) {
        initNabati = parts[0];
      }
    }

    const isNpo =
      item.bentuk_makanan === 'NPO' ||
      item.kategori_diet === 'NPO' ||
      item.diet_rs_raw.trim().toUpperCase() === 'NPO';

    const isKatering =
      item.status_mapping === 'KATERING' ||
      item.bentuk_makanan === 'KATERING' ||
      item.kategori_diet === 'KATERING';

    if (isNpo) {
      reset({
        mode: 'NPO',
        karbo: 'NPO',
        hewani: 'NPO',
        nabati: 'NPO',
        sayur: 'NPO',
        buah: 'NPO',
        snack: 'NPO',
      });
    } else if (isKatering) {
      reset({
        mode: 'KATERING',
        karbo: 'KATERING',
        hewani: 'KATERING',
        nabati: '',
        sayur: '',
        buah: '',
        snack: '',
      });
    } else {
      reset({
        mode: 'STANDARD',
        karbo: item.bentuk_makanan ?? '',
        hewani: item.kategori_diet ?? '',
        nabati: initNabati,
        sayur: initSayur,
        buah: item.buah ?? '',
        snack: item.snack ?? '',
      });
    }
  }, [item, open, reset]);

  // Handle Mode Switch
  function handleModeChange(newMode: 'STANDARD' | 'NPO' | 'KATERING') {
    setValue('mode', newMode);
    if (newMode === 'NPO') {
      setValue('karbo', 'NPO');
      setValue('hewani', 'NPO');
      setValue('nabati', 'NPO');
      setValue('sayur', 'NPO');
      setValue('buah', 'NPO');
      setValue('snack', 'NPO');
    } else if (newMode === 'KATERING') {
      setValue('karbo', 'KATERING');
      setValue('hewani', 'KATERING');
      setValue('nabati', '');
      setValue('sayur', '');
      setValue('buah', '');
      setValue('snack', '');
    } else {
      // Return to standard values
      setValue('karbo', (karbo === 'NPO' || karbo === 'KATERING') ? (item?.bentuk_makanan || '') : karbo);
      setValue('hewani', (hewani === 'NPO' || hewani === 'KATERING') ? (item?.kategori_diet || '') : hewani);
      setValue('nabati', nabati === 'NPO' ? (item?.nabati || '') : nabati);
      setValue('sayur', sayur === 'NPO' ? (item?.sayur || '') : sayur);
      setValue('buah', buah === 'NPO' ? (item?.buah || '') : buah);
      setValue('snack', snack === 'NPO' ? (item?.snack || '') : snack);
    }
  }

  const onValidSubmit = () => {
    setIsConfirmOpen(true);
  };

  const onInvalidSubmit = (fieldErrors: typeof errors) => {
    const firstError = Object.values(fieldErrors)[0]?.message;
    toast.error(firstError || 'Semua kolom form mapping wajib diisi.');
  };

  async function handleFinalSave() {
    if (!item) return;
    setIsSubmitting(true);
    try {
      const extraCombined = [nabati, sayur].filter(Boolean).join(', ');

      const res = await saveDietMapping({
        diet_rs_raw: item.diet_rs_raw,
        mode: mode,
        status_mapping: mode === 'KATERING' ? 'KATERING' : undefined,
        bentuk_makanan: karbo || null,
        kategori_diet: hewani || null,
        nabati: nabati || null,
        sayur: sayur || null,
        extra: extraCombined || null,
        buah: buah || null,
        snack: snack || null,
        mapped_by: 'Admin Gizi',
      });

      if (res.success) {
        toast.success(res.message);
        broadcastProductionUpdate('SYNC_NOW', 'mapping-diet');
        setIsConfirmOpen(false);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan mapping diet.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!item) return null;

  const isFormIncomplete =
    mode === 'STANDARD' &&
    (!karbo.trim() ||
      !hewani.trim() ||
      !nabati.trim() ||
      !sayur.trim() ||
      !buah.trim() ||
      !snack.trim());

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-xl max-h-[92vh] overflow-y-auto p-6'>
          <DialogHeader className='gap-1 border-b pb-4'>
            <div className='flex items-center gap-2'>
              <Badge
                variant='outline'
                className='font-mono text-[11px] bg-muted/60'
              >
                {item.status_mapping === 'MAPPED'
                  ? 'EDIT MAPPING'
                  : 'MAPPING BARU'}
              </Badge>
              {item.jumlah_pasien > 0 && (
                <Badge
                  variant='secondary'
                  className='text-[10px] text-blue-700 dark:text-blue-300'
                >
                  {item.jumlah_pasien} Pasien Aktif
                </Badge>
              )}
            </div>
            <DialogTitle className='text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mt-1'>
              <Edit className='w-5 h-5 text-primary' />
              Edit Mapping Diet Pasien
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Tentukan kategori menu lengkap (6 komponen), otomatisasi NPO, atau alihkan ke Live Katering.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}>
            <div className='space-y-4 py-2 text-xs'>
              {/* Raw Text Card */}
              <div className='p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900/40 space-y-1.5'>
                <span className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
                  Diet RS Raw (Free-text):
                </span>
                <div className='flex items-center justify-between gap-2 flex-wrap'>
                  <p className='font-mono text-sm font-bold text-foreground'>
                    {item.diet_rs_raw}
                  </p>
                  {item.kelas_list && item.kelas_list.length > 0 && (
                    <span className='text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded border truncate'>
                      Kelas: {item.kelas_list.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Mode Mapping Switcher */}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold text-foreground block'>
                  Pilih Mode Mapping:
                </label>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
                  {/* 1. Standard */}
                  <button
                    type='button'
                    onClick={() => handleModeChange('STANDARD')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      mode === 'STANDARD'
                        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                        : 'border-border bg-background hover:bg-muted/40'
                    }`}
                  >
                    <div className='flex items-center gap-1.5 font-bold text-foreground text-xs'>
                      <Utensils className='w-3.5 h-3.5 text-primary' />
                      <span>Menu Standar</span>
                    </div>
                    <p className='text-[10px] text-muted-foreground leading-snug'>
                      Pilih lengkap 6 kategori menu dapur umum.
                    </p>
                  </button>

                  {/* 2. NPO */}
                  <button
                    type='button'
                    onClick={() => handleModeChange('NPO')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      mode === 'NPO'
                        ? 'border-purple-600 bg-purple-500/15 shadow-xs ring-1 ring-purple-600 text-purple-950 dark:text-purple-200'
                        : 'border-border bg-background hover:bg-purple-500/5'
                    }`}
                  >
                    <div className='flex items-center gap-1.5 font-bold text-xs text-purple-700 dark:text-purple-300'>
                      <Sparkles className='w-3.5 h-3.5' />
                      <span>NPO / Puasa</span>
                    </div>
                    <p className='text-[10px] text-muted-foreground leading-snug'>
                      Semua kriteria otomatis diset NPO (tidak makan).
                    </p>
                  </button>

                  {/* 3. Alihkan ke AG Katering */}
                  <button
                    type='button'
                    onClick={() => handleModeChange('KATERING')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      mode === 'KATERING'
                        ? 'border-blue-600 bg-blue-500/15 shadow-xs ring-1 ring-blue-600 text-blue-950 dark:text-blue-200'
                        : 'border-border bg-background hover:bg-blue-500/5'
                    }`}
                  >
                    <div className='flex items-center gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-300'>
                      <Send className='w-3.5 h-3.5' />
                      <span>AG Katering</span>
                    </div>
                    <p className='text-[10px] text-muted-foreground leading-snug'>
                      Bubur saring / sonde dialihkan ke Live Katering.
                    </p>
                  </button>
                </div>
              </div>

              {/* Mode-specific Banner */}
              {mode === 'NPO' && (
                <div className='flex items-start gap-2.5 p-3 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-500/10 text-purple-900 dark:text-purple-200 text-xs'>
                  <Sparkles className='w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5' />
                  <p>
                    <strong>Mode NPO Aktif:</strong> Karbohidrat, Lauk Hewani,
                    Nabati, Sayur, Buah, dan Snack otomatis dipetakan sebagai{' '}
                    <span className='font-mono font-bold'>NPO</span>.
                  </p>
                </div>
              )}

              {mode === 'KATERING' && (
                <div className='flex items-start gap-2.5 p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs'>
                  <Info className='w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5' />
                  <p>
                    <strong>Mode Alihkan ke AG Katering Aktif:</strong> Diet ini
                    dialihkan langsung ke halaman <strong>Live Katering (/overview/katering)</strong>.
                  </p>
                </div>
              )}

              {/* Category Form Fields */}
              <div
                className={`space-y-3.5 pt-1 ${
                  mode !== 'STANDARD' ? 'opacity-70 pointer-events-none' : ''
                }`}
              >
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
                  {/* 1. KARBO */}
                  <Controller
                    control={control}
                    name='karbo'
                    render={({ field }) => (
                      <SelectField
                        label={KATEGORI_LABEL['KARBO']}
                        required={mode === 'STANDARD'}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder='Pilih Karbohidrat...'
                        options={karboOptions}
                        disabled={mode !== 'STANDARD'}
                        error={errors.karbo?.message}
                      />
                    )}
                  />

                  {/* 2. HEWANI */}
                  <Controller
                    control={control}
                    name='hewani'
                    render={({ field }) => (
                      <SelectField
                        label={KATEGORI_LABEL['HEWANI']}
                        required={mode === 'STANDARD'}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder='Pilih Lauk Hewani...'
                        options={hewaniOptions}
                        disabled={mode !== 'STANDARD'}
                        error={errors.hewani?.message}
                      />
                    )}
                  />

                  {/* 3. NABATI */}
                  <Controller
                    control={control}
                    name='nabati'
                    render={({ field }) => (
                      <SelectField
                        label={KATEGORI_LABEL['NABATI']}
                        required={mode === 'STANDARD'}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder='Pilih Lauk Nabati...'
                        options={nabatiOptions}
                        disabled={mode !== 'STANDARD'}
                        error={errors.nabati?.message}
                      />
                    )}
                  />

                  {/* 4. SAYUR */}
                  <Controller
                    control={control}
                    name='sayur'
                    render={({ field }) => (
                      <SelectField
                        label={KATEGORI_LABEL['SAYUR']}
                        required={mode === 'STANDARD'}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder='Pilih Sayur...'
                        options={sayurOptions}
                        disabled={mode !== 'STANDARD'}
                        error={errors.sayur?.message}
                      />
                    )}
                  />

                  {/* 5. BUAH */}
                  <Controller
                    control={control}
                    name='buah'
                    render={({ field }) => (
                      <SelectField
                        label={KATEGORI_LABEL['BUAH']}
                        required={mode === 'STANDARD'}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder='Pilih Buah...'
                        options={buahOptions}
                        disabled={mode !== 'STANDARD'}
                        error={errors.buah?.message}
                      />
                    )}
                  />

                  {/* 6. SNACK */}
                  <Controller
                    control={control}
                    name='snack'
                    render={({ field }) => (
                      <SelectField
                        label={KATEGORI_LABEL['SNACK']}
                        required={mode === 'STANDARD'}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder='Pilih Snack...'
                        options={snackOptions}
                        disabled={mode !== 'STANDARD'}
                        error={errors.snack?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className='gap-2 flex-wrap pt-3 border-t mt-3'>
              <Button
                variant='outline'
                size='sm'
                type='button'
                onClick={() => onOpenChange(false)}
                className='text-xs'
              >
                Batal
              </Button>
              <Button
                size='sm'
                type='submit'
                disabled={isFormIncomplete}
                className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-xs'
              >
                <Save className='w-4 h-4' />
                Simpan Mapping
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog Step */}
      <MappingDietConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        diet_rs_raw={item.diet_rs_raw}
        mode={mode}
        values={{
          karbo,
          hewani,
          nabati,
          sayur,
          buah,
          snack,
        }}
        jumlahPasien={item.jumlah_pasien}
        isSubmitting={isSubmitting}
        onConfirm={handleFinalSave}
      />
    </>
  );
}
