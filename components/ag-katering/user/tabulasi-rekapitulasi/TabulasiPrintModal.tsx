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
import type { TabulasiHospitalData } from '@/types/tabulasitypes';

interface TabulasiPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalData: TabulasiHospitalData;
}

export default function TabulasiPrintModal({
  open,
  onOpenChange,
  hospitalData,
}: TabulasiPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Tabulasi_Kebutuhan_Makanan_RS_${hospitalData.waktuMakan}_${hospitalData.tanggal}`,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 8mm 10mm;
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
        .tabulasi-print-container {
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
      <DialogContent className="max-w-7xl w-[92vw] min-w-[75vw] max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="p-4 sm:p-5 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-left">
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                Cetak Lembar Tabulasi Porsi Makanan Pasien (Gedung Lama & Gedung Baru)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pratinjau lembar kerja resmi produksi dapur instalasi gizi rumah sakit format A4 Landscape.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Document Preview Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40 flex justify-center">
          <div
            ref={printRef}
            className="tabulasi-print-container bg-white text-black p-6 sm:p-8 rounded-xl shadow-md border max-w-[280mm] w-full text-xs leading-normal space-y-4 font-sans"
            style={{ minHeight: '190mm' }}
          >
            {/* Letterhead / Kop */}
            <div className="border-b-2 border-black pb-2 flex items-center justify-between gap-4">
              <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-rsud.png"
                  alt="Logo RS"
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="flex-1 text-center space-y-0.5">
                <h2 className="text-sm font-extrabold uppercase tracking-wide">
                  RUMAH SAKIT UMUM DAERAH
                </h2>
                <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                  INSTALASI GIZI & PELAYANAN KATERING MAKANAN
                </h3>
                <p className="text-[10px] text-gray-700">
                  Jl. Rumah Sakit No. 1, Telp: (021) 1234567 • Layanan Gizi Rawat Inap
                </p>
              </div>

              <div className="w-14 h-14 shrink-0 text-right text-[10px] font-mono">
                <span className="font-bold border border-black px-1.5 py-0.5 rounded">
                  {hospitalData.batchCode}
                </span>
              </div>
            </div>

            {/* Document Title & Meta */}
            <div className="text-center space-y-1">
              <h1 className="text-sm font-extrabold underline uppercase tracking-wide">
                TABULASI KEBUTUHAN MAKANAN PASIEN
              </h1>
              <div className="flex justify-between items-center text-[11px] font-bold px-2 pt-1">
                <span>HARI / TANGGAL: {hospitalData.tanggalFormatted.toUpperCase()}</span>
                <span>WAKTU MAKAN: {hospitalData.waktuMakan.toUpperCase()}</span>
                <span>SIKLUS MENU: {hospitalData.siklusNama.toUpperCase()}</span>
              </div>
            </div>

            {/* Side by Side Tables for Gedung Lama & Gedung Baru */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              
              {/* GEDUNG LAMA */}
              <div className="border border-black">
                <div className="bg-[#568203] text-white p-1 text-center font-bold text-xs uppercase">
                  GEDUNG LAMA
                </div>
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-[#b4d330] text-black font-bold border-b border-black">
                      <th className="border-r border-black p-1 text-left w-20">KATEGORI</th>
                      <th className="border-r border-black p-1 text-left">
                        {hospitalData.waktuMakan.toUpperCase()} (MENU HIDANGAN)
                      </th>
                      <th className="border-r border-black p-1 text-center w-14">DIET</th>
                      <th className="p-1 text-center w-14">PORSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitalData.categoryGroups.map((group) => {
                      const isTktp = group.isTktp || group.kategori.includes('TKTP');
                      return (
                        <React.Fragment key={`print-gl-${group.kategori}`}>
                          {group.items.map((item, idx) => (
                            <tr
                              key={`print-gl-item-${item.id}`}
                              className={`border-b border-black ${isTktp ? 'bg-[#ffec8b] font-bold' : ''}`}
                            >
                              <td className="border-r border-black p-1 font-bold align-top">
                                {idx === 0 ? group.kategori : ''}
                              </td>
                              <td className="border-r border-black p-1">{item.nama_menu}</td>
                              <td className="border-r border-black p-1 text-center font-bold">{item.kode_diet}</td>
                              <td className="p-1 text-center font-bold font-mono">{item.porsi_gedung_lama}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                    <tr className="bg-[#b4d330] text-black font-bold border-t-2 border-black">
                      <td colSpan={3} className="p-1 text-left border-r border-black">TOTAL PORSI GEDUNG LAMA</td>
                      <td className="p-1 text-center font-mono font-extrabold">{hospitalData.totalGedungLama}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* GEDUNG BARU */}
              <div className="border border-black">
                <div className="bg-[#568203] text-white p-1 text-center font-bold text-xs uppercase">
                  GEDUNG BARU
                </div>
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-[#b4d330] text-black font-bold border-b border-black">
                      <th className="border-r border-black p-1 text-left w-20">KATEGORI</th>
                      <th className="border-r border-black p-1 text-left">
                        {hospitalData.waktuMakan.toUpperCase()} (MENU HIDANGAN)
                      </th>
                      <th className="border-r border-black p-1 text-center w-14">DIET</th>
                      <th className="p-1 text-center w-14">PORSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitalData.categoryGroups.map((group) => {
                      const isTktp = group.isTktp || group.kategori.includes('TKTP');
                      return (
                        <React.Fragment key={`print-gb-${group.kategori}`}>
                          {group.items.map((item, idx) => (
                            <tr
                              key={`print-gb-item-${item.id}`}
                              className={`border-b border-black ${isTktp ? 'bg-[#ffec8b] font-bold' : ''}`}
                            >
                              <td className="border-r border-black p-1 font-bold align-top">
                                {idx === 0 ? group.kategori : ''}
                              </td>
                              <td className="border-r border-black p-1">{item.nama_menu}</td>
                              <td className="border-r border-black p-1 text-center font-bold">{item.kode_diet}</td>
                              <td className="p-1 text-center font-bold font-mono">{item.porsi_gedung_baru}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                    <tr className="bg-[#b4d330] text-black font-bold border-t-2 border-black">
                      <td colSpan={3} className="p-1 text-left border-r border-black">TOTAL PORSI GEDUNG BARU</td>
                      <td className="p-1 text-center font-mono font-extrabold">{hospitalData.totalGedungBaru}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Grand Total Highlight */}
            <div className="flex justify-between items-center bg-gray-100 border border-black p-2 text-xs font-bold">
              <span>REKAPITULASI: {hospitalData.totalPasienMakan} Pasien Makan • {hospitalData.totalDietKhusus} Diet Khusus / TKTP</span>
              <span className="font-extrabold text-sm">
                GRAND TOTAL PORSI (LAMA + BARU): {hospitalData.grandTotalPorsi} PORSI
              </span>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-4 text-center text-[10px]">
              <div className="space-y-12">
                <p>Petugas Pengolah / Juru Masak,</p>
                <div>
                  <p className="font-bold underline">( ............................................ )</p>
                  <p className="text-gray-600">Tim Dapur Katering</p>
                </div>
              </div>

              <div className="space-y-12">
                <p>Ahli Gizi Distribusi Jaga,</p>
                <div>
                  <p className="font-bold underline">( ............................................ )</p>
                  <p className="text-gray-600">Nutrisionis Pelaksana</p>
                </div>
              </div>

              <div className="space-y-12">
                <p>Kepala Instalasi Gizi RS,</p>
                <div>
                  <p className="font-bold underline">( ............................................ )</p>
                  <p className="text-gray-600">NIP: .......................................</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-3 sm:p-4 border-t bg-muted/30 flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Format tabel siap cetak untuk dapur instalasi gizi (A4 Landscape).</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl"
            >
              Tutup
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handlePrint()}
              className="text-xs font-bold rounded-xl bg-primary text-primary-foreground gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen Sekarang
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
