'use client';

import React, { useState, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mappingDietFormSchema, type MappingDietFormValues } from '@/lib/mapping-diet-schema';
import { hasFormFoodMapping, selectBentukMakanan, getTugasKateringCodes, isBentukTugasKatering } from '@/lib/mapping-diet-fields';
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
import { Save, Layers } from 'lucide-react';
import { bulkSaveDietMapping } from '@/servers/mapping-diet.service';
import { broadcastProductionUpdate } from '@/lib/realtime-sync';
import { toast } from 'sonner';
import { SelectField, KATEGORI_LABEL } from './ui/SelectField';

import MappingDietConfirmDialog from './MappingDietConfirmDialog';

interface MappingDietBulkDialogProps {
  selectedRaws: string[];
  options: KategoriMenuOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type MappingBulkValues = MappingDietFormValues;

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
    setIsSubmitting(true);
    try {
      const extraCombined = [nabati, sayur].filter(Boolean).join(', ');

      const res = await bulkSaveDietMapping(selectedRaws, {
        mode,
        bentuk_makanan: bentukMakanan || null,
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

  const isFormIncomplete = mode === 'STANDARD' && !hasFormFoodMapping({ bentukMakanan, hewani, nabati, sayur, buah, snack });
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
          hewani,
          nabati,
          sayur,
          buah,
          snack,
        }}
        items={selectedRaws.map((raw) => ({
          diet_rs_raw: raw,
          bentukMakanan,
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
