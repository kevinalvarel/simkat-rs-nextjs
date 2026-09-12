'use client';

import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { KategoriMenuOption } from '@/servers/mapping-diet.service';
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
import { Save, Layers, Loader2 } from 'lucide-react';
import { bulkSaveDietMapping } from '@/servers/mapping-diet.service';
import { broadcastProductionUpdate } from '@/lib/realtime-sync';
import { toast } from 'sonner';
import { SelectField, KATEGORI_LABEL } from './ui/SelectField';

import MappingDietConfirmDialog from './MappingDietConfirmDialog';
import { Utensils, Sparkles, Send } from 'lucide-react';

interface MappingDietBulkDialogProps {
  selectedRaws: string[];
  options: KategoriMenuOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MappingBulkSchema = z
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

type MappingBulkValues = z.infer<typeof MappingBulkSchema>;

export default function MappingDietBulkDialog({
  selectedRaws,
  options,
  open,
  onOpenChange,
  onSuccess,
}: MappingDietBulkDialogProps) {
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
  } = useForm<MappingBulkValues>({
    resolver: zodResolver(MappingBulkSchema),
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
      setValue('karbo', '');
      setValue('hewani', '');
      setValue('nabati', '');
      setValue('sayur', '');
      setValue('buah', '');
      setValue('snack', '');
    }
  }

  const onValidSubmit = () => {
    setIsConfirmOpen(true);
  };

  const onInvalidSubmit = (fieldErrors: typeof errors) => {
    const firstError = Object.values(fieldErrors)[0]?.message;
    toast.error(firstError || 'Semua 6 form mapping wajib diisi untuk mode standar.');
  };

  async function handleFinalSave() {
    setIsSubmitting(true);
    try {
      const extraCombined = [nabati, sayur].filter(Boolean).join(', ');

      const res = await bulkSaveDietMapping(selectedRaws, {
        mode,
        status_mapping: mode === 'KATERING' ? 'KATERING' : undefined,
        bentuk_makanan: karbo || null,
        kategori_diet: hewani || null,
        nabati: nabati || null,
        sayur: sayur || null,
        extra: extraCombined || undefined,
        buah: buah || undefined,
        snack: snack || undefined,
        mapped_by: 'Admin Gizi',
      });

      if (res.success) {
        toast.success(res.message);
        broadcastProductionUpdate('SYNC_NOW', 'mapping-diet');
        setIsConfirmOpen(false);
        onOpenChange(false);
        onSuccess();
        reset({
          mode: 'STANDARD',
          karbo: '',
          hewani: '',
          nabati: '',
          sayur: '',
          buah: '',
          snack: '',
        });
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan bulk mapping.');
    } finally {
      setIsSubmitting(false);
    }
  }

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
        <DialogContent className='sm:max-w-md max-h-[90vh] overflow-y-auto p-6'>
          <DialogHeader className='gap-1 border-b pb-4'>
            <div className='flex items-center gap-2'>
              <Badge
                variant='outline'
                className='font-mono text-[11px] bg-muted/60'
              >
                BULK MAPPING
              </Badge>
            </div>
            <DialogTitle className='text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mt-1'>
              <Layers className='w-5 h-5 text-primary' />
              Mapping Massal ({selectedRaws.length} Item)
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Terapkan pemetaan lengkap 6 kategori menu untuk semua diet RS terpilih.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}>
            <div className='space-y-4 py-2'>
              {/* Selected items list */}
              <div className='bg-muted/40 p-3 rounded-xl border space-y-2'>
                <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider'>
                  Diet yang akan di-mapping ({selectedRaws.length})
                </p>
                <div className='flex flex-wrap gap-1.5 max-h-24 overflow-y-auto'>
                  {selectedRaws.map((raw) => (
                    <span
                      key={raw}
                      className='font-mono text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border truncate max-w-[180px]'
                    >
                      {raw}
                    </span>
                  ))}
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
                      <span>Standar</span>
                    </div>
                    <p className='text-[10px] text-muted-foreground leading-snug'>
                      Pilih lengkap 6 kategori menu.
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
                      <span>NPO</span>
                    </div>
                    <p className='text-[10px] text-muted-foreground leading-snug'>
                      Semua diset Puasa/NPO.
                    </p>
                  </button>

                  {/* 3. Katering */}
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
                      <span>Katering</span>
                    </div>
                    <p className='text-[10px] text-muted-foreground leading-snug'>
                      Alihkan ke Live Katering.
                    </p>
                  </button>
                </div>
              </div>

              {/* Mapping Fields */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${
                  mode !== 'STANDARD' ? 'opacity-70 pointer-events-none' : ''
                }`}
              >
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

            <DialogFooter className='gap-2 sm:gap-0 pt-3 border-t mt-3'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => onOpenChange(false)}
                className='text-xs'
              >
                Batal
              </Button>
              <Button
                type='submit'
                size='sm'
                disabled={isFormIncomplete}
                className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-xs'
              >
                <Save className='w-4 h-4' />
                Simpan {selectedRaws.length} Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog Step */}
      <MappingDietConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        diet_rs_raw={`${selectedRaws.length} Item Massal`}
        mode={mode}
        values={{
          karbo,
          hewani,
          nabati,
          sayur,
          buah,
          snack,
        }}
        items={selectedRaws.map((raw) => ({
          diet_rs_raw: raw,
          karbo,
          hewani,
          nabati,
          sayur,
          buah,
          snack,
        }))}
        isSubmitting={isSubmitting}
        onConfirm={handleFinalSave}
      />
    </>
  );
}
