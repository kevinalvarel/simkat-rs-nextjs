'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type {
  PemorsianSummaryData,
  PemorsianPatientItem,
  PemorsianRevisiItem,
  EtiketData,
  CetakEtiketTab,
  CetakEtiketFilterOptions,
  CetakEtiketStatsData,
} from '@/types/cetaketikettypes';
import {
  getLivePemorsianData,
  updateEtiketPrintStatus,
} from '@/servers/pemorsian.service';
import {
  broadcastProductionUpdate,
  listenProductionUpdate,
} from '@/lib/realtime-sync';
import { isNpoPatient } from '@/lib/npo-utils';
import EtiketPrintPreviewModal from '@/components/ag-katering/user/cetak-etiket/layout/EtiketPrintPreviewModal';
import CetakEtiketHeader, { type WaktuMakanType } from './CetakEtiketHeader';
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

  // Snapshot Date, Waktu, & Live Mode States (Live Snapshot as default!)
  const [isLive, setIsLive] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialData.tanggalProduksi || new Date().toISOString().slice(0, 10),
  );
  const [selectedWaktu, setSelectedWaktu] = useState<WaktuMakanType>(
    (initialData.waktuMakan as WaktuMakanType) || 'SIANG',
  );

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

  // 2. Synchronized Printed Status from Database (per snapshot)
  const printedPatientIds = useMemo(() => {
    const set = new Set<number>();
    data.patients.forEach((p) => {
      if (p.print_status === 'SUDAH_DICETAK') {
        set.add(p.id);
      }
    });
    return set;
  }, [data.patients]);

  // Fetch / Refresh Data helper with date & mealtime filter
  const fetchData = useCallback(
    async (batchId?: number, date?: string, waktu?: string) => {
      setIsRefreshing(true);
      try {
        const res = await getLivePemorsianData(batchId, date, waktu);
        if (res && res.success !== false) {
          setData(res);
          setSelectedIds(new Set());
          toast.success('Data snapshot etiket berhasil dimuat.');
        } else {
          toast.error('Gagal memuat data snapshot.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Terjadi kesalahan saat memuat data etiket.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [],
  );

  function handleSelectLive() {
    setIsLive(true);
    fetchData();
  }

  function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    setIsLive(false);

    const matching = data.availableBatches.find(
      (b) =>
        b.tanggal_produksi === newDate &&
        b.waktu_makan.toUpperCase() === selectedWaktu.toUpperCase(),
    );

    if (matching) {
      fetchData(matching.id, newDate, selectedWaktu);
    } else {
      fetchData(undefined, newDate, selectedWaktu);
    }
  }

  function handleWaktuChange(newWaktu: WaktuMakanType) {
    setSelectedWaktu(newWaktu);
    setIsLive(false);

    const matching = data.availableBatches.find(
      (b) =>
        b.tanggal_produksi === selectedDate &&
        b.waktu_makan.toUpperCase() === newWaktu.toUpperCase(),
    );

    if (matching) {
      fetchData(matching.id, selectedDate, newWaktu);
    } else {
      fetchData(undefined, selectedDate, newWaktu);
    }
  }

  function handleRefresh() {
    if (isLive) {
      fetchData();
    } else {
      const matching = data.availableBatches.find(
        (b) =>
          b.tanggal_produksi === selectedDate &&
          b.waktu_makan.toUpperCase() === selectedWaktu.toUpperCase(),
      );
      fetchData(matching?.id, selectedDate, selectedWaktu);
    }
  }

  // Cross-tab and real-time event listener (syncs immediately when printed in other tabs/pages)
  useEffect(() => {
    const unsubscribe = listenProductionUpdate((msg) => {
      // Ignore if this tab itself produced the event (avoid overwriting optimistic state)
      if (msg.source === 'cetak-etiket') return;

      if (
        msg.type === 'ETIKET_PRINTED' ||
        msg.type === 'SYNC_NOW' ||
        msg.type === 'PATIENT_UPDATED' ||
        msg.type === 'REVISION_APPROVED' ||
        msg.type === 'REVISION_REJECTED' ||
        msg.type === 'SNAPSHOT_TRIGGERED'
      ) {
        if (isLive) {
          getLivePemorsianData().then((res) => {
            if (res && res.success !== false) setData(res);
          });
        } else {
          const matching = data.availableBatches.find(
            (b) =>
              b.tanggal_produksi === selectedDate &&
              b.waktu_makan.toUpperCase() === selectedWaktu.toUpperCase(),
          );
          getLivePemorsianData(matching?.id, selectedDate, selectedWaktu).then(
            (res) => {
              if (res && res.success !== false) setData(res);
            },
          );
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isLive, data.availableBatches, selectedDate, selectedWaktu]);

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
    const patient = data.patients.find((p) => p.id === id);
    if (patient && (isNpoPatient(patient) || patient.status === 'NPO')) return;

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

  // Toggle select all visible filtered patients (feeding patients only)
  function handleToggleSelectAll() {
    const allFeedingIds = filteredPatients
      .filter((p) => !isNpoPatient(p) && p.status !== 'NPO')
      .map((p) => p.id);
    const isAllSelected =
      allFeedingIds.length > 0 &&
      allFeedingIds.every((id) => selectedIds.has(id));

    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFeedingIds));
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
      keterangan: p.kelas ? `Kelas ${p.kelas}` : '-',
      exp_date: data.tanggalProduksi || undefined,
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
      keterangan: r.alasan || r.jenis_perubahan || 'Revisi Diet',
      exp_date: data.tanggalProduksi || undefined,
    };
  }

  // Handle single patient print
  function handlePrintSingle(patient: PemorsianPatientItem) {
    if (isNpoPatient(patient) || patient.status === 'NPO') {
      toast.error('Pasien Puasa (NPO) tidak mendapatkan etiket baki makanan.');
      return;
    }
    const etiket = toEtiket(patient);
    setEtiketList([etiket]);
    setCurrentPrintTargetIds([patient.id]);
    setModalTitle(`Cetak Etiket Pasien - ${patient.nama_pasien}`);
    setModalOpen(true);
  }

  // Handle batch print selected patients
  function handlePrintSelected() {
    const targets = data.patients.filter(
      (p) => selectedIds.has(p.id) && !isNpoPatient(p) && p.status !== 'NPO',
    );
    if (targets.length === 0) {
      toast.error('Pilih minimal satu pasien makan untuk dicetak.');
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
    setCurrentPrintTargetIds([revisi.id]);
    setModalTitle(`Cetak Etiket Revisi - ${revisi.nama_pasien}`);
    setModalOpen(true);
  }

  // Callback on successful print to persist status in DB per snapshot
  async function handlePrintSuccess() {
    if (currentPrintTargetIds.length === 0) return;

    const targetIds = [...currentPrintTargetIds];
    const targetSet = new Set(targetIds);

    // 1. Optimistic UI update (0ms delay)
    setData((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        targetSet.has(p.id)
          ? {
              ...p,
              print_status: 'SUDAH_DICETAK',
              printed_at: new Date().toISOString(),
            }
          : p,
      ),
    }));

    // 2. Persist to DB per snapshot batch
    try {
      const res = await updateEtiketPrintStatus(
        targetIds,
        true,
        data.batch?.id,
        undefined,
        selectedDate,
        selectedWaktu,
      );
      if (res.success) {
        broadcastProductionUpdate('ETIKET_PRINTED', 'cetak-etiket');
        toast.success(`${targetIds.length} etiket berhasil dicetak.`);
        if (res.batchId && (!data.batch || data.batch.id !== res.batchId)) {
          // If a new batch was created/resolved, silently reload the data for that batch
          fetchData(res.batchId, selectedDate, selectedWaktu);
        }
      } else {
        toast.error(res.message || 'Gagal menyimpan status cetak ke database.');
      }
    } catch (err) {
      console.error('Error updating print status in DB:', err);
      toast.error('Terjadi kesalahan saat menyimpan status cetak.');
    }
  }

  // Stats Counters
  const stats: CetakEtiketStatsData = useMemo(() => {
    let sudah = 0;
    let belum = 0;
    let aktifCount = 0;
    let puasaCount = 0;

    data.patients.forEach((p) => {
      const isNpo = isNpoPatient(p) || p.status === 'NPO';
      if (isNpo) {
        puasaCount++;
      } else {
        aktifCount++;
        if (printedPatientIds.has(p.id)) {
          sudah++;
        } else {
          belum++;
        }
      }
    });

    return {
      totalPasien: aktifCount,
      porsiDietAktif: aktifCount,
      pasienPuasa: puasaCount,
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
        tanggalProduksi={data.tanggalProduksi}
        selectedDate={selectedDate}
        selectedWaktu={selectedWaktu}
        isLive={isLive}
        isRefreshing={isRefreshing}
        onSelectLive={handleSelectLive}
        onDateChange={handleDateChange}
        onWaktuChange={handleWaktuChange}
        onRefresh={handleRefresh}
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
