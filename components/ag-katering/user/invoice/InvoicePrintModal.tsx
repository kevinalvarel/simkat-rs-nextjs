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
} from 'lucide-react';
import type { InvoiceDailySummary } from '@/types/invoicetypes';
import { cn } from '@/lib/utils';

interface InvoicePrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: InvoiceDailySummary;
}

import { getKelasSortWeight, normalizeKelasName } from '@/lib/kelas-utils';

/** Label tampil apa adanya dari sistem (kanonis KELAS I/II/III) */
function formatKelasDisplay(rawKelas: string): string {
  return normalizeKelasName(rawKelas, (rawKelas || '').trim());
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
  const num = String(batchId || 80).padStart(3, '0');
  return `${num}/${roman}/INV/TRADCO/${year}`;
}

export default function InvoicePrintModal({
  open,
  onOpenChange,
  data,
}: InvoicePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const isRange = Boolean(data.isRange);
  const [printMode, setPrintMode] = useState<
    'REKAP' | 'DAILY_PAGES' | 'SNAPSHOT_PAGES'
  >('REKAP');

  // Customization state for official signatories & metadata
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
  const [namaPengirim, setNamaPengirim] = useState('Mochammad Riyadi');
  const [jabatanPengirim, setJabatanPengirim] = useState('Direktur');
  const [namaVendor, setNamaVendor] = useState('PT. Tradco Energy Indonesia');
  const [namaPengurusBarang, setNamaPengurusBarang] = useState('Syaripudin');
  const [nipPengurusBarang, setNipPengurusBarang] =
    useState('19810303200911006');

  // Manual override for TKTP portions if customized by user
  const [customTktpPagi, setCustomTktpPagi] = useState<string>('');
  const [customTktpSiang, setCustomTktpSiang] = useState<string>('');
  const [customTktpMalam, setCustomTktpMalam] = useState<string>('');

  function handleResetMetadata() {
    setNomorFaktur(defaultNomor);
    setTanggalFaktur(defaultTanggal);
    setNamaPpk('dr. Inge Andriani Heriawan, M.Si., M.K.M.');
    setNipPpk('197611042011012001');
    setNamaPengirim('Mochammad Riyadi');
    setJabatanPengirim('Direktur');
    setNamaVendor('PT. Tradco Energy Indonesia');
    setNamaPengurusBarang('Syaripudin');
    setNipPengurusBarang('19810303200911006');
    setCustomTktpPagi('');
    setCustomTktpSiang('');
    setCustomTktpMalam('');
  }

  // List of per-day summaries for "Cetak Harian"
  const dailyPages = useMemo(() => {
    if (data.dailySummaries && data.dailySummaries.length > 0) {
      return data.dailySummaries;
    }
    return [data];
  }, [data]);

  // List of per-snapshot summaries for "Cetak 1 Snapshot 1 Lembar"
  const snapshotPages = useMemo(() => {
    if (data.snapshotSummaries && data.snapshotSummaries.length > 0) {
      return data.snapshotSummaries;
    }
    return dailyPages;
  }, [data, dailyPages]);

  const documentTitle = isRange
    ? printMode === 'SNAPSHOT_PAGES'
      ? `Faktur_Pengiriman_Snapshot_${data.startDate}_sd_${data.endDate}`
      : printMode === 'DAILY_PAGES'
        ? `Faktur_Pengiriman_Harian_${data.startDate}_sd_${data.endDate}`
        : `Faktur_Pengiriman_Rekap_${data.startDate}_sd_${data.endDate}`
    : data.isPerSnapshot
      ? `Faktur_Pengiriman_${data.waktuMakan}_${data.tanggal}`
      : `Faktur_Pengiriman_${data.tanggal}`;

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
        .invoice-print-container {
          display: block !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .invoice-single-sheet {
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
        .invoice-single-sheet:last-child {
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

  // Calculate TKTP portion count for a mealtime
  function getTktpCount(
    summary: InvoiceDailySummary,
    waktu: 'PAGI' | 'SIANG' | 'MALAM',
  ): number {
    // 1. If manual override is specified
    if (waktu === 'PAGI' && customTktpPagi !== '') {
      return parseInt(customTktpPagi, 10) || 0;
    }
    if (waktu === 'SIANG' && customTktpSiang !== '') {
      return parseInt(customTktpSiang, 10) || 0;
    }
    if (waktu === 'MALAM' && customTktpMalam !== '') {
      return parseInt(customTktpMalam, 10) || 0;
    }

    // 2. From backend summary.tktpCounts
    if (summary.tktpCounts) {
      if (waktu === 'PAGI') return summary.tktpCounts.pagi;
      if (waktu === 'SIANG') return summary.tktpCounts.siang;
      if (waktu === 'MALAM') return summary.tktpCounts.malam;
    }

    // 3. Fallback: derive from dietBreakdown across classes
    let count = 0;
    for (const c of summary.classes) {
      for (const d of c.dietBreakdown || []) {
        if (
          d.kategori?.toUpperCase().includes('TKTP') ||
          d.bentuk?.toUpperCase().includes('TKTP')
        ) {
          if (summary.isPerSnapshot) {
            count += d.count;
          } else {
            count += Math.round(d.count / 3);
          }
        }
      }
    }
    return count;
  }

  // Render a single Faktur Pengiriman sheet matching the reference document
  function renderSheet(
    summary: InvoiceDailySummary,
    isSummaryOfRange: boolean,
    pageIndex?: number,
    totalPages?: number,
  ) {
    const isPerSnap = Boolean(summary.isPerSnapshot);
    const dateFormatted = formatTanggalIndo(summary.tanggal);

    // Kelas murni dari sistem (DB): urutan mengikuti daftar kelas summary
    const kelasOrder = summary.classes.map((c) => c.kelas);
    const dynamicClasses = summary.classes
      .filter((c) => !c.kelas.toUpperCase().includes('TKTP'))
      .sort((a, b) => {
        const orderA = getKelasSortWeight(a.kelas, kelasOrder);
        const orderB = getKelasSortWeight(b.kelas, kelasOrder);
        if (orderA !== orderB) return orderA - orderB;
        return a.kelas.localeCompare(b.kelas);
      });

    // Define mealtimes to display
    // If single snapshot mode, only show the selected mealtime; otherwise show all 3
    type MealDef = {
      no: number;
      label: string;
      key: 'PAGI' | 'SIANG' | 'MALAM';
      getCount: (c: (typeof dynamicClasses)[0]) => number;
    };

    let mealCycles: MealDef[] = [];
    if (isPerSnap && summary.waktuMakan) {
      const w = summary.waktuMakan.toUpperCase() as 'PAGI' | 'SIANG' | 'MALAM';
      const label =
        w === 'PAGI'
          ? 'Makan Pagi'
          : w === 'SIANG'
            ? 'Makan Siang'
            : 'Makan Malam';
      mealCycles = [
        {
          no: 1,
          label,
          key: w,
          getCount: (c) =>
            w === 'PAGI'
              ? c.pagiCount || c.totalPorsi
              : w === 'SIANG'
                ? c.siangCount || c.totalPorsi
                : c.malamCount || c.totalPorsi,
        },
      ];
    } else {
      mealCycles = [
        {
          no: 1,
          label: 'Makan Pagi',
          key: 'PAGI',
          getCount: (c) => c.pagiCount,
        },
        {
          no: 2,
          label: 'Makan Siang',
          key: 'SIANG',
          getCount: (c) => c.siangCount,
        },
        {
          no: 3,
          label: 'Makan Malam',
          key: 'MALAM',
          getCount: (c) => c.malamCount,
        },
      ];
    }

    // Compute meal groups data
    const mealGroups = mealCycles.map((m) => {
      const tktpPortions = getTktpCount(summary, m.key);
      const classRows = dynamicClasses.map((c) => ({
        rawKelas: c.kelas,
        label: formatKelasDisplay(c.kelas),
        count: m.getCount(c),
      }));

      const subtotal =
        tktpPortions + classRows.reduce((sum, r) => sum + r.count, 0);

      return {
        ...m,
        tktpPortions,
        classRows,
        subtotal,
      };
    });

    // Grand total of all displayed meals
    const grandTotal = mealGroups.reduce((acc, m) => acc + m.subtotal, 0);

    return (
      <div
        key={`${summary.tanggal}-${summary.batchId || pageIndex || 0}`}
        className='invoice-single-sheet bg-white text-black p-8 sm:p-10 rounded-xl shadow-md border max-w-[210mm] w-full text-xs font-sans leading-tight space-y-4'
        style={{ minHeight: '297mm' }}
      >
        {/* 1. Header Section: Tradco Energy Logo (Left) & Recipient RSUD dr. Slamet (Right) */}
        <div className='grid grid-cols-2 gap-4 items-start pt-2'>
          {/* Logo Kiri: TRADCO ENERGY */}
          <div className='flex flex-col items-start justify-start pt-1 pl-2'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src='/icons/logo-tradco.png'
              alt='Logo Tradco Energy'
              className='w-28 sm:w-32 h-auto object-contain'
            />
          </div>

          {/* Blok Kanan: Tanggal & Tujuan RSUD dr. Slamet Garut */}
          <div className='text-left space-y-0.5 text-xs text-black pl-8 sm:pl-16'>
            <p className='font-normal'>
              Garut, {tanggalFaktur || dateFormatted}
            </p>
            <div className='pt-2 space-y-0.5'>
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

        {/* 2. Title Section: FAKTUR PENGIRIMAN & Nomor */}
        <div className='text-center space-y-0.5 pt-4 pb-1'>
          <h1 className='text-sm sm:text-base font-bold uppercase underline tracking-wider'>
            FAKTUR PENGIRIMAN
          </h1>
          <p className='text-xs font-semibold'>
            Nomor :{nomorFaktur || defaultNomor}
          </p>
        </div>

        {/* 3. Main Consumption Table (Full Black Borders Grid) */}
        <div className='w-full'>
          <table className='w-full text-xs border-collapse border border-black text-center'>
            <thead>
              <tr className='font-bold text-center'>
                <th className='border border-black px-2 py-1.5 w-10'>No</th>
                <th className='border border-black px-2 py-1.5 w-36 text-center'>
                  Waktu Makan
                </th>
                <th className='border border-black px-2 py-1.5 w-32 text-center'>
                  Tipe
                </th>
                <th className='border border-black px-2 py-1.5 w-24 text-center'>
                  Jumlah
                </th>
                <th className='border border-black px-2 py-1.5 w-24 text-center'>
                  Satuan
                </th>
                <th className='border border-black px-2 py-1.5 w-32 text-center'>
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody>
              {mealGroups.map((mg) => (
                <React.Fragment key={mg.key}>
                  {/* Row 1: TKTP row with Meal Number & Mealtime Name */}
                  <tr>
                    <td className='border border-black px-2 py-1'>{mg.no}</td>
                    <td className='border border-black px-2 py-1 text-left font-normal pl-3'>
                      {mg.label}
                    </td>
                    <td className='border border-black px-2 py-1 font-normal text-center'>
                      TKTP
                    </td>
                    <td className='border border-black px-2 py-1 font-mono text-center'>
                      {mg.tktpPortions}
                    </td>
                    <td className='border border-black px-2 py-1 text-center font-normal'>
                      Porsi
                    </td>
                    <td className='border border-black px-2 py-1'></td>
                  </tr>

                  {/* Dynamic Class Rows dari sistem */}
                  {mg.classRows.map((cr) => (
                    <tr key={cr.rawKelas}>
                      <td className='border border-black px-2 py-1'></td>
                      <td className='border border-black px-2 py-1'></td>
                      <td className='border border-black px-2 py-1 font-normal text-center'>
                        {cr.label}
                      </td>
                      <td className='border border-black px-2 py-1 font-mono text-center'>
                        {cr.count}
                      </td>
                      <td className='border border-black px-2 py-1 text-center font-normal'>
                        Porsi
                      </td>
                      <td className='border border-black px-2 py-1'></td>
                    </tr>
                  ))}

                  {/* Subtotal Row ("Jumlah") */}
                  <tr className='font-bold'>
                    <td className='border border-black px-2 py-1'></td>
                    <td className='border border-black px-2 py-1'></td>
                    <td className='border border-black px-2 py-1 text-center font-bold'>
                      Jumlah
                    </td>
                    <td className='border border-black px-2 py-1 font-mono font-bold text-center'>
                      {mg.subtotal}
                    </td>
                    <td className='border border-black px-2 py-1 text-center font-bold'>
                      Porsi
                    </td>
                    <td className='border border-black px-2 py-1'></td>
                  </tr>
                </React.Fragment>
              ))}

              {/* Grand Total Row ("Total") */}
              <tr className='font-bold'>
                <td className='border border-black px-2 py-1.5'></td>
                <td className='border border-black px-2 py-1.5'></td>
                <td className='border border-black px-2 py-1.5 text-center font-bold'>
                  Total
                </td>
                <td className='border border-black px-2 py-1.5 font-mono font-bold text-center'>
                  {grandTotal}
                </td>
                <td className='border border-black px-2 py-1.5 text-center font-bold'>
                  Porsi
                </td>
                <td className='border border-black px-2 py-1.5'></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. Text Below Table: Keterangan Pengiriman */}
        <div className='pt-1 text-left text-xs'>
          <p className='font-normal'>
            Keterangan : Pengiriman tanggal {tanggalFaktur || dateFormatted}
          </p>
        </div>

        {/* 5. Official 3-Party Signatures Block */}
        <div className='pt-6 space-y-6 text-xs text-black'>
          {/* Row 1: Pejabat Pembuat Komitmen (Kiri) & Pengirim PT. Tradco (Kanan) */}
          <div className='grid grid-cols-2 gap-8'>
            {/* Kiri: PPK */}
            <div className='text-center flex flex-col justify-between h-32'>
              <p className='font-normal'>Pejabat Pembuat Komitmen</p>
              <div>
                <p className='font-bold underline'>{namaPpk}</p>
                <p className='font-normal'>NIP. {nipPpk}</p>
              </div>
            </div>

            {/* Kanan: Pengirim / Direktur */}
            <div className='text-center flex flex-col justify-between h-32'>
              <div>
                <p className='font-normal'>Pengirim,</p>
                <p className='font-normal'>{namaVendor}</p>
              </div>
              <div>
                <p className='font-bold underline'>{namaPengirim}</p>
                <p className='font-normal'>{jabatanPengirim}</p>
              </div>
            </div>
          </div>

          {/* Row 2: Mengetahui & Pengurus Barang Pembantu */}
          <div className='space-y-2 pt-2'>
            <div className='grid grid-cols-2 gap-8'>
              <div></div>
              <p className='text-center font-normal'>Mengetahui,</p>
            </div>

            <div className='grid grid-cols-2 gap-8 items-end'>
              <div className='text-left space-y-0.5 pl-2 sm:pl-4'>
                <p className='font-normal'>Pengurus Barang Pembantu :</p>
                <p className='font-normal'>1. {namaPengurusBarang}</p>
                <p className='font-normal'>NIP. {nipPengurusBarang}</p>
              </div>

              <div className='text-center pb-1'>
                <p className='font-normal'>(....................)</p>
              </div>
            </div>
          </div>
        </div>
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
                Cetak Faktur Pengiriman Makanan Pasien
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                Format resmi Faktur Pengiriman PT. Tradco Energy Indonesia &
                RSUD dr. Slamet Garut.
              </DialogDescription>
            </div>

            {/* Print Mode Selector (When printing a Date Range) */}
            <div className='flex items-center gap-2 self-start sm:self-auto flex-wrap'>
              {isRange && (
                <div className='flex items-center gap-1 p-1 bg-muted/70 dark:bg-muted/40 rounded-xl border border-border/80 text-xs shrink-0 shadow-2xs'>
                  <button
                    type='button'
                    onClick={() => setPrintMode('REKAP')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-xs cursor-pointer select-none',
                      printMode === 'REKAP'
                        ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                    )}
                    title='Cetak total akumulasi periode dalam 1 lembar faktur'
                  >
                    <Layers className='w-3.5 h-3.5' />
                    <span>Rekap (1 Lembar)</span>
                  </button>

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

                  <button
                    type='button'
                    onClick={() => setPrintMode('SNAPSHOT_PAGES')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-xs cursor-pointer select-none',
                      printMode === 'SNAPSHOT_PAGES'
                        ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                    )}
                    title='Cetak setiap siklus snapshot per lembar faktur terpisah'
                  >
                    <Files className='w-3.5 h-3.5' />
                    <span>Per-Snapshot ({snapshotPages.length})</span>
                  </button>
                </div>
              )}

              {/* Customization Toggle Button */}
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

          {/* Collapsible Metadata Customization Panel (Screen Only, no-print) */}
          <Collapsible open={showSettings} onOpenChange={setShowSettings}>
            <CollapsibleContent className='pt-3 no-print'>
              <div className='p-4 bg-background border rounded-xl shadow-xs space-y-4 text-xs'>
                <div className='flex items-center justify-between border-b pb-2'>
                  <span className='font-bold text-foreground text-xs'>
                    Pengaturan Data Faktur & Penandatangan Resmi
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

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Nomor Faktur
                    </Label>
                    <Input
                      value={nomorFaktur}
                      onChange={(e) => setNomorFaktur(e.target.value)}
                      placeholder='080/VIII/INV/TRADCO/2026'
                      className='h-8 text-xs'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Tanggal Pengiriman
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
                      Nama Pengirim / Direktur
                    </Label>
                    <Input
                      value={namaPengirim}
                      onChange={(e) => setNamaPengirim(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Jabatan Pengirim
                    </Label>
                    <Input
                      value={jabatanPengirim}
                      onChange={(e) => setJabatanPengirim(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      Pengurus Barang Pembantu
                    </Label>
                    <Input
                      value={namaPengurusBarang}
                      onChange={(e) => setNamaPengurusBarang(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] font-medium text-muted-foreground'>
                      NIP Pengurus Barang
                    </Label>
                    <Input
                      value={nipPengurusBarang}
                      onChange={(e) => setNipPengurusBarang(e.target.value)}
                      className='h-8 text-xs font-mono'
                    />
                  </div>
                </div>

                {/* Custom TKTP Portions Section */}
                <div className='pt-1 border-t'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='font-semibold text-foreground text-[11px]'>
                      Porsi Diet TKTP (Kosongkan jika ingin otomatis dari
                      sistem):
                    </span>
                  </div>
                  <div className='grid grid-cols-3 gap-3 max-w-md'>
                    <div className='space-y-1'>
                      <Label className='text-[10px] text-muted-foreground'>
                        TKTP Pagi
                      </Label>
                      <Input
                        type='number'
                        value={customTktpPagi}
                        onChange={(e) => setCustomTktpPagi(e.target.value)}
                        placeholder={String(data.tktpCounts?.pagi || 0)}
                        className='h-7 text-xs'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-[10px] text-muted-foreground'>
                        TKTP Siang
                      </Label>
                      <Input
                        type='number'
                        value={customTktpSiang}
                        onChange={(e) => setCustomTktpSiang(e.target.value)}
                        placeholder={String(data.tktpCounts?.siang || 0)}
                        className='h-7 text-xs'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-[10px] text-muted-foreground'>
                        TKTP Malam
                      </Label>
                      <Input
                        type='number'
                        value={customTktpMalam}
                        onChange={(e) => setCustomTktpMalam(e.target.value)}
                        placeholder={String(data.tktpCounts?.malam || 0)}
                        className='h-7 text-xs'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </DialogHeader>

        {/* Document Preview Scroll Area */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40'>
          <div
            ref={printRef}
            className='invoice-print-container flex flex-col items-center gap-8 w-full'
          >
            {/* Mode A: Single Sheet (Rekap Periode atau Single Snapshot/Harian) */}
            {(!isRange || printMode === 'REKAP') && renderSheet(data, isRange)}

            {/* Mode B: Cetak Harian (Tiap hari dicetak pada lembar faktur terpisah) */}
            {isRange &&
              printMode === 'DAILY_PAGES' &&
              dailyPages.map((daySummary, idx) => (
                <div
                  key={daySummary.tanggal}
                  className='w-full flex flex-col items-center gap-2'
                >
                  {/* Visual Page Break Separator in On-Screen Preview */}
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

                  {renderSheet(daySummary, false, idx + 1, dailyPages.length)}
                </div>
              ))}

            {/* Mode C: Cetak 1 Snapshot 1 Lembar */}
            {isRange &&
              printMode === 'SNAPSHOT_PAGES' &&
              snapshotPages.map((snapSummary, idx) => (
                <div
                  key={`${snapSummary.tanggal}-${snapSummary.batchId || idx}`}
                  className='w-full flex flex-col items-center gap-2'
                >
                  {/* Visual Page Break Separator in On-Screen Preview */}
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
                      {snapSummary.batchId && (
                        <span className='text-[11px] text-muted-foreground font-mono'>
                          Batch #{snapSummary.batchId}
                        </span>
                      )}
                    </div>
                    <span className='font-semibold text-[11px] text-foreground'>
                      {snapSummary.tanggalFormatted}
                    </span>
                  </div>

                  {renderSheet(
                    snapSummary,
                    false,
                    idx + 1,
                    snapshotPages.length,
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Modal Footer with Print Button */}
        <DialogFooter className='p-4 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div className='text-xs text-muted-foreground hidden sm:block'>
            {isRange ? (
              printMode === 'SNAPSHOT_PAGES' ? (
                <span>
                  Mode Cetak: <strong>Per-Snapshot</strong> (
                  {snapshotPages.length} halaman — Tiap siklus snapshot per
                  kertas faktur).
                </span>
              ) : printMode === 'DAILY_PAGES' ? (
                <span>
                  Mode Cetak: <strong>Harian</strong> ({dailyPages.length}{' '}
                  halaman — Rekap faktur harian per tanggal kalender).
                </span>
              ) : (
                <span>
                  Mode Cetak: <strong>Rekap Periode</strong> (1 lembar —
                  Konsolidasi hemat kertas untuk seluruh periode).
                </span>
              )
            ) : data.isPerSnapshot ? (
              <span>
                Faktur Pengiriman Snapshot <strong>{data.waktuMakan}</strong>.
              </span>
            ) : (
              <span>
                Format Resmi Faktur Pengiriman RSUD dr. Slamet Garut & PT.
                Tradco Energy Indonesia.
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
              {isRange
                ? printMode === 'SNAPSHOT_PAGES'
                  ? `Cetak ${snapshotPages.length} Lembar Snapshot (Print / PDF)`
                  : printMode === 'DAILY_PAGES'
                    ? `Cetak ${dailyPages.length} Lembar Harian (Print / PDF)`
                    : 'Cetak Faktur Rekap (Print / PDF)'
                : data.isPerSnapshot
                  ? `Cetak Faktur ${data.waktuMakan} (Print / PDF)`
                  : 'Cetak Faktur Pengiriman (Print / PDF)'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
