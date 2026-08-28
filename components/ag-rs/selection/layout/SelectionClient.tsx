'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ag-rs/navbar';
import SelectionStepHeader from '@/components/ag-rs/selection/ui/SelectionStepHeader';
import SelectionProgressIndicator from '@/components/ag-rs/selection/ui/SelectionProgressIndicator';
import StepMealTimeSection from './StepMealTimeSection';
import StepGedungSection from './StepGedungSection';
import StepRuanganSection from './StepRuanganSection';
import StepKamarSection from './StepKamarSection';
import StepConfirmationSection from './StepConfirmationSection';
import { toast } from 'sonner';
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
  const [isNavigating, startNavigationTransition] = useTransition();

  const [selectedMealTime, setSelectedMealTime] = useState<MealTimeType>(null);
  const [selectedGedung, setSelectedGedung] =
    useState<GedungWithRuangan | null>(null);
  const [selectedRuangan, setSelectedRuangan] = useState<RuanganItem | null>(
    null,
  );
  const [selectedKamar, setSelectedKamar] =
    useState<SelectedKamarItem | null>(null);

  const [gedungList, setGedungList] = useState<GedungWithRuangan[]>(
    () => initialGedungList || [],
  );
  const [waktuConfigs, setWaktuConfigs] = useState<WaktuMakanConfig[]>(
    () => initialWaktuConfigs || [],
  );
  const [snapshotBatches, setSnapshotBatches] = useState<SnapshotBatch[]>(
    () => initialSnapshotBatches || [],
  );
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

  // Helper to determine lock status and whether a meal cycle is the IMMEDIATELY PREVIOUS batch (eligible for revision)
  function getMealLockInfo(
    jenisMakan: 'PAGI' | 'SIANG' | 'MALAM',
    defaultCutoff: string,
  ): MealLockInfo {
    const cfg = waktuConfigs.find((c) => c.jenis_makan === jenisMakan);
    const cutoffTime = cfg ? cfg.waktu : defaultCutoff;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Cut-off minutes for each meal cycle
    const getMin = (timeStr: string) => {
      const [h, m] = (timeStr || '12:00').split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const pagiCutoffStr =
      waktuConfigs.find((c) => c.jenis_makan === 'PAGI')?.waktu || '05:30';
    const siangCutoffStr =
      waktuConfigs.find((c) => c.jenis_makan === 'SIANG')?.waktu || '10:30';
    const malamCutoffStr =
      waktuConfigs.find((c) => c.jenis_makan === 'MALAM')?.waktu || '16:00';

    const pagiMin = getMin(pagiCutoffStr);
    const siangMin = getMin(siangCutoffStr);
    const malamMin = getMin(malamCutoffStr);

    const hasTodayMalamBatch = snapshotBatches.some(
      (b) => b.tanggal_produksi === todayStr && b.waktu_makan === 'MALAM',
    );
    const isMalamLocked = currentMinutes >= malamMin || hasTodayMalamBatch;

    // Determine current running cycle & immediately previous cycle
    let runningCycle: 'PAGI' | 'SIANG' | 'MALAM' = 'PAGI';
    let prevCycle: 'PAGI' | 'SIANG' | 'MALAM' = 'MALAM';

    if (currentMinutes < pagiMin) {
      runningCycle = 'PAGI';
      prevCycle = 'MALAM'; // Yesterday's Malam
    } else if (currentMinutes < siangMin) {
      runningCycle = 'SIANG';
      prevCycle = 'PAGI'; // Today's Pagi (cut-off has passed)
    } else if (currentMinutes < malamMin && !hasTodayMalamBatch) {
      runningCycle = 'MALAM';
      prevCycle = 'SIANG'; // Today's Siang (cut-off has passed)
    } else {
      // Malam is locked -> running cycle rolls over to tomorrow's PAGI, prevCycle is today's MALAM
      runningCycle = 'PAGI';
      prevCycle = 'MALAM';
    }

    let isLocked = false;
    let hasBatchForCycle = false;
    let isCutoffPassed = false;

    if (isMalamLocked && jenisMakan === 'PAGI') {
      // Makan Pagi now targets TOMORROW: active until tomorrow morning
      hasBatchForCycle = snapshotBatches.some(
        (b) => b.tanggal_produksi === tomorrowStr && b.waktu_makan === 'PAGI',
      );
      isLocked = hasBatchForCycle; // Only locked if tomorrow's batch was already snapshotted
      isCutoffPassed = false;
    } else {
      // Normal today evaluation
      const [h, m] = cutoffTime.split(':').map(Number);
      const cutoffMinutes = (h || 0) * 60 + (m || 0);

      isCutoffPassed = currentMinutes >= cutoffMinutes;
      hasBatchForCycle = snapshotBatches.some(
        (b) => b.tanggal_produksi === todayStr && b.waktu_makan === jenisMakan,
      );
      isLocked = isCutoffPassed || hasBatchForCycle;
    }

    // Previous batch is ONLY eligible if it is locked AND equals prevCycle
    const isPreviousBatch = isLocked && jenisMakan === prevCycle;
    const isOlderLocked = isLocked && !isPreviousBatch;

    return {
      isLocked,
      isPreviousBatch,
      isOlderLocked,
      cutoffTime,
      hasBatchToday: hasBatchForCycle,
      isCutoffPassed,
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

    const targetBatch = snapshotBatches.find(
      (b) => b.waktu_makan === jenisMakan,
    );

    const params = new URLSearchParams({
      ruangan: ruangan.namaRuangan,
      gedung: gedung.namaGedung,
      ruanganId: String(ruangan.idRuangan),
      gedungId: String(gedung.idGedung),
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
            waktuMakan: jenisMakan,
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


