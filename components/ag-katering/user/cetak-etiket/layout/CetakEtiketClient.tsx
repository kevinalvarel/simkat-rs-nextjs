'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type {
  PemorsianSummaryData,
  PemorsianPatientItem,
  PemorsianRevisiItem,
  EtiketData,
  CetakEtiketTab,
  CetakEtiketFilterOptions,
  CetakEtiketStatsData,
} from '@/types/cetaketikettypes';
import { getLivePemorsianData } from '@/servers/pemorsian.service';
import { useEtiketPrintedSync } from '@/hooks/useEtiketPrintedSync';
import EtiketPrintPreviewModal from '@/components/ag-katering/cetak-etiket/EtiketPrintPreviewModal';
import CetakEtiketHeader from './CetakEtiketHeader';
import CetakEtiketStats from './CetakEtiketStats';
import CetakEtiketTabs from './CetakEtiketTabs';
import CetakEtiketFilters from './CetakEtiketFilters';
import CetakEtiketTable from './CetakEtiketTable';
import CetakEtiketRevisiTable from './CetakEtiketRevisiTable';
import { toast } from 'sonner';

interface CetakEtiketClientProps {
  initialData: PemorsianSummaryData;
}

export default function CetakEtiketClient({
  initialData,
}: CetakEtiketClientProps) {
  const [data, setData] = useState<PemorsianSummaryData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<CetakEtiketTab>('UTAMA');

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRuangan, setFilterRuangan] = useState('ALL');
  const [filterKelas, setFilterKelas] = useState('ALL');
  const [filterDiet, setFilterDiet] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Print state
  const [modalOpen, setModalOpen] = useState(false);
  const [etiketList, setEtiketList] = useState<EtiketData[]>([]);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [currentPrintTargetIds, setCurrentPrintTargetIds] = useState<number[]>(
    [],
  );

  // 2. Synchronized Printed Status (shared with Live Pemorsian)
  const { printedPatientIds, markIdsAsPrinted } = useEtiketPrintedSync(
    data.batchCode,
  );

  // Fetch / Refresh Data helper
  const fetchData = useCallback(
    async (batchId?: number) => {
      setIsRefreshing(true);
      try {
        const res = await getLivePemorsianData(
          batchId ?? (data.batch?.id || undefined),
        );
        if (res && res.success !== false) {
          setData(res);
          setSelectedIds(new Set());
          toast.success('Data snapshot etiket berhasil diperbarui.');
        } else {
          toast.error('Gagal memperbarui data snapshot.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Terjadi kesalahan saat memuat data etiket.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [data.batch],
  );

  // Dynamic filter dropdown options
  const filterOptions: CetakEtiketFilterOptions = useMemo(() => {
    const ruanganSet = new Set<string>();
    const kelasSet = new Set<string>();
    const dietSet = new Set<string>();

    data.patients.forEach((p) => {
      if (p.ruangan) ruanganSet.add(p.ruangan);
      if (p.kelas) kelasSet.add(p.kelas);
      if (p.diet) dietSet.add(p.diet);
    });

    return {
      ruangan: Array.from(ruanganSet).sort(),
      kelas: Array.from(kelasSet).sort(),
      diet: Array.from(dietSet).sort(),
    };
  }, [data.patients]);

  // Filtered Patients for Tab Utama
  const filteredPatients = useMemo(() => {
    return data.patients.filter((p) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.nama_pasien.toLowerCase().includes(q);
        const matchRm = (p.no_rm || '').toLowerCase().includes(q);
        const matchRuangan = (p.ruangan || '').toLowerCase().includes(q);
        if (!matchName && !matchRm && !matchRuangan) return false;
      }

      // 2. Ruangan
      if (filterRuangan !== 'ALL' && p.ruangan !== filterRuangan) return false;

      // 3. Kelas
      if (filterKelas !== 'ALL' && p.kelas !== filterKelas) return false;

      // 4. Diet
      if (filterDiet !== 'ALL' && p.diet !== filterDiet) return false;

      // 5. Status
      if (filterStatus !== 'ALL') {
        const isPrinted = printedPatientIds.has(p.id);
        if (filterStatus === 'SUDAH_DICETAK' && !isPrinted) return false;
        if (filterStatus === 'BELUM_DICETAK' && isPrinted) return false;

        const statusUpper = (p.status || 'AKTIF').toUpperCase();
        if (filterStatus === 'AKTIF' && statusUpper !== 'AKTIF') return false;
        if (filterStatus === 'PUASA' && statusUpper !== 'NPO') return false;
        if (filterStatus === 'PULANG' && statusUpper !== 'PULANG') return false;
      }

      return true;
    });
  }, [
    data.patients,
    searchQuery,
    filterRuangan,
    filterKelas,
    filterDiet,
    filterStatus,
    printedPatientIds,
  ]);

  // Filtered Revisions for Tab Revisi
  const filteredRevisions = useMemo(() => {
    return data.revisiItems.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.nama_pasien.toLowerCase().includes(q);
        const matchRm = (r.no_rm || '').toLowerCase().includes(q);
        if (!matchName && !matchRm) return false;
      }
      return true;
    });
  }, [data.revisiItems, searchQuery]);

  // Toggle selection for single patient
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

  // Toggle select all visible filtered patients
  function handleToggleSelectAll() {
    const allFilteredIds = filteredPatients.map((p) => p.id);
    const isAllSelected =
      allFilteredIds.length > 0 &&
      allFilteredIds.every((id) => selectedIds.has(id));

    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  }

  // Convert patient item to EtiketData format
  function toEtiket(p: PemorsianPatientItem): EtiketData {
    return {
      nama: p.nama_pasien,
      no_rm: p.no_rm,
      ruangan: p.ruangan,
      bed: p.bed || '-',
      kelas: p.kelas,
      gedung: p.gedung,
      diet: p.diet,
      waktu: p.waktu || data.waktuMakan || 'SIANG',
      is_revisi: false,
    };
  }

  // Convert revision item to EtiketData format
  function revisiToEtiket(r: PemorsianRevisiItem): EtiketData {
    return {
      nama: r.nama_pasien,
      no_rm: r.no_rm,
      ruangan: r.data_baru?.ruangan || r.ruangan,
      bed: r.data_baru?.bed || r.bed || '-',
      kelas: r.data_baru?.kelas || r.kelas,
      gedung: r.data_baru?.gedung || r.gedung,
      diet: r.data_baru?.diet || r.dampak_dapur || 'Diet Khusus',
      waktu: r.waktu_makan || data.waktuMakan || 'SIANG',
      is_revisi: true,
      keterangan_revisi: r.alasan || r.jenis_perubahan || 'Revisi Diet',
    };
  }

  // Handle single patient print
  function handlePrintSingle(patient: PemorsianPatientItem) {
    const etiket = toEtiket(patient);
    setEtiketList([etiket]);
    setCurrentPrintTargetIds([patient.id]);
    setModalTitle(`Cetak Etiket Pasien - ${patient.nama_pasien}`);
    setModalOpen(true);
  }

  // Handle batch print selected patients
  function handlePrintSelected() {
    const targets = data.patients.filter((p) => selectedIds.has(p.id));
    if (targets.length === 0) {
      toast.error('Pilih minimal satu pasien untuk dicetak.');
      return;
    }

    const list = targets.map(toEtiket);
    setEtiketList(list);
    setCurrentPrintTargetIds(targets.map((p) => p.id));
    setModalTitle(`Cetak Massal ${list.length} Etiket Makan`);
    setModalOpen(true);
  }

  // Handle print revision item
  function handlePrintRevisi(revisi: PemorsianRevisiItem) {
    const etiket = revisiToEtiket(revisi);
    setEtiketList([etiket]);
    setCurrentPrintTargetIds([revisi.pasien_id]);
    setModalTitle(`Cetak Etiket Revisi - ${revisi.nama_pasien}`);
    setModalOpen(true);
  }

  // Callback on successful print to persist status (synced with Live Pemorsian)
  function handlePrintSuccess() {
    if (currentPrintTargetIds.length === 0) return;
    markIdsAsPrinted(currentPrintTargetIds);
    toast.success(
      `${currentPrintTargetIds.length} etiket berhasil diproses cetak.`,
    );
  }

  // Stats Counters
  const stats: CetakEtiketStatsData = useMemo(() => {
    let sudah = 0;
    let belum = 0;
    data.patients.forEach((p) => {
      if (printedPatientIds.has(p.id)) {
        sudah++;
      } else {
        belum++;
      }
    });

    return {
      totalPasien: data.patients.length,
      porsiDietAktif: data.patients.filter(
        (p) => (p.status || '').toUpperCase() === 'AKTIF',
      ).length,
      pasienPuasa: data.patients.filter(
        (p) => (p.status || '').toUpperCase() === 'NPO',
      ).length,
      terpilihCount: selectedIds.size,
      sudahDicetakCount: sudah,
      belumDicetakCount: belum,
    };
  }, [data.patients, selectedIds.size, printedPatientIds]);

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header Banner */}
      <CetakEtiketHeader
        batch={data.batch}
        availableBatches={data.availableBatches}
        waktuMakan={data.waktuMakan}
        isRefreshing={isRefreshing}
        onSelectBatch={(batchId) => fetchData(batchId)}
        onRefresh={() => fetchData()}
      />

      {/* 2. 4 Summary Stats Cards */}
      <CetakEtiketStats stats={stats} />

      {/* 3. Tab Navigation */}
      <CetakEtiketTabs
        activeTab={activeTab}
        totalPasien={stats.totalPasien}
        revisiCount={data.revisiItems.length}
        onTabChange={setActiveTab}
      />

      {/* 4. Filter and Search Bar */}
      <CetakEtiketFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterRuangan={filterRuangan}
        onFilterRuanganChange={setFilterRuangan}
        filterKelas={filterKelas}
        onFilterKelasChange={setFilterKelas}
        filterDiet={filterDiet}
        onFilterDietChange={setFilterDiet}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterOptions={filterOptions}
        showFilters={activeTab === 'UTAMA'}
      />

      {/* 5. Main or Revision Table */}
      {activeTab === 'UTAMA' ? (
        <CetakEtiketTable
          patients={filteredPatients}
          selectedIds={selectedIds}
          printedPatientIds={printedPatientIds}
          waktuMakan={data.waktuMakan}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onPrintSingle={handlePrintSingle}
          onPrintSelected={handlePrintSelected}
        />
      ) : (
        <CetakEtiketRevisiTable
          revisions={filteredRevisions}
          waktuMakan={data.waktuMakan}
          onPrintRevisi={handlePrintRevisi}
        />
      )}

      {/* 6. Etiket Print Preview Modal Dialog */}
      <EtiketPrintPreviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        etiketList={etiketList}
        title={modalTitle}
        onPrintSuccess={handlePrintSuccess}
      />
    </div>
  );
}
