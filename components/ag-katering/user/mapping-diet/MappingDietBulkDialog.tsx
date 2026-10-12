'use client';

import React, { useState, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mappingDietFormSchema, type MappingDietFormValues } from '@/lib/mapping-diet-schema';
import { hasFormFoodMapping, applyBentukSaringTransition, getTugasKateringCodes, isBentukTugasKatering, isBentukSaring, getMasterOptionsForKind, getSaringDietCodes, hewaniMappingOptions, validateSaringPartition } from '@/lib/mapping-diet-fields';
import type { KategoriMenuOption } from '@/servers/mapping-diet.service';
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
import { Save, Layers } from 'lucide-react';
import { bulkSaveDietMapping } from '@/servers/mapping-diet.service';
import { broadcastProductionUpdate } from '@/lib/realtime-sync';
import { toast } from 'sonner';
import { SelectField, KATEGORI_LABEL } from './ui/SelectField';

import MappingDietConfirmDialog from './MappingDietConfirmDialog';

interface MappingDietBulkDialogProps {
  selectedRaws: string[];
  options: KategoriMenuOption[];
  siklusDietOptions?: SiklusDietOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type MappingBulkValues = MappingDietFormValues;

export default function MappingDietBulkDialog({
  selectedRaws,
  options,
  siklusDietOptions = [],
  open,
  onOpenChange,
  onSuccess,
}: MappingDietBulkDialogProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opsi dengan pola gabungan mode Saring (grup Saring atas + Biasa bawah).
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
  const saringSnackOptions = useMemo(
    () => getMasterOptionsForKind(options, 'SNACK', true),
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
  } = useForm<MappingBulkValues>({
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

  const isSaring = isBentukSaring(bentukMakanan);
  const karbohidratOptions = isSaring ? saringKarbohidratOptions : regulerKarbohidratOptions;
  const karbohidratSecondary = isSaring ? regulerKarbohidratOptions : undefined;
  const hewaniOptions = isSaring ? saringHewaniOptions : regulerHewaniOptions;
  const hewaniSecondary = isSaring ? regulerHewaniOptions : undefined;
  const nabatiOptions = isSaring ? saringNabatiOptions : regulerNabatiOptions;
  const nabatiSecondary = isSaring ? regulerNabatiOptions : undefined;
  const sayurOptions = isSaring ? saringSayurOptions : regulerSayurOptions;
  const sayurSecondary = isSaring ? regulerSayurOptions : undefined;
  const buahOptions = isSaring ? saringBuahOptions : regulerBuahOptions;
  const buahSecondary = isSaring ? regulerBuahOptions : undefined;
  // Snack reguler tetap semua (perilaku lama); mode Saring memakai pola gabungan.
  const snackPrimaryOptions = isSaring ? saringSnackOptions : snackOptions;
  const snackSecondary = isSaring ? snackOptions : undefined;

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
    setIsSubmitting(true);
    try {
      const extraCombined = [nabati, sayur].filter(Boolean).join(', ');

      const res = await bulkSaveDietMapping(selectedRaws, {
        mode,
        bentuk_makanan: bentukMakanan || null,
        karbohidrat: karbohidrat || null,
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
        if (res.skippedRaws?.length) toast.warning(`Mode khusus dilewati: ${res.skippedRaws.join(', ')}. Edit terpisah untuk mengubah mode.`);
        if (res.failedRaws?.length) toast.error(`Gagal menyimpan: ${res.failedRaws.join(', ')}.`);
        broadcastProductionUpdate('SYNC_NOW', 'mapping-diet');
        setIsConfirmOpen(false);
        onOpenChange(false);
        onSuccess();
        reset({
          mode: 'STANDARD',
          bentukMakanan: '',
          karbohidrat: '',
          hewani: '',
          nabati: '',
          sayur: '',
          buah: '',
          snack: '',
        });
      } else {
        toast.error(res.message);
        if (res.skippedRaws?.length) toast.warning(`Mode khusus dilewati: ${res.skippedRaws.join(', ')}.`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan bulk mapping.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isFormIncomplete = mode === 'STANDARD' && !hasFormFoodMapping({ bentukMakanan, karbohidrat, hewani, nabati, sayur, buah, snack });
  const isTugasKatering = isBentukTugasKatering(bentukMakanan, tugasKateringCodes);

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
              Isi minimal satu kategori menu. Kolom lain pada diet terpilih tetap tersimpan.
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

              {/* Mapping Fields */}
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
                      secondaryOptions={karbohidratSecondary}
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
                      secondaryOptions={hewaniSecondary}
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
                      secondaryOptions={nabatiSecondary}
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
                      secondaryOptions={sayurSecondary}
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
                      secondaryOptions={buahSecondary}
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
                      options={snackPrimaryOptions}
                      secondaryOptions={snackSecondary}
                      saringMode={isSaring}
                      disabled={mode !== 'STANDARD'}
                      error={errors.snack?.message}
                    />
                  )}
                />
              </div>

              {isTugasKatering && (
                <p className='text-[11px] text-blue-800 dark:text-blue-300 bg-blue-500/10 border border-blue-200 dark:border-blue-900 rounded-lg p-2.5'>
                  Bentuk ini tugas AG Katering: {selectedRaws.length} diet akan
                  otomatis masuk Live Katering dan tidak diproduksi di dapur umum.
                </p>
              )}
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
          bentukMakanan,
          karbohidrat,
          hewani,
          nabati,
          sayur,
          buah,
          snack,
        }}
        items={selectedRaws.map((raw) => ({
          diet_rs_raw: raw,
          bentukMakanan,
          karbohidrat,
          hewani,
          nabati,
          sayur,
          buah,
          snack,
          isTugasKatering,
        }))}
        isSubmitting={isSubmitting}
        onConfirm={handleFinalSave}
      />
    </>
  );
}
