'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Save,
  FileText,
  Users,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { saveDietMapping } from '@/servers/mapping-diet.service';
import { toast } from 'sonner';

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

// Friendly category label
const KATEGORI_LABEL: Record<string, string> = {
  BENTUK_MAKANAN: 'Bentuk Makanan',
  DIIT: 'Kategori Diet / Diit',
  EXTRA: 'Extra Makanan',
  BUAH: 'Buah',
  SNACK: 'Snack',
};

interface SelectFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: KategoriMenuOption[];
  disabled?: boolean;
}

function SelectField({
  label,
  required,
  value,
  onChange,
  placeholder,
  options,
  disabled,
}: SelectFieldProps) {
  return (
    <div className='space-y-1.5'>
      <Label className='text-xs font-semibold text-foreground flex items-center gap-1'>
        {label}
        {required && <span className='text-rose-500 ml-0.5'>*</span>}
      </Label>
      <div className='relative'>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className='w-full h-9 rounded-lg border border-input bg-background px-3 pr-8 text-xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed'
        >
          <option value=''>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.kodeItem}>
              {opt.kodeItem} — {opt.labelItem}
            </option>
          ))}
        </select>
        <ChevronDown className='absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none' />
      </div>
    </div>
  );
}

export default function MappingDietDialog({
  item,
  options,
  open,
  onOpenChange,
  onSuccess,
}: MappingDietDialogProps) {
  const [bentukMakanan, setBentukMakanan] = useState('');
  const [kategoriDiet, setKategoriDiet] = useState('');
  const [extra, setExtra] = useState('');
  const [buah, setBuah] = useState('');
  const [snack, setSnack] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grouped = useMemo(() => groupByKategori(options), [options]);

  // Pre-fill on item change
  useEffect(() => {
    if (item) {
      setBentukMakanan(item.bentuk_makanan ?? '');
      setKategoriDiet(item.kategori_diet ?? '');
      setExtra(item.extra ?? '');
      setBuah(item.buah ?? '');
      setSnack(item.snack ?? '');
    }
  }, [item]);

  function handleReset() {
    setBentukMakanan('');
    setKategoriDiet('');
    setExtra('');
    setBuah('');
    setSnack('');
  }

  async function handleSubmit() {
    if (!item) return;
    if (!bentukMakanan || !kategoriDiet) {
      toast.error('Bentuk Makanan dan Kategori Diet wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveDietMapping({
        diet_rs_raw: item.diet_rs_raw,
        bentuk_makanan: bentukMakanan,
        kategori_diet: kategoriDiet,
        extra: extra || undefined,
        buah: buah || undefined,
        snack: snack || undefined,
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
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!item) return null;

  const isEdit = item.status_mapping !== 'UNMAPPED';

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

        <div className='space-y-5 py-2'>
          {/* Diet Raw Info */}
          <div className='bg-muted/40 p-3.5 rounded-xl border space-y-2'>
            <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider'>
              Diet RS Raw (Free Text Dokter / Perawat)
            </p>
            <p className='font-mono text-sm font-bold text-foreground bg-background px-3 py-2 rounded-lg border'>
              {item.diet_rs_raw}
            </p>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Users className='w-3.5 h-3.5' />
              <span>
                Mempengaruhi{' '}
                <strong className='text-foreground'>
                  {item.jumlah_pasien} pasien
                </strong>{' '}
                aktif
              </span>
            </div>
          </div>

          {/* Info Banner */}
          <div className='flex items-start gap-2 bg-blue-500/5 p-3 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200'>
            <AlertTriangle className='w-4 h-4 text-blue-500 shrink-0 mt-0.5' />
            <p>
              Mapping ini akan digunakan untuk standarisasi diet pada laporan
              dan etiket katering. Wajib minimal isi{' '}
              <strong>Bentuk Makanan</strong> dan{' '}
              <strong>Kategori Diet</strong>.
            </p>
          </div>

          {/* Mapping Form Fields */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* Bentuk Makanan — Required */}
            <SelectField
              label={KATEGORI_LABEL['BENTUK_MAKANAN']}
              required
              value={bentukMakanan}
              onChange={setBentukMakanan}
              placeholder='Pilih bentuk makanan...'
              options={grouped['BENTUK_MAKANAN'] ?? []}
            />

            {/* Kategori Diet — Required */}
            <SelectField
              label={KATEGORI_LABEL['DIIT']}
              required
              value={kategoriDiet}
              onChange={setKategoriDiet}
              placeholder='Pilih kategori diet...'
              options={grouped['DIIT'] ?? []}
            />

            {/* Extra — Optional */}
            <SelectField
              label={KATEGORI_LABEL['EXTRA'] + ' (Opsional)'}
              value={extra}
              onChange={setExtra}
              placeholder='Pilih extra makanan...'
              options={grouped['EXTRA'] ?? []}
            />

            {/* Buah — Optional */}
            <SelectField
              label={KATEGORI_LABEL['BUAH'] + ' (Opsional)'}
              value={buah}
              onChange={setBuah}
              placeholder='Pilih buah...'
              options={grouped['BUAH'] ?? []}
            />

            {/* Snack — Optional */}
            <SelectField
              label={KATEGORI_LABEL['SNACK'] + ' (Opsional)'}
              value={snack}
              onChange={setSnack}
              placeholder='Pilih snack...'
              options={grouped['SNACK'] ?? []}
            />
          </div>

          {/* Preview Hasil Mapping */}
          {(bentukMakanan || kategoriDiet) && (
            <div className='bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-2'>
              <p className='text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider'>
                Preview Mapping Hasil
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {bentukMakanan && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200'>
                    {bentukMakanan}
                  </span>
                )}
                {kategoriDiet && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200'>
                    {kategoriDiet}
                  </span>
                )}
                {extra && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200'>
                    +{extra}
                  </span>
                )}
                {buah && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200'>
                    🍊 {buah}
                  </span>
                )}
                {snack && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200'>
                    🍪 {snack}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='gap-2 flex-wrap pt-2 border-t'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleReset}
            disabled={isSubmitting}
            className='text-xs text-muted-foreground'
          >
            Reset Form
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            size='sm'
            onClick={handleSubmit}
            disabled={isSubmitting || !bentukMakanan || !kategoriDiet}
            className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground'
          >
            <Save className='w-4 h-4' />
            {isSubmitting ? 'Menyimpan...' : 'Simpan Mapping'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
