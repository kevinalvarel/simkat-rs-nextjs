'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Printer, 
  FileText, 
  FileSpreadsheet, 
  RefreshCw, 
  Plus,
  Zap
} from 'lucide-react';

interface TabulasiQuickActionsProps {
  onOpenGenerate: () => void;
  onPrint: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function TabulasiQuickActions({
  onOpenGenerate,
  onPrint,
  onExportPdf,
  onExportExcel,
  onRefresh,
  isRefreshing = false,
}: TabulasiQuickActionsProps) {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
      
      {/* Title / Info */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-foreground">
            Aksi Cepat & Operasional Dapur
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Akses langsung cetak tiket, export laporan, dan pembuatan tabulasi porsi.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-1.5 h-8 text-xs font-semibold rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          Refresh
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onPrint}
          className="gap-1.5 h-8 text-xs font-semibold rounded-xl"
        >
          <Printer className="w-3.5 h-3.5 text-muted-foreground" />
          Cetak Tabulasi
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExportPdf}
          className="gap-1.5 h-8 text-xs font-semibold rounded-xl"
        >
          <FileText className="w-3.5 h-3.5 text-rose-500" />
          PDF
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExportExcel}
          className="gap-1.5 h-8 text-xs font-semibold rounded-xl"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          Excel
        </Button>

        <Button
          size="sm"
          onClick={onOpenGenerate}
          className="gap-1.5 h-8 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          Generate Tabulasi
        </Button>
      </div>

    </div>
  );
}
