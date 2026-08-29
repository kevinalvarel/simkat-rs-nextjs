'use client';

import React, { useState, useMemo } from 'react';
import type {
  UnmappedDietItem,
  KategoriMenuOption,
  MappingDietStats as MappingDietStatsType,
} from '@/servers/mapping-diet.service';
import { Button } from '@/components/ui/button';
import { RefreshCw, Layers, GitMerge, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MappingDietStats from './MappingDietStats';
import MappingDietFilterBar from './MappingDietFilterBar';
import MappingDietTable from './MappingDietTable';
import MappingDietBulkDialog from './MappingDietBulkDialog';

interface MappingDietClientProps {
  initialItems: UnmappedDietItem[];
  options: KategoriMenuOption[];
  stats: MappingDietStatsType;
}

export default function MappingDietClient({
  initialItems,
  options,
  stats,
}: MappingDietClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Selection state
  const [selectedRaws, setSelectedRaws] = useState<string[]>([]);

  // Bulk Dialog state
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  }

  function handleResetFilters() {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedRaws([]);
  }

  // Filtered items
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      if (
        searchQuery.trim() !== '' &&
        !item.diet_rs_raw.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (selectedStatus !== 'ALL' && item.status_mapping !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [initialItems, searchQuery, selectedStatus]);

  function handleToggleSelect(raw: string) {
    setSelectedRaws((prev) =>
      prev.includes(raw) ? prev.filter((r) => r !== raw) : [...prev, raw],
    );
  }

  function handleToggleSelectAll() {
    const allRaws = filteredItems.map((i) => i.diet_rs_raw);
    const isAllSelected =
      allRaws.length > 0 && allRaws.every((r) => selectedRaws.includes(r));

    if (isAllSelected) {
      setSelectedRaws((prev) => prev.filter((r) => !allRaws.includes(r)));
    } else {
      setSelectedRaws((prev) => Array.from(new Set([...prev, ...allRaws])));
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-5 sm:gap-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* ── 1. Header Banner ─────────────────────────────────────────────── */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-rose-500/10 via-primary/5 to-transparent p-4 sm:p-5 rounded-2xl border border-rose-500/20 shadow-xs min-w-0'>
        <div className='space-y-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
              Mapping Diet Pasien
            </h1>
            <span className='inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'>
              <GitMerge className='w-3.5 h-3.5' /> Master Mapping Diet
            </span>
          </div>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Petakan diet free-text dari RS ke standar kategori diet katering
            untuk laporan dan etiket makanan pasien.
          </p>
        </div>

        <div className='flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap'>
          {/* Bulk Mapping Button */}
          {selectedRaws.length > 1 && (
            <Button
              size='sm'
              onClick={() => setIsBulkOpen(true)}
              className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs'
            >
              <Layers className='w-4 h-4' />
              Mapping {selectedRaws.length} Item
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
            Refresh
          </Button>
        </div>
      </div>

      {/* ── 2. Info Banner ────────────────────────────────────────────────── */}
      <div className='flex items-start gap-3 bg-blue-500/5 p-3.5 px-4 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 min-w-0'>
        <Info className='w-4 h-4 text-blue-500 shrink-0 mt-0.5' />
        <div className='min-w-0'>
          <strong className='text-foreground font-semibold'>
            Tentang Mapping Diet:
          </strong>
          <span className='ml-1'>
            Diet yang tulis bebas oleh dokter/perawat (<em>free-text RS</em>)
            perlu dipetakan ke standar kategori katering agar etiket makanan
            dapat dicetak dengan benar. Data <strong>UNMAPPED</strong> artinya
            belum pernah dipetakan. <strong>PARTIAL</strong> artinya sudah
            sebagian dipetakan.
          </span>
        </div>
      </div>

      {/* ── 3. Stats Cards ────────────────────────────────────────────────── */}
      <MappingDietStats stats={stats} />

      {/* ── 4. Filter Bar ─────────────────────────────────────────────────── */}
      <MappingDietFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={handleResetFilters}
      />

      {/* ── 5. Results Count ──────────────────────────────────────────────── */}
      <div className='flex items-center justify-between text-xs text-muted-foreground px-1'>
        <span>
          Menampilkan{' '}
          <strong className='text-foreground'>{filteredItems.length}</strong>{' '}
          dari {initialItems.length} item
          {selectedRaws.length > 0 && (
            <span className='ml-2 text-primary font-semibold'>
              ({selectedRaws.length} dipilih)
            </span>
          )}
        </span>
        {selectedRaws.length > 0 && (
          <Button
            variant='ghost'
            size='sm'
            className='h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground'
            onClick={() => setSelectedRaws([])}
          >
            Batalkan Pilihan
          </Button>
        )}
      </div>

      {/* ── 6. Main Table ─────────────────────────────────────────────────── */}
      <MappingDietTable
        items={filteredItems}
        options={options}
        selectedRaws={selectedRaws}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onRefresh={handleRefresh}
      />

      <MappingDietBulkDialog
        selectedRaws={selectedRaws}
        options={options}
        open={isBulkOpen}
        onOpenChange={setIsBulkOpen}
        onSuccess={() => {
          setSelectedRaws([]);
          handleRefresh();
        }}
      />
    </div>
  );
}
