'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/ag-rs/navbar';
import SelectionStepHeader from '@/components/ag-rs/selection/ui/SelectionStepHeader';
import SelectionProgressIndicator from '@/components/ag-rs/selection/ui/SelectionProgressIndicator';
import StepMealTimeSection from './StepMealTimeSection';
import StepGedungSection from './StepGedungSection';
import StepRuanganSection from './StepRuanganSection';
import StepKamarSection from './StepKamarSection';
import StepConfirmationSection from './StepConfirmationSection';
import { toast } from 'sonner';
import { computeMealCycleStatuses } from '@/lib/snapshot-cycle';
import { listenProductionUpdate } from '@/lib/realtime-sync';
import {
  getGedungWithRuangan,
  GedungWithRuangan,
  RuanganItem,
} from '@/servers/tempat.service';
import {
  getWaktuMakanConfig,
  getSnapshotBatches,
  WaktuMakanConfig,
  SnapshotBatch,
} from '@/servers/snapshot.service';
import type {
  MealTimeType,
  MealLockInfo,
  SelectedKamarItem,
} from '@/types/ag-rs-types';

const MEAL_NAME_MAP: Record<string, string> = {
  PAGI: 'Makan Pagi',
  SIANG: 'Makan Siang',
  MALAM: 'Makan Malam',
};

interface SelectionClientProps {
  initialGedungList?: GedungWithRuangan[];
  initialWaktuConfigs?: WaktuMakanConfig[];
  initialSnapshotBatches?: SnapshotBatch[];
}

