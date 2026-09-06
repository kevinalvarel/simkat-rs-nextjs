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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Printer,
  Tag,
  Quote,
  Utensils,
  RotateCcw,
  Sliders,
  Sparkles,
  Layers,
  Calendar,
  Clock,
  Eye,
} from 'lucide-react';
import type { EtiketData, EtiketVariant } from '@/types/pemorsiantypes';
import EtiketCard from '@/components/ag-katering/user/cetak-etiket/layout/EtiketCard';

interface EtiketPrintPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etiketList: EtiketData[];
  title?: string;
  onPrintSuccess?: () => void;
}

const DEFAULT_HEADER_TITLE = 'ETIKET DIET PASIEN';
const DEFAULT_QUOTE = 'Setiap suapan adalah langkah menuju sehat';

const NOTICE_DEFAULT_V1 = '*Alat makan diambil 1 jam setelah pengantaran';
const NOTICE_DEFAULT_V2 =
  '*Makanan dikonsumsi maksimal 1 jam setelah disajikan';

const QUOTE_PRESETS = [
  'Setiap suapan adalah langkah menuju sehat',
  'Semoga lekas sembuh & sehat selalu',
  'Selamat menikmati hidangan bernutrisi',
  'Makanan sehat untuk pemulihan optimal',
];

const NOTICE_PRESETS_V1 = [
  '*Alat makan diambil 1 jam setelah pengantaran',
  '*Alat makan diambil 30 menit setelah pengantaran',
  '*Alat makan diambil 2 jam setelah pengantaran',
  '*Harap kembalikan alat makan ke troli gizi',
];

const NOTICE_PRESETS_V2 = [
  '*Makanan dikonsumsi maksimal 1 jam setelah disajikan',
  '*Makanan dikonsumsi maksimal 2 jam setelah disajikan',
  '*Sebaiknya dikonsumsi dalam keadaan hangat',
  '*Alat makan diambil 1 jam setelah pengantaran',
];

