'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Printer, 
  Check, 
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import type { TabulasiDashboardData } from '@/types/tabulasitypes';
import { exportTabulasiToExcel, exportTabulasiToHtmlExcel } from '@/lib/exportTabulasiExcel';

interface TabulasiExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  data: TabulasiDashboardData;
  selectedDate: string;
  selectedMeal: string;
}

export default function TabulasiExportModal({
  isOpen,
  onClose,
  onPrint,
  data,
  selectedDate,
  selectedMeal,
}: TabulasiExportModalProps) {
  const [exportType, setExportType] = useState<'excel' | 'excel_colored' | 'print'>('excel');
  const [isExporting, setIsExporting] = useState(false);

  function handleExecuteExport() {
    setIsExporting(true);

    if (exportType === 'print') {
      onClose();
      setIsExporting(false);
      setTimeout(() => {
        onPrint();
      }, 300);
      return;
    }

    try {
      if (exportType === 'excel') {
        exportTabulasiToExcel(data, selectedDate, selectedMeal);
        toast.success(`File Excel (.xlsx) berhasil di-generate sesuai format fisik RS.`);
      } else if (exportType === 'excel_colored') {
        exportTabulasiToHtmlExcel(data, selectedDate, selectedMeal);
        toast.success(`File Excel Berwarna (.xls) berhasil diunduh.`);
      }
      onClose();
    } catch (err) {
      toast.error('Gagal mengekspor file Excel.');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isExporting && onClose()}>
      <DialogContent className="sm:max-w-md">
        
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="p-2 rounded-xl bg-primary/10">
              <Download className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Export & Cetak Tabulasi RS
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Pilih format dokumen laporan rekapitulasi gizi untuk tanggal{' '}
            <strong className="text-foreground">{selectedDate}</strong> (Siklus{' '}
            <strong className="text-foreground">{selectedMeal}</strong>).
          </DialogDescription>
        </DialogHeader>

        {/* Options */}
        <div className="space-y-3 py-2">
          
          {/* Option 1: Excel Standard */}
          <div
            onClick={() => setExportType('excel')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              exportType === 'excel'
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'border-border hover:bg-muted/30 bg-card'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  Spreadsheet Excel Standar (.xlsx)
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Format matriks tabel lengkap sesuai lembar fisik: Rekap Pasien, Menu Gedung Lama/Baru, dan Tabulasi Snack.
                </p>
              </div>
            </div>

            {exportType === 'excel' && (
              <span className="p-1 rounded-full bg-primary text-primary-foreground">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Option 2: Excel Berwarna */}
          <div
            onClick={() => setExportType('excel_colored')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              exportType === 'excel_colored'
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'border-border hover:bg-muted/30 bg-card'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  Excel Berwarna & Styling (.xls)
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Format tabel dengan highlight warna kuning & hijau persis dokumen asli.
                </p>
              </div>
            </div>

            {exportType === 'excel_colored' && (
              <span className="p-1 rounded-full bg-primary text-primary-foreground">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Option 3: Print / PDF */}
          <div
            onClick={() => setExportType('print')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              exportType === 'print'
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'border-border hover:bg-muted/30 bg-card'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  Cetak Dokumen Fisik / PDF (A4)
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Buka print dialog dengan layout 100% presisi lembar kerja dapur RS.
                </p>
              </div>
            </div>

            {exportType === 'print' && (
              <span className="p-1 rounded-full bg-primary text-primary-foreground">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isExporting}
            className="text-xs rounded-xl"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="text-xs font-bold rounded-xl bg-primary text-primary-foreground gap-1.5"
          >
            {isExporting ? (
              'Memproses Dokumen...'
            ) : exportType === 'print' ? (
              <>
                <Printer className="w-3.5 h-3.5" />
                Cetak / Simpan PDF
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Unduh Excel
              </>
            )}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
