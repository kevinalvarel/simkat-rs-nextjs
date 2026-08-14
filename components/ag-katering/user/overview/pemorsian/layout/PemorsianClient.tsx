'use client';

import React, { useState, useMemo } from 'react';
import type {
  PemorsianSummaryData,
  PemorsianPatientItem,
  PemorsianRevisiItem,
  PemorsianFilterState,
  EtiketData,
} from '@/types/pemorsiantypes';
import { getPemorsianData } from '@/servers/pemorsian.service';
import PemorsianHeader from '@/components/ag-katering/user/overview/pemorsian/layout/PemorsianHeader';
import PemorsianStatsCard from '@/components/ag-katering/user/overview/pemorsian/ui/PemorsianStatsCard';
import PemorsianFilterBar from '@/components/ag-katering/user/overview/pemorsian/ui/PemorsianFilterBar';
import PemorsianTableSection from '@/components/ag-katering/user/overview/pemorsian/layout/PemorsianTableSection';
import PemorsianRevisiTableSection from '@/components/ag-katering/user/overview/pemorsian/layout/PemorsianRevisiTableSection';
import EtiketPrintPreviewModal from '@/components/ag-katering/user/overview/pemorsian/layout/EtiketPrintPreviewModal';
import { Layers, History } from 'lucide-react';

interface PemorsianClientProps {
  initialData: PemorsianSummaryData;
}

