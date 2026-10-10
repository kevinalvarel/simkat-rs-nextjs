'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mappingDietFormSchema, type MappingDietFormValues } from '@/lib/mapping-diet-schema';
import { hasFormFoodMapping, applyBentukSaringTransition, getTugasKateringCodes, isBentukTugasKatering, isBentukSaring, getMasterOptionsForKind, getSaringDietCodes, hewaniMappingOptions, validateSaringPartition } from '@/lib/mapping-diet-fields';
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

  // Opsi dengan partisi Saring ketat (lihat MappingDietTable untuk penjelasan).
  const bentukOptions = useMemo(
    () =>
      options.filter(
        (o) =>
          o.namaKategori === 'KARBO' || o.namaKategori === 'BENTUK_MAKANAN',
      ),
    [options],
  );
  const saringCodes = useMemo(() => getSaringDietCodes(options), [options]);
  const regulerKarbohidratOptions = useMemo(
    () => getMasterOptionsForKind(options, 'KARBOHIDRAT', false),
    [options],
  );
  const saringKarbohidratOptions = useMemo(
    () => getMasterOptionsForKind(options, 'KARBOHIDRAT', true),
    [options],
  );
  const regulerHewaniOptions = useMemo(
    () => hewaniMappingOptions(options, siklusDietOptions, false),
    [options, siklusDietOptions],
  );
  const saringHewaniOptions = useMemo(
    () => hewaniMappingOptions(options, siklusDietOptions, true),
    [options, siklusDietOptions],
  );
  const regulerNabatiOptions = useMemo(
    () => getMasterOptionsForKind(options, 'NABATI', false),
    [options],
  );
  const saringNabatiOptions = useMemo(
    () => getMasterOptionsForKind(options, 'NABATI', true),
    [options],
  );
  const regulerSayurOptions = useMemo(
    () => getMasterOptionsForKind(options, 'SAYUR', false),
    [options],
  );
  const saringSayurOptions = useMemo(
    () => getMasterOptionsForKind(options, 'SAYUR', true),
    [options],
  );
  const regulerBuahOptions = useMemo(
    () => getMasterOptionsForKind(options, 'BUAH', false),
    [options],
  );
  const saringBuahOptions = useMemo(
    () => getMasterOptionsForKind(options, 'BUAH', true),
    [options],
  );

  const snackOptions = useMemo(
    () => options.filter((o) => o.namaKategori === 'SNACK'),
    [options],
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
      karbohidrat: '',
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
  const karbohidrat = values.karbohidrat || '';
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
        karbohidrat: 'NPO',
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
        karbohidrat: item.karbohidrat ?? '',
        hewani: item.kategori_diet ?? '',
        nabati: initNabati,
        sayur: initSayur,
        buah: item.buah ?? '',
        snack: item.snack ?? '',
      });
    }
  }, [item, open, reset]);

  const isSaring = isBentukSaring(bentukMakanan);
  const karbohidratOptions = isSaring ? saringKarbohidratOptions : regulerKarbohidratOptions;
  const hewaniOptions = isSaring ? saringHewaniOptions : regulerHewaniOptions;
  const nabatiOptions = isSaring ? saringNabatiOptions : regulerNabatiOptions;
  const sayurOptions = isSaring ? saringSayurOptions : regulerSayurOptions;
  const buahOptions = isSaring ? saringBuahOptions : regulerBuahOptions;

  function handleFieldChange(
    field: 'karbohidrat' | 'hewani' | 'nabati' | 'sayur' | 'buah' | 'snack',
    value: string,
  ) {
    const next = { karbohidrat, hewani, nabati, sayur, buah, snack, [field]: value };
    const errors = validateSaringPartition(
      {
        karbohidrat: next.karbohidrat,
        hewani: next.hewani,
        nabati: next.nabati,
        sayur: next.sayur,
        buah: next.buah,
      },
      saringCodes,
      isBentukSaring(bentukMakanan),
    );
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    setValue(field, value, { shouldValidate: true });
  }

  function handleBentukMakananChange(value: string) {
    const wasSaring = isBentukSaring(bentukMakanan);
    const next = applyBentukSaringTransition({ karbohidrat, hewani, nabati, sayur, buah, snack }, value, bentukMakanan);
    const cleared =
      wasSaring !== next.isSaring &&
      (karbohidrat || hewani || nabati || sayur || buah) &&
      !next.karbohidrat && !next.hewani && !next.nabati && !next.sayur && !next.buah &&
      next.mode === 'STANDARD';
    setValue('mode', next.mode);
    setValue('bentukMakanan', next.bentukMakanan, { shouldValidate: true });
    setValue('karbohidrat', next.karbohidrat);
    setValue('hewani', next.hewani);
    setValue('nabati', next.nabati);
    setValue('sayur', next.sayur);
    setValue('buah', next.buah);
    setValue('snack', next.snack);
    if (cleared) {
      toast.info(
        next.isSaring
          ? 'Mode Saring: kolom Karbo/Hewani/Nabati/Sayur/Buah dikosongkan, pilih diet Saring.'
          : 'Keluar mode Saring: kolom Saring dikosongkan, pilih diet standar.',
      );
    }
  }

  const onValidSubmit = () => {
    const errors = validateSaringPartition(
      { karbohidrat, hewani, nabati, sayur, buah },
      saringCodes,
      isSaring,
    );
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
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
        karbohidrat: karbohidrat || null,
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

  const isFormIncomplete = mode === 'STANDARD' && !hasFormFoodMapping({ bentukMakanan, karbohidrat, hewani, nabati, sayur, buah, snack });
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
                    <strong>Mode NPO Aktif:</strong> Bentuk Makanan, Karbohidrat, Lauk Hewani,
                    Nabati, Sayur, Buah, dan Snack otomatis dipetakan sebagai{' '}
                    <span className='font-mono font-bold'>NPO</span>.
                  </p>
                </div>
              )}

              {isSaring && mode === 'STANDARD' && (
                <div className='flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs'>
                  <Sparkles className='w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
                  <p>
                    <strong>Mode Saring Aktif:</strong> Karbohidrat, Lauk Hewani,
                    Nabati, Sayur, dan Buah hanya menampilkan diet berflag Saring.
                    Snack tetap normal.
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
                        options={bentukOptions}
                        includeSpecial
                        error={errors.bentukMakanan?.message}
                      />
                    )}
                  />

                  {/* 2. KARBOHIDRAT */}
                  <Controller
                    control={control}
                    name='karbohidrat'
                    render={({ field }) => (
                      <SelectField
                        label={KATEGORI_LABEL['KARBOHIDRAT']}
                        value={field.value || ''}
                        onChange={(v) => handleFieldChange('karbohidrat', v)}
                        placeholder={isSaring ? 'Pilih Karbohidrat Saring...' : 'Pilih Karbohidrat...'}
                        options={karbohidratOptions}
                        disabled={mode !== 'STANDARD'}
                        saringMode={isSaring}
                        error={errors.karbohidrat?.message}
                      />
                    )}
                  />

                  {/* 3. HEWANI */}
                  <Controller
                    control={control}
                    name='hewani'
                    render={({ field }) => (
                      <SelectField
                        label={KATEGORI_LABEL['HEWANI']}
                        value={field.value || ''}
                        onChange={(v) => handleFieldChange('hewani', v)}
                        placeholder={isSaring ? 'Pilih Lauk Hewani Saring...' : 'Pilih Lauk Hewani...'}
                        options={hewaniOptions}
                        disabled={mode !== 'STANDARD'}
                        saringMode={isSaring}
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
                        onChange={(v) => handleFieldChange('nabati', v)}
                        placeholder={isSaring ? 'Pilih Lauk Nabati Saring...' : 'Pilih Lauk Nabati...'}
                        options={nabatiOptions}
                        disabled={mode !== 'STANDARD'}
                        saringMode={isSaring}
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
                        onChange={(v) => handleFieldChange('sayur', v)}
                        placeholder={isSaring ? 'Pilih Sayur Saring...' : 'Pilih Sayur...'}
                        options={sayurOptions}
                        disabled={mode !== 'STANDARD'}
                        saringMode={isSaring}
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
                        onChange={(v) => handleFieldChange('buah', v)}
                        placeholder={isSaring ? 'Pilih Buah Saring...' : 'Pilih Buah...'}
                        options={buahOptions}
                        disabled={mode !== 'STANDARD'}
                        saringMode={isSaring}
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
          karbohidrat,
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
