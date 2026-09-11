'use client';

import React, { useRef, useMemo } from 'react';
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
import { Printer, Check } from 'lucide-react';
import type { DpmpPatientItem, DpmpSummaryData } from '@/types/dpmptypes';
import { isNpoPatient } from '@/lib/npo-utils';

interface DpmpPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientsToPrint: DpmpPatientItem[];
  summaryData: DpmpSummaryData;
  title?: string;
}

export default function DpmpPrintModal({
  open,
  onOpenChange,
  patientsToPrint,
  summaryData,
  title,
}: DpmpPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Group patients by Ruangan so each Ruangan gets its own formal hospital DPMP sheet (strictly feeding patients only)
  const groupedByRuangan = useMemo(() => {
    const feedingOnly = patientsToPrint.filter(
      (p) => !isNpoPatient(p) && p.status !== 'NPO',
    );
    const map = new Map<string, DpmpPatientItem[]>();
    feedingOnly.forEach((p) => {
      const r = p.ruangan || 'Ruangan';
      if (!map.has(r)) {
        map.set(r, []);
      }
      map.get(r)!.push(p);
    });

    return Array.from(map.entries()).map(([ruanganName, list]) => {
      const distinctKelas = Array.from(
        new Set(list.map((item) => item.kelas).filter(Boolean)),
      );
      return {
        ruanganName,
        kelasListStr: distinctKelas.join(', ') || '-',
        patients: list,
      };
    });
  }, [patientsToPrint]);

  const totalPorsiToPrint = useMemo(() => {
    return groupedByRuangan.reduce((sum, g) => sum + g.patients.length, 0);
  }, [groupedByRuangan]);

  const isSingle = totalPorsiToPrint === 1;
  const singlePatient =
    isSingle && groupedByRuangan[0]?.patients[0]
      ? groupedByRuangan[0].patients[0]
      : null;

  const docTitle =
    title ||
    (isSingle
      ? `DPMP_${singlePatient?.ruangan || 'Pasien'}_${singlePatient?.no_rm || ''}`
      : groupedByRuangan.length === 1
        ? `DPMP_${groupedByRuangan[0].ruanganName}_${summaryData.batch?.batch_code || 'Batch'}`
        : `DPMP_Distribusi_${summaryData.batch?.batch_code || 'Batch'}`);

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
          font-family: Arial, Helvetica, sans-serif !important;
        }
        .dpmp-print-sheet {
          page-break-after: always;
          break-after: page;
        }
        .dpmp-print-sheet:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-6xl w-[90vw] min-w-[75vw] max-h-[92vh] flex flex-col p-0 overflow-hidden'>
        {/* Modal Header */}
        <DialogHeader className='p-4 sm:p-5 border-b bg-muted/30'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1 text-left'>
              <DialogTitle className='text-base sm:text-lg font-bold text-foreground flex items-center gap-2'>
                <Printer className='w-5 h-5 text-primary' />
                Preview Cetak DPMP
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                {summaryData.tanggalFormatted} · Makan{' '}
                {summaryData.waktuMakanFormatted} (
                {summaryData.batch?.batch_code || 'Batch Snapshot'})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Info Ruangan yang akan dicetak */}
        <div className='p-4 sm:p-5 bg-muted/25 border-b space-y-2.5'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-bold text-foreground uppercase tracking-wider'>
              Ruangan yang akan dicetak:
            </span>
            <span className='text-xs font-bold text-primary'>
              Total: {groupedByRuangan.length} ruangan ({totalPorsiToPrint} pasien / porsi)
            </span>
          </div>

          <div className='flex flex-wrap gap-2'>
            {groupedByRuangan.map((g) => (
              <div
                key={g.ruanganName}
                className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-primary/30 text-xs font-semibold shadow-2xs text-foreground'
              >
                <Check className='w-3.5 h-3.5 text-primary shrink-0 stroke-[2.5]' />
                <span>Ruangan {g.ruanganName}</span>
                <span className='text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded'>
                  {g.patients.length} pasien
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40 flex justify-center'>
          <div
            ref={printRef}
            className='bg-white text-black p-8 sm:p-10 rounded-xl shadow-md border max-w-[210mm] w-full text-xs leading-normal space-y-10'
            style={{
              minHeight: '297mm',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            {groupedByRuangan.map((group, groupIdx) => (
              <div
                key={group.ruanganName || groupIdx}
                className='dpmp-print-sheet space-y-5'
              >
                {/* 1. Header / Kop Surat */}
                <div className='flex items-center justify-between gap-4 pb-2 border-b border-black/80'>
                  {/* Logo Kiri RSUD */}
                  <div className='w-16 h-16 shrink-0 flex items-center justify-center'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src='/icons/logo-rsud.png'
                      alt='Logo RSUD'
                      className='w-14 h-14 object-contain'
                    />
                  </div>

                  {/* Judul Dokumen & Subjudul */}
                  <div className='flex-1 text-center space-y-0.5'>
                    <h1 className='text-sm sm:text-base font-extrabold uppercase tracking-wide text-black'>
                      DAFTAR PERMINTAAN MAKANAN PASIEN
                    </h1>
                    <h2 className='text-xs sm:text-sm font-bold uppercase tracking-wider text-black'>
                      INSTALASI GIZI RSUD dr. SLAMET KAB. GARUT
                    </h2>
                  </div>

                  {/* Logo Kanan Tradco */}
                  <div className='w-16 h-16 shrink-0 flex items-center justify-center'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src='/icons/logo-tradco.png'
                      alt='Logo Katering'
                      className='w-14 h-14 object-contain'
                    />
                  </div>
                </div>

                {/* 2. Metadata Ruangan & Jadwal (2 Kolom: Kiri & Kanan) */}
                <div className='pt-1 flex items-start justify-between gap-6'>
                  {/* Sisi Kiri: Ruangan, Hari/Tanggal, Jam Makan */}
                  <table className='text-xs font-bold leading-normal'>
                    <tbody>
                      <tr>
                        <td className='w-32 py-0.5 text-black'>RUANGAN</td>
                        <td className='py-0.5 text-black'>
                          : {group.ruanganName.toUpperCase()}
                        </td>
                      </tr>
                      <tr>
                        <td className='w-32 py-0.5 text-black'>HARI/TANGGAL</td>
                        <td className='py-0.5 text-black'>
                          : {summaryData.tanggalFormatted.toUpperCase()}
                        </td>
                      </tr>
                      <tr>
                        <td className='w-32 py-0.5 text-black'>JAM MAKAN</td>
                        <td className='py-0.5 text-black'>
                          : {summaryData.waktuMakanFormatted.toUpperCase()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Sisi Kanan: Jumlah Pasien Utama & Kelas */}
                  <table className='text-xs font-bold leading-normal'>
                    <tbody>
                      <tr>
                        <td className='w-32 py-0.5 text-black'>
                          JUMLAH PASIEN
                        </td>
                        <td className='py-0.5 text-black'>
                          : {group.patients.length}
                        </td>
                      </tr>
                      <tr>
                        <td className='w-32 py-0.5 text-black align-top'>
                          KELAS
                        </td>
                        <td className='py-0.5 text-black'>
                          : {group.kelasListStr.toUpperCase()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. Tabel Rincian Pasien */}
                <div className='pt-1'>
                  <table className='w-full border-collapse border border-black text-xs text-black'>
                    <thead>
                      <tr className='font-bold bg-white text-center border-b border-black'>
                        <th className='border border-black p-2 w-10 text-center font-bold'>
                          No.
                        </th>
                        <th className='border border-black p-2 text-left font-bold min-w-[150px]'>
                          Nama Pasien
                        </th>
                        <th className='border border-black p-2 w-28 text-center font-bold'>
                          No. Rekam Medik
                        </th>
                        <th className='border border-black p-2 text-left font-bold min-w-[140px]'>
                          Diet
                        </th>
                        <th className='border border-black p-2 w-24 text-center font-bold'>
                          Kamar
                        </th>
                        <th className='border border-black p-2 w-20 text-center font-bold'>
                          Nomor Bed
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.patients.map((p, idx) => (
                        <tr key={p.id || idx} className='border-b border-black'>
                          {/* No. */}
                          <td className='border border-black p-2 text-center font-mono'>
                            {idx + 1}
                          </td>

                          {/* Nama Pasien */}
                          <td className='border border-black p-2 text-left font-semibold'>
                            <div className='flex items-center gap-1.5'>
                              <span>{p.nama_pasien}</span>
                              {p.is_emergent && (
                                <span className='text-[10px] text-red-600 font-bold'>
                                  [CITO]
                                </span>
                              )}
                            </div>
                          </td>

                          {/* No. Rekam Medik */}
                          <td className='border border-black p-2 text-center font-mono'>
                            {p.no_rm}
                          </td>

                          {/* Diet */}
                          <td className='border border-black p-2 text-left'>
                            <div className='font-medium'>{p.diet}</div>
                            {(p.extra || p.buah || p.snack) && (
                              <div className='text-[10px] text-gray-700 italic'>
                                {[
                                  p.extra && `Ext: ${p.extra}`,
                                  p.buah && `Buah: ${p.buah}`,
                                  p.snack && `Snk: ${p.snack}`,
                                ]
                                  .filter(Boolean)
                                  .join(', ')}
                              </div>
                            )}
                          </td>

                          {/* Kamar */}
                          <td className='border border-black p-2 text-center font-medium'>
                            {p.kamar || '—'}
                          </td>

                          {/* Nomor Bed */}
                          <td className='border border-black p-2 text-center font-mono font-medium'>
                            {p.bed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Kolom Tanda Tangan 2 Pihak (Sesuai Foto Format RS) */}
                <div className='pt-12 grid grid-cols-2 gap-12 text-center text-xs text-black'>
                  {/* Pihak Kiri: Mengetahui Instalasi Gizi */}
                  <div className='space-y-16'>
                    <p className='font-medium leading-tight'>
                      Mengetahui,
                      <br />
                      Instalasi Gizi
                    </p>
                    <div>
                      <p className='font-bold'>
                        (&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                        &nbsp; &nbsp; &nbsp; &nbsp;)
                      </p>
                    </div>
                  </div>

                  {/* Pihak Kanan: Ahli Gizi Catering */}
                  <div className='space-y-16'>
                    <p className='font-medium leading-tight'>
                      Ahli Gizi Catering
                    </p>
                    <div>
                      <p className='font-bold'>
                        (&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                        &nbsp; &nbsp; &nbsp; &nbsp;)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className='p-4 sm:p-5 border-t bg-muted/20 flex flex-row items-center justify-between gap-3'>
          <div className='text-xs text-muted-foreground hidden sm:block'>
            Pratinjau lembar cetak siap dikirim ke printer atau diunduh sebagai PDF.
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='cursor-pointer text-xs rounded-xl'
            >
              Batal
            </Button>
            <Button
              onClick={() => handlePrint()}
              disabled={groupedByRuangan.length === 0}
              className='gap-2 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer text-xs shadow-xs font-bold rounded-xl'
            >
              <Printer className='w-4 h-4' />
              Cetak Sekarang
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
