'use client';

import React, { useState, useMemo } from 'react';
import type {
  KwitansiSummaryData,
  KwitansiPageProps,
  KwitansiPatientItem,
  KwitansiFilterState,
} from '@/types/kwitansitypes';
import { getKwitansiData } from '@/servers/kwitansi.service';
import KwitansiHeader from './KwitansiHeader';
import KwitansiStatsCards from './KwitansiStatsCards';
import KwitansiFilterBar from './KwitansiFilterBar';
import KwitansiTable from './KwitansiTable';
import KwitansiPrintModal from './KwitansiPrintModal';
import { toast } from 'sonner';

export default function KwitansiClient({ initialData }: KwitansiPageProps) {
  const [data, setData] = useState<KwitansiSummaryData>(initialData);
  const [selectedBatchId, setSelectedBatchId] = useState<number | undefined>(
    initialData.batch?.id,
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filter state
  const [filter, setFilter] = useState<KwitansiFilterState>({
    search: '',
    gedung: 'ALL',
    ruangan: 'ALL',
    kelas: 'ALL',
    diet: 'ALL',
    status: 'ALL',
  });

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [patientsToPrint, setPatientsToPrint] = useState<KwitansiPatientItem[]>([]);

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

    return {
      gedungOptions: Array.from(gedungs).sort(),
      ruanganOptions: Array.from(ruangans).sort(),
      dietOptions: Array.from(diets).sort(),
    };
  }, [data.patients]);

  // 2. Filtered Patients
  const filteredPatients = useMemo(() => {
    return data.patients.filter((p) => {
      // Search
      if (filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
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

      // Kelas
      if (filter.kelas !== 'ALL') {
        const pK = p.kelas.toLowerCase().trim();
        const fK = filter.kelas.toLowerCase().trim();
        if (!pK.includes(fK) && !fK.includes(pK)) return false;
      }

      // Diet
      if (filter.diet !== 'ALL' && p.diet !== filter.diet) {
        return false;
      }

      // Status
      if (filter.status !== 'ALL') {
        const pStatus = (p.status || '').toUpperCase();
        if (filter.status === 'EMERGENT' && !p.is_emergent && pStatus !== 'EMERGENT') return false;
        if (filter.status === 'NPO' && pStatus !== 'NPO') return false;
        if (filter.status === 'AKTIF' && pStatus !== 'AKTIF') return false;
      }

      return true;
    });
  }, [data.patients, filter]);

  // 3. Selection Handlers
  function handleToggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleToggleSelectAll() {
    if (selectedIds.size === filteredPatients.length && filteredPatients.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPatients.map((p) => p.id)));
    }
  }

  function handleFilterChange(newFilter: Partial<KwitansiFilterState>) {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  }

  function handleResetFilter() {
    setFilter({
      search: '',
      gedung: 'ALL',
      ruangan: 'ALL',
      kelas: 'ALL',
      diet: 'ALL',
      status: 'ALL',
    });
  }

  // 4. Batch & Data Fetching Handlers
  async function handleBatchChange(batchId: number) {
    setSelectedBatchId(batchId);
    setIsRefreshing(true);
    setSelectedIds(new Set());
    try {
      const freshData = await getKwitansiData(batchId);
      setData(freshData);
    } catch (err) {
      console.error('Error changing batch:', err);
      toast.error('Gagal memuat data batch snapshot kwitansi.');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const freshData = await getKwitansiData(selectedBatchId);
      setData(freshData);
      toast.success('Data kwitansi berhasil diperbarui.');
    } catch (err) {
      console.error('Error refreshing kwitansi data:', err);
      toast.error('Gagal memperbarui data.');
    } finally {
      setIsRefreshing(false);
    }
  }

  // 5. Print Handlers
  function handlePrintSingle(patient: KwitansiPatientItem) {
    setPatientsToPrint([patient]);
    setIsPrintModalOpen(true);
  }

  function handlePrintBatch() {
    const selected = data.patients.filter((p) => selectedIds.has(p.id));
    if (selected.length > 0) {
      setPatientsToPrint(selected);
      setIsPrintModalOpen(true);
    } else {
      // Print all filtered
      setPatientsToPrint(filteredPatients);
      setIsPrintModalOpen(true);
    }
  }

  function handleOpenPrintModalDefault() {
    if (selectedIds.size > 0) {
      const selected = data.patients.filter((p) => selectedIds.has(p.id));
      setPatientsToPrint(selected);
    } else {
      setPatientsToPrint(filteredPatients);
    }
    setIsPrintModalOpen(true);
  }

  const isAllSelected =
    filteredPatients.length > 0 && selectedIds.size === filteredPatients.length;

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header with Batch Selection & Actions */}
      <KwitansiHeader
        data={data}
        selectedBatchId={selectedBatchId}
        onBatchChange={handleBatchChange}
        onOpenPrintModal={handleOpenPrintModalDefault}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        selectedCount={selectedIds.size}
      />

      {/* 2. Key Stats KPI Cards */}
      <KwitansiStatsCards data={data} selectedCount={selectedIds.size} />

      {/* 3. Filter Bar */}
      <KwitansiFilterBar
        filter={filter}
        onFilterChange={handleFilterChange}
        onResetFilter={handleResetFilter}
        gedungOptions={gedungOptions}
        ruanganOptions={ruanganOptions}
        dietOptions={dietOptions}
        totalFiltered={filteredPatients.length}
        totalAll={data.patients.length}
      />

      {/* 4. Main Patient Distribution & Receipt Table */}
      <KwitansiTable
        patients={filteredPatients}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onPrintSingle={handlePrintSingle}
        onPrintBatch={handlePrintBatch}
        isAllSelected={isAllSelected}
      />

      {/* 5. Print Modal (useReactToPrint) */}
      <KwitansiPrintModal
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        patientsToPrint={patientsToPrint}
        summaryData={data}
      />
    </div>
  );
}
