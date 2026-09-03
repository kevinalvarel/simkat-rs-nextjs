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
import { Badge } from '@/components/ui/badge';
import { Save, Layers, AlertTriangle, Loader2 } from 'lucide-react';
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

function groupByKategori(
  options: KategoriMenuOption[],
): Record<string, KategoriMenuOption[]> {
  return options.reduce(
    (acc, opt) => {
      const key = opt.namaKategori.trim().toUpperCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(opt);
      return acc;
    },
    {} as Record<string, KategoriMenuOption[]>,
  );
}

export default function MappingDietBulkDialog({
  selectedRaws,
  options,
  open,
  onOpenChange,
  onSuccess,
}: MappingDietBulkDialogProps) {
  const [mode, setMode] = useState<'STANDARD' | 'NPO' | 'KATERING'>('STANDARD');
  const [karbo, setKarbo] = useState('');
  const [hewani, setHewani] = useState('');
  const [nabati, setNabati] = useState('');
  const [sayur, setSayur] = useState('');
  const [buah, setBuah] = useState('');
  const [snack, setSnack] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grouped = useMemo(() => groupByKategori(options), [options]);

  const karboOptions = grouped['KARBO'] ?? grouped['BENTUK_MAKANAN'] ?? [];
  const hewaniOptions = grouped['HEWANI'] ?? grouped['DIIT'] ?? [];
  const nabatiOptions = grouped['NABATI'] ?? grouped['EXTRA'] ?? [];
  const sayurOptions = grouped['SAYUR'] ?? [];
  const buahOptions = grouped['BUAH'] ?? [];
  const snackOptions = grouped['SNACK'] ?? [];

  function handleModeChange(newMode: 'STANDARD' | 'NPO' | 'KATERING') {
    setMode(newMode);
    if (newMode === 'NPO') {
      setKarbo('NPO');
      setHewani('NPO');
      setNabati('NPO');
      setSayur('NPO');
      setBuah('NPO');
      setSnack('NPO');
    } else if (newMode === 'KATERING') {
      setKarbo('KATERING');
      setHewani('KATERING');
      setNabati('');
      setSayur('');
      setBuah('');
      setSnack('');
    } else {
      setKarbo('');
      setHewani('');
      setNabati('');
      setSayur('');
      setBuah('');
      setSnack('');
    }
  }

  function handlePreSubmit() {
    if (mode === 'STANDARD') {
      if (!karbo || !hewani) {
        toast.error('Karbohidrat dan Lauk Hewani wajib diisi untuk mapping standar.');
        return;
      }
    }
    setIsConfirmOpen(true);
  }

  async function handleFinalSave() {
    setIsSubmitting(true);
    try {
      const extraCombined = [nabati, sayur].filter(Boolean).join(', ');

      const res = await bulkSaveDietMapping(selectedRaws, {
        mode,
        status_mapping: mode === 'KATERING' ? 'KATERING' : undefined,
        bentuk_makanan: karbo || null,
        kategori_diet: hewani || null,
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
        setMode('STANDARD');
        setKarbo('');
        setHewani('');
        setNabati('');
        setSayur('');
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
            Terapkan nilai mapping dari Master Konfigurasi Menu untuk semua diet RS yang dipilih.
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

          {/* Mode Switcher */}
          <div className='space-y-1.5'>
            <label className='text-xs font-bold text-foreground block'>
              Pilih Mode Mapping Massal:
            </label>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
              <button
                type='button'
                onClick={() => handleModeChange('STANDARD')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                  mode === 'STANDARD'
                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                    : 'border-border bg-background hover:bg-muted/40'
                }`}
              >
                <div className='flex items-center gap-1.5 font-bold text-foreground text-xs'>
                  <Utensils className='w-3.5 h-3.5 text-primary' />
                  <span>Menu Standar</span>
                </div>
                <p className='text-[10px] text-muted-foreground'>
                  Pilih kategori menu siklus
                </p>
              </button>

              <button
                type='button'
                onClick={() => handleModeChange('NPO')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                  mode === 'NPO'
                    ? 'border-purple-600 bg-purple-500/15 shadow-xs ring-1 ring-purple-600 text-purple-950 dark:text-purple-200'
                    : 'border-border bg-background hover:bg-purple-500/5'
                }`}
              >
                <div className='flex items-center gap-1.5 font-bold text-xs text-purple-700 dark:text-purple-300'>
                  <Sparkles className='w-3.5 h-3.5' />
                  <span>NPO / Puasa</span>
                </div>
                <p className='text-[10px] text-muted-foreground'>
                  Semua kriteria otomatis NPO
                </p>
              </button>

              <button
                type='button'
                onClick={() => handleModeChange('KATERING')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                  mode === 'KATERING'
                    ? 'border-blue-600 bg-blue-500/15 shadow-xs ring-1 ring-blue-600 text-blue-950 dark:text-blue-200'
                    : 'border-border bg-background hover:bg-blue-500/5'
                }`}
              >
                <div className='flex items-center gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-300'>
                  <Send className='w-3.5 h-3.5' />
                  <span>AG Katering</span>
                </div>
                <p className='text-[10px] text-muted-foreground'>
                  Alihkan ke Live Katering
                </p>
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className='flex items-start gap-2 bg-amber-500/5 p-3 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200'>
            <AlertTriangle className='w-4 h-4 text-amber-500 shrink-0 mt-0.5' />
            <p>
              Nilai mapping ini akan diterapkan ke{' '}
              <strong>semua {selectedRaws.length} diet</strong> yang dipilih.
            </p>
          </div>

          {/* Mapping Fields */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${
              mode !== 'STANDARD' ? 'opacity-70 pointer-events-none' : ''
            }`}
          >
            {/* 1. KARBO */}
            <SelectField
              label={KATEGORI_LABEL['KARBO']}
              required={mode === 'STANDARD'}
              value={karbo}
              onChange={setKarbo}
              placeholder='Pilih Karbohidrat...'
              options={karboOptions}
              disabled={mode !== 'STANDARD'}
            />

            {/* 2. HEWANI */}
            <SelectField
              label={KATEGORI_LABEL['HEWANI']}
              required={mode === 'STANDARD'}
              value={hewani}
              onChange={setHewani}
              placeholder='Pilih Lauk Hewani...'
              options={hewaniOptions}
              disabled={mode !== 'STANDARD'}
            />

            {/* 3. NABATI */}
            <SelectField
              label={KATEGORI_LABEL['NABATI'] + ' (Opsional)'}
              value={nabati}
              onChange={setNabati}
              placeholder='Pilih Lauk Nabati...'
              options={nabatiOptions}
              disabled={mode !== 'STANDARD'}
            />

            {/* 4. SAYUR */}
            <SelectField
              label={KATEGORI_LABEL['SAYUR'] + ' (Opsional)'}
              value={sayur}
              onChange={setSayur}
              placeholder='Pilih Sayur...'
              options={sayurOptions}
              disabled={mode !== 'STANDARD'}
            />

            {/* 5. BUAH */}
            <SelectField
              label={KATEGORI_LABEL['BUAH'] + ' (Opsional)'}
              value={buah}
              onChange={setBuah}
              placeholder='Pilih Buah...'
              options={buahOptions}
              disabled={mode !== 'STANDARD'}
            />

            {/* 6. SNACK */}
            <SelectField
              label={KATEGORI_LABEL['SNACK'] + ' (Opsional)'}
              value={snack}
              onChange={setSnack}
              placeholder='Pilih Snack...'
              options={snackOptions}
              disabled={mode !== 'STANDARD'}
            />
          </div>
        </div>

        <DialogFooter className='gap-2 flex-wrap pt-2 border-t'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className='text-xs'
          >
            Batal
          </Button>
          <Button
            size='sm'
            onClick={handlePreSubmit}
            disabled={isSubmitting || (mode === 'STANDARD' && (!karbo || !hewani))}
            className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs'
          >
            <Save className='w-4 h-4' />
            Simpan {selectedRaws.length} Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <MappingDietConfirmDialog
      open={isConfirmOpen}
      onOpenChange={setIsConfirmOpen}
      diet_rs_raw={`${selectedRaws.length} Diet Terpilih (${selectedRaws.slice(0, 3).join(', ')}${selectedRaws.length > 3 ? '...' : ''})`}
      mode={mode}
      values={{
        karbo,
        hewani,
        nabati,
        sayur,
        buah,
        snack,
      }}
      jumlahPasien={selectedRaws.length}
      isSubmitting={isSubmitting}
      onConfirm={handleFinalSave}
    />
    </>
  );
}
