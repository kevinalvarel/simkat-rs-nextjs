'use client';

import React from 'react';
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
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
} from 'lucide-react';

import type { ReadyDietRow } from './MappingDietFloatingBar';

export interface MappingDietConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diet_rs_raw: string;
  mode: 'STANDARD' | 'NPO' | 'KATERING';
  values?: {
    karbo: string;
    hewani: string;
    nabati: string;
    sayur: string;
    buah: string;
    snack: string;
  };
  items?: ReadyDietRow[];
  jumlahPasien?: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export default function MappingDietConfirmDialog({
  open,
  onOpenChange,
  diet_rs_raw,
  mode,
  values = {
    karbo: '',
    hewani: '',
    nabati: '',
    sayur: '',
    buah: '',
    snack: '',
  },
  items,
  jumlahPasien = 0,
  isSubmitting,
  onConfirm,
}: MappingDietConfirmDialogProps) {
  const isMulti = Boolean(items && items.length > 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto p-6'>
        <DialogHeader className='gap-1 border-b pb-4'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='font-mono text-[10px] bg-muted/60'
            >
              KONFIRMASI MAPPING
            </Badge>
            {isMulti ? (
              <Badge className='bg-primary text-primary-foreground text-[10px] font-bold'>
                {items!.length} ITEM SEKALIGUS
              </Badge>
            ) : mode === 'NPO' ? (
              <Badge className='bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold'>
                NPO / PUASA
              </Badge>
            ) : mode === 'KATERING' ? (
              <Badge className='bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold'>
                ALIHKAN KE AG KATERING
              </Badge>
            ) : (
              <Badge variant='secondary' className='text-[10px] font-bold'>
                MENU STANDAR
              </Badge>
            )}
          </div>
          <DialogTitle className='text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mt-1'>
            <HelpCircle className='w-5 h-5 text-primary' />
            Konfirmasi Simpan Mapping Diet
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            {isMulti
              ? `Tinjau ${items!.length} pemetaan diet sebelum disimpan permanen ke Master Mapping.`
              : 'Tinjau pemetaan diet pasien sebelum disimpan permanen ke Master Mapping.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2 text-xs'>
          {/* Target Raw Text Banner */}
          {!isMulti ? (
            <div className='p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900/50 space-y-1.5'>
              <span className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
                Diet RS Raw Target:
              </span>
              <div className='flex items-center justify-between gap-2 flex-wrap'>
                <span className='font-mono text-sm font-bold text-foreground bg-background px-2.5 py-1 rounded-md border'>
                  {diet_rs_raw}
                </span>
                {jumlahPasien > 0 && (
                  <span className='text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900'>
                    Dipakai {jumlahPasien} pasien aktif
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className='border rounded-xl p-3 bg-muted/20 space-y-2'>
              <span className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
                Daftar Diet yang Akan Disimpan ({items!.length} item):
              </span>
              <div className='max-h-56 overflow-y-auto divide-y rounded-lg border bg-background text-xs'>
                {items!.map((it) => (
                  <div key={it.diet_rs_raw} className='p-2.5 flex items-center justify-between gap-2'>
                    <div className='min-w-0'>
                      <div className='font-mono font-bold text-foreground truncate'>
                        {it.diet_rs_raw}
                      </div>
                      <div className='text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5'>
                        <span>Karbo: <strong>{it.karbo}</strong></span>
                        <span>•</span>
                        <span>Hewani: <strong>{it.hewani}</strong></span>
                        {it.sayur && <span>• Sayur: {it.sayur}</span>}
                      </div>
                    </div>
                    {it.karbo === 'NPO' ? (
                      <Badge className='text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'>
                        NPO
                      </Badge>
                    ) : it.karbo === 'KATERING' ? (
                      <Badge className='text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'>
                        AG KATERING
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='text-[10px] font-mono'>
                        LENGKAP
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode-specific explanations */}
          {!isMulti && mode === 'NPO' && (
            <div className='p-3.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-500/10 text-purple-950 dark:text-purple-200 space-y-1.5'>
              <div className='flex items-center gap-2 font-bold text-xs text-purple-800 dark:text-purple-300'>
                <Sparkles className='w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0' />
                <span>Otomatisasi Kriteria NPO (Puasa)</span>
              </div>
              <p className='text-[11px] leading-relaxed text-purple-900/90 dark:text-purple-200/90'>
                Semua jenis kriteria (<strong>Karbo, Hewani, Nabati, Sayur, Buah, Snack</strong>) akan otomatis dipetakan sebagai <strong>NPO</strong>. Pasien dengan diet ini tidak akan mendapatkan porsi makanan reguler di dapur produksi.
              </p>
            </div>
          )}

          {!isMulti && mode === 'KATERING' && (
            <div className='p-3.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-500/10 text-blue-950 dark:text-blue-200 space-y-1.5'>
              <div className='flex items-center gap-2 font-bold text-xs text-blue-800 dark:text-blue-300'>
                <Send className='w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0' />
                <span>Dialihkan ke AG Katering (Bukan Produksi Dapur Umum)</span>
              </div>
              <p className='text-[11px] leading-relaxed text-blue-900/90 dark:text-blue-200/90'>
                Diet ini (misal <em>Bubur Saring, Sonde, dll.</em>) tidak masuk ke alur masak produksi harian dapur umum, melainkan langsung diteruskan ke halaman <strong>Live Katering (/overview/katering)</strong> menggunakan raw text aslinya.
              </p>
            </div>
          )}

          {!isMulti && mode === 'STANDARD' && (
            <div className='border rounded-xl p-3 bg-muted/20 space-y-2.5'>
              <p className='text-[11px] font-bold text-muted-foreground uppercase tracking-wider'>
                Rincian Kategori yang Akan Disimpan:
              </p>
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs'>
                <div className='p-2 rounded-lg bg-background border'>
                  <span className='text-[10px] text-muted-foreground block'>Karbohidrat:</span>
                  <span className='font-mono font-bold text-foreground truncate block'>
                    {values.karbo || '-'}
                  </span>
                </div>
                <div className='p-2 rounded-lg bg-background border'>
                  <span className='text-[10px] text-muted-foreground block'>Lauk Hewani:</span>
                  <span className='font-mono font-bold text-foreground truncate block'>
                    {values.hewani || '-'}
                  </span>
                </div>
                <div className='p-2 rounded-lg bg-background border'>
                  <span className='text-[10px] text-muted-foreground block'>Lauk Nabati:</span>
                  <span className='font-mono font-semibold text-foreground truncate block'>
                    {values.nabati || '-'}
                  </span>
                </div>
                <div className='p-2 rounded-lg bg-background border'>
                  <span className='text-[10px] text-muted-foreground block'>Sayur:</span>
                  <span className='font-mono font-semibold text-foreground truncate block'>
                    {values.sayur || '-'}
                  </span>
                </div>
                <div className='p-2 rounded-lg bg-background border'>
                  <span className='text-[10px] text-muted-foreground block'>Buah:</span>
                  <span className='font-mono font-semibold text-foreground truncate block'>
                    {values.buah || '-'}
                  </span>
                </div>
                <div className='p-2 rounded-lg bg-background border'>
                  <span className='text-[10px] text-muted-foreground block'>Snack:</span>
                  <span className='font-mono font-semibold text-foreground truncate block'>
                    {values.snack || '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className='flex items-start gap-2 text-muted-foreground text-[11px] bg-muted/40 p-2.5 rounded-lg'>
            <AlertTriangle className='w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5' />
            <span>
              Perubahan akan langsung disinkronkan secara real-time ke monitoring pemorsian dan cetak etiket.
            </span>
          </div>
        </div>

        <DialogFooter className='gap-2 flex-wrap pt-2 border-t'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className='text-xs'
          >
            Batal
          </Button>
          <Button
            type='button'
            size='sm'
            onClick={onConfirm}
            disabled={isSubmitting}
            className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='w-3.5 h-3.5 animate-spin' />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className='w-3.5 h-3.5' />
                Ya, Simpan Mapping
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
