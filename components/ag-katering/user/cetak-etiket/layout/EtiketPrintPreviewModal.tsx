'use client';

import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Printer,
  Tag,
  Quote,
  Utensils,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import type { EtiketData } from '@/types/pemorsiantypes';
import EtiketCard from '@/components/ag-katering/user/cetak-etiket/layout/EtiketCard';

interface EtiketPrintPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etiketList: EtiketData[];
  title?: string;
  onPrintSuccess?: () => void;
}

const DEFAULT_QUOTE = 'Setiap suapan adalah langkah menuju sehat';
const DEFAULT_NOTICE = '*Alat makan diambil 1 jam setelah pengantaran';

const QUOTE_PRESETS = [
  'Setiap suapan adalah langkah menuju sehat',
  'Semoga lekas sembuh & sehat selalu',
  'Selamat menikmati hidangan bernutrisi',
  'Makanan sehat untuk pemulihan optimal',
];

const NOTICE_PRESETS = [
  '*Alat makan diambil 1 jam setelah pengantaran',
  '*Alat makan diambil 30 menit setelah pengantaran',
  '*Alat makan diambil 2 jam setelah pengantaran',
  '*Harap kembalikan alat makan ke troli gizi',
];

export default function EtiketPrintPreviewModal({
  open,
  onOpenChange,
  etiketList,
  title,
  onPrintSuccess,
}: EtiketPrintPreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Customization States
  const [customQuote, setCustomQuote] = useState<string>(DEFAULT_QUOTE);
  const [customNotice, setCustomNotice] = useState<string>(DEFAULT_NOTICE);
  const [printMargin, setPrintMargin] = useState<number>(3); // 3mm default safe margin

  const isBatch = etiketList && etiketList.length > 1;
  const modalTitle =
    title ||
    (isBatch
      ? `Cetak ${etiketList?.length || 0} Etiket Makan`
      : `Cetak Etiket Makan - ${etiketList?.[0]?.nama || ''}`);

  const triggerReactPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: modalTitle,
    onAfterPrint: () => {
      onPrintSuccess?.();
    },

    pageStyle: `
      @page {
        size: auto;
        margin: ${printMargin}mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: Arial, Helvetica, sans-serif !important;
        }
        .etiket-container-print {
          display: block !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .etiket-card-print {
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          position: relative !important;
          width: 96mm !important;
          max-width: 98mm !important;
          min-height: 56mm !important;
          padding: 3mm 3.5mm !important;
          margin: 2.5mm auto !important;
          border: 1.5px solid #000000 !important;
          border-radius: 2px !important;
          background-color: #ffffff !important;
          color: #000000 !important;
          page-break-inside: avoid !important;
          page-break-after: always !important;
          break-inside: avoid !important;
          break-after: page !important;
          box-sizing: border-box !important;
          box-shadow: none !important;
          overflow: hidden !important;
        }
        .etiket-card-print * {
          outline: none !important;
          box-shadow: none !important;
        }
        .etiket-card-print h2 {
          font-size: 10.5pt !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        .etiket-card-print table {
          font-size: 8pt !important;
          line-height: 1.25 !important;
        }
        .etiket-card-print td {
          padding: 1mm 1.5mm !important;
        }
        .etiket-card-print span,
        .etiket-card-print div,
        .etiket-card-print p {
          font-size: 8pt !important;
          line-height: 1.2 !important;
        }
      }
    `,
  });

  if (!etiketList || etiketList.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[94vh] flex flex-col p-0 overflow-hidden'>
        {/* 1. Modal Header */}
        <DialogHeader className='px-6 py-3.5 border-b bg-muted/20'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <DialogTitle className='text-base sm:text-lg font-bold flex items-center gap-2 text-foreground'>
                <Tag className='w-5 h-5 text-primary' />
                {modalTitle}
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                {isBatch
                  ? `Pratinjau cetak untuk ${etiketList.length} pasien. Sesuaikan teks quotes, catatan alat makan, dan margin sebelum mencetak.`
                  : 'Pratinjau cetak etiket makan pasien sesuai standar penyajian katering RS.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 2. Customization Controls Section (Quotes, Catatan Alat, Margin) */}
        <div className='px-6 py-3 border-b bg-card/60 space-y-3 shrink-0'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3.5'>
            {/* Input Quotes / Pesan Motivasi */}
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <Label
                  htmlFor='input-quote'
                  className='text-xs font-semibold flex items-center gap-1.5 text-foreground'
                >
                  <Quote className='w-3.5 h-3.5 text-amber-500' />
                  Quotes / Pesan Motivasi di Etiket
                </Label>
                {customQuote !== DEFAULT_QUOTE && (
                  <button
                    type='button'
                    onClick={() => setCustomQuote(DEFAULT_QUOTE)}
                    className='text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer'
                    title='Kembalikan ke quotes awal'
                  >
                    <RotateCcw className='w-3 h-3' /> Reset
                  </button>
                )}
              </div>
              <Input
                id='input-quote'
                value={customQuote}
                onChange={(e) => setCustomQuote(e.target.value)}
                placeholder='Tulis pesan/quotes motivasi...'
                className='h-8 text-xs bg-background'
              />
              {/* Preset Chips */}
              <div className='flex flex-wrap gap-1 pt-0.5'>
                {QUOTE_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type='button'
                    onClick={() => setCustomQuote(preset)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer truncate max-w-[200px] ${
                      customQuote === preset
                        ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold dark:bg-amber-950 dark:text-amber-200'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted border-border'
                    }`}
                    title={preset}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Catatan Pengambilan Alat Makan */}
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <Label
                  htmlFor='input-notice'
                  className='text-xs font-semibold flex items-center gap-1.5 text-foreground'
                >
                  <Utensils className='w-3.5 h-3.5 text-blue-500' />
                  Catatan Pengambilan Alat Makan
                </Label>
                {customNotice !== DEFAULT_NOTICE && (
                  <button
                    type='button'
                    onClick={() => setCustomNotice(DEFAULT_NOTICE)}
                    className='text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer'
                    title='Kembalikan ke catatan awal'
                  >
                    <RotateCcw className='w-3 h-3' /> Reset
                  </button>
                )}
              </div>
              <Input
                id='input-notice'
                value={customNotice}
                onChange={(e) => setCustomNotice(e.target.value)}
                placeholder='Contoh: *Alat makan diambil 1 jam setelah pengantaran'
                className='h-8 text-xs bg-background'
              />
              {/* Preset Chips */}
              <div className='flex flex-wrap gap-1 pt-0.5'>
                {NOTICE_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type='button'
                    onClick={() => setCustomNotice(preset)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer truncate max-w-[200px] ${
                      customNotice === preset
                        ? 'bg-blue-100 text-blue-900 border-blue-300 font-semibold dark:bg-blue-950 dark:text-blue-200'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted border-border'
                    }`}
                    title={preset}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sub Row: Pengaturan Margin Cetak */}
          <div className='flex items-center justify-between pt-1 border-t border-border/50 text-xs'>
            <div className='flex items-center gap-2'>
              <Sliders className='w-3.5 h-3.5 text-muted-foreground' />
              <span className='text-xs text-muted-foreground font-medium'>
                Margin Cetak:
              </span>
              <div className='flex items-center gap-1'>
                {[
                  { label: 'Tipis (1.5mm)', val: 1.5 },
                  { label: 'Normal (3mm)', val: 3 },
                  { label: 'Lebar (5mm)', val: 5 },
                ].map((m) => (
                  <button
                    key={m.val}
                    type='button'
                    onClick={() => setPrintMargin(m.val)}
                    className={`px-2 py-0.5 text-[11px] rounded-md transition-all cursor-pointer ${
                      printMargin === m.val
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className='text-[11px] text-muted-foreground hidden sm:block'>
              Perubahan teks otomatis diterapkan ke semua kartu etiket.
            </div>
          </div>
        </div>

        {/* 3. Preview Scrollable Body */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40'>
          <div
            ref={printRef}
            className='etiket-container-print flex flex-wrap justify-center gap-5 sm:gap-6'
          >
            {etiketList.map((item, idx) => (
              <div key={idx} className='flex justify-center'>
                <EtiketCard
                  data={item}
                  customQuote={customQuote}
                  customNotice={customNotice}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 4. Modal Footer */}
        <DialogFooter className='px-6 py-3 border-t bg-card flex sm:justify-between items-center gap-2'>
          <div className='text-xs text-muted-foreground hidden sm:block'>
            Total: <strong>{etiketList.length}</strong> etiket siap cetak
          </div>

          <div className='flex items-center gap-2 w-full sm:w-auto justify-end'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onOpenChange(false)}
            >
              Tutup
            </Button>
            <Button
              size='sm'
              onClick={() => {
                triggerReactPrint();
                onPrintSuccess?.();
              }}
              className='gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold cursor-pointer'
            >
              <Printer className='w-4 h-4' />
              {isBatch
                ? `Cetak Sekarang (${etiketList.length})`
                : 'Cetak Sekarang'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

