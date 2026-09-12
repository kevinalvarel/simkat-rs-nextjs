'use client';

import React, { useRef, useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Printer,
  Layers,
  Files,
  Calendar,
  Settings2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CalendarRange,
} from 'lucide-react';
import type {
  SalesInvoiceSummary,
  SalesInvoiceLineItem,
  SalesInvoicePriceConfig,
} from '@/types/invoicetypes';
import { angkaTerbilang } from '@/lib/sales-invoice-utils';
import { cn } from '@/lib/utils';

interface SalesInvoicePrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SalesInvoiceSummary;
}

function formatTanggalIndo(dateStr?: string): string {
  if (!dateStr) return '6 Agustus 2026';
  const cleanStr = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;
  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return dateStr;
}

function generateDefaultNomorFaktur(
  dateStr?: string,
  batchId?: number | null,
): string {
  const romanMonths = [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
    'XI',
    'XII',
  ];
  const cleanStr = dateStr?.includes(' ') ? dateStr.split(' ')[0] : dateStr;
  const d = cleanStr ? new Date(cleanStr) : new Date();
  const monthIdx = !isNaN(d.getTime()) ? d.getMonth() : 7;
  const year = !isNaN(d.getTime()) ? d.getFullYear() : 2026;
  const roman = romanMonths[monthIdx] || 'VIII';
  const num = String(batchId || 106).padStart(3, '0');
  return `${num}/${roman}/INV/TRADCO/${year}`;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('id-ID');
}

