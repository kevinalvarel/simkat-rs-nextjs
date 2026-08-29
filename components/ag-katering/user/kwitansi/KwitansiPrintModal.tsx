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
import type { KwitansiPatientItem, KwitansiSummaryData } from '@/types/kwitansitypes';

interface KwitansiPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientsToPrint: KwitansiPatientItem[];
  summaryData: KwitansiSummaryData;
  title?: string;
}

export default function KwitansiPrintModal({
  open,
  onOpenChange,
  patientsToPrint,
  summaryData,
  title,
}: KwitansiPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const isSingle = patientsToPrint.length === 1;
  const singlePatient = isSingle ? patientsToPrint[0] : null;

  const docTitle =
    title ||
    (isSingle
      ? `Kwitansi_Makan_${singlePatient?.no_rm || ''}_${singlePatient?.nama_pasien || ''}`
      : `Kwitansi_Distribusi_Makanan_${summaryData.batch?.batch_code || 'Batch'}`);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: docTitle,
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
        .kwitansi-print-container {
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
                {isSingle
                  ? `Cetak Kwitansi Tanda Terima - ${singlePatient?.nama_pasien}`
                  : `Cetak Kwitansi Distribusi (${patientsToPrint.length} Pasien)`}
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                Pratinjau lembar tanda terima resmi penyerahan makanan pasien rawat inap.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Printable Document Container */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40 flex justify-center'>
          <div
            ref={printRef}
            className='kwitansi-print-container bg-white text-black p-8 sm:p-10 rounded-xl shadow-md border max-w-[210mm] w-full text-sm leading-normal space-y-6'
            style={{ minHeight: '297mm' }}
          >
            {/* 1. Kop Surat Resmi */}
            <div className='border-b-2 border-black pb-3 text-center space-y-1'>
              <h2 className='text-base font-extrabold uppercase tracking-wide'>
                RUMAH SAKIT UMUM DAERAH
              </h2>
              <h3 className='text-xs font-bold uppercase tracking-wider text-gray-700'>
                INSTALASI GIZI & LAYANAN KATERING RUMAH SAKIT
              </h3>
              <p className='text-[11px] text-gray-600'>
                Jl. Kesehatan No. 1 - Layanan Distribusi Makanan Pasien Rawat Inap
              </p>
            </div>

            {/* 2. Judul Dokumen */}
            <div className='text-center space-y-1 pt-1'>
              <h1 className='text-sm font-bold uppercase underline tracking-wider'>
                BUKTI TANDA TERIMA PENYERAHAN MAKANAN PASIEN (KWITANSI DISTRIBUSI)
              </h1>
              <p className='text-xs text-gray-600 font-mono'>
                No. Kwitansi: {summaryData.kwitansiNumber}
              </p>
            </div>

            {/* 3. Metadata Info Block */}
            <div className='grid grid-cols-2 gap-4 text-xs border p-3 rounded bg-gray-50/50'>
              <div>
                <table className='w-full text-xs'>
                  <tbody>
                    <tr>
                      <td className='w-28 text-gray-600 py-0.5'>Hari / Tanggal</td>
                      <td className='font-bold py-0.5'>: {summaryData.tanggalFormatted}</td>
                    </tr>
                    <tr>
                      <td className='text-gray-600 py-0.5'>Waktu Makan</td>
                      <td className='font-bold py-0.5'>
                        : Makan {summaryData.waktuMakanFormatted} ({summaryData.batch?.batch_code || 'Batch Terpilih'})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <table className='w-full text-xs'>
                  <tbody>
                    <tr>
                      <td className='w-28 text-gray-600 py-0.5'>Total Pasien</td>
                      <td className='font-bold py-0.5'>: {patientsToPrint.length} Pasien</td>
                    </tr>
                    <tr>
                      <td className='text-gray-600 py-0.5'>Waktu Cetak</td>
                      <td className='font-mono py-0.5'>: {new Date().toLocaleString('id-ID')} WIB</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Tabel Daftar Pasien Penerima Makanan */}
            <div className='space-y-2'>
              <h4 className='text-xs font-bold uppercase tracking-wide text-gray-800'>
                Daftar Rincian Pasien & Menu Makanan:
              </h4>
              <table className='w-full text-xs border-collapse border border-black text-center'>
                <thead>
                  <tr className='bg-gray-100 font-bold'>
                    <th className='border border-black p-2 w-8'>No</th>
                    <th className='border border-black p-2 w-20'>No RM</th>
                    <th className='border border-black p-2 text-left'>Nama Pasien</th>
                    <th className='border border-black p-2 w-28 text-left'>Ruangan & Bed</th>
                    <th className='border border-black p-2 w-16'>Kelas</th>
                    <th className='border border-black p-2 text-left'>Jenis Diet & Ekstra</th>
                    <th className='border border-black p-2 w-16'>Status</th>
                    <th className='border border-black p-2 w-20'>Paraf</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsToPrint.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td className='border border-black p-1.5 font-mono'>{idx + 1}</td>
                      <td className='border border-black p-1.5 font-mono'>{p.no_rm}</td>
                      <td className='border border-black p-1.5 text-left font-semibold pl-2'>
                        {p.nama_pasien}
                        {p.is_emergent && <span className='text-[10px] text-red-600 ml-1 font-bold'>[CITO]</span>}
                      </td>
                      <td className='border border-black p-1.5 text-left pl-2'>
                        {p.ruangan} ({p.bed})
                      </td>
                      <td className='border border-black p-1.5 font-bold'>{p.kelas}</td>
                      <td className='border border-black p-1.5 text-left pl-2'>
                        <div>{p.diet}</div>
                        {(p.extra || p.buah || p.snack) && (
                          <div className='text-[10px] text-gray-600 italic'>
                            {[p.extra && `Ext: ${p.extra}`, p.buah && `Buah: ${p.buah}`, p.snack && `Snk: ${p.snack}`]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                      </td>
                      <td className='border border-black p-1.5 font-semibold text-[10px]'>
                        {p.status}
                      </td>
                      <td className='border border-black p-1.5 text-center text-gray-300 font-mono text-[10px]'>
                        ( &nbsp; &nbsp; &nbsp; &nbsp; )
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5. Pernyataan Penyerahan */}
            <div className='p-3 bg-gray-50 border border-gray-300 rounded text-xs space-y-1'>
              <p>
                <strong>Pernyataan Serah Terima:</strong> Makanan pasien di atas telah disiapkan oleh pihak katering sesuai diet dan diserahkan dalam keadaan baik, bersih, dan tepat waktu ke ruang perawatan bersangkutan.
              </p>
            </div>

            {/* 6. Kolom Tanda Tangan 3 Pihak */}
            <div className='pt-6 grid grid-cols-3 gap-4 text-center text-xs'>
              <div className='space-y-16'>
                <p>
                  Yang Menyerahkan:
                  <br />
                  <strong>Pramusaji / Katering</strong>
                </p>
                <div>
                  <p className='font-bold underline'>( ........................................ )</p>
                  <p className='text-[10px] text-gray-500'>Petugas Distribusi</p>
                </div>
              </div>

              <div className='space-y-16'>
                <p>
                  Yang Menerima:
                  <br />
                  <strong>Perawat / PJ Ruangan</strong>
                </p>
                <div>
                  <p className='font-bold underline'>( ........................................ )</p>
                  <p className='text-[10px] text-gray-500'>Perawat Jaga</p>
                </div>
              </div>

              <div className='space-y-16'>
                <p>
                  Mengetahui / Pengawas:
                  <br />
                  <strong>Ahli Gizi RS</strong>
                </p>
                <div>
                  <p className='font-bold underline'>( ........................................ )</p>
                  <p className='text-[10px] text-gray-500'>NIP. ...................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
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
            className='gap-2 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer text-xs shadow-xs font-bold'
          >
            <Printer className='w-4 h-4' />
            Cetak Dokumen Kwitansi (Print / PDF)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
