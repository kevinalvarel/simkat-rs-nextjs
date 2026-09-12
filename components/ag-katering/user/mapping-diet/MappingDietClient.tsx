'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type {
  UnmappedDietItem,
  KategoriMenuOption,
  MappingDietStats as MappingDietStatsType,
} from '@/servers/mapping-diet.service';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Layers,
  GitMerge,
  Info,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { listenProductionUpdate } from '@/lib/realtime-sync';
import MappingDietStats from './MappingDietStats';
import MappingDietFilterBar from './MappingDietFilterBar';
import MappingDietTable from './MappingDietTable';
import MappingDietBulkDialog from './MappingDietBulkDialog';
import MappingDietEditDialog from './MappingDietEditDialog';

interface MappingDietClientProps {
  initialUnmappedItems?: UnmappedDietItem[];
  initialMappedItems?: UnmappedDietItem[];
  initialItems?: UnmappedDietItem[]; // fallback
  options: KategoriMenuOption[];
  stats: MappingDietStatsType;
}

export default function MappingDietClient({
  initialUnmappedItems,
  initialMappedItems = [],
  initialItems,
  options,
  stats,
}: MappingDietClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tab state: 'UNMAPPED' (Belum Termapping) vs 'MAPPED' (Sudah Termapping)
  const [activeTab, setActiveTab] = useState<'UNMAPPED' | 'MAPPED'>('UNMAPPED');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Selection state (for bulk mapping)
  const [selectedRaws, setSelectedRaws] = useState<string[]>([]);

  // Dialog states
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UnmappedDietItem | null>(null);

  const unmappedList = useMemo(
    () => initialUnmappedItems ?? initialItems ?? [],
    [initialUnmappedItems, initialItems],
  );
  const mappedList = useMemo(
    () => initialMappedItems ?? [],
    [initialMappedItems],
  );

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  }

  // Refresh otomatis saat data pasien RS berubah (atau hasil otorisasi),
  // agar user yang sedang membuka halaman ini langsung melihat diet baru
  // tanpa harus pindah halaman dulu. Abaikan event dari diri sendiri.
  useEffect(() => {
    const unsubscribe = listenProductionUpdate((msg) => {
      if (msg.source === 'mapping-diet') return;
      if (
        msg.type === 'PATIENT_UPDATED' ||
        msg.type === 'SYNC_NOW' ||
        msg.type === 'REVISION_APPROVED' ||
        msg.type === 'REVISION_REJECTED' ||
        msg.type === 'SNAPSHOT_TRIGGERED'
      ) {
        router.refresh();
      }
    });
    return unsubscribe;
  }, [router]);

  function handleTabChange(tab: 'UNMAPPED' | 'MAPPED') {
    setActiveTab(tab);
    setSelectedRaws([]);
    setSelectedStatus('ALL');
  }

  function handleResetFilters() {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedRaws([]);
  }

  function handleOpenEdit(item: UnmappedDietItem) {
    setEditingItem(item);
    setIsEditOpen(true);
  }

  // Filtered items based on activeTab, searchQuery, and selectedStatus
  const filteredItems = useMemo(() => {
    const sourceList = activeTab === 'UNMAPPED' ? unmappedList : mappedList;

    return sourceList.filter((item) => {
      // 1. Search Query Filter
      if (
        searchQuery.trim() !== '' &&
        !item.diet_rs_raw.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // 2. Status Filter
      if (selectedStatus !== 'ALL') {
        if (activeTab === 'UNMAPPED') {
          if (item.status_mapping !== selectedStatus) {
            return false;
          }
        } else {
          // In MAPPED tab:
          const isNpo =
            item.bentuk_makanan === 'NPO' ||
            item.kategori_diet === 'NPO' ||
            item.diet_rs_raw.trim().toUpperCase() === 'NPO';

          const isKatering =
            item.status_mapping === 'KATERING' ||
            item.bentuk_makanan === 'KATERING' ||
            item.kategori_diet === 'KATERING';

          if (selectedStatus === 'NPO' && !isNpo) return false;
          if (selectedStatus === 'KATERING' && !isKatering) return false;
          if (selectedStatus === 'STANDARD' && (isNpo || isKatering))
            return false;
        }
      }
      return true;
    });
  }, [activeTab, unmappedList, mappedList, searchQuery, selectedStatus]);

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
            Petakan diet free-text dari RS ke standar kategori katering,
            otomatisasi NPO, atau alihkan ke Live Katering.
          </p>
        </div>

        <div className='flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap'>
          {/* Bulk Mapping Button (Available in both tabs) */}
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
            Diet tulis bebas oleh dokter/perawat (<em>free-text RS</em>) perlu
            dipetakan agar etiket makanan dan porsi produksi tercetak akurat.
            Jika raw text berstatus <strong>NPO</strong>, seluruh kriteria
            otomatis terisi NPO. Jika dipilih{' '}
            <strong>Alihkan ke AG Katering</strong> (misal Bubur Saring, Sonde),
            diet tidak masuk ke dapur produksi umum, melainkan langsung
            dialihkan ke halaman Live Katering.
          </span>
        </div>
      </div>

      {/* ── 3. Stats Cards ────────────────────────────────────────────────── */}
      <MappingDietStats stats={stats} />

      {/* ── 4. Main Tab Navigation ────────────────────────────────────────── */}
      <div className='flex items-center gap-2 sm:gap-6 border-b border-border/80 px-1 overflow-x-auto'>
        {/* Tab 1: Belum Termapping */}
        <button
          type='button'
          onClick={() => handleTabChange('UNMAPPED')}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold transition-all cursor-pointer relative whitespace-nowrap ${
            activeTab === 'UNMAPPED'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertCircle className='w-4 h-4' />
          <span>Belum Termapping (Perlu Tindakan)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
              activeTab === 'UNMAPPED'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {unmappedList.length}
          </span>
          {activeTab === 'UNMAPPED' && (
            <span className='absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 dark:bg-rose-400 rounded-full' />
          )}
        </button>

        {/* Tab 2: Sudah Termapping */}
        <button
          type='button'
          onClick={() => handleTabChange('MAPPED')}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold transition-all cursor-pointer relative whitespace-nowrap ${
            activeTab === 'MAPPED'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckCircle2 className='w-4 h-4' />
          <span>Sudah Termapping </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
              activeTab === 'MAPPED'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {mappedList.length}
          </span>
          {activeTab === 'MAPPED' && (
            <span className='absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full' />
          )}
        </button>
      </div>

      {/* ── 5. Filter Bar ─────────────────────────────────────────────────── */}
      <MappingDietFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={handleResetFilters}
        tab={activeTab}
      />

      {/* ── 6. Results Count & Bulk Action ───────────────────────────────── */}
      <div className='flex items-center justify-between text-xs text-muted-foreground px-1'>
        <span>
          Menampilkan{' '}
          <strong className='text-foreground'>{filteredItems.length}</strong>{' '}
          dari{' '}
          {activeTab === 'UNMAPPED' ? unmappedList.length : mappedList.length}{' '}
          diet (
          {activeTab === 'UNMAPPED' ? 'Belum Termapping' : 'Sudah Termapping'})
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

      {/* ── 7. Main Table ─────────────────────────────────────────────────── */}
      <MappingDietTable
        items={filteredItems}
        options={options}
        selectedRaws={selectedRaws}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onRefresh={handleRefresh}
        onEditItem={handleOpenEdit}
        isMappedTab={activeTab === 'MAPPED'}
      />

      {/* ── 8. Single Edit Dialog ─────────────────────────────────────────── */}
      <MappingDietEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        item={editingItem}
        options={options}
        onSuccess={handleRefresh}
      />

      {/* ── 9. Bulk Mapping Dialog ────────────────────────────────────────── */}
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
