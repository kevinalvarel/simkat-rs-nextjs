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
import {
  Printer,
  FileText,
  Layers,
  Files,
  Calendar,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import type { InvoiceDailySummary } from '@/types/invoicetypes';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface InvoicePrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: InvoiceDailySummary;
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
      ? `Snapshot_Konsumsi_Makanan_Periode_${data.startDate}_sd_${data.endDate}`
      : printMode === 'DAILY_PAGES'
        ? `Harian_Konsumsi_Makanan_Periode_${data.startDate}_sd_${data.endDate}`
        : `Rekap_Konsumsi_Makanan_Periode_${data.startDate}_sd_${data.endDate}`
    : data.isPerSnapshot
      ? `Invoice_Konsumsi_Snapshot_${data.waktuMakan}_${data.tanggal}`
      : `Rekap_Konsumsi_Makanan_Harian_${data.tanggal}`;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 12mm 15mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: 'Times New Roman', Times, serif, Arial, sans-serif !important;
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
          padding: 0 0 20mm 0 !important;
          min-height: 265mm !important;
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
      }
    `,
  });

  // Helper renderer for a single invoice sheet
  function renderSheet(
    summary: InvoiceDailySummary,
    isSummaryOfRange: boolean,
    pageIndex?: number,
    totalPages?: number,
  ) {
    const isPerSnap = Boolean(summary.isPerSnapshot);
    const hasRevisiPatients =
      summary.revisiPatients && summary.revisiPatients.length > 0;

    return (
      <div
        key={`${summary.tanggal}-${summary.batchId || pageIndex || 0}`}
        className='invoice-single-sheet bg-white text-black p-8 sm:p-10 rounded-xl shadow-md border max-w-[210mm] w-full text-sm leading-normal space-y-6'
        style={{ minHeight: '297mm' }}
      >
        {/* 1. Header / Letterhead Kop Surat */}
        <div className='border-b-2 border-black pb-3 flex items-center justify-between gap-4'>
          {/* Logo Kiri RS */}
          <div className='w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src='/icons/logo-rsud.png'
              alt='Logo Rumah Sakit'
              className='w-14 h-14 sm:w-16 sm:h-16 object-contain'
            />
          </div>

          {/* Teks Kop Surat */}
          <div className='flex-1 text-center space-y-1'>
            <h2 className='text-base sm:text-lg font-extrabold uppercase tracking-wide text-black'>
              {summary.hospitalName}
            </h2>
            <h3 className='text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-800'>
              {summary.cateringVendor}
            </h3>
            <p className='text-[11px] sm:text-xs text-gray-600'>
              Layanan Pengelolaan Gizi & Distribusi Makanan Pasien Rawat Inap
            </p>
          </div>

          {/* Logo Kanan Vendor */}
          <div className='w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image
              src='/icons/logo-tradco.png'
              alt='Logo Katering'
              className='w-14 h-14 sm:w-16 sm:h-16 object-contain'
              height={50}
              width={50}
            />
          </div>
        </div>

        {/* 2. Document Title & Metadata */}
        <div className='text-center space-y-1 pt-1'>
          <h1 className='text-sm font-bold uppercase underline tracking-wider'>
            {isSummaryOfRange
              ? 'BERITA ACARA REKAPITULASI KONSUMSI MAKANAN PERIODE PER KELAS'
              : isPerSnap
                ? `BERITA ACARA REKAPITULASI KONSUMSI MAKANAN PER SNAPSHOT (${summary.waktuMakan})`
                : 'BERITA ACARA REKAPITULASI KONSUMSI MAKANAN HARIAN PER KELAS'}
          </h1>
          <p className='text-xs text-gray-600 font-mono'>
            No: {summary.invoiceNumber}
          </p>
        </div>

        {/* 3. Info Block */}
        <div className='grid grid-cols-2 gap-4 text-xs border p-3 rounded bg-gray-50/50'>
          <div>
            <table className='w-full text-xs'>
              <tbody>
                <tr>
                  <td className='w-28 text-gray-600 py-0.5'>
                    {isSummaryOfRange ? 'Periode Tanggal' : 'Hari / Tanggal'}
                  </td>
                  <td className='font-bold py-0.5'>
                    : {summary.tanggalFormatted}
                  </td>
                </tr>
                {isPerSnap && (
                  <tr>
                    <td className='text-gray-600 py-0.5'>Siklus Makan</td>
                    <td className='font-bold py-0.5'>: {summary.waktuMakan}</td>
                  </tr>
                )}
                {isSummaryOfRange && (
                  <tr>
                    <td className='text-gray-600 py-0.5'>Jumlah Hari</td>
                    <td className='font-semibold py-0.5'>
                      : {summary.totalDays} Hari Kalender
                    </td>
                  </tr>
                )}
                <tr>
                  <td className='text-gray-600 py-0.5'>Unit Layanan</td>
                  <td className='font-semibold py-0.5'>
                    : Rawat Inap (Semua Gedung)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className='w-full text-xs'>
              <tbody>
                <tr>
                  <td className='w-28 text-gray-600 py-0.5'>Status Batch</td>
                  <td className='font-bold py-0.5'>
                    :{' '}
                    {summary.statusBatch === 'OFFICIAL_LOCKED'
                      ? `Terkunci (Official${summary.batchId ? ` - Batch #${summary.batchId}` : ''})`
                      : 'Live Preview'}
                  </td>
                </tr>
                {isPerSnap && summary.cutoffTime && (
                  <tr>
                    <td className='text-gray-600 py-0.5'>Cut-off Snapshot</td>
                    <td className='font-mono py-0.5'>
                      : {summary.cutoffTime} WIB
                    </td>
                  </tr>
                )}
                <tr>
                  <td className='text-gray-600 py-0.5'>Waktu Cetak</td>
                  <td className='font-mono py-0.5'>
                    : {new Date().toLocaleString('id-ID')} WIB
                  </td>
                </tr>
                {totalPages && totalPages > 1 && (
                  <tr>
                    <td className='text-gray-600 py-0.5'>Halaman Cetak</td>
                    <td className='font-semibold py-0.5'>
                      : Hal. {pageIndex} dari {totalPages}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Main Consumption Table per Class */}
        <div className='space-y-2'>
          <h4 className='text-xs font-bold uppercase tracking-wide text-gray-800'>
            {isPerSnap
              ? `I. Tabel Rekapitulasi Jumlah Porsi Snapshot ${summary.waktuMakan} per Kelas (Baseline + Revisi)`
              : isSummaryOfRange
                ? 'I. Tabel Rekapitulasi Jumlah Porsi Periode per Kelas Perawatan'
                : 'I. Tabel Rekapitulasi Jumlah Porsi per Kelas Perawatan'}
          </h4>

          <table className='w-full text-xs border-collapse border border-black text-center'>
            <thead>
              <tr className='bg-gray-100 font-bold'>
                <th className='border border-black p-2 w-10'>No</th>
                <th className='border border-black p-2 text-left'>
                  Kelas Perawatan
                </th>
                <th className='border border-black p-2 w-20'>
                  {isSummaryOfRange ? 'Pasien-Hari' : 'Pasien'}
                </th>

                {/* Specific columns for Per-Snapshot mode */}
                {isPerSnap ? (
                  <>
                    <th className='border border-black p-2 w-28'>
                      Baseline Snapshot
                    </th>
                    <th className='border border-black p-2 w-28'>
                      Tambah Pasien (Susulan)
                    </th>
                  </>
                ) : (
                  <>
                    <th className='border border-black p-2 w-18'>Pagi</th>
                    <th className='border border-black p-2 w-18'>Siang</th>
                    <th className='border border-black p-2 w-18'>Malam</th>
                  </>
                )}

                <th className='border border-black p-2 w-18'>Extra</th>
                <th className='border border-black p-2 w-24 bg-gray-200'>
                  Total Porsi
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.classes.map((row, idx) => (
                <tr key={row.kelas}>
                  <td className='border border-black p-1.5'>{idx + 1}</td>
                  <td className='border border-black p-1.5 text-left font-bold pl-2.5'>
                    {row.kelas}
                  </td>
                  <td className='border border-black p-1.5 font-mono'>
                    {row.totalPasien}
                  </td>

                  {isPerSnap ? (
                    <>
                      <td className='border border-black p-1.5 font-mono'>
                        {row.baselinePorsi ?? row.totalPorsi}
                      </td>
                      <td className='border border-black p-1.5 font-mono'>
                        {(row.revisiTambahPorsi ?? 0) > 0
                          ? `+${row.revisiTambahPorsi}`
                          : '0'}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className='border border-black p-1.5 font-mono'>
                        {row.pagiCount}
                      </td>
                      <td className='border border-black p-1.5 font-mono'>
                        {row.siangCount}
                      </td>
                      <td className='border border-black p-1.5 font-mono'>
                        {row.malamCount}
                      </td>
                    </>
                  )}

                  <td className='border border-black p-1.5 font-mono'>
                    {row.extraCount}
                  </td>
                  <td className='border border-black p-1.5 font-mono font-extrabold bg-gray-50'>
                    {row.totalPorsi}
                  </td>
                </tr>
              ))}

              {/* Grand Total Row */}
              <tr className='bg-gray-200 font-extrabold'>
                <td
                  colSpan={2}
                  className='border border-black p-2 text-left pl-3'
                >
                  TOTAL KESELURUHAN
                </td>
                <td className='border border-black p-2 font-mono'>
                  {summary.grandTotalPasien}
                </td>

                {isPerSnap ? (
                  <>
                    <td className='border border-black p-2 font-mono'>
                      {summary.baselineTotalPorsi ?? summary.grandTotalPorsi}
                    </td>
                    <td className='border border-black p-2 font-mono'>
                      +{summary.revisiTambahPasienCount ?? 0}
                    </td>
                  </>
                ) : (
                  <>
                    <td className='border border-black p-2 font-mono'>
                      {summary.grandTotalPagi}
                    </td>
                    <td className='border border-black p-2 font-mono'>
                      {summary.grandTotalSiang}
                    </td>
                    <td className='border border-black p-2 font-mono'>
                      {summary.grandTotalMalam}
                    </td>
                  </>
                )}

                <td className='border border-black p-2 font-mono'>
                  {summary.grandTotalExtra}
                </td>
                <td className='border border-black p-2 font-mono text-sm bg-gray-300'>
                  {summary.grandTotalPorsi}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Summary Statement */}
        <div className='p-3 bg-gray-50 border border-gray-300 rounded text-xs space-y-1'>
          <p>
            <strong>Catatan Verifikasi:</strong> Total keseluruhan porsi makan
            pasien yang diproduksi dan didistribusikan{' '}
            {isSummaryOfRange ? (
              <>
                selama periode <strong>{summary.tanggalFormatted}</strong>{' '}
                adalah sebanyak{' '}
                <strong className='underline'>
                  {summary.grandTotalPorsi} Porsi
                </strong>{' '}
                untuk akumulasi{' '}
                <strong>{summary.grandTotalPasien} Pasien-Hari</strong> rawat
                inap.
              </>
            ) : isPerSnap ? (
              <>
                pada siklus makan <strong>{summary.waktuMakan}</strong> tanggal{' '}
                <strong>{summary.tanggalFormatted}</strong> adalah sebanyak{' '}
                <strong className='underline'>
                  {summary.grandTotalPorsi} Porsi
                </strong>{' '}
                (terdiri dari{' '}
                <strong>
                  {summary.baselineTotalPorsi ?? summary.grandTotalPorsi} Porsi
                  Baseline Snapshot
                </strong>{' '}
                dan{' '}
                <strong>
                  +{summary.revisiTambahPasienCount ?? 0} Porsi Tambahan Revisi
                  Pasien Susulan
                </strong>
                ) untuk <strong>{summary.grandTotalPasien} Pasien</strong> rawat
                inap.
              </>
            ) : (
              <>
                pada tanggal <strong>{summary.tanggalFormatted}</strong> adalah
                sebanyak{' '}
                <strong className='underline'>
                  {summary.grandTotalPorsi} Porsi
                </strong>{' '}
                untuk <strong>{summary.grandTotalPasien} Pasien</strong> rawat
                inap.
              </>
            )}
          </p>
        </div>

        {/* Optional: Detail Tambah Pasien Susulan in official document */}
        {isPerSnap && hasRevisiPatients && (
          <div className='space-y-1 text-xs'>
            <h5 className='font-bold uppercase text-gray-800 text-[11px]'>
              II. Rincian Pasien Tambahan Pasca-Cut-Off (Revisi Tambah Pasien):
            </h5>
            <table className='w-full text-[10px] border-collapse border border-black text-left'>
              <thead>
                <tr className='bg-gray-100 font-bold text-center'>
                  <th className='border border-black p-1 w-6'>No</th>
                  <th className='border border-black p-1'>
                    Nama Pasien & No RM
                  </th>
                  <th className='border border-black p-1'>Ruangan / Bed</th>
                  <th className='border border-black p-1'>Kelas</th>
                  <th className='border border-black p-1'>Diet</th>
                  <th className='border border-black p-1'>Disetujui Oleh</th>
                </tr>
              </thead>
              <tbody>
                {summary.revisiPatients!.map((rp, rIdx) => (
                  <tr key={rp.id}>
                    <td className='border border-black p-1 text-center font-mono'>
                      {rIdx + 1}
                    </td>
                    <td className='border border-black p-1 font-semibold'>
                      {rp.nama_pasien} ({rp.no_rm})
                    </td>
                    <td className='border border-black p-1'>
                      {rp.ruangan} / {rp.bed}
                    </td>
                    <td className='border border-black p-1 text-center font-bold'>
                      {rp.kelas}
                    </td>
                    <td className='border border-black p-1'>{rp.diet}</td>
                    <td className='border border-black p-1 text-gray-600'>
                      {rp.reviewed_by || 'Supervisor Gizi'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Signature Block */}
        <div className='pt-6 grid grid-cols-2 gap-8 text-center text-xs'>
          <div className='space-y-16'>
            <p>
              Pihak I (Penyedia / Katering)
              <br />
              <strong>Penanggung Jawab Katering</strong>
            </p>
            <div>
              <p className='font-bold underline'>
                ( ................................................... )
              </p>
              <p className='text-[10px] text-gray-500'>NIP / ID Vendor</p>
            </div>
          </div>

          <div className='space-y-16'>
            <p>
              Pihak II (Pengawas Rumah Sakit)
              <br />
              <strong>Ahli Gizi Pengawas RS</strong>
            </p>
            <div>
              <p className='font-bold underline'>
                ( ................................................... )
              </p>
              <p className='text-[10px] text-gray-500'>
                NIP. ........................................
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-7xl w-[85vw] min-w-[70vw] max-h-[94vh] flex flex-col p-0 overflow-hidden'>
        {/* Modal Header */}
        <DialogHeader className='p-4 sm:p-5 border-b bg-muted/30'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
            <div className='space-y-1 text-left'>
              <DialogTitle className='text-base sm:text-lg font-bold text-foreground flex items-center gap-2'>
                <Printer className='w-5 h-5 text-primary' />
                Cetak Dokumen Invoice{' '}
                {isRange
                  ? 'Periode'
                  : data.isPerSnapshot
                    ? `Snapshot ${data.waktuMakan}`
                    : 'Harian'}{' '}
                per Kelas
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                {isRange
                  ? `Pratinjau lembar rekapitulasi periode ${data.tanggalFormatted}. Pilih format Rekap, Harian, atau Per-Snapshot.`
                  : data.isPerSnapshot
                    ? `Pratinjau berita acara resmi konsumsi snapshot ${data.waktuMakan} (Baseline Snapshot + Revisi Pasien Susulan).`
                    : 'Pratinjau lembar rekapitulasi resmi konsumsi makanan pasien untuk verifikasi katering.'}
              </DialogDescription>
            </div>

            {/* Print Mode Selector (Only when printing a Date Range) */}
            {isRange && (
              <div className='flex items-center gap-1 p-1 bg-muted/70 dark:bg-muted/40 rounded-xl border border-border/80 text-xs shrink-0 self-start sm:self-auto shadow-2xs'>
                <button
                  type='button'
                  onClick={() => setPrintMode('REKAP')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-xs cursor-pointer select-none',
                    printMode === 'REKAP'
                      ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                  )}
                  title='Cetak total akumulasi periode dalam 1 lembar rekap (Hemat Kertas)'
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
                  title='Cetak setiap tanggal pada lembar / halaman terpisah'
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
                  title='Cetak setiap siklus snapshot per lembar terpisah lengkap dengan rincian batch'
                >
                  <Files className='w-3.5 h-3.5' />
                  <span>Per-Snapshot ({snapshotPages.length})</span>
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Document Preview Scroll Area */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40'>
          <div
            ref={printRef}
            className='invoice-print-container flex flex-col items-center gap-8 w-full'
          >
            {/* Mode A: Single Sheet (Rekap Periode atau Single Snapshot/Harian) */}
            {(!isRange || printMode === 'REKAP') && renderSheet(data, isRange)}

            {/* Mode B: Cetak Harian (Tiap hari dicetak pada lembar terpisah) */}
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

            {/* Mode C: Cetak 1 Snapshot 1 Lembar (Tiap snapshot dicetak per lembar) */}
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
                  kertas terpisah).
                </span>
              ) : printMode === 'DAILY_PAGES' ? (
                <span>
                  Mode Cetak: <strong>Harian</strong> ({dailyPages.length}{' '}
                  halaman — Rekap harian per tanggal kalender).
                </span>
              ) : (
                <span>
                  Mode Cetak: <strong>Rekap Periode</strong> (1 lembar —
                  Konsolidasi hemat kertas untuk seluruh periode).
                </span>
              )
            ) : data.isPerSnapshot ? (
              <span>
                Berita Acara Resmi Snapshot <strong>{data.waktuMakan}</strong>{' '}
                (Baseline + Revisi Pasien Susulan).
              </span>
            ) : (
              <span>
                Format Dokumen A4 Portrait Resmi RSUD dr Slamet Garut.
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
                    : 'Cetak Dokumen Rekap (Print / PDF)'
                : data.isPerSnapshot
                  ? `Cetak Berita Acara ${data.waktuMakan} (Print / PDF)`
                  : 'Cetak Dokumen Rekap (Print / PDF)'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