export default function SalesInvoicePrintModal({
  open,
  onOpenChange,
  data,
}: SalesInvoicePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const isRange = Boolean(data.isRange);
  const isMonthly = Boolean(data.isMonthly);
  const [printMode, setPrintMode] = useState<
    'REKAP' | 'DAILY_PAGES' | 'SNAPSHOT_PAGES' | 'MONTHLY'
  >(isMonthly ? 'MONTHLY' : 'REKAP');

  // Customization state
  const [showSettings, setShowSettings] = useState(false);
  const defaultNomor = useMemo(
    () => generateDefaultNomorFaktur(data.tanggal, data.batchId),
    [data.tanggal, data.batchId],
  );
  const defaultTanggal = useMemo(
    () => formatTanggalIndo(data.tanggal),
    [data.tanggal],
  );

  const [nomorFaktur, setNomorFaktur] = useState(defaultNomor);
  const [tanggalFaktur, setTanggalFaktur] = useState(defaultTanggal);
  const [namaPpk, setNamaPpk] = useState(
    'dr. Inge Andriani Heriawan, M.Si., M.K.M.',
  );
  const [nipPpk, setNipPpk] = useState('197611042011012001');
  const [namaDirektur, setNamaDirektur] = useState('Mochammad Riyadi');
  const [jabatanDirektur, setJabatanDirektur] = useState('Direktur');
  const [namaVendor, setNamaVendor] = useState('PT. Tradco Energy Indonesia');
  const [npwpVendor, setNpwpVendor] = useState('82.795.126.0.443.000');
  const [alamatVendor, setAlamatVendor] = useState(
    'Perum Jaya Asri 2 Blok A No. 34 Kel. Jayawaras Kec.Tarogong Kidul Kab. Garut',
  );
  const [keterangan, setKeterangan] = useState('Harga sudah termasuk pajak');

  // Price overrides
  const [prices, setPrices] = useState<SalesInvoicePriceConfig>(
    data.priceConfig,
  );

  function handleResetMetadata() {
    setNomorFaktur(defaultNomor);
    setTanggalFaktur(defaultTanggal);
    setNamaPpk('dr. Inge Andriani Heriawan, M.Si., M.K.M.');
    setNipPpk('197611042011012001');
    setNamaDirektur('Mochammad Riyadi');
    setJabatanDirektur('Direktur');
    setNamaVendor('PT. Tradco Energy Indonesia');
    setNpwpVendor('82.795.126.0.443.000');
    setAlamatVendor(
      'Perum Jaya Asri 2 Blok A No. 34 Kel. Jayawaras Kec.Tarogong Kidul Kab. Garut',
    );
    setKeterangan('Harga sudah termasuk pajak');
    setPrices(data.priceConfig);
  }

  function updatePrice(key: keyof SalesInvoicePriceConfig, value: string) {
    setPrices((prev) => ({ ...prev, [key]: parseInt(value, 10) || 0 }));
  }

  // Recompute line items when prices change
  const computedLineItems = useMemo(() => {
    return recomputeLineItems(data.lineItems, prices, data.priceConfig);
  }, [data.lineItems, prices, data.priceConfig]);

  const computedTotalHarga = useMemo(() => {
    return computedLineItems.reduce((sum, item) => sum + item.jumlahHarga, 0);
  }, [computedLineItems]);

  const computedTotalBanyaknya = useMemo(() => {
    return computedLineItems.reduce((sum, item) => sum + item.banyaknya, 0);
  }, [computedLineItems]);

  const computedTerbilang = useMemo(() => {
    return angkaTerbilang(computedTotalHarga);
  }, [computedTotalHarga]);

  // Recompute helper: apply new prices to existing line items
  function recomputeLineItems(
    items: SalesInvoiceLineItem[],
    newPrices: SalesInvoicePriceConfig,
    _originalPrices: SalesInvoicePriceConfig,
  ): SalesInvoiceLineItem[] {
    return items.map((item) => {
      const kelasKey = getKelasKeyFromType(item.type);
      let newHarga: number;
      if (item.namaBarang === 'TKTP') {
        newHarga =
          kelasKey === '1'
            ? newPrices.tktpKelas1
            : kelasKey === '2'
              ? newPrices.tktpKelas2
              : newPrices.tktpKelas3;
      } else {
        newHarga =
          kelasKey === '1'
            ? newPrices.makanPasienKelas1
            : kelasKey === '2'
              ? newPrices.makanPasienKelas2
              : newPrices.makanPasienKelas3;
      }
      return {
        ...item,
        hargaSatuan: newHarga,
        jumlahHarga: item.banyaknya * newHarga,
      };
    });
  }

  function getKelasKeyFromType(type: string): '1' | '2' | '3' {
    const u = type.toUpperCase();
    if (u.includes('I') && !u.includes('II') && !u.includes('III')) return '1';
    if (u.includes('II') && !u.includes('III')) return '2';
    return '3';
  }

  // Daily pages
  const dailyPages = useMemo(() => {
    if (data.dailySalesInvoices && data.dailySalesInvoices.length > 0) {
      return data.dailySalesInvoices;
    }
    return [data];
  }, [data]);

  // Snapshot pages
  const snapshotPages = useMemo(() => {
    if (data.snapshotSummaries && data.snapshotSummaries.length > 0) {
      // Enrich snapshot summaries with sales data
      return data.snapshotSummaries.map((snap) => {
        const snapItems = buildSnapshotLineItems(snap, prices);
        const snapTotal = snapItems.reduce(
          (sum, item) => sum + item.jumlahHarga,
          0,
        );
        const snapBanyaknya = snapItems.reduce(
          (sum, item) => sum + item.banyaknya,
          0,
        );
        return {
          ...snap,
          lineItems: snapItems,
          totalBanyaknya: snapBanyaknya,
          totalHarga: snapTotal,
          terbilang: angkaTerbilang(snapTotal),
          priceConfig: prices,
        } as SalesInvoiceSummary;
      });
    }
    return dailyPages;
  }, [data, dailyPages, prices]);

  function buildSnapshotLineItems(
    summary: { classes: typeof data.classes },
    config: SalesInvoicePriceConfig,
  ): SalesInvoiceLineItem[] {
    const items: SalesInvoiceLineItem[] = [];
    let no = 1;
    for (const cls of summary.classes) {
      let tktpCount = 0;
      for (const d of cls.dietBreakdown || []) {
        if (
          d.kategori?.toUpperCase().includes('TKTP') ||
          d.bentuk?.toUpperCase().includes('TKTP')
        ) {
          tktpCount += d.count;
        }
      }
      const type = formatKelasTypeDisplay(cls.kelas);
      if (tktpCount > 0) {
        const kelasKey = getKelasKeyFromType(type);
        const harga =
          kelasKey === '1'
            ? config.tktpKelas1
            : kelasKey === '2'
              ? config.tktpKelas2
              : config.tktpKelas3;
        items.push({
          no: no++,
          namaBarang: 'TKTP',
          type,
          banyaknya: tktpCount,
          satuan: 'Porsi',
          hargaSatuan: harga,
          jumlahHarga: tktpCount * harga,
        });
      }
      const makanCount = cls.totalPorsi - tktpCount;
      if (makanCount > 0) {
        const kelasKey = getKelasKeyFromType(type);
        const harga =
          kelasKey === '1'
            ? config.makanPasienKelas1
            : kelasKey === '2'
              ? config.makanPasienKelas2
              : config.makanPasienKelas3;
        items.push({
          no: no++,
          namaBarang: 'Makan Pasien',
          type,
          banyaknya: makanCount,
          satuan: 'Porsi',
          hargaSatuan: harga,
          jumlahHarga: makanCount * harga,
        });
      }
    }
    return items;
  }

  function formatKelasTypeDisplay(kelas: string): string {
    const u = (kelas || '').trim().toUpperCase();
    if (u.includes('VIP')) return 'Kelas I';
    if (u.includes('1') || u === 'I') return 'Kelas I';
    if (u.includes('2') && u.includes('3')) return 'Kelas II';
    if (u.includes('2') || u === 'II') return 'Kelas II';
    return 'Kelas III';
  }

  const documentTitle = isMonthly
    ? `Faktur_Penjualan_Bulanan_${data.monthLabel || ''}`
    : isRange
      ? printMode === 'DAILY_PAGES'
        ? `Faktur_Penjualan_Harian_${data.startDate}_sd_${data.endDate}`
        : `Faktur_Penjualan_Rekap_${data.startDate}_sd_${data.endDate}`
      : data.isPerSnapshot
        ? `Faktur_Penjualan_${data.waktuMakan}_${data.tanggal}`
        : `Faktur_Penjualan_${data.tanggal}`;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 10mm 15mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: Arial, Calibri, 'Helvetica Neue', Helvetica, sans-serif !important;
        }
        .sales-invoice-container {
          display: block !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .sales-invoice-sheet {
          display: block !important;
          page-break-after: always !important;
          break-after: page !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 0 15mm 0 !important;
          min-height: 270mm !important;
          background: #ffffff !important;
        }
        .sales-invoice-sheet:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
          padding-bottom: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        table {
          border-collapse: collapse !important;
        }
        th, td {
          border: 1px solid #000000 !important;
        }
      }
    `,
  });

  // Render a single Faktur Penjualan sheet
  function renderSheet(
    summary: SalesInvoiceSummary,
    lineItems: SalesInvoiceLineItem[],
    totalHarga: number,
    totalBanyaknya: number,
    terbilangText: string,
    pageIndex?: number,
    totalPages?: number,
  ) {
    const dateFormatted = formatTanggalIndo(summary.tanggal);

    return (
      <div
        key={`${summary.tanggal}-${summary.batchId || pageIndex || 0}`}
        className='sales-invoice-sheet bg-white text-black p-8 sm:p-10 rounded-xl shadow-md border max-w-[210mm] w-full text-xs font-sans leading-tight space-y-4'
        style={{ minHeight: '297mm' }}
      >
        {/* 1. Header: Logo (Left) + Recipient (Right) */}
        <div className='grid grid-cols-2 gap-4 items-start pt-2'>
          <div className='flex flex-col items-start justify-start pt-1 pl-2'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src='/icons/logo-tradco.png'
              alt='Logo Tradco Energy'
              className='w-28 sm:w-32 h-auto object-contain'
            />
          </div>

          <div className='text-left space-y-0.5 text-xs text-black pl-8 sm:pl-16'>
            <div className='space-y-0.5'>
              <p className='font-normal'>Kepada Yth :</p>
              <p className='font-normal'>Pejabat Pembuat Komitmen</p>
              <p className='font-normal'>
                Kegiatan Makan Minum Pasien dan Non Pasien
              </p>
              <p className='font-normal'>Belanja Makanan dan Minuman Pasien</p>
              <p className='font-normal'>RSUD dr. Slamet Garut</p>
              <p className='font-normal'>di</p>
              <p className='font-normal pl-3'>Garut</p>
            </div>
          </div>
        </div>

        {/* 2. Title: FAKTUR PENJUALAN + Nomor */}
        <div className='text-center space-y-0.5 pt-4 pb-1'>
          <h1 className='text-sm sm:text-base font-bold uppercase underline tracking-wider'>
            FAKTUR PENJUALAN
          </h1>
          <p className='text-xs font-semibold'>
            Nomor :{nomorFaktur || defaultNomor}
          </p>
        </div>

        {/* 3. Vendor Information Block */}
        <div className='w-full text-xs space-y-0.5 px-2 pb-2'>
          <div className='grid grid-cols-[auto_auto_1fr] gap-x-2'>
            <span className='font-normal'>Nama Perusahaan</span>
            <span>:</span>
            <span className='font-normal'>{namaVendor}</span>
          </div>
          <div className='grid grid-cols-[auto_auto_1fr] gap-x-2'>
            <span className='font-normal'>NPWP</span>
            <span>:</span>
            <span className='font-normal'>{npwpVendor}</span>
          </div>
          <div className='grid grid-cols-[auto_auto_1fr] gap-x-2'>
            <span className='font-normal'>Alamat</span>
            <span>:</span>
            <span className='font-normal'>{alamatVendor}</span>
          </div>
        </div>

        {/* 4. Main Sales Table */}
        <div className='w-full'>
          <table className='w-full text-xs border-collapse border border-black text-center'>
            <thead>
              <tr className='font-bold text-center'>
                <th className='border border-black px-2 py-1.5 w-10'>No</th>
                <th className='border border-black px-2 py-1.5 w-28 text-center'>
                  Nama Barang
                </th>
                <th className='border border-black px-2 py-1.5 w-24 text-center'>
                  Tipe
                </th>
                <th
                  className='border border-black px-2 py-1.5 text-center'
                  colSpan={2}
                >
                  Banyaknya
                </th>
                <th className='border border-black px-2 py-1.5 w-28 text-center'>
                  Harga Satuan
                  <br />
                  (Rp)
                </th>
                <th className='border border-black px-2 py-1.5 w-28 text-center'>
                  Jumlah Harga
                  <br />
                  (Rp)
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={`${item.no}-${item.namaBarang}-${item.type}`}>
                  <td className='border border-black px-2 py-1 font-normal'>
                    {item.no}
                  </td>
                  <td className='border border-black px-2 py-1 text-left font-normal pl-3'>
                    {item.namaBarang}
                  </td>
                  <td className='border border-black px-2 py-1 font-normal text-center'>
                    {item.type}
                  </td>
                  <td className='border border-black px-2 py-1 font-mono text-right w-14'>
                    {item.banyaknya}
                  </td>
                  <td className='border border-black px-2 py-1 font-normal text-left w-12'>
                    {item.satuan}
                  </td>
                  <td className='border border-black px-2 py-1 font-mono text-right'>
                    {formatCurrency(item.hargaSatuan)}
                  </td>
                  <td className='border border-black px-2 py-1 font-mono text-right'>
                    {formatCurrency(item.jumlahHarga)}
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className='font-bold'>
                <td className='border border-black px-2 py-1.5'></td>
                <td className='border border-black px-2 py-1.5'></td>
                <td className='border border-black px-2 py-1.5'></td>
                <td className='border border-black px-2 py-1.5 font-mono text-right font-bold'>
                  {totalBanyaknya}
                </td>
                <td className='border border-black px-2 py-1.5 font-bold text-left'>
                  Porsi
                </td>
                <td className='border border-black px-2 py-1.5 text-center font-bold'>
                  Total Harga
                </td>
                <td className='border border-black px-2 py-1.5 font-mono text-right font-bold'>
                  {formatCurrency(totalHarga)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Terbilang */}
        <div className='pt-1 text-left text-xs'>
          <p>
            <span className='font-bold'>Terbilang : </span>
            <span className='font-bold italic'>{terbilangText}</span>
          </p>
        </div>

        {/* 6. Keterangan */}
        <div className='pt-1 text-left text-xs'>
          <p className='font-normal pl-6'>Keterangan : {keterangan}</p>
        </div>

        {/* 7. Signatures: PPK (Left) & Direktur PT Tradco (Right) */}
        <div className='pt-6 space-y-0 text-xs text-black'>
          <div className='grid grid-cols-2 gap-8'>
            {/* Left: PPK */}
            <div className='text-center flex flex-col justify-between h-32'>
              <p className='font-normal'>Pejabat Pembuat Komitmen</p>
              <div>
                <p className='font-bold underline'>{namaPpk}</p>
                <p className='font-normal'>NIP. {nipPpk}</p>
              </div>
            </div>

            {/* Right: Direktur */}
            <div className='text-center flex flex-col justify-between h-32'>
              <div>
                <p className='font-normal'>Hormat Kami,</p>
                <p className='font-normal'>{namaVendor}</p>
              </div>
              <div>
                <p className='font-bold underline'>{namaDirektur}</p>
                <p className='font-normal'>{jabatanDirektur}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page indicator (optional, non-print) */}
        {totalPages && totalPages > 1 && (
          <div className='no-print text-center text-[10px] text-gray-400 pt-4'>
            Halaman {pageIndex} dari {totalPages}
          </div>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-7xl w-[88vw] min-w-[70vw] max-h-[95vh] flex flex-col p-0 overflow-hidden'>
        {/* Modal Header */}
        <DialogHeader className='p-4 sm:p-5 border-b bg-muted/30'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
            <div className='space-y-1 text-left'>
              <DialogTitle className='text-base sm:text-lg font-bold text-foreground flex items-center gap-2'>
                <Printer className='w-5 h-5 text-primary' />
                Cetak Faktur Penjualan Makanan Pasien
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                Format resmi Faktur Penjualan {namaVendor} &amp; RSUD dr. Slamet
                Garut — termasuk Harga Satuan dan Jumlah Harga.
              </DialogDescription>
            </div>

            {/* Print Mode Selector */}
            <div className='flex items-center gap-2 self-start sm:self-auto flex-wrap'>
              {(isRange || isMonthly) && (
                <div className='flex items-center gap-1 p-1 bg-muted/70 dark:bg-muted/40 rounded-xl border border-border/80 text-xs shrink-0 shadow-2xs'>
                  <button
                    type='button'
                    onClick={() => setPrintMode('REKAP')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-xs cursor-pointer select-none',
                      printMode === 'REKAP' || printMode === 'MONTHLY'
                        ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                    )}
                    title='Cetak total akumulasi periode dalam 1 lembar faktur'
                  >
                    <Layers className='w-3.5 h-3.5' />
                    <span>
                      {isMonthly ? 'Rekap Bulanan' : 'Rekap (1 Lembar)'}
                    </span>
                  </button>

                  {!isMonthly && (
                    <button
                      type='button'
                      onClick={() => setPrintMode('DAILY_PAGES')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-xs cursor-pointer select-none',
                        printMode === 'DAILY_PAGES'
                          ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                      )}
                      title='Cetak setiap tanggal pada lembar faktur terpisah'
                    >
                      <Calendar className='w-3.5 h-3.5' />
                      <span>Harian ({dailyPages.length})</span>
                    </button>
                  )}

                  {!isMonthly && (
                    <button
                      type='button'
                      onClick={() => setPrintMode('SNAPSHOT_PAGES')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-xs cursor-pointer select-none',
                        printMode === 'SNAPSHOT_PAGES'
                          ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                      )}
                      title='Cetak setiap snapshot per lembar faktur terpisah'
                    >
                      <Files className='w-3.5 h-3.5' />
                      <span>Per-Snapshot ({snapshotPages.length})</span>
                    </button>
                  )}
                </div>
              )}

              {/* Customization Toggle */}
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setShowSettings((prev) => !prev)}
                className='text-xs gap-1.5 cursor-pointer'
              >
                <Settings2 className='w-3.5 h-3.5' />
                <span>Sesuaikan Dokumen</span>
                {showSettings ? (
                  <ChevronUp className='w-3.5 h-3.5' />
                ) : (
                  <ChevronDown className='w-3.5 h-3.5' />
                )}
              </Button>
            </div>
          </div>

          {/* Collapsible Customization Panel */}
          <Collapsible open={showSettings} onOpenChange={setShowSettings}>
            <CollapsibleContent className='pt-3 no-print'>
              <div className='p-4 bg-background border rounded-xl shadow-xs space-y-4 text-xs'>
                <div className='flex items-center justify-between border-b pb-2'>
                  <span className='font-bold text-foreground text-xs'>
                    Pengaturan Data Faktur Penjualan & Penandatangan
                  </span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={handleResetMetadata}
                    className='h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground'
                  >
                    <RotateCcw className='w-3 h-3' />
                    Reset Standar
                  </Button>
                </div>

                {/* Row 1: Invoice Metadata */}
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Nomor Faktur
                    </Label>
                    <Input
                      value={nomorFaktur}
                      onChange={(e) => setNomorFaktur(e.target.value)}
                      placeholder='106/VIII/INV/TRADCO/2026'
                      className='h-8 text-xs'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Tanggal Faktur
                    </Label>
                    <Input
                      value={tanggalFaktur}
                      onChange={(e) => setTanggalFaktur(e.target.value)}
                      placeholder='6 Agustus 2026'
                      className='h-8 text-xs'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Nama PPK
                    </Label>
                    <Input
                      value={namaPpk}
                      onChange={(e) => setNamaPpk(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      NIP PPK
                    </Label>
                    <Input
                      value={nipPpk}
                      onChange={(e) => setNipPpk(e.target.value)}
                      className='h-8 text-xs font-mono'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Nama Vendor / Perusahaan
                    </Label>
                    <Input
                      value={namaVendor}
                      onChange={(e) => setNamaVendor(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      NPWP Vendor
                    </Label>
                    <Input
                      value={npwpVendor}
                      onChange={(e) => setNpwpVendor(e.target.value)}
                      className='h-8 text-xs font-mono'
                    />
                  </div>

                  <div className='space-y-1 sm:col-span-2'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Alamat Vendor
                    </Label>
                    <Input
                      value={alamatVendor}
                      onChange={(e) => setAlamatVendor(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Nama Direktur / Pengirim
                    </Label>
                    <Input
                      value={namaDirektur}
                      onChange={(e) => setNamaDirektur(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Jabatan Direktur
                    </Label>
                    <Input
                      value={jabatanDirektur}
                      onChange={(e) => setJabatanDirektur(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>

                  <div className='space-y-1 sm:col-span-2'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Keterangan
                    </Label>
                    <Input
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>
                </div>

                {/* Row 2: Price Configuration */}
                <div className='pt-1 border-t'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='font-semibold text-foreground text-[11px]'>
                      Harga Satuan per Kelas (Rp) — Kosongkan 0 untuk non-aktif:
                    </span>
                  </div>
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3'>
                    <div className='space-y-1'>
                      <Label className='text-[10px] text-muted-foreground'>
                        TKTP Kelas I
                      </Label>
                      <Input
                        type='number'
                        value={prices.tktpKelas1}
                        onChange={(e) =>
                          updatePrice('tktpKelas1', e.target.value)
                        }
                        className='h-7 text-xs font-mono'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-[10px] text-muted-foreground'>
                        TKTP Kelas II
                      </Label>
                      <Input
                        type='number'
                        value={prices.tktpKelas2}
                        onChange={(e) =>
                          updatePrice('tktpKelas2', e.target.value)
                        }
                        className='h-7 text-xs font-mono'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-[10px] text-muted-foreground'>
                        TKTP Kelas III
                      </Label>
                      <Input
                        type='number'
                        value={prices.tktpKelas3}
                        onChange={(e) =>
                          updatePrice('tktpKelas3', e.target.value)
                        }
                        className='h-7 text-xs font-mono'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-[10px] text-muted-foreground'>
                        Makan Pasien Kelas I
                      </Label>
                      <Input
                        type='number'
                        value={prices.makanPasienKelas1}
                        onChange={(e) =>
                          updatePrice('makanPasienKelas1', e.target.value)
                        }
                        className='h-7 text-xs font-mono'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-[10px] text-muted-foreground'>
                        Makan Pasien Kelas II
                      </Label>
                      <Input
                        type='number'
                        value={prices.makanPasienKelas2}
                        onChange={(e) =>
                          updatePrice('makanPasienKelas2', e.target.value)
                        }
                        className='h-7 text-xs font-mono'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-[10px] text-muted-foreground'>
                        Makan Pasien Kelas III
                      </Label>
                      <Input
                        type='number'
                        value={prices.makanPasienKelas3}
                        onChange={(e) =>
                          updatePrice('makanPasienKelas3', e.target.value)
                        }
                        className='h-7 text-xs font-mono'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </DialogHeader>

        {/* Document Preview */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40'>
          <div
            ref={printRef}
            className='sales-invoice-container flex flex-col items-center gap-8 w-full'
          >
            {/* Mode A: Single Sheet or Rekap */}
            {(!isRange || printMode === 'REKAP' || printMode === 'MONTHLY') &&
              renderSheet(
                data,
                computedLineItems,
                computedTotalHarga,
                computedTotalBanyaknya,
                computedTerbilang,
              )}

            {/* Mode B: Cetak Harian */}
            {isRange &&
              !isMonthly &&
              printMode === 'DAILY_PAGES' &&
              dailyPages.map((daySummary, idx) => {
                const dayItems =
                  'lineItems' in daySummary
                    ? recomputeLineItems(
                        (daySummary as SalesInvoiceSummary).lineItems,
                        prices,
                        data.priceConfig,
                      )
                    : buildSnapshotLineItems(daySummary, prices);
                const dayTotal = dayItems.reduce(
                  (sum, item) => sum + item.jumlahHarga,
                  0,
                );
                const dayBanyaknya = dayItems.reduce(
                  (sum, item) => sum + item.banyaknya,
                  0,
                );

                return (
                  <div
                    key={daySummary.tanggal}
                    className='w-full flex flex-col items-center gap-2'
                  >
                    <div className='no-print w-full max-w-[210mm] flex items-center justify-between text-xs text-muted-foreground px-2 pt-2'>
                      <Badge
                        variant='outline'
                        className='text-[10px] font-mono bg-background'
                      >
                        Lembar {idx + 1} dari {dailyPages.length}
                      </Badge>
                      <span className='font-semibold text-[11px] text-foreground'>
                        {daySummary.tanggalFormatted}
                      </span>
                    </div>
                    {renderSheet(
                      daySummary as SalesInvoiceSummary,
                      dayItems,
                      dayTotal,
                      dayBanyaknya,
                      angkaTerbilang(dayTotal),
                      idx + 1,
                      dailyPages.length,
                    )}
                  </div>
                );
              })}

            {/* Mode C: Per-Snapshot */}
            {isRange &&
              !isMonthly &&
              printMode === 'SNAPSHOT_PAGES' &&
              snapshotPages.map((snapSummary, idx) => {
                const snapItems =
                  'lineItems' in snapSummary
                    ? recomputeLineItems(
                        (snapSummary as SalesInvoiceSummary).lineItems,
                        prices,
                        data.priceConfig,
                      )
                    : buildSnapshotLineItems(snapSummary, prices);
                const snapTotal = snapItems.reduce(
                  (sum, item) => sum + item.jumlahHarga,
                  0,
                );
                const snapBanyaknya = snapItems.reduce(
                  (sum, item) => sum + item.banyaknya,
                  0,
                );

                return (
                  <div
                    key={`${snapSummary.tanggal}-${snapSummary.batchId || idx}`}
                    className='w-full flex flex-col items-center gap-2'
                  >
                    <div className='no-print w-full max-w-[210mm] flex items-center justify-between text-xs text-muted-foreground px-2 pt-2'>
                      <div className='flex items-center gap-1.5'>
                        <Badge
                          variant='outline'
                          className='text-[10px] font-mono bg-background'
                        >
                          Lembar {idx + 1} dari {snapshotPages.length}
                        </Badge>
                        <Badge
                          variant='outline'
                          className='text-[10px] font-bold bg-primary/10 text-primary border-primary/25'
                        >
                          Snapshot {snapSummary.waktuMakan}
                        </Badge>
                      </div>
                      <span className='font-semibold text-[11px] text-foreground'>
                        {snapSummary.tanggalFormatted}
                      </span>
                    </div>
                    {renderSheet(
                      snapSummary as SalesInvoiceSummary,
                      snapItems,
                      snapTotal,
                      snapBanyaknya,
                      angkaTerbilang(snapTotal),
                      idx + 1,
                      snapshotPages.length,
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className='p-4 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div className='text-xs text-muted-foreground hidden sm:block'>
            {isMonthly ? (
              <span>
                Mode Cetak: <strong>Faktur Penjualan Bulanan</strong> —{' '}
                {data.monthLabel}.
              </span>
            ) : isRange ? (
              printMode === 'SNAPSHOT_PAGES' ? (
                <span>
                  Mode Cetak: <strong>Per-Snapshot</strong> (
                  {snapshotPages.length} halaman).
                </span>
              ) : printMode === 'DAILY_PAGES' ? (
                <span>
                  Mode Cetak: <strong>Harian</strong> ({dailyPages.length}{' '}
                  halaman).
                </span>
              ) : (
                <span>
                  Mode Cetak: <strong>Rekap Periode</strong> (1 lembar).
                </span>
              )
            ) : data.isPerSnapshot ? (
              <span>
                Faktur Penjualan Snapshot <strong>{data.waktuMakan}</strong>.
              </span>
            ) : (
              <span>
                Format Resmi Faktur Penjualan RSUD dr. Slamet Garut &amp;{' '}
                {namaVendor}.
              </span>
            )}
          </div>

          <div className='flex items-center justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='cursor-pointer text-xs'
            >
              Tutup
            </Button>
            <Button
              onClick={() => handlePrint()}
              className='gap-2 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer text-xs shadow-xs font-bold'
            >
              <Printer className='w-4 h-4' />
              {isMonthly
                ? 'Cetak Faktur Bulanan (Print / PDF)'
                : isRange
                  ? printMode === 'SNAPSHOT_PAGES'
                    ? `Cetak ${snapshotPages.length} Lembar Snapshot (Print / PDF)`
                    : printMode === 'DAILY_PAGES'
                      ? `Cetak ${dailyPages.length} Lembar Harian (Print / PDF)`
                      : 'Cetak Faktur Rekap (Print / PDF)'
                  : data.isPerSnapshot
                    ? `Cetak Faktur ${data.waktuMakan} (Print / PDF)`
                    : 'Cetak Faktur Penjualan (Print / PDF)'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
