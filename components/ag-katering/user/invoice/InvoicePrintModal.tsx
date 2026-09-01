'use client';

import React, { useRef } from 'react';
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
import { Printer, FileText, CheckCircle2 } from 'lucide-react';
import type { InvoiceDailySummary } from '@/types/invoicetypes';
import Image from 'next/image';

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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Rekap_Konsumsi_Makanan_Harian_${data.tanggal}`,
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
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-7xl w-[80vw] min-w-[70vw] max-h-[92vh] flex flex-col p-0 overflow-hidden'>
        {/* Modal Header */}
        <DialogHeader className='p-4 sm:p-5 border-b bg-muted/30'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1 text-left'>
              <DialogTitle className='text-base sm:text-lg font-bold text-foreground flex items-center gap-2'>
                <Printer className='w-5 h-5 text-primary' />
                Cetak Dokumen Rekap Konsumsi Makanan Harian per Kelas
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                Pratinjau lembar rekapitulasi resmi konsumsi makanan pasien
                untuk verifikasi katering.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Document Preview Scroll Area */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40 flex justify-center'>
          <div
            ref={printRef}
            className='invoice-print-container bg-white text-black p-8 sm:p-10 rounded-xl shadow-md border max-w-[210mm] w-full text-sm leading-normal space-y-6'
            style={{ minHeight: '297mm' }}
          >
            {/* 1. Header / Letterhead Kop Surat */}
            <div className='border-b-2 border-black pb-3 flex items-center justify-between gap-4'>
              {/* Logo Kiri */}
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
                  {data.hospitalName}
                </h2>
                <h3 className='text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-800'>
                  {data.cateringVendor}
                </h3>
                <p className='text-[11px] sm:text-xs text-gray-600'>
                  Layanan Pengelolaan Gizi & Distribusi Makanan Pasien Rawat
                  Inap
                </p>
              </div>

              {/* Logo Kanan */}
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
                BERITA ACARA REKAPITULASI KONSUMSI MAKANAN HARIAN PER KELAS
              </h1>
              <p className='text-xs text-gray-600 font-mono'>
                No: {data.invoiceNumber}
              </p>
            </div>

            {/* 3. Info Block */}
            <div className='grid grid-cols-2 gap-4 text-xs border p-3 rounded bg-gray-50/50'>
              <div>
                <table className='w-full text-xs'>
                  <tbody>
                    <tr>
                      <td className='w-28 text-gray-600 py-0.5'>
                        Hari / Tanggal
                      </td>
                      <td className='font-bold py-0.5'>
                        : {data.tanggalFormatted}
                      </td>
                    </tr>
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
                      <td className='w-28 text-gray-600 py-0.5'>
                        Status Batch
                      </td>
                      <td className='font-bold py-0.5'>
                        :{' '}
                        {data.statusBatch === 'OFFICIAL_LOCKED'
                          ? 'Terkunci (Official)'
                          : 'Live Preview'}
                      </td>
                    </tr>
                    <tr>
                      <td className='text-gray-600 py-0.5'>Waktu Cetak</td>
                      <td className='font-mono py-0.5'>
                        : {new Date().toLocaleString('id-ID')} WIB
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Main Consumption Table per Class */}
            <div className='space-y-2'>
              <h4 className='text-xs font-bold uppercase tracking-wide text-gray-800'>
                I. Tabel Rekapitulasi Jumlah Porsi per Kelas Perawatan
              </h4>
              <table className='w-full text-xs border-collapse border border-black text-center'>
                <thead>
                  <tr className='bg-gray-100 font-bold'>
                    <th className='border border-black p-2 w-10'>No</th>
                    <th className='border border-black p-2 text-left'>
                      Kelas Perawatan
                    </th>
                    <th className='border border-black p-2 w-20'>Pasien</th>
                    <th className='border border-black p-2 w-20'>Pagi</th>
                    <th className='border border-black p-2 w-20'>Siang</th>
                    <th className='border border-black p-2 w-20'>Malam</th>
                    <th className='border border-black p-2 w-20'>Extra</th>
                    <th className='border border-black p-2 w-24 bg-gray-200'>
                      Total Porsi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.classes.map((row, idx) => (
                    <tr key={row.kelas}>
                      <td className='border border-black p-1.5'>{idx + 1}</td>
                      <td className='border border-black p-1.5 text-left font-bold pl-2.5'>
                        {row.kelas}
                      </td>
                      <td className='border border-black p-1.5 font-mono'>
                        {row.totalPasien}
                      </td>
                      <td className='border border-black p-1.5 font-mono'>
                        {row.pagiCount}
                      </td>
                      <td className='border border-black p-1.5 font-mono'>
                        {row.siangCount}
                      </td>
                      <td className='border border-black p-1.5 font-mono'>
                        {row.malamCount}
                      </td>
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
                      {data.grandTotalPasien}
                    </td>
                    <td className='border border-black p-2 font-mono'>
                      {data.grandTotalPagi}
                    </td>
                    <td className='border border-black p-2 font-mono'>
                      {data.grandTotalSiang}
                    </td>
                    <td className='border border-black p-2 font-mono'>
                      {data.grandTotalMalam}
                    </td>
                    <td className='border border-black p-2 font-mono'>
                      {data.grandTotalExtra}
                    </td>
                    <td className='border border-black p-2 font-mono text-sm bg-gray-300'>
                      {data.grandTotalPorsi}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Summary Statement */}
            <div className='p-3 bg-gray-50 border border-gray-300 rounded text-xs space-y-1'>
              <p>
                <strong>Catatan Verifikasi:</strong> Total keseluruhan porsi
                makan pasien yang diproduksi dan didistribusikan pada tanggal{' '}
                <strong>{data.tanggalFormatted}</strong> adalah sebanyak{' '}
                <strong className='underline'>
                  {data.grandTotalPorsi} Porsi
                </strong>{' '}
                untuk <strong>{data.grandTotalPasien} Pasien</strong> rawat
                inap.
              </p>
            </div>

            {/* 6. Signature Block */}
            <div className='pt-8 grid grid-cols-2 gap-8 text-center text-xs'>
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
        </div>

        {/* Modal Footer with Print Button */}
        <DialogFooter className='p-4 border-t bg-muted/20 gap-2 sm:gap-0'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='cursor-pointer text-xs'
          >
            Tutup
          </Button>
          <Button
            onClick={() => handlePrint()}
            className='gap-2 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer text-xs shadow-xs'
          >
            <Printer className='w-4 h-4' />
            Cetak Dokumen (Print / PDF)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
