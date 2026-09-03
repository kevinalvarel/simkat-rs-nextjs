'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  PemorsianSummaryData,
  PemorsianPatientItem,
  PemorsianRevisiItem,
  EtiketData,
} from '@/types/pemorsiantypes';
import { getLivePemorsianData } from '@/servers/pemorsian.service';
import { listenProductionUpdate } from '@/lib/realtime-sync';
import { useEtiketPrintedSync } from '@/hooks/useEtiketPrintedSync';
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

  // Prevent concurrent fetch calls
  const isFetchingRef = useRef(false);

  // 2. Synchronized Printed Status (shared with Cetak Etiket)
  const { printedPatientIds, savePrintedIds } = useEtiketPrintedSync(
    data.batchCode,
  );

  // 3. Enrich patients with dynamic printed status
  const enrichedPatients: PemorsianPatientItem[] = useMemo(() => {
    return data.patients.map((p) => {
      // If patient is in Butuh Revisi, retain status
      if (p.print_status === 'BUTUH_REVISI') {
        return p;
      }

      // Check if printed in localStorage
      if (printedPatientIds.has(p.id)) {
        return {
          ...p,
          print_status: 'SUDAH_DICETAK',
        };
      }

      return {
        ...p,
        print_status: 'BELUM_DICETAK',
      };
    });
  }, [data.patients, printedPatientIds]);

  // Calculate dynamic status counts
  const { belumDicetakCount, sudahDicetakCount, butuhRevisiCount } =
    useMemo(() => {
      let belum = 0;
      let sudah = 0;
      enrichedPatients.forEach((p) => {
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

  // 10. Status Toggle Handlers (Manual status update)
  function handleTogglePrintedStatus(id: number, currentStatus: string) {
    const next = new Set(printedPatientIds);
    if (currentStatus === 'SUDAH_DICETAK') {
      next.delete(id);
    } else {
      next.add(id);
    }
    savePrintedIds(next);
  }

  function handleBatchMarkStatus(
    ids: number[],
    newStatus: 'SUDAH_DICETAK' | 'BELUM_DICETAK',
  ) {
    const next = new Set(printedPatientIds);
    ids.forEach((id) => {
      if (newStatus === 'SUDAH_DICETAK') next.add(id);
      else next.delete(id);
    });
    savePrintedIds(next);
    setSelectedCardIds(new Set());
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
      keterangan_revisi: r.dampak_dapur || 'Revisi Diet',
    };
  }

  // 12. Print Action Handlers
  function handlePrintSinglePatient(patient: PemorsianPatientItem) {
    const etiket = mapPatientToEtiket(patient);
    pendingPrintIdsRef.current = [patient.id];
    setPreviewEtiketList([etiket]);
    setModalTitle(`Cetak Etiket - ${patient.nama_pasien}`);
    setModalOpen(true);
  }

  function handlePrintBatchPatients(patientList?: PemorsianPatientItem[]) {
    const targetPatients =
      patientList || enrichedPatients.filter((p) => selectedCardIds.has(p.id));

    if (targetPatients.length === 0) return;

    const etikets = targetPatients.map(mapPatientToEtiket);
    pendingPrintIdsRef.current = targetPatients.map((p) => p.id);

    setPreviewEtiketList(etikets);
    setModalTitle(`Cetak ${targetPatients.length} Etiket Makan Pasien`);
    setModalOpen(true);
  }

  function handlePrintSingleRevisi(revisi: PemorsianRevisiItem) {
    const etiket = mapRevisiToEtiket(revisi);
    pendingPrintIdsRef.current = [revisi.id];
    setPreviewEtiketList([etiket]);
    setModalTitle(`Cetak Etiket Revisi - ${revisi.nama_pasien}`);
    setModalOpen(true);
  }

  function handlePrintBatchRevisi(items?: PemorsianRevisiItem[]) {
    const targetItems =
      items || data.revisiItems.filter((r) => selectedRevisiIds.has(r.id));

    if (targetItems.length === 0) return;

    const etikets = targetItems.map(mapRevisiToEtiket);
    pendingPrintIdsRef.current = targetItems.map((r) => r.id);

    setPreviewEtiketList(etikets);
    setModalTitle(`Cetak ${targetItems.length} Etiket Revisi Pasien`);
    setModalOpen(true);
  }

  // When print succeeds, mark the pending printed IDs in localStorage
  function handlePrintSuccess() {
    const ids = pendingPrintIdsRef.current;
    if (ids && ids.length > 0) {
      const next = new Set(printedPatientIds);
      ids.forEach((id) => next.add(id));
      savePrintedIds(next);
      setSelectedCardIds(new Set());
      setSelectedRevisiIds(new Set());
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