export default function SelectionClient({
  initialGedungList,
  initialWaktuConfigs,
  initialSnapshotBatches,
}: SelectionClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigationTransition] = useTransition();

  const [selectedMealTime, setSelectedMealTime] = useState<MealTimeType>(null);
  const [selectedGedung, setSelectedGedung] =
    useState<GedungWithRuangan | null>(null);
  const [selectedRuangan, setSelectedRuangan] = useState<RuanganItem | null>(
    null,
  );
  const [selectedKamar, setSelectedKamar] = useState<SelectedKamarItem | null>(
    null,
  );

  const [gedungList, setGedungList] = useState<GedungWithRuangan[]>(
    () => initialGedungList || [],
  );
  const [waktuConfigs, setWaktuConfigs] = useState<WaktuMakanConfig[]>(
    () => initialWaktuConfigs || [],
  );
  const [snapshotBatches, setSnapshotBatches] = useState<SnapshotBatch[]>(
    () => initialSnapshotBatches || [],
  );
  useEffect(() => {
    let mounted = true;
    const refreshBatches = async () => {
      const next = await getSnapshotBatches();
      if (mounted) setSnapshotBatches(next);
    };
    const stop = listenProductionUpdate((message) => {
      if (message.type === 'SNAPSHOT_TRIGGERED') void refreshBatches();
    });
    const interval = setInterval(() => void refreshBatches(), 30000);
    return () => { mounted = false; stop(); clearInterval(interval); };
  }, []);
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !initialGedungList || initialGedungList.length === 0,
  );

  useEffect(() => {
    if (initialGedungList && initialGedungList.length > 0) return;

    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [gData, cData, bData] = await Promise.all([
          getGedungWithRuangan(),
          getWaktuMakanConfig(),
          getSnapshotBatches(),
        ]);
        if (!isMounted) return;
        setGedungList(gData);
        setWaktuConfigs(cData);
        setSnapshotBatches(bData);
      } catch (err) {
        console.error('Gagal mengambil data master RS:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [initialGedungList]);

  // Auto-restore state from URL query parameters (e.g. when user clicks "Kembali" from Data Pasien)
  useEffect(() => {
    if (!gedungList || gedungList.length === 0) return;

    const mealParam = searchParams.get('meal') as MealTimeType;
    const waktuMakanParam = searchParams.get('waktuMakan');
    const resolvedMeal: MealTimeType =
      mealParam ||
      (waktuMakanParam === 'PAGI'
        ? 'Makan Pagi'
        : waktuMakanParam === 'SIANG'
          ? 'Makan Siang'
          : waktuMakanParam === 'MALAM'
            ? 'Makan Malam'
            : null);

    const gedungParam = searchParams.get('gedung');
    const gedungIdParam = searchParams.get('gedungId');
    const ruanganParam = searchParams.get('ruangan');
    const ruanganIdParam = searchParams.get('ruanganId');

    const restore = setTimeout(() => {
      if (resolvedMeal) {
        setSelectedMealTime((prev) => prev || resolvedMeal);
      }

      if (gedungParam || gedungIdParam) {
        const foundGedung = gedungList.find(
          (g) =>
            (gedungIdParam && String(g.idGedung) === String(gedungIdParam)) ||
            (gedungParam &&
              g.namaGedung.toLowerCase() === gedungParam.toLowerCase()),
        );
        if (foundGedung) {
          setSelectedGedung((prev) => prev || foundGedung);

          if (ruanganParam || ruanganIdParam) {
            const foundRuangan = foundGedung.ruanganList.find(
              (r) =>
                (ruanganIdParam &&
                  String(r.idRuangan) === String(ruanganIdParam)) ||
                (ruanganParam &&
                  r.namaRuangan.toLowerCase() ===
                    ruanganParam.toLowerCase()),
            );
            if (foundRuangan) {
              setSelectedRuangan((prev) => prev || foundRuangan);
            }
          }
        }
      }
    }, 0);
    return () => clearTimeout(restore);
  }, [gedungList, searchParams]);

  // The same batch-driven status is used by AG Katering's snapshot page.
  function getMealLockInfo(
    jenisMakan: 'PAGI' | 'SIANG' | 'MALAM',
    defaultCutoff: string,
  ): MealLockInfo {
    const cycle = computeMealCycleStatuses(waktuConfigs, snapshotBatches, new Date());
    const status = cycle.statuses.find((item) => item.jenis_makan === jenisMakan);
    const runningCycle = cycle.activeCycle?.jenis_makan || 'PAGI';
    const prevCycle = runningCycle === 'PAGI' ? 'MALAM' : runningCycle === 'SIANG' ? 'PAGI' : 'SIANG';
    const isLocked = Boolean(status?.isLocked);
    const isPreviousBatch = isLocked && jenisMakan === prevCycle;
    return {
      isLocked,
      isPreviousBatch,
      isOlderLocked: isLocked && !isPreviousBatch,
      isWaiting: Boolean(status && !status.isLocked && !status.isAvailable),
      cutoffTime: status?.waktu || defaultCutoff,
      hasBatchToday: Boolean(status?.batch),
      isCutoffPassed: Boolean(status?.isAvailable && status.remainingSeconds === 0),
      runningCycle,
      prevCycle,
    };
  }

  // Construct target URL for prefetching and direct navigation
  const buildTargetUrl = (
    meal: MealTimeType,
    gedung: GedungWithRuangan | null,
    ruangan: RuanganItem | null,
    kamar: SelectedKamarItem | null,
  ) => {
    if (!meal || !gedung || !ruangan) return null;

    const jenisMakan =
      meal === 'Makan Pagi'
        ? 'PAGI'
        : meal === 'Makan Siang'
          ? 'SIANG'
          : 'MALAM';
    const lock = getMealLockInfo(jenisMakan, '12:00');
    const isRevisi = lock.isPreviousBatch;

    const selectedStatus = computeMealCycleStatuses(waktuConfigs, snapshotBatches, new Date())
      .statuses.find((status) => status.jenis_makan === jenisMakan);
    const targetBatch = snapshotBatches.find(
      (b) => b.waktu_makan === jenisMakan && b.tanggal_produksi === selectedStatus?.targetDate && b.status_batch === 'LOCKED',
    );

    const params = new URLSearchParams({
      ruangan: ruangan.namaRuangan,
      gedung: gedung.namaGedung,
      ruanganId: String(ruangan.idRuangan),
      gedungId: String(gedung.idGedung),
      meal: meal,
      waktuMakan: jenisMakan,
      ...(kamar && kamar.idKamar !== 'all'
        ? {
            kamar: kamar.nomorKamar,
            kamarId: String(kamar.idKamar),
          }
        : {}),
      ...(isRevisi
        ? {
            isRevisi: 'true',
            revisiMeal: meal,
            batchId: targetBatch ? String(targetBatch.id) : '',
          }
        : {}),
    });

    return `/dashboard/ag-rs/data-pasien?${params.toString()}`;
  };

  const handleSelectMealTime = (
    meal: 'Makan Pagi' | 'Makan Siang' | 'Makan Malam',
    lockInfo: MealLockInfo,
  ) => {
    if (lockInfo.isWaiting) {
      toast.error('Tunggu snapshot sebelumnya terkunci sebelum memilih waktu makan ini.');
      return;
    }
    if (lockInfo.isOlderLocked) {
      const prevMealTitle =
        MEAL_NAME_MAP[lockInfo.prevCycle] || lockInfo.prevCycle;
      toast.error(
        `Batch ${meal} sudah lampau dan tidak dapat direvisi. Hanya batch sebelumnya (${prevMealTitle}) yang dapat direvisi.`,
      );
      return;
    }

    if (lockInfo.isPreviousBatch) {
      toast.info(
        `📌 Memilih ${meal} dalam MODE REVISI BATCH SEBELUMNYA (Post-Snapshot).`,
      );
    }

    setSelectedMealTime(meal);
    setSelectedGedung(null);
    setSelectedRuangan(null);
    setSelectedKamar(null);
  };

  const handleSelectGedung = (gedung: GedungWithRuangan) => {
    setSelectedGedung(gedung);
    setSelectedRuangan(null);
    setSelectedKamar(null);
  };

  const handleSelectRuangan = (ruangan: RuanganItem) => {
    setSelectedRuangan(ruangan);
    setSelectedKamar(null);
  };

  const handleSelectKamar = (kamar: SelectedKamarItem) => {
    setSelectedKamar(kamar);

    // Optimistically prefetch target data-pasien page
    const nextUrl = buildTargetUrl(
      selectedMealTime,
      selectedGedung,
      selectedRuangan,
      kamar,
    );
    if (nextUrl) {
      router.prefetch(nextUrl);
    }
  };

  const handleReset = () => {
    setSelectedMealTime(null);
    setSelectedGedung(null);
    setSelectedRuangan(null);
    setSelectedKamar(null);
  };

  const handleStepJump = (step: number) => {
    if (step === 0) {
      setSelectedMealTime(null);
      setSelectedGedung(null);
      setSelectedRuangan(null);
      setSelectedKamar(null);
    } else if (step === 1) {
      setSelectedGedung(null);
      setSelectedRuangan(null);
      setSelectedKamar(null);
    } else if (step === 2) {
      setSelectedRuangan(null);
      setSelectedKamar(null);
    } else if (step === 3) {
      setSelectedKamar(null);
    }
  };

  const handleContinue = () => {
    const targetUrl = buildTargetUrl(
      selectedMealTime,
      selectedGedung,
      selectedRuangan,
      selectedKamar,
    );
    if (!targetUrl) return;

    startNavigationTransition(() => {
      router.push(targetUrl);
    });
  };

  // Determine current step index (0: Jam Makan, 1: Gedung, 2: Ruangan, 3: Kamar/Pintu, 4: Konfirmasi)
  const currentStep = !selectedMealTime
    ? 0
    : !selectedGedung
      ? 1
      : !selectedRuangan
        ? 2
        : !selectedKamar
          ? 3
          : 4;

  const currentJenisMakan =
    selectedMealTime === 'Makan Pagi'
      ? 'PAGI'
      : selectedMealTime === 'Makan Siang'
        ? 'SIANG'
        : 'MALAM';
  const confirmationLock = selectedMealTime
    ? getMealLockInfo(currentJenisMakan, '12:00')
    : null;

  return (
    <div className='min-h-dvh flex flex-col bg-background text-foreground'>
      <Navbar />

      <main className='flex-1 grid place-items-center p-4 sm:p-6 md:p-8'>
        <div className='w-full max-w-2xl space-y-6'>
          {/* Header Step Info */}
          <SelectionStepHeader
            currentStep={currentStep}
            selectedMealTime={selectedMealTime}
            selectedGedungName={selectedGedung?.namaGedung}
            selectedRuanganName={selectedRuangan?.namaRuangan}
          />

          {/* Interactive Progress Indicator */}
          <SelectionProgressIndicator
            currentStep={currentStep}
            onStepClick={handleStepJump}
          />

          {/* STEP 1: Select Meal Time */}
          {currentStep === 0 && (
            <StepMealTimeSection
              isLoading={isLoading}
              selectedMealTime={selectedMealTime}
              getMealLockInfo={getMealLockInfo}
              onSelectMealTime={handleSelectMealTime}
            />
          )}

          {/* STEP 2: Select Building */}
          {currentStep === 1 && (
            <StepGedungSection
              selectedMealTime={selectedMealTime}
              selectedGedung={selectedGedung}
              isLoading={isLoading}
              gedungList={gedungList}
              onBack={() => handleStepJump(0)}
              onSelectGedung={handleSelectGedung}
            />
          )}

          {/* STEP 3: Select Room */}
          {currentStep === 2 && selectedGedung && (
            <StepRuanganSection
              selectedMealTime={selectedMealTime}
              selectedGedung={selectedGedung}
              selectedRuangan={selectedRuangan}
              onBack={() => handleStepJump(1)}
              onSelectRuangan={handleSelectRuangan}
            />
          )}

          {/* STEP 4: Select Kamar / Pintu */}
          {currentStep === 3 && selectedGedung && selectedRuangan && (
            <StepKamarSection
              selectedMealTime={selectedMealTime}
              selectedGedung={selectedGedung}
              selectedRuangan={selectedRuangan}
              selectedKamar={selectedKamar}
              onBack={() => handleStepJump(2)}
              onSelectKamar={handleSelectKamar}
            />
          )}

          {/* STEP 5: Final Confirmation */}
          {currentStep === 4 &&
            selectedMealTime &&
            selectedGedung &&
            selectedRuangan &&
            selectedKamar && (
              <StepConfirmationSection
                selectedMealTime={selectedMealTime}
                selectedGedung={selectedGedung}
                selectedRuangan={selectedRuangan}
                selectedKamar={selectedKamar}
                isRevisi={Boolean(confirmationLock?.isPreviousBatch)}
                isNavigating={isNavigating}
                onReset={handleReset}
                onContinue={handleContinue}
              />
            )}
        </div>
      </main>
    </div>
  );
}
