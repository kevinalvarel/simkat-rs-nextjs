'use client';

import React, { useState, useMemo } from 'react';
import type {
  RevisiPostSnapshotItem,
  RevisiStats,
} from '@/servers/revisi-snapshot.service';
import RevisiSummaryCards from './RevisiSummaryCards';
import RevisiFilterBar from './RevisiFilterBar';
import RevisiTable from './RevisiTable';
import RevisiDetailDialog from './RevisiDetailDialog';
import KitchenSlipDialog from './KitchenSlipDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RevisiPostSnapshotClientProps {
  initialItems: RevisiPostSnapshotItem[];
  stats: RevisiStats;
}

export default function RevisiPostSnapshotClient({
  initialItems,
  stats,
}: RevisiPostSnapshotClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<RevisiPostSnapshotItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWaktu, setSelectedWaktu] = useState<string>('ALL');
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Dialog States
  const [selectedItem, setSelectedItem] =
    useState<RevisiPostSnapshotItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const [slipItem, setSlipItem] = useState<RevisiPostSnapshotItem | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState<boolean>(false);

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  }

  function handleResetFilters() {
    setSearchQuery('');
    setSelectedWaktu('ALL');
    setSelectedJenis('ALL');
    setSelectedStatus('ALL');
  }

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = item.nama_pasien.toLowerCase().includes(q);
        const matchRm = item.no_rm.toLowerCase().includes(q);
        const matchRuang = item.ruangan.toLowerCase().includes(q);
        const matchBed = item.bed.toLowerCase().includes(q);
        const matchDiet = (item.data_baru?.diet || '')
          .toLowerCase()
          .includes(q);
        if (!matchName && !matchRm && !matchRuang && !matchBed && !matchDiet) {
          return false;
        }
      }

      // Waktu Makan
      if (selectedWaktu !== 'ALL' && item.waktu_makan !== selectedWaktu) {
        return false;
      }

      // Jenis Perubahan
      if (selectedJenis !== 'ALL' && item.jenis_perubahan !== selectedJenis) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedWaktu, selectedJenis, selectedStatus]);

  function handleSelectDetail(item: RevisiPostSnapshotItem) {
    setSelectedItem(item);
    setIsDetailOpen(true);
  }

  function handlePrintSlip(item: RevisiPostSnapshotItem) {
    setSlipItem(item);
    setIsSlipOpen(true);
  }

  return (
    <div className='flex flex-1 flex-col gap-5 sm:gap-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header Banner */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 rounded-2xl border border-primary/20 shadow-xs min-w-0'>
        <div className='space-y-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
              Log Revisi Post-Snapshot
            </h1>
            <span className='inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'>
              <AlertCircle className='w-3.5 h-3.5' /> Mode Pemantauan (Read-Only)
            </span>
          </div>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Memantau seluruh perubahan diet pasien pasca-snapshot dan mencetak Slip Dapur.
          </p>
        </div>

        <div className='flex items-center gap-2 self-start sm:self-auto shrink-0'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={isRefreshing}
            className='gap-2 shadow-xs text-xs'
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* 2. Info Banner */}
      <div className='flex items-start gap-3 bg-muted/40 p-3.5 px-4 rounded-xl border text-xs text-muted-foreground min-w-0'>
        <ShieldCheck className='w-4 h-4 text-emerald-500 shrink-0 mt-0.5' />
        <div className='min-w-0'>
          <strong className='text-foreground font-semibold'>
            Prosedur Otorisasi & Persetujuan:
          </strong>
          <span className='ml-1'>
            Persetujuan (approval) dan otorisasi revisi hanya dilakukan melalui halaman <strong>Snapshot Approval / Otorisasi Perubahan</strong> dengan otorisasi role Admin. Halaman ini digunakan khusus untuk memantau log revisi dan mencetak <strong>Slip Dapur</strong>.
          </span>
        </div>
      </div>

      {/* 3. KPI Summary Cards */}
      <RevisiSummaryCards stats={stats} />

      {/* 4. Filter & Search Controls */}
      <RevisiFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedWaktu={selectedWaktu}
        onWaktuChange={setSelectedWaktu}
        selectedJenis={selectedJenis}
        onJenisChange={setSelectedJenis}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={handleResetFilters}
      />

      {/* 5. Main Revisions Table (Read-Only) */}
      <RevisiTable
        items={filteredItems}
        onSelectDetail={handleSelectDetail}
        onPrintSlip={handlePrintSlip}
      />

      {/* Modals */}
      <RevisiDetailDialog
        item={selectedItem}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onPrintSlip={handlePrintSlip}
      />

      <KitchenSlipDialog
        item={slipItem}
        open={isSlipOpen}
        onOpenChange={setIsSlipOpen}
      />
    </div>
  );
}
