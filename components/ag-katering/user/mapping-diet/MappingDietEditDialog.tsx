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
import {
  Edit,
  Save,
  Layers,
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

export default function MappingDietEditDialog({
  open,
  onOpenChange,
  item,
  options,
  onSuccess,
}: MappingDietEditDialogProps) {
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
      setMode('NPO');
      setKarbo('NPO');
      setHewani('NPO');
      setNabati('NPO');
      setSayur('NPO');
      setBuah('NPO');
      setSnack('NPO');
    } else if (isKatering) {
      setMode('KATERING');
      setKarbo('KATERING');
      setHewani('KATERING');
      setNabati('');
      setSayur('');
      setBuah('');
      setSnack('');
    } else {
      setMode('STANDARD');
      setKarbo(item.bentuk_makanan ?? '');
      setHewani(item.kategori_diet ?? '');
      setNabati(initNabati);
      setSayur(initSayur);
      setBuah(item.buah ?? '');
      setSnack(item.snack ?? '');
    }
  }, [item, open]);

  // Handle Mode Switch
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
      // Return to standard values
      if (karbo === 'NPO' || karbo === 'KATERING') setKarbo(item?.bentuk_makanan || '');
      if (hewani === 'NPO' || hewani === 'KATERING') setHewani(item?.kategori_diet || '');
      if (nabati === 'NPO') setNabati(item?.nabati || '');
      if (sayur === 'NPO') setSayur(item?.sayur || '');
      if (buah === 'NPO') setBuah(item?.buah || '');
      if (snack === 'NPO') setSnack(item?.snack || '');
    }
  }

  function handlePreSubmit() {
    if (!item) return;

    if (mode === 'STANDARD') {
      if (!karbo.trim() || !hewani.trim()) {
        toast.error('Karbohidrat dan Lauk Hewani wajib diisi untuk mapping standar.');
        return;
      }
    }

    // Open confirmation dialog
    setIsConfirmOpen(true);
  }

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
              Tentukan kategori katering, otomatisasi NPO, atau alihkan ke Live
              Katering untuk diet ini.
            </DialogDescription>
          </DialogHeader>

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
                    Pilih per kategori menu siklus dapur umum.
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
                  <span className='font-mono font-bold'>NPO</span>. Pasien ini
                  tidak memotong stok produksi makanan utama.
                </p>
              </div>
            )}

            {mode === 'KATERING' && (
              <div className='flex items-start gap-2.5 p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs'>
                <Info className='w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5' />
                <p>
                  <strong>Mode Alihkan ke AG Katering Aktif:</strong> Diet ini
                  (mis. Bubur Saring, Sonde, Cair RS) tidak masuk ke laporan
                  produksi dapur umum, melainkan langsung diteruskan ke halaman{' '}
                  <strong>Live Katering (/overview/katering)</strong> menggunakan
                  raw text aslinya.
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
          </div>

          <DialogFooter className='gap-2 flex-wrap pt-3 border-t'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onOpenChange(false)}
              className='text-xs'
            >
              Batal
            </Button>
            <Button
              size='sm'
              onClick={handlePreSubmit}
              disabled={mode === 'STANDARD' && (!karbo || !hewani)}
              className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-xs'
            >
              <Save className='w-4 h-4' />
              Simpan Mapping
            </Button>
          </DialogFooter>
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