export default function EtiketPrintPreviewModal({
  open,
  onOpenChange,
  etiketList,
  title,
  onPrintSuccess,
}: EtiketPrintPreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Variant State: 'diet-focus' (Gambar 1) vs 'ruangan-focus' (Gambar 2)
  const [selectedVariant, setSelectedVariant] =
    useState<EtiketVariant>('diet-focus');

  // Customization States
  const [customHeaderTitle, setCustomHeaderTitle] =
    useState<string>(DEFAULT_HEADER_TITLE);
  const [customQuote, setCustomQuote] = useState<string>(DEFAULT_QUOTE);
  const [customNotice, setCustomNotice] = useState<string>(NOTICE_DEFAULT_V1);
  const [customDateLabel, setCustomDateLabel] = useState<string>('');
  const [customDateValue, setCustomDateValue] = useState<string>('');

  // Toggles
  const [showQuote, setShowQuote] = useState<boolean>(true);
  const [showNotice, setShowNotice] = useState<boolean>(true);
  const [showBedWithRuangan, setShowBedWithRuangan] = useState<boolean>(true);

  // Print Layout Margin
  const [printMargin, setPrintMargin] = useState<number>(3); // 3mm safe margin

  const isBatch = etiketList && etiketList.length > 1;
  const modalTitle =
    title ||
    (isBatch
      ? `Cetak ${etiketList?.length || 0} Etiket Makan`
      : `Cetak Etiket Makan - ${etiketList?.[0]?.nama || ''}`);

  // Handle variant change and sync natural notice default if untouched
  const handleVariantChange = (val: string) => {
    const newVariant = val as EtiketVariant;
    setSelectedVariant(newVariant);

    if (newVariant === 'diet-focus' && customNotice === NOTICE_DEFAULT_V2) {
      setCustomNotice(NOTICE_DEFAULT_V1);
    } else if (
      newVariant === 'ruangan-focus' &&
      customNotice === NOTICE_DEFAULT_V1
    ) {
      setCustomNotice(NOTICE_DEFAULT_V2);
    }
  };

  const activeNoticePresets =
    selectedVariant === 'diet-focus' ? NOTICE_PRESETS_V1 : NOTICE_PRESETS_V2;

  const defaultNoticeForActiveVariant =
    selectedVariant === 'diet-focus' ? NOTICE_DEFAULT_V1 : NOTICE_DEFAULT_V2;

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
          padding: 2.5mm 3.2mm !important;
          margin: 2mm auto !important;
          border: 1.2px solid #000000 !important;
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
          font-size: 10pt !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        .etiket-card-print h3 {
          font-size: 9.5pt !important;
          margin: 0 !important;
          line-height: 1.1 !important;
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
      <DialogContent className='sm:max-w-5xl max-h-[95vh] flex flex-col p-4 overflow-hidden'>
        {/* 1. Modal Header */}
        <DialogHeader className='px-6 py-3 border-b bg-muted/20'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <DialogTitle className='text-base sm:text-lg font-bold flex items-center gap-2 text-foreground'>
                <Tag className='w-5 h-5 text-primary' />
                {modalTitle}
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                {isBatch
                  ? `Pratinjau cetak untuk ${etiketList.length} pasien. Pilih varian desain dan sesuaikan teks sebelum mencetak.`
                  : 'Pratinjau cetak etiket makan pasien sesuai standar penyajian gizi rumah sakit.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 2. Customization Controls Section */}
        <div className='px-6 py-3 border-b bg-card/70 space-y-3 shrink-0 overflow-y-auto max-h-[36vh]'>
          {/* Row 1: Pemilihan Varian Desain (Shadcn Tabs) */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-border/50'>
            <div className='flex items-center gap-2'>
              <Layers className='w-4 h-4 text-primary shrink-0' />
              <div>
                <span className='text-xs font-bold text-foreground block'>
                  Varian Desain Etiket:
                </span>
                <span className='text-[11px] text-muted-foreground'>
                  {selectedVariant === 'diet-focus'
                    ? 'Varian 1: Subjudul Nama Diet dengan format garis pembatas'
                    : 'Varian 2: Subjudul Ruangan Pasien dengan 2 kolom titik dua sejajar'}
                </span>
              </div>
            </div>

            {/* Switcher Varian menggunakan Shadcn Tabs */}
            <Tabs
              value={selectedVariant}
              onValueChange={handleVariantChange}
              className='shrink-0'
            >
              <TabsList className='grid grid-cols-2 h-8'>
                <TabsTrigger value='diet-focus' className='text-xs px-3'>
                  Varian 1 (Fokus Diet)
                </TabsTrigger>
                <TabsTrigger value='ruangan-focus' className='text-xs px-3'>
                  Varian 2 (Fokus Ruangan)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Row 2: Kustomisasi Kalimat (Judul, Quotes, Catatan) */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            {/* Input Judul Header */}
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <Label
                  htmlFor='input-header-title'
                  className='text-xs font-semibold flex items-center gap-1 text-foreground'
                >
                  Judul Kop Etiket
                </Label>
                {customHeaderTitle !== DEFAULT_HEADER_TITLE && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => setCustomHeaderTitle(DEFAULT_HEADER_TITLE)}
                    className='h-5 w-5 text-muted-foreground hover:text-foreground'
                    title='Reset ke judul awal'
                  >
                    <RotateCcw className='w-3 h-3' />
                  </Button>
                )}
              </div>
              <Input
                id='input-header-title'
                value={customHeaderTitle}
                onChange={(e) => setCustomHeaderTitle(e.target.value)}
                placeholder='ETIKET DIET PASIEN'
                className='h-8 text-xs bg-background'
              />
              <span className='text-[10px] text-muted-foreground block truncate'>
                Default: ETIKET DIET PASIEN
              </span>
            </div>

            {/* Input Quotes Motivasi */}
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <Label
                  htmlFor='input-quote'
                  className='text-xs font-semibold flex items-center gap-1 text-foreground'
                >
                  <Quote className='w-3.5 h-3.5 text-amber-500' />
                  Quotes Motivasi
                </Label>
                {customQuote !== DEFAULT_QUOTE && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => setCustomQuote(DEFAULT_QUOTE)}
                    className='h-5 w-5 text-muted-foreground hover:text-foreground'
                    title='Reset quotes'
                  >
                    <RotateCcw className='w-3 h-3' />
                  </Button>
                )}
              </div>
              <Input
                id='input-quote'
                value={customQuote}
                onChange={(e) => setCustomQuote(e.target.value)}
                placeholder='Tulis kalimat quotes...'
                className='h-8 text-xs bg-background'
                disabled={!showQuote}
              />
              {/* Preset Chips */}
              <div className='flex flex-wrap gap-1 pt-0.5'>
                {QUOTE_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type='button'
                    onClick={() => setCustomQuote(preset)}
                    disabled={!showQuote}
                    className={`text-[9.5px] px-1.5 py-0.5 rounded border transition-all cursor-pointer truncate max-w-[140px] ${
                      customQuote === preset
                        ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold dark:bg-amber-950 dark:text-amber-200'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted border-border'
                    }`}
                    title={preset}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Catatan Alat / Makanan */}
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <Label
                  htmlFor='input-notice'
                  className='text-xs font-semibold flex items-center gap-1 text-foreground'
                >
                  <Utensils className='w-3.5 h-3.5 text-emerald-500' />
                  Catatan Tambahan
                </Label>
                {customNotice !== defaultNoticeForActiveVariant && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() =>
                      setCustomNotice(defaultNoticeForActiveVariant)
                    }
                    className='h-5 w-5 text-muted-foreground hover:text-foreground'
                    title='Reset catatan'
                  >
                    <RotateCcw className='w-3 h-3' />
                  </Button>
                )}
              </div>
              <Input
                id='input-notice'
                value={customNotice}
                onChange={(e) => setCustomNotice(e.target.value)}
                placeholder='Contoh: *Alat makan diambil 1 jam...'
                className='h-8 text-xs bg-background'
                disabled={!showNotice}
              />
              {/* Preset Chips */}
              <div className='flex flex-wrap gap-1 pt-0.5'>
                {activeNoticePresets.map((preset, i) => (
                  <button
                    key={i}
                    type='button'
                    onClick={() => setCustomNotice(preset)}
                    disabled={!showNotice}
                    className={`text-[9.5px] px-1.5 py-0.5 rounded border transition-all cursor-pointer truncate max-w-[140px] ${
                      customNotice === preset
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted border-border'
                    }`}
                    title={preset}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Pengaturan Format Waktu, Tanggal, dan Checkboxes */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-24 pt-1 border-t border-border/40 text-xs'>
            {/* Margin Cetak */}
            <div className='flex items-center gap-2'>
              <Sliders className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
              <span className='font-medium text-muted-foreground shrink-0'>
                Margin:
              </span>
              <div className='flex items-center gap-1'>
                {[
                  { label: '1.5mm', val: 1.5 },
                  { label: '3mm', val: 3 },
                  { label: '5mm', val: 5 },
                ].map((m) => (
                  <Button
                    key={m.val}
                    type='button'
                    size='sm'
                    variant={printMargin === m.val ? 'default' : 'outline'}
                    onClick={() => setPrintMargin(m.val)}
                    className='h-6 text-[11px] px-2'
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Checkbox Toggles: Quotes & Notice */}
            <div className='flex items-center gap-3 justify-end flex-wrap'>
              <div className='flex items-center space-x-1.5'>
                <Checkbox
                  id='toggle-quote'
                  checked={showQuote}
                  onCheckedChange={(checked) => setShowQuote(!!checked)}
                />
                <Label
                  htmlFor='toggle-quote'
                  className='text-[11px] font-medium text-foreground cursor-pointer select-none'
                >
                  Quotes
                </Label>
              </div>

              <div className='flex items-center space-x-1.5'>
                <Checkbox
                  id='toggle-notice'
                  checked={showNotice}
                  onCheckedChange={(checked) => setShowNotice(!!checked)}
                />
                <Label
                  htmlFor='toggle-notice'
                  className='text-[11px] font-medium text-foreground cursor-pointer select-none'
                >
                  Catatan
                </Label>
              </div>

              <div className='flex items-center space-x-1.5'>
                <Checkbox
                  id='toggle-bed'
                  checked={showBedWithRuangan}
                  onCheckedChange={(checked) =>
                    setShowBedWithRuangan(!!checked)
                  }
                />
                <Label
                  htmlFor='toggle-bed'
                  className='text-[11px] font-medium text-foreground cursor-pointer select-none'
                >
                  Nomor Bed
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Preview Scrollable Body */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40'>
          <div className='flex items-center justify-between mb-3 px-1'>
            <div className='flex items-center gap-2'>
              <Eye className='w-4 h-4 text-muted-foreground' />
              <span className='text-xs font-semibold text-muted-foreground'>
                Pratinjau Kartu (
                {selectedVariant === 'diet-focus'
                  ? 'Varian 1 - Fokus Diet'
                  : 'Varian 2 - Fokus Ruangan'}
                )
              </span>
            </div>
            <Badge variant='outline' className='text-[11px] bg-background'>
              {etiketList.length} etiket
            </Badge>
          </div>

          <div
            ref={printRef}
            className='etiket-container-print flex flex-wrap justify-center gap-5 sm:gap-6'
          >
            {etiketList.map((item, idx) => (
              <div key={idx} className='flex justify-center'>
                <EtiketCard
                  data={item}
                  variant={selectedVariant}
                  customHeaderTitle={customHeaderTitle}
                  customQuote={customQuote}
                  customNotice={customNotice}
                  customDateLabel={
                    customDateLabel.trim() ? customDateLabel : undefined
                  }
                  customDateValue={
                    customDateValue.trim() ? customDateValue : undefined
                  }
                  showQuote={showQuote}
                  showNotice={showNotice}
                  showBedWithRuangan={showBedWithRuangan}
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
