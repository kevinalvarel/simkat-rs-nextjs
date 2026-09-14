'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { RevisiPostSnapshotItem } from '@/servers/revisi-snapshot.service';
import type { OtorisasiStats } from '@/servers/otorisasi-diet.service';
import { refreshOtorisasiData } from '@/servers/otorisasi-diet.service';
import { listenProductionUpdate } from '@/lib/realtime-sync';
import OtorisasiSummaryCards from './OtorisasiSummaryCards';
import OtorisasiFilterBar from './OtorisasiFilterBar';
import OtorisasiTable from './OtorisasiTable';
import OtorisasiActionDialog from './OtorisasiActionDialog';
import OtorisasiBulkApproveDialog from './OtorisasiBulkApproveDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

interface OtorisasiPerubahanClientProps {
  initialItems: RevisiPostSnapshotItem[];
  stats: OtorisasiStats;
}

const POLLING_INTERVAL_MS = 15_000; // 15 seconds

export default function OtorisasiPerubahanClient({
  initialItems,
  stats: initialStats,
}: OtorisasiPerubahanClientProps) {
  const [items, setItems] = useState<RevisiPostSnapshotItem[]>(initialItems);
  const [liveStats, setLiveStats] = useState<OtorisasiStats>(initialStats);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING'); // Default focus PENDING
  const [selectedWaktu, setSelectedWaktu] = useState<string>('ALL');
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Selection state for Bulk Action
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Dialog States
  const [actionItem, setActionItem] = useState<RevisiPostSnapshotItem | null>(null);
  const [actionMode, setActionMode] = useState<'APPROVE' | 'REJECT' | 'VIEW' | null>(null);
  const [isActionOpen, setIsActionOpen] = useState<boolean>(false);

  const [isBulkOpen, setIsBulkOpen] = useState<boolean>(false);

  // Ref for polling interval
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { items: freshItems, stats: freshStats } = await refreshOtorisasiData();
      setItems(freshItems);
      setLiveStats(freshStats);
    } catch (err) {
      console.error('Failed to refresh otorisasi data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Polling: auto-refresh every 15 seconds when tab is visible
  useEffect(() => {
    function startPolling() {
      if (pollingRef.current) return;
      pollingRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          handleRefresh();
        }
      }, POLLING_INTERVAL_MS);
    }

    function stopPolling() {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        handleRefresh(); // Immediate refresh when tab becomes visible
        startPolling();
      } else {
        stopPolling();
      }
    }

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleRefresh]);

  // BroadcastChannel listener for cross-tab realtime sync
  useEffect(() => {
    const cleanup = listenProductionUpdate((msg) => {
      if (
        msg.type === 'REVISION_APPROVED' ||
        msg.type === 'REVISION_REJECTED' ||
        msg.type === 'PATIENT_UPDATED' ||
        msg.type === 'SYNC_NOW'
      ) {
        handleRefresh();
      }
    });
    return cleanup;
  }, [handleRefresh]);

  function handleResetFilters() {
    setSearchQuery('');
    setSelectedStatus('PENDING');
    setSelectedWaktu('ALL');
    setSelectedJenis('ALL');
    setSelectedIds([]);
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
        const matchKelas = (item.kelas || '').toLowerCase().includes(q);
        const matchKamar = (item.gedung || '').toLowerCase().includes(q);
        const matchDiet = (item.data_baru?.diet || '').toLowerCase().includes(q);
        if (
          !matchName &&
          !matchRm &&
          !matchRuang &&
          !matchBed &&
          !matchKelas &&
          !matchKamar &&
          !matchDiet
        ) {
          return false;
        }
      }

      // Status
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      // Waktu Makan
      if (selectedWaktu !== 'ALL' && item.waktu_makan !== selectedWaktu) {
        return false;
      }

      // Jenis Perubahan
      if (selectedJenis !== 'ALL' && item.jenis_perubahan !== selectedJenis) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedStatus, selectedWaktu, selectedJenis]);

  // Toggle single item selection
  function handleToggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  // Toggle select all pending items in current view
  function handleToggleSelectAll() {
    const pendingInView = filteredItems.filter((i) => i.status === 'PENDING').map((i) => i.id);
    const isAllSelected = pendingInView.length > 0 && pendingInView.every((id) => selectedIds.includes(id));

    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pendingInView.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pendingInView])));
    }
  }

  function handleOpenActionDialog(
    item: RevisiPostSnapshotItem,
    mode: 'APPROVE' | 'REJECT' | 'VIEW'
  ) {
    setActionItem(item);
    setActionMode(mode);
    setIsActionOpen(true);
  }

  return (
    <div className='flex flex-1 flex-col gap-5 sm:gap-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header Banner */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-amber-500/15 via-primary/5 to-transparent p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-xs min-w-0'>
        <div className='space-y-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
              Otorisasi Perubahan Diet
            </h1>
            <span className='inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'>
              <Lock className='w-3.5 h-3.5' /> Modul Otorisasi Admin
            </span>
          </div>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Otorisasi dan persetujuan resmi Admin / Kepemimpinan Gizi untuk permintaan perubahan diet pasca-snapshot.
          </p>
        </div>

        <div className='flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap'>
          {/* Bulk Approve Button if any pending selected */}
          {selectedIds.length > 0 && (
            <Button
              size='sm'
              onClick={() => setIsBulkOpen(true)}
              className='gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs'
            >
              <CheckCircle2 className='w-4 h-4' /> Setujui {selectedIds.length} Item
            </Button>
          )}

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
      <div className='flex items-start gap-3 bg-amber-500/10 p-3.5 px-4 rounded-xl border border-amber-300 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 min-w-0'>
        <ShieldCheck className='w-4 h-4 text-amber-600 shrink-0 mt-0.5' />
        <div className='min-w-0'>
          <strong className='text-foreground font-semibold'>Otorisasi Role Admin:</strong>
          <span className='ml-1'>
            Permintaan yang disetujui (<strong>APPROVED</strong>) akan secara otomatis diperbarui di sistem dan diteruskan ke lini produksi katering. Penolakan wajib disertai catatan alasan penolakan.
          </span>
        </div>
      </div>

      {/* 3. KPI Summary Cards */}
      <OtorisasiSummaryCards stats={liveStats} />

      {/* 4. Filter Controls */}
      <OtorisasiFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedWaktu={selectedWaktu}
        onWaktuChange={setSelectedWaktu}
        selectedJenis={selectedJenis}
        onJenisChange={setSelectedJenis}
        onReset={handleResetFilters}
      />

      {/* 5. Main Authorization Table */}
      <OtorisasiTable
        items={filteredItems}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onOpenActionDialog={handleOpenActionDialog}
      />

      {/* Modals */}
      <OtorisasiActionDialog
        item={actionItem}
        mode={actionMode}
        open={isActionOpen}
        onOpenChange={setIsActionOpen}
        onSuccess={() => {
          setSelectedIds([]);
          handleRefresh();
        }}
      />

      <OtorisasiBulkApproveDialog
        selectedIds={selectedIds}
        open={isBulkOpen}
        onOpenChange={setIsBulkOpen}
        onSuccess={() => {
          setSelectedIds([]);
          handleRefresh();
        }}
      />
    </div>
  );
}
