'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  PemorsianSummaryData,
  PemorsianPatientItem,
  PemorsianRevisiItem,
  EtiketData,
} from '@/types/pemorsiantypes';
import {
  getLivePemorsianData,
  updateEtiketPrintStatus,
  updateRevisionEtiketPrintStatus,
} from '@/servers/pemorsian.service';
import {
  listenProductionUpdate,
  broadcastProductionUpdate,
} from '@/lib/realtime-sync';
import { isNpoPatient } from '@/lib/npo-utils';
import { canPrintRevision, revisionTypeLabel } from '@/lib/revisi-etiket';
import { toast } from 'sonner';
import PemorsianStatsCards from '../ui/PemorsianStatsCards';
import PemorsianRevisiTableSection from './PemorsianRevisiTableSection';
import EtiketPrintPreviewModal from '../../../cetak-etiket/layout/EtiketPrintPreviewModal';

const AUTO_SYNC_INTERVAL_MS = 60000; // 60s background keep-fresh interval

interface PemorsianClientProps {
  initialData: PemorsianSummaryData;
}

export default function PemorsianClient({ initialData }: PemorsianClientProps) {
  const [data, setData] = useState<PemorsianSummaryData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(
    initialData.lastUpdated || new Date().toLocaleTimeString('id-ID'),
  );

  // Status Filter: 'ALL' | 'BELUM_DICETAK' | 'SUDAH_DICETAK' | 'BUTUH_REVISI'
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');

  // Selected Card & Revision IDs for batch actions
  const [selectedCardIds, setSelectedCardIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectedRevisiIds, setSelectedRevisiIds] = useState<Set<number>>(
    new Set(),
  );

  // Modal Preview State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [previewEtiketList, setPreviewEtiketList] = useState<EtiketData[]>([]);
  const pendingPrintIdsRef = useRef<number[]>([]);
  const pendingRevisionPrintRef = useRef<{ id: number; signature: string }[]>([]);

  // Prevent concurrent fetch calls
  const isFetchingRef = useRef(false);

  // 2. Synchronized Printed Status from Database per Snapshot
  const printedPatientIds = useMemo(() => {
    const set = new Set<number>();
    data.patients.forEach((p) => {
      if (p.print_status === 'SUDAH_DICETAK') {
        set.add(p.id);
      }
    });
    return set;
  }, [data.patients]);

  // 3. Patients with dynamic printed status loaded directly from DB
  const enrichedPatients: PemorsianPatientItem[] = useMemo(() => {
    return data.patients;
  }, [data.patients]);

  // Calculate dynamic status counts (strictly for feeding patients)
  const { belumDicetakCount, sudahDicetakCount, butuhRevisiCount } =
    useMemo(() => {
      let belum = 0;
      let sudah = 0;
      enrichedPatients.forEach((p) => {
        if (isNpoPatient(p) || p.status === 'NPO') return;
        if (p.print_status === 'BELUM_DICETAK') belum++;
        else if (p.print_status === 'SUDAH_DICETAK') sudah++;
      });
      return {
        belumDicetakCount: belum,
        sudahDicetakCount: sudah,
        butuhRevisiCount: data.revisiItems.length,
      };
    }, [enrichedPatients, data.revisiItems.length]);

  // 4. Data fetching helper (manual and silent background sync)
  const fetchLiveData = useCallback(
    async (batchId?: number, isManual = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isManual) setIsRefreshing(true);

      try {
        const targetBatchId = batchId !== undefined ? batchId : data.batch?.id;
        const live = await getLivePemorsianData(targetBatchId);
        if (live && live.success !== false) {
          setData(live);
          setLastSyncedAt(
            live.lastUpdated || new Date().toLocaleTimeString('id-ID'),
          );
        }
      } catch (err) {
        console.error('Error fetching live pemorsian data:', err);
      } finally {
        isFetchingRef.current = false;
        if (isManual) setIsRefreshing(false);
      }
    },
    [data.batch],
  );

  // Keep state synchronized if RSC passes updated initialData
  const lastInitialUpdateRef = useRef(initialData?.lastUpdated);
  useEffect(() => {
    if (
      initialData &&
      initialData.lastUpdated !== lastInitialUpdateRef.current
    ) {
      lastInitialUpdateRef.current = initialData.lastUpdated;
      const timer = setTimeout(() => {
        setData(initialData);
        setLastSyncedAt(
          initialData.lastUpdated || new Date().toLocaleTimeString('id-ID'),
        );
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialData]);

  // 5. Periodic Background Auto-Sync Polling (every 60s)
  useEffect(() => {
    if (!isAutoSyncEnabled) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchLiveData(undefined, false);
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, fetchLiveData]);

  // 6. Tab Visibility & Window Focus Auto-Sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveData(undefined, false);
      }
    };

    const handleWindowFocus = () => {
      fetchLiveData(undefined, false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchLiveData]);

  // 7. Cross-Tab Synchronization (BroadcastChannel)
  useEffect(() => {
    const unsubscribe = listenProductionUpdate((msg) => {
      if (msg.source === 'pemorsian') return;
      console.debug('Received real-time production update in Pemorsian:', msg);
      fetchLiveData(undefined, false);
    });

    return () => {
      unsubscribe();
    };
  }, [fetchLiveData]);

  // 8. Card Selection Handlers
  function handleToggleCardSelect(id: number) {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleCardSelectAll() {
    const activeCards = enrichedPatients.filter(
      (p) => p.print_status !== 'BUTUH_REVISI',
    );
    const isAll =
      activeCards.length > 0 &&
      activeCards.every((p) => selectedCardIds.has(p.id));

    if (isAll) {
      setSelectedCardIds(new Set());
    } else {
      setSelectedCardIds(new Set(activeCards.map((p) => p.id)));
    }
  }

  // 9. Revisi Selection Handlers
  function handleToggleRevisiSelect(id: number) {
    setSelectedRevisiIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleRevisiSelectAll() {
    const isAll =
      data.revisiItems.length > 0 &&
      data.revisiItems.every((r) => selectedRevisiIds.has(r.id));

    if (isAll) {
      setSelectedRevisiIds(new Set());
    } else {
      setSelectedRevisiIds(new Set(data.revisiItems.map((r) => r.id)));
    }
  }

  // 10. Status Toggle Handlers (Persisted to Database per Snapshot)
  async function handleTogglePrintedStatus(id: number, currentStatus: string) {
    const newPrinted = currentStatus !== 'SUDAH_DICETAK';

    // Optimistic UI update
    setData((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === id
          ? {
              ...p,
              print_status: newPrinted ? 'SUDAH_DICETAK' : 'BELUM_DICETAK',
              printed_at: newPrinted ? new Date().toISOString() : null,
            }
          : p,
      ),
    }));

    try {
      const res = await updateEtiketPrintStatus(
        [id],
        newPrinted,
        data.batch?.id,
        undefined,
        data.tanggalProduksi,
        data.waktuMakan,
      );
      if (res.success) {
        broadcastProductionUpdate('ETIKET_PRINTED', 'pemorsian');
      } else {
        toast.error(res.message || 'Gagal mengubah status cetak.');
        fetchLiveData(undefined, false);
      }
    } catch (err) {
      console.error('Error toggling print status in DB:', err);
      toast.error('Gagal memperbarui status cetak di database.');
      fetchLiveData(undefined, false);
    }
  }

  async function handleBatchMarkStatus(
    ids: number[],
    newStatus: 'SUDAH_DICETAK' | 'BELUM_DICETAK',
  ) {
    const isPrinted = newStatus === 'SUDAH_DICETAK';
    const targetSet = new Set(ids);

    // Optimistic UI update
    setData((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        targetSet.has(p.id)
          ? {
              ...p,
              print_status: newStatus,
              printed_at: isPrinted ? new Date().toISOString() : null,
            }
          : p,
      ),
    }));
    setSelectedCardIds(new Set());

    try {
      const res = await updateEtiketPrintStatus(
        ids,
        isPrinted,
        data.batch?.id,
        undefined,
        data.tanggalProduksi,
        data.waktuMakan,
      );
      if (res.success) {
        broadcastProductionUpdate('ETIKET_PRINTED', 'pemorsian');
        toast.success(
          `${ids.length} pasien berhasil ditandai ${isPrinted ? 'sudah dicetak' : 'belum dicetak'}.`,
        );
      } else {
        toast.error(res.message || 'Gagal mengubah status cetak massal.');
        fetchLiveData(undefined, false);
      }
    } catch (err) {
      console.error('Error batch updating print status in DB:', err);
      toast.error('Terjadi kesalahan saat menyimpan status ke database.');
      fetchLiveData(undefined, false);
    }
  }

  // 11. Etiket Mapping Helpers
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
      keterangan: p.kelas ? `Kelas ${p.kelas}` : '-',
      exp_date: data.tanggalProduksi || undefined,
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
      keterangan_revisi:
        r.alasan || revisionTypeLabel(r.jenis_perubahan),
      keterangan:
        r.alasan || revisionTypeLabel(r.jenis_perubahan),
      exp_date: data.tanggalProduksi || undefined,
    };
  }

  // 12. Print Action Handlers
  function handlePrintSinglePatient(patient: PemorsianPatientItem) {
    if (isNpoPatient(patient) || patient.status === 'NPO') return;
    const etiket = mapPatientToEtiket(patient);
    pendingPrintIdsRef.current = [patient.id];
    pendingRevisionPrintRef.current = [];
    setPreviewEtiketList([etiket]);
    setModalTitle(`Cetak Etiket - ${patient.nama_pasien}`);
    setModalOpen(true);
  }

  function handlePrintBatchPatients(patientList?: PemorsianPatientItem[]) {
    const rawTarget =
      patientList || enrichedPatients.filter((p) => selectedCardIds.has(p.id));
    const targetPatients = rawTarget.filter(
      (p) => !isNpoPatient(p) && p.status !== 'NPO',
    );

    if (targetPatients.length === 0) return;

    const etikets = targetPatients.map(mapPatientToEtiket);
    pendingPrintIdsRef.current = targetPatients.map((p) => p.id);
    pendingRevisionPrintRef.current = [];

    setPreviewEtiketList(etikets);
    setModalTitle(`Cetak ${targetPatients.length} Etiket Makan Pasien`);
    setModalOpen(true);
  }

  function handlePrintSingleRevisi(revisi: PemorsianRevisiItem) {
    if (!canPrintRevision(revisi.jenis_perubahan) || !revisi.revision_signature) return;
    const etiket = mapRevisiToEtiket(revisi);
    pendingPrintIdsRef.current = [];
    pendingRevisionPrintRef.current = [{ id: revisi.id, signature: revisi.revision_signature }];
    setPreviewEtiketList([etiket]);
    setModalTitle(`Cetak Etiket Revisi - ${revisi.nama_pasien}`);
    setModalOpen(true);
  }

  function handlePrintBatchRevisi(items?: PemorsianRevisiItem[]) {
    const targetItems = (items || data.revisiItems.filter((r) => selectedRevisiIds.has(r.id)))
      .filter((r) => canPrintRevision(r.jenis_perubahan) && r.revision_signature);

    if (targetItems.length === 0) return;

    const etikets = targetItems.map(mapRevisiToEtiket);
    pendingPrintIdsRef.current = [];
    pendingRevisionPrintRef.current = targetItems.map((r) => ({ id: r.id, signature: r.revision_signature! }));

    setPreviewEtiketList(etikets);
    setModalTitle(`Cetak ${targetItems.length} Etiket Revisi Pasien`);
    setModalOpen(true);
  }

  // When print succeeds, persist printed status to DB
  async function handlePrintSuccess() {
    const revisionTargets = pendingRevisionPrintRef.current;
    if (revisionTargets.length > 0) {
      pendingRevisionPrintRef.current = [];
      try {
        const res = await updateRevisionEtiketPrintStatus(data.batch?.id || 0, revisionTargets);
        if (!res.success) {
          toast.error(res.message);
          fetchLiveData(undefined, false);
          return;
        }
        const targetIds = new Set(revisionTargets.map((r) => r.id));
        setData((prev) => ({ ...prev, revisiItems: prev.revisiItems.map((r) => targetIds.has(r.id) ? { ...r, revision_print_status: 'SUDAH_DICETAK', revision_printed_at: new Date().toISOString() } : r) }));
        setSelectedRevisiIds(new Set());
        broadcastProductionUpdate('ETIKET_PRINTED', 'pemorsian');
        toast.success(`${res.count} etiket revisi berhasil dicetak.`);
      } catch (err) {
        console.error('Error updating revision print status:', err);
        toast.error('Gagal menyimpan status cetak revisi.');
      }
      return;
    }
    const ids = pendingPrintIdsRef.current;
    if (ids && ids.length > 0) {
      pendingPrintIdsRef.current = [];
      const targetSet = new Set(ids);

      // Optimistic UI update
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
      setSelectedCardIds(new Set());
      setSelectedRevisiIds(new Set());

      try {
        const res = await updateEtiketPrintStatus(
          ids,
          true,
          data.batch?.id,
          undefined,
          data.tanggalProduksi,
          data.waktuMakan,
        );
        if (res.success) {
          broadcastProductionUpdate('ETIKET_PRINTED', 'pemorsian');
          toast.success(`${ids.length} etiket berhasil diproses cetak.`);
        }
      } catch (err) {
        console.error('Error pada Sistem :', err);
      }
    }
  }

  // 13. Filter status navigation (from sidebar or tabs)
  function handleStatusFilterClick(
    status: 'ALL' | 'BELUM_DICETAK' | 'SUDAH_DICETAK' | 'BUTUH_REVISI',
  ) {
    setActiveStatusFilter(status);
    if (status === 'BUTUH_REVISI') {
      // Smooth scroll to dedicated revisi section
      const section = document.getElementById('section-revisi-pemorsian');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 2. 3 Card Keterangan: Sudah Dicetak, Belum Tercetak, Perlu Direvisi (Shadcn) */}
      <PemorsianStatsCards
        sudahDicetakCount={sudahDicetakCount}
        belumDicetakCount={belumDicetakCount}
        butuhRevisiCount={butuhRevisiCount}
        activeStatusFilter={activeStatusFilter}
        onFilterStatusClick={handleStatusFilterClick}
      />

      {/* 4. Dedicated Section: Table Perubahan Data (Status: Butuh Revisi) */}
      <div id='section-revisi-pemorsian' className='w-full pt-2'>
        <PemorsianRevisiTableSection
          revisiItems={data.revisiItems}
          selectedIds={selectedRevisiIds}
          onToggleSelect={handleToggleRevisiSelect}
          onToggleSelectAll={handleToggleRevisiSelectAll}
          onPrintSingle={handlePrintSingleRevisi}
          onPrintBatch={handlePrintBatchRevisi}
          isAllSelected={
            data.revisiItems.length > 0 &&
            selectedRevisiIds.size === data.revisiItems.length
          }
        />
      </div>

      {/* 5. Etiket Print Preview Modal Dialog */}
      <EtiketPrintPreviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        etiketList={previewEtiketList}
        title={modalTitle}
        onPrintSuccess={handlePrintSuccess}
      />
    </div>
  );
}
