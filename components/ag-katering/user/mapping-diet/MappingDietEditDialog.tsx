'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mappingDietFormSchema, type MappingDietFormValues } from '@/lib/mapping-diet-schema';
import { hasFormFoodMapping, selectBentukMakanan, getTugasKateringCodes, isBentukTugasKatering, siklusDietOptionsForKind } from '@/lib/mapping-diet-fields';
import type {
  UnmappedDietItem,
  KategoriMenuOption,
} from '@/servers/mapping-diet.service';
import type { SiklusDietOption } from '@/servers/siklus-menu.service';
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
  siklusDietOptions?: SiklusDietOption[];
  onSuccess: () => void;
}

type MappingEditValues = MappingDietFormValues;

export default function MappingDietEditDialog({
  open,
  onOpenChange,
  item,
  options,
  siklusDietOptions = [],
  onSuccess,
}: MappingDietEditDialogProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group options strictly from DB kategori_menu table
  // Bentuk makanan tetap dari Konfigurasi Menu; hewani–snack dari siklus menu.
  const karboOptions = useMemo(
    () =>
      options.filter(
        (o) =>
          o.namaKategori === 'KARBO' || o.namaKategori === 'BENTUK_MAKANAN',
      ),
    [options],
  );

  const hewaniOptions = useMemo(
    () => siklusDietOptionsForKind(siklusDietOptions, 'HEWANI'),
    [siklusDietOptions],
  );

  const nabatiOptions = useMemo(
    () => siklusDietOptionsForKind(siklusDietOptions, 'NABATI'),
    [siklusDietOptions],
  );

  const sayurOptions = useMemo(
    () => siklusDietOptionsForKind(siklusDietOptions, 'SAYUR'),
    [siklusDietOptions],
  );

  const buahOptions = useMemo(
    () => siklusDietOptionsForKind(siklusDietOptions, 'BUAH'),
    [siklusDietOptions],
  );

  const snackOptions = useMemo(
    () => siklusDietOptionsForKind(siklusDietOptions, 'SNACK'),
    [siklusDietOptions],
  );

  // Kode bentuk yang berflag tugas AG Katering → otomatis masuk Live Katering
  const tugasKateringCodes = useMemo(
    () => getTugasKateringCodes(options),
    [options],
  );

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MappingEditValues>({
    resolver: zodResolver(mappingDietFormSchema),
    defaultValues: {
      mode: 'STANDARD',
      bentukMakanan: '',
      hewani: '',
      nabati: '',
      sayur: '',
      buah: '',
      snack: '',
    },
  });

  const values = useWatch({ control });
  const mode = values.mode || 'STANDARD';
  const bentukMakanan = values.bentukMakanan || '';
  const hewani = values.hewani || '';
  const nabati = values.nabati || '';
  const sayur = values.sayur || '';
  const buah = values.buah || '';
  const snack = values.snack || '';

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

    if (isNpo) {
      reset({
        mode: 'NPO',
        bentukMakanan: 'NPO',
        hewani: 'NPO',
        nabati: 'NPO',
        sayur: 'NPO',
        buah: 'NPO',
        snack: 'NPO',
      });
    } else {
      reset({
        mode: 'STANDARD',
        bentukMakanan: item.bentuk_makanan ?? '',
        hewani: item.kategori_diet ?? '',
        nabati: initNabati,
        sayur: initSayur,
        buah: item.buah ?? '',
        snack: item.snack ?? '',
      });
    }
  }, [item, open, reset]);

  function handleBentukMakananChange(value: string) {
    const next = selectBentukMakanan({ hewani, nabati, sayur, buah, snack }, value);
    setValue('mode', next.mode);
    setValue('bentukMakanan', next.bentukMakanan, { shouldValidate: true });
    setValue('hewani', next.hewani);
    setValue('nabati', next.nabati);
    setValue('sayur', next.sayur);
    setValue('buah', next.buah);
    setValue('snack', next.snack);
  }

  const onValidSubmit = () => {
    setIsConfirmOpen(true);
  };

  const onInvalidSubmit = (fieldErrors: typeof errors) => {
    const firstError = Object.values(fieldErrors)[0]?.message;
    toast.error(firstError || 'Isi minimal satu jenis makanan.');
  };

  async function handleFinalSave() {
    if (!item) return;
    setIsSubmitting(true);
    try {
      const extraCombined = [nabati, sayur].filter(Boolean).join(', ');

      const res = await saveDietMapping({
        diet_rs_raw: item.diet_rs_raw,
        mode: mode,
        bentuk_makanan: bentukMakanan || null,
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

  const isFormIncomplete = mode === 'STANDARD' && !hasFormFoodMapping({ bentukMakanan, hewani, nabati, sayur, buah, snack });
  const isTugasKatering = isBentukTugasKatering(bentukMakanan, tugasKateringCodes);

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
              Isi minimal satu kategori menu atau pilih NPO. Bentuk makanan
              berflag tugas AG Katering otomatis masuk Live Katering.
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

              {/* Mode-specific Banner */}
              {mode === 'NPO' && (
                <div className='flex items-start gap-2.5 p-3 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-500/10 text-purple-900 dark:text-purple-200 text-xs'>
                  <Sparkles className='w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5' />
                  <p>
                    <strong>Mode NPO Aktif:</strong> Bentuk Makanan, Lauk Hewani,
                    Nabati, Sayur, Buah, dan Snack otomatis dipetakan sebagai{' '}
                    <span className='font-mono font-bold'>NPO</span>.
                  </p>
                </div>
              )}

              {isTugasKatering && (
                <div className='flex items-start gap-2.5 p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs'>
                  <Send className='w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5' />
                  <p>
                    <strong>Bentuk ini tugas AG Katering:</strong> diet akan
                    otomatis masuk halaman <strong>Live Katering (/overview/katering)</strong>{' '}
                    dan tidak diproduksi di dapur umum.
                  </p>
                </div>
              )}

              {/* Category Form Fields */}
              <div className='space-y-3.5 pt-1'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
                  {/* 1. BENTUK MAKANAN */}
                  <Controller
                    control={control}
                    name='bentukMakanan'
                    render={({ field }) => (
                      <SelectField
                        label={KATEGORI_LABEL['BENTUK_MAKANAN']}
                        value={field.value || ''}
                        onChange={handleBentukMakananChange}
                        placeholder='Pilih Bentuk Makanan...'
                        options={karboOptions}
                        includeSpecial
                        error={errors.bentukMakanan?.message}
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
          bentukMakanan,
          hewani,
          nabati,
          sayur,
          buah,
          snack,
        }}
        isTugasKatering={isTugasKatering}
        jumlahPasien={item.jumlah_pasien}
        isSubmitting={isSubmitting}
        onConfirm={handleFinalSave}
      />
    </>
  );
}