export default function PemorsianClient({ initialData }: PemorsianClientProps) {
  const [data, setData] = useState<PemorsianSummaryData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'utama' | 'revisi'>('utama');

  // Selection states
  const [selectedSnapshotIds, setSelectedSnapshotIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectedRevisiIds, setSelectedRevisiIds] = useState<Set<number>>(
    new Set(),
  );

  // Filter State
  const [filter, setFilter] = useState<PemorsianFilterState>({
    search: '',
    gedung: 'ALL',
    ruangan: 'ALL',
    diet: 'ALL',
    status: 'ALL',
  });

  // Modal Preview State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [previewEtiketList, setPreviewEtiketList] = useState<EtiketData[]>([]);

  // 1. Dynamic Filter Options derived from patients list
  const { gedungOptions, ruanganOptions, dietOptions } = useMemo(() => {
    const gedungs = new Set<string>();
    const ruangans = new Set<string>();
    const diets = new Set<string>();

    data.patients.forEach((p) => {
      if (p.gedung) gedungs.add(p.gedung);
      if (p.ruangan) ruangans.add(p.ruangan);
      if (p.diet) diets.add(p.diet);
    });

    data.revisiItems.forEach((r) => {
      if (r.gedung) gedungs.add(r.gedung);
      if (r.ruangan) ruangans.add(r.ruangan);
      if (r.data_baru?.diet) diets.add(r.data_baru.diet);
    });

    return {
      gedungOptions: Array.from(gedungs).sort(),
      ruanganOptions: Array.from(ruangans).sort(),
      dietOptions: Array.from(diets).sort(),
    };
  }, [data.patients, data.revisiItems]);

  // 2. Filtered Snapshot Patients
  const filteredPatients = useMemo(() => {
    return data.patients.filter((p) => {
      // Search
      if (filter.search.trim()) {
        const q = filter.search.toLowerCase();
        const matchName = p.nama_pasien.toLowerCase().includes(q);
        const matchRm = p.no_rm.toLowerCase().includes(q);
        if (!matchName && !matchRm) return false;
      }

      // Gedung
      if (filter.gedung !== 'ALL' && p.gedung !== filter.gedung) {
        return false;
      }

      // Ruangan
      if (filter.ruangan !== 'ALL' && p.ruangan !== filter.ruangan) {
        return false;
      }

      // Diet
      if (filter.diet !== 'ALL' && p.diet !== filter.diet) {
        return false;
      }

      // Status
      if (filter.status !== 'ALL') {
        const normStatus = (p.status || '').toUpperCase();
        if (
          filter.status === 'EMERGENT' &&
          !p.is_emergent &&
          normStatus !== 'EMERGENT'
        ) {
          return false;
        }
        if (
          filter.status === 'NPO' &&
          normStatus !== 'NPO' &&
          !p.diet.toLowerCase().includes('npo')
        ) {
          return false;
        }
        if (
          filter.status === 'AKTIF' &&
          (normStatus === 'NPO' || p.is_emergent)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [data.patients, filter]);

  // 3. Filtered Revisi Items
  const filteredRevisiItems = useMemo(() => {
    return data.revisiItems.filter((r) => {
      if (filter.search.trim()) {
        const q = filter.search.toLowerCase();
        const matchName = r.nama_pasien.toLowerCase().includes(q);
        const matchRm = r.no_rm.toLowerCase().includes(q);
        if (!matchName && !matchRm) return false;
      }

      if (filter.gedung !== 'ALL' && r.gedung !== filter.gedung) {
        return false;
      }

      if (filter.ruangan !== 'ALL' && r.ruangan !== filter.ruangan) {
        return false;
      }

      return true;
    });
  }, [data.revisiItems, filter]);

  // 4. Selection Handlers for Tab Utama (Snapshot)
  const isAllSnapshotSelected =
    filteredPatients.length > 0 &&
    filteredPatients.every((p) => selectedSnapshotIds.has(p.id));

  function handleToggleSnapshotSelect(id: number) {
    setSelectedSnapshotIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleToggleSnapshotSelectAll() {
    if (isAllSnapshotSelected) {
      setSelectedSnapshotIds((prev) => {
        const next = new Set(prev);
        filteredPatients.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedSnapshotIds((prev) => {
        const next = new Set(prev);
        filteredPatients.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }

  // 5. Selection Handlers for Tab Revisi
  const isAllRevisiSelected =
    filteredRevisiItems.length > 0 &&
    filteredRevisiItems.every((r) => selectedRevisiIds.has(r.id));

  function handleToggleRevisiSelect(id: number) {
    setSelectedRevisiIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleToggleRevisiSelectAll() {
    if (isAllRevisiSelected) {
      setSelectedRevisiIds((prev) => {
        const next = new Set(prev);
        filteredRevisiItems.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedRevisiIds((prev) => {
        const next = new Set(prev);
        filteredRevisiItems.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }

  // 6. Print Handlers
  function mapPatientToEtiket(p: PemorsianPatientItem): EtiketData {
    return {
      nama: p.nama_pasien,
      ruangan: p.ruangan,
      bed: p.bed || '-',
      diet: p.diet,
      waktu: p.waktu,
      no_rm: p.no_rm,
      kelas: p.kelas,
      gedung: p.gedung,
      is_revisi: false,
    };
  }

  function mapRevisiToEtiket(r: PemorsianRevisiItem): EtiketData {
    return {
      nama: r.nama_pasien,
      ruangan: r.data_baru?.ruangan || r.ruangan,
      bed: r.data_baru?.bed || r.bed || '-',
      diet: r.data_baru?.diet || r.dampak_dapur || 'Diet Khusus',
      waktu: r.waktu_makan,
      no_rm: r.no_rm,
      kelas: r.data_baru?.kelas || r.kelas,
      gedung: r.data_baru?.gedung || r.gedung,
      is_revisi: true,
      keterangan_revisi: r.dampak_dapur,
    };
  }

  function handlePrintSinglePatient(patient: PemorsianPatientItem) {
    const etiket = mapPatientToEtiket(patient);
    setPreviewEtiketList([etiket]);
    setModalTitle(`Cetak Etiket - ${patient.nama_pasien}`);
    setModalOpen(true);
  }

  function handlePrintBatchPatients() {
    const selectedPatients = data.patients.filter((p) =>
      selectedSnapshotIds.has(p.id),
    );
    if (selectedPatients.length === 0) return;

    const etikets = selectedPatients.map(mapPatientToEtiket);
    const isAll = selectedPatients.length === filteredPatients.length;

    setPreviewEtiketList(etikets);
    setModalTitle(
      isAll
        ? `Cetak Semua Etiket (${selectedPatients.length} Pasien)`
        : `Cetak ${selectedPatients.length} Etiket Terpilih`,
    );
    setModalOpen(true);
  }

  function handlePrintSingleRevisi(revisi: PemorsianRevisiItem) {
    const etiket = mapRevisiToEtiket(revisi);
    setPreviewEtiketList([etiket]);
    setModalTitle(`Cetak Etiket Revisi - ${revisi.nama_pasien}`);
    setModalOpen(true);
  }

  function handlePrintBatchRevisi() {
    const selectedItems = data.revisiItems.filter((r) =>
      selectedRevisiIds.has(r.id),
    );
    if (selectedItems.length === 0) return;

    const etikets = selectedItems.map(mapRevisiToEtiket);
    const isAll = selectedItems.length === filteredRevisiItems.length;

    setPreviewEtiketList(etikets);
    setModalTitle(
      isAll
        ? `Cetak Semua Etiket Revisi (${selectedItems.length} Pasien)`
        : `Cetak ${selectedItems.length} Etiket Revisi Terpilih`,
    );
    setModalOpen(true);
  }

  // 7. Filter Update & Reset
  function handleFilterChange(newFilter: Partial<PemorsianFilterState>) {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  }

  function handleResetFilter() {
    setFilter({
      search: '',
      gedung: 'ALL',
      ruangan: 'ALL',
      diet: 'ALL',
      status: 'ALL',
    });
  }

  // 8. Batch & Refresh Handlers
  async function handleBatchChange(batchId: number) {
    setIsRefreshing(true);
    try {
      const refreshed = await getPemorsianData(batchId);
      setData(refreshed);
      setSelectedSnapshotIds(new Set());
      setSelectedRevisiIds(new Set());
    } catch (err) {
      console.error('Error changing snapshot batch:', err);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const refreshed = await getPemorsianData(data.batch?.id);
      setData(refreshed);
    } catch (err) {
      console.error('Error refreshing pemorsian data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }

  const currentSelectedCount =
    activeTab === 'utama' ? selectedSnapshotIds.size : selectedRevisiIds.size;

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header with Title & Batch Selector */}
      <PemorsianHeader
        currentBatch={data.batch}
        availableBatches={data.availableBatches}
        onBatchChange={handleBatchChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 2. Stats Metrics Card */}
      <PemorsianStatsCard
        totalCount={data.totalCount}
        activeCount={data.activeCount}
        npoCount={data.npoCount}
        selectedCount={currentSelectedCount}
      />

      {/* 3. Tab Switcher Navigation */}
      <div className='flex items-center gap-2 border-b border-border pb-1'>
        <button
          onClick={() => setActiveTab('utama')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'utama'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <Layers className='w-4 h-4' />
          <span>Tab Utama (Snapshot Saat Ini)</span>
          <span className='ml-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-bold'>
            {filteredPatients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('revisi')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'revisi'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <History className='w-4 h-4' />
          <span>Tab Revisi (Perubahan Susulan)</span>
          <span className='ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'>
            {filteredRevisiItems.length}
          </span>
        </button>
      </div>

      {/* 4. Search & Filter Bar */}
      <PemorsianFilterBar
        filter={filter}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilter}
        gedungOptions={gedungOptions}
        ruanganOptions={ruanganOptions}
        dietOptions={dietOptions}
      />

      {/* 5. Active Tab Table Content */}
      {activeTab === 'utama' ? (
        <PemorsianTableSection
          patients={filteredPatients}
          selectedIds={selectedSnapshotIds}
          onToggleSelect={handleToggleSnapshotSelect}
          onToggleSelectAll={handleToggleSnapshotSelectAll}
          onPrintSingle={handlePrintSinglePatient}
          onPrintBatch={handlePrintBatchPatients}
          isAllSelected={isAllSnapshotSelected}
        />
      ) : (
        <PemorsianRevisiTableSection
          revisiItems={filteredRevisiItems}
          selectedIds={selectedRevisiIds}
          onToggleSelect={handleToggleRevisiSelect}
          onToggleSelectAll={handleToggleRevisiSelectAll}
          onPrintSingle={handlePrintSingleRevisi}
          onPrintBatch={handlePrintBatchRevisi}
          isAllSelected={isAllRevisiSelected}
        />
      )}

      {/* 6. Etiket Print Preview Dialog */}
      <EtiketPrintPreviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        etiketList={previewEtiketList}
        title={modalTitle}
      />
    </div>
  );
}
