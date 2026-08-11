'use client';

import { useState } from 'react';
import type { SnapshotBatch, WaktuMakanConfig } from '@/servers/snapshot.service';
import CutoffConfigCard from './CutoffConfigCard';
import SnapshotHistoryTable from './SnapshotHistoryTable';
import SnapshotDetailDialog from './SnapshotDetailDialog';
import { RefreshCw, Clock, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface StatusSnapshotClientProps {
  initialBatches: SnapshotBatch[];
  configs: WaktuMakanConfig[];
}

export default function StatusSnapshotClient({
  initialBatches,
  configs,
}: StatusSnapshotClientProps) {
  const router = useRouter();
  const [selectedBatch, setSelectedBatch] = useState<SnapshotBatch | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  function handleSelectBatch(batch: SnapshotBatch) {
    setSelectedBatch(batch);
    setIsDetailOpen(true);
  }

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full'>
      {/* Header Banner */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-sm'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              Snapshot & Waktu Kunci
            </h1>
            <span className='inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'>
              <ShieldCheck className='w-3.5 h-3.5' /> Real-time System
            </span>
          </div>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Atur jam cut-off harian untuk pembekuan (snapshot) data porsi makanan pasien RS.
          </p>
        </div>

        <Button
          variant='outline'
          size='sm'
          onClick={handleRefresh}
          disabled={isRefreshing}
          className='gap-2 self-start sm:self-auto shadow-xs'
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Info Callout */}
      <div className='flex items-start gap-3 bg-muted/40 p-3.5 px-4 rounded-xl border text-xs text-muted-foreground'>
        <Clock className='w-4 h-4 text-amber-500 shrink-0 mt-0.5' />
        <div>
          <strong className='text-foreground font-semibold'>Penjelasan Bisnis Waktu Cut-Off:</strong>
          <span className='ml-1'>
            Ketika waktu cut-off tercapai (atau snapshot dipicu secara manual), sistem secara otomatis mengunci (LOCKED) seluruh data diet pasien aktif di tiap ruangan. Seluruh perubahan diet setelah jam cut-off akan masuk ke menu <strong>Log Revisi Post-Snapshot</strong> / <strong>Otorisasi Perubahan</strong>.
          </span>
        </div>
      </div>

      {/* 1. Cut-off Config Cards */}
      <CutoffConfigCard
        configs={configs}
        onSnapshotTriggered={handleRefresh}
      />

      {/* 2. Snapshot History Table */}
      <SnapshotHistoryTable
        batches={initialBatches}
        onSelectBatch={handleSelectBatch}
      />

      {/* 3. Snapshot Detail Dialog */}
      <SnapshotDetailDialog
        batch={selectedBatch}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
