'use client';

import React, { useState, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, ChevronDown, Layers, AlertTriangle } from 'lucide-react';
import { bulkSaveDietMapping } from '@/servers/mapping-diet.service';
import { toast } from 'sonner';

interface MappingDietBulkDialogProps {
  selectedRaws: string[];
  options: KategoriMenuOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

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

const KATEGORI_LABEL: Record<string, string> = {
  BENTUK_MAKANAN: 'Bentuk Makanan',
  DIIT: 'Kategori Diet',
  EXTRA: 'Extra',
  BUAH: 'Buah',
  SNACK: 'Snack',
};

export default function MappingDietBulkDialog({
  selectedRaws,
  options,
  open,
  onOpenChange,
  onSuccess,
}: MappingDietBulkDialogProps) {
  const [bentukMakanan, setBentukMakanan] = useState('');
  const [kategoriDiet, setKategoriDiet] = useState('');
  const [extra, setExtra] = useState('');
  const [buah, setBuah] = useState('');
  const [snack, setSnack] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grouped = useMemo(() => groupByKategori(options), [options]);

  async function handleSubmit() {
    if (!bentukMakanan || !kategoriDiet) {
      toast.error('Bentuk Makanan dan Kategori Diet wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bulkSaveDietMapping(selectedRaws, {
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
        setBentukMakanan('');
        setKategoriDiet('');
        setExtra('');
        setBuah('');
        setSnack('');
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

  return (
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
            Terapkan nilai mapping yang sama untuk semua diet RS yang dipilih.
          </DialogDescription>
        </DialogHeader>

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
                  title={raw}
                >
                  {raw}
                </span>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className='flex items-start gap-2 bg-amber-500/5 p-3 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200'>
            <AlertTriangle className='w-4 h-4 text-amber-500 shrink-0 mt-0.5' />
            <p>
              Nilai mapping ini akan diterapkan ke{' '}
              <strong>semua {selectedRaws.length} diet</strong> yang dipilih.
              Gunakan fitur ini hanya jika semua item memiliki pola diet yang
              sama.
            </p>
          </div>

          {/* Mapping Fields */}
          <div className='grid grid-cols-1 gap-3.5'>
            {/* Bentuk Makanan */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                Bentuk Makanan <span className='text-rose-500'>*</span>
              </Label>
              <div className='relative'>
                <select
                  value={bentukMakanan}
                  onChange={(e) => setBentukMakanan(e.target.value)}
                  className='w-full h-9 rounded-lg border border-input bg-background px-3 pr-8 text-xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20'
                >
                  <option value=''>Pilih bentuk makanan...</option>
                  {(grouped['BENTUK_MAKANAN'] ?? []).map((opt) => (
                    <option key={opt.id} value={opt.kodeItem}>
                      {opt.kodeItem} — {opt.labelItem}
                    </option>
                  ))}
                </select>
                <ChevronDown className='absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none' />
              </div>
            </div>

            {/* Kategori Diet */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                {KATEGORI_LABEL['DIIT']} <span className='text-rose-500'>*</span>
              </Label>
              <div className='relative'>
                <select
                  value={kategoriDiet}
                  onChange={(e) => setKategoriDiet(e.target.value)}
                  className='w-full h-9 rounded-lg border border-input bg-background px-3 pr-8 text-xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20'
                >
                  <option value=''>Pilih kategori diet...</option>
                  {(grouped['DIIT'] ?? []).map((opt) => (
                    <option key={opt.id} value={opt.kodeItem}>
                      {opt.kodeItem} — {opt.labelItem}
                    </option>
                  ))}
                </select>
                <ChevronDown className='absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none' />
              </div>
            </div>

            <div className='grid grid-cols-3 gap-2'>
              {/* Extra */}
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold text-foreground'>
                  Extra
                </Label>
                <div className='relative'>
                  <select
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    className='w-full h-9 rounded-lg border border-input bg-background px-2 pr-7 text-xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20'
                  >
                    <option value=''>-</option>
                    {(grouped['EXTRA'] ?? []).map((opt) => (
                      <option key={opt.id} value={opt.kodeItem}>
                        {opt.kodeItem}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none' />
                </div>
              </div>
              {/* Buah */}
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold text-foreground'>
                  Buah
                </Label>
                <div className='relative'>
                  <select
                    value={buah}
                    onChange={(e) => setBuah(e.target.value)}
                    className='w-full h-9 rounded-lg border border-input bg-background px-2 pr-7 text-xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20'
                  >
                    <option value=''>-</option>
                    {(grouped['BUAH'] ?? []).map((opt) => (
                      <option key={opt.id} value={opt.kodeItem}>
                        {opt.kodeItem}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none' />
                </div>
              </div>
              {/* Snack */}
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold text-foreground'>
                  Snack
                </Label>
                <div className='relative'>
                  <select
                    value={snack}
                    onChange={(e) => setSnack(e.target.value)}
                    className='w-full h-9 rounded-lg border border-input bg-background px-2 pr-7 text-xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20'
                  >
                    <option value=''>-</option>
                    {(grouped['SNACK'] ?? []).map((opt) => (
                      <option key={opt.id} value={opt.kodeItem}>
                        {opt.kodeItem}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none' />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2 flex-wrap pt-2 border-t'>
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
            {isSubmitting
              ? 'Menyimpan...'
              : `Simpan ${selectedRaws.length} Mapping`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
