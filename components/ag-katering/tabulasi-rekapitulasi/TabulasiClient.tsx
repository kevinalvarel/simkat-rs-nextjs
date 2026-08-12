'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { SnapshotBatch, TabulationSummary } from '@/servers/tabulasi.service';
import { getTabulationSummary } from '@/servers/tabulasi.service';
import TabulasiStats from './TabulasiStats';
import TabulasiBreakdown from './TabulasiBreakdown';
import TabulasiDetailsTable from './TabulasiDetailsTable';
import { Button } from '@/components/ui/button';
import { 
  Printer, 
  Calendar, 
  Database, 
  RefreshCw, 
  GitMerge, 
  BookOpen, 
  ListOrdered,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

interface TabulasiClientProps {
  batches: SnapshotBatch[];
  initialSummary: TabulationSummary | null;
}

export default function TabulasiClient({ batches, initialSummary }: TabulasiClientProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<number>(
    initialSummary?.batch?.id ?? (batches[0]?.id || 0)
  );
  const [summary, setSummary] = useState<TabulationSummary | null>(initialSummary);
  const [activeTab, setActiveTab] = useState<'rekap' | 'daftar'>('rekap');
  const [isPending, startTransition] = useTransition();

  // Load new summary on batch change
  useEffect(() => {
    if (selectedBatchId && selectedBatchId !== initialSummary?.batch?.id) {
      startTransition(async () => {
        try {
          const res = await getTabulationSummary(selectedBatchId);
          if (res) {
            setSummary(res);
            toast.success(`Data batch ${res.batch?.batch_code} berhasil dimuat.`);
          } else {
            toast.error('Gagal mengambil data rekapitulasi.');
          }
        } catch (err) {
          toast.error('Terjadi kesalahan memuat data.');
        }
      });
    }
  }, [selectedBatchId, initialSummary]);

  function handlePrint() {
    window.print();
  }

  const selectedBatch = summary?.batch;

  return (
    <div className="flex flex-1 flex-col gap-5 sm:gap-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden print:p-0 print:max-w-none">
      
      {/* CSS @media print styling overrides */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          aside, header, nav, button, select, [role="tablist"], .no-print {
            display: none !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            background: white !important;
            color: black !important;
            font-size: 12px;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #ccc !important;
            padding: 6px !important;
            text-align: left !important;
          }
        }
      `}</style>

      {/* 1. Header Banner (Hidden in Print) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-teal-500/10 via-primary/5 to-transparent p-4 sm:p-5 rounded-2xl border border-teal-500/20 shadow-xs min-w-0 no-print">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
              Tabulasi & Rekapitulasi Snapshot
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300">
              <Database className="w-3.5 h-3.5" /> Data Katering Dapur
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Rekap porsi memasak, ekstra diet, buah, snack, dan lokasi tujuan pengantaran dari snapshot aktif.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!summary || isPending}
            className="gap-2 shadow-xs text-xs font-bold"
          >
            <Printer className="w-4 h-4" />
            Cetak Dapur (Print)
          </Button>
        </div>
      </div>

      {/* 2. Batch Selector (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border no-print">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-foreground">
            Pilih Snapshot Batch Terkunci:
          </span>
        </div>
        
        <div className="relative flex-1 sm:max-w-md">
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(Number(e.target.value))}
            disabled={isPending}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 pr-8 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            {batches.length === 0 ? (
              <option value="">Tidak ada snapshot terkunci</option>
            ) : (
              batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_code} — {new Date(b.tanggal_produksi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ({b.waktu_makan})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Loading Overlay */}
      {isPending ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4 border rounded-2xl bg-card">
          <RefreshCw className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground">Memuat data rekapitulasi...</p>
        </div>
      ) : summary ? (
        
        /* PRINTABLE WRAPPER */
        <div id="print-area" className="space-y-6">
          
          {/* Print Only Header */}
          <div className="hidden print:block border-b-2 border-foreground pb-4 mb-4">
            <h1 className="text-xl font-bold">REKAPITULASI DAPUR KATERING RS</h1>
            <p className="text-xs">
              Batch: <strong>{selectedBatch?.batch_code}</strong> | 
              Siklus: <strong>{selectedBatch?.waktu_makan}</strong> | 
              Tanggal: <strong>{selectedBatch?.tanggal_produksi ? new Date(selectedBatch.tanggal_produksi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</strong>
            </p>
            <p className="text-xs mt-1">Total Produksi: <strong>{summary.totalPortions} Porsi Makanan</strong></p>
          </div>

          {/* 3. Summary Statistics */}
          <TabulasiStats 
            total={summary.totalPortions}
            mapped={summary.mappedPortions}
            unmapped={summary.unmappedPortions}
            totalRooms={summary.ruanganBreakdown.length}
          />

          {/* 4. Tab Navigation (Hidden in Print) */}
          <div className="flex border-b border-border/80 gap-2 no-print">
            <button
              onClick={() => setActiveTab('rekap')}
              className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'rekap' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Rekapitulasi Dapur
            </button>
            <button
              onClick={() => setActiveTab('daftar')}
              className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'daftar' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              Daftar Rincian Diet
            </button>
          </div>

          {/* 5. Tab Content */}
          {activeTab === 'rekap' ? (
            <div className="animate-in fade-in-50 duration-200">
              <TabulasiBreakdown
                total={summary.totalPortions}
                dietBreakdown={summary.dietBreakdown}
                extraBreakdown={summary.extraBreakdown}
                buahBreakdown={summary.buahBreakdown}
                snackBreakdown={summary.snackBreakdown}
                ruanganBreakdown={summary.ruanganBreakdown}
              />
            </div>
          ) : (
            <div className="animate-in fade-in-50 duration-200">
              <TabulasiDetailsTable details={summary.details} />
            </div>
          )}

        </div>

      ) : (
        <div className="text-center p-12 border border-dashed rounded-2xl">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Pilih snapshot batch untuk melihat tabulasi.</p>
        </div>
      )}

    </div>
  );
}
