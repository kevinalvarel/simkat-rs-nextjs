'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ag-rs/navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Building2,
  Building,
  Sun,
  SunMedium,
  Moon,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  DoorOpen,
  Clock,
  Loader2,
  Lock,
  Unlock,
  ShieldAlert,
  Edit3,
} from 'lucide-react';
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

type MealTimeType = 'Makan Pagi' | 'Makan Siang' | 'Makan Malam' | null;

const MEAL_TIMES_CONFIG: Array<{
  key: 'Makan Pagi' | 'Makan Siang' | 'Makan Malam';
  title: string;
  jenisMakan: 'PAGI' | 'SIANG' | 'MALAM';
  distribusi: string;
  defaultCutoff: string;
  icon: React.ReactNode;
  bgLight: string;
}> = [
  {
    key: 'Makan Pagi',
    title: 'Makan Pagi',
    jenisMakan: 'PAGI',
    distribusi: '06:00 - 08:00 WIB',
    defaultCutoff: '05:30',
    icon: <Sun className='w-8 h-8' />,
    bgLight:
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    key: 'Makan Siang',
    title: 'Makan Siang',
    jenisMakan: 'SIANG',
    distribusi: '11:30 - 13:30 WIB',
    defaultCutoff: '10:30',
    icon: <SunMedium className='w-8 h-8' />,
    bgLight:
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    key: 'Makan Malam',
    title: 'Makan Malam',
    jenisMakan: 'MALAM',
    distribusi: '17:00 - 19:00 WIB',
    defaultCutoff: '16:00',
    icon: <Moon className='w-8 h-8' />,
    bgLight:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  },
];

const MEAL_NAME_MAP: Record<string, string> = {
  PAGI: 'Makan Pagi',
  SIANG: 'Makan Siang',
  MALAM: 'Makan Malam',
};

export default function AhliGiziRSPage() {
  const router = useRouter();
  const [selectedMealTime, setSelectedMealTime] = useState<MealTimeType>(null);
  const [selectedGedung, setSelectedGedung] =
    useState<GedungWithRuangan | null>(null);
  const [selectedRuangan, setSelectedRuangan] = useState<RuanganItem | null>(
    null,
  );

  const [gedungList, setGedungList] = useState<GedungWithRuangan[]>([]);
  const [waktuConfigs, setWaktuConfigs] = useState<WaktuMakanConfig[]>([]);
  const [snapshotBatches, setSnapshotBatches] = useState<SnapshotBatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [gData, cData, bData] = await Promise.all([
          getGedungWithRuangan(),
          getWaktuMakanConfig(),
          getSnapshotBatches(),
        ]);
        setGedungList(gData);
        setWaktuConfigs(cData);
        setSnapshotBatches(bData);
      } catch (err) {
        console.error('Gagal mengambil data master RS:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to determine lock status and whether a meal cycle is the IMMEDIATELY PREVIOUS batch (eligible for revision)
  function getMealLockInfo(
    jenisMakan: 'PAGI' | 'SIANG' | 'MALAM',
    defaultCutoff: string,
  ) {
    const cfg = waktuConfigs.find((c) => c.jenis_makan === jenisMakan);
    const cutoffTime = cfg ? cfg.waktu : defaultCutoff;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Cut-off minutes for each meal cycle
    const getMin = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
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

    // Determine current running cycle & immediately previous cycle
    let runningCycle: 'PAGI' | 'SIANG' | 'MALAM' = 'PAGI';
    let prevCycle: 'PAGI' | 'SIANG' | 'MALAM' = 'MALAM';

    if (currentMinutes < pagiMin) {
      runningCycle = 'PAGI';
      prevCycle = 'MALAM'; // Yesterday's Malam
    } else if (currentMinutes < siangMin) {
      runningCycle = 'SIANG';
      prevCycle = 'PAGI'; // Today's Pagi (cut-off has passed)
    } else if (currentMinutes < malamMin) {
      runningCycle = 'MALAM';
      prevCycle = 'SIANG'; // Today's Siang (cut-off has passed)
    } else {
      runningCycle = 'PAGI';
      prevCycle = 'MALAM'; // Today's Malam (cut-off has passed)
    }

    const [h, m] = cutoffTime.split(':').map(Number);
    const cutoffMinutes = h * 60 + m;

    const isCutoffPassed = currentMinutes >= cutoffMinutes;
    const hasBatchToday = snapshotBatches.some(
      (b) => b.tanggal_produksi === todayStr && b.waktu_makan === jenisMakan,
    );

    const isLocked = isCutoffPassed || hasBatchToday;

    // Previous batch is ONLY eligible if it is locked AND equals prevCycle
    const isPreviousBatch = isLocked && jenisMakan === prevCycle;
    const isOlderLocked = isLocked && !isPreviousBatch;

    return {
      isLocked,
      isPreviousBatch,
      isOlderLocked,
      cutoffTime,
      hasBatchToday,
      isCutoffPassed,
      runningCycle,
      prevCycle,
    };
  }

  const handleSelectMealTime = (
    meal: 'Makan Pagi' | 'Makan Siang' | 'Makan Malam',
    lockInfo: ReturnType<typeof getMealLockInfo>,
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
  };

  const handleSelectGedung = (gedung: GedungWithRuangan) => {
    setSelectedGedung(gedung);
    setSelectedRuangan(null);
  };

  const handleSelectRuangan = (ruangan: RuanganItem) => {
    setSelectedRuangan(ruangan);
  };

  const handleReset = () => {
    setSelectedMealTime(null);
    setSelectedGedung(null);
    setSelectedRuangan(null);
  };

  // Determine current step index for UI indicators (0: Jam Makan, 1: Gedung, 2: Ruangan, 3: Konfirmasi)
  const currentStep = !selectedMealTime
    ? 0
    : !selectedGedung
      ? 1
      : !selectedRuangan
        ? 2
        : 3;

  return (
    <div className='min-h-dvh flex flex-col bg-background text-foreground'>
      <Navbar />

      <main className='flex-1 grid place-items-center p-4 sm:p-6 md:p-8'>
        <div className='w-full max-w-2xl space-y-6'>
          {/* Header Step Info */}
          <div className='text-center space-y-2'>
            <h2 className='text-2xl font-bold tracking-tight text-primary'>
              {currentStep === 0 && 'Pilih Waktu Makan'}
              {currentStep === 1 && 'Pilih Lokasi Gedung'}
              {currentStep === 2 && 'Pilih Ruangan'}
              {currentStep === 3 && 'Pilihan Berhasil Disimpan'}
            </h2>
            <p className='text-sm text-muted-foreground'>
              {currentStep === 0 &&
                'Silakan tentukan jadwal distribusi gizi rumah sakit'}
              {currentStep === 1 &&
                `Waktu terpilih: ${selectedMealTime}. Pilih gedung fasilitas RS.`}
              {currentStep === 2 &&
                `Gedung terpilih: ${selectedGedung?.namaGedung}. Pilih ruangan rawat/instalasi.`}
              {currentStep === 3 &&
                'Berikut adalah ringkasan waktu makan, gedung, dan ruangan yang Anda pilih'}
            </p>
          </div>

          {/* Progress Indicator (3 Steps) */}
          <div className='flex items-center justify-center gap-3'>
            {/* Step 1: Jam Makan */}
            <div className='flex items-center gap-1.5'>
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentStep >= 0 ? 'w-12 bg-primary' : 'w-8 bg-muted'
                }`}
              />
              <span className='text-xs font-medium text-muted-foreground hidden sm:inline'>
                Jam Makan
              </span>
            </div>

            {/* Step 2: Gedung */}
            <div className='flex items-center gap-1.5'>
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentStep >= 1 ? 'w-12 bg-primary' : 'w-8 bg-muted'
                }`}
              />
              <span className='text-xs font-medium text-muted-foreground hidden sm:inline'>
                Gedung
              </span>
            </div>

            {/* Step 3: Ruangan */}
            <div className='flex items-center gap-1.5'>
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentStep >= 2 ? 'w-12 bg-primary' : 'w-8 bg-muted'
                }`}
              />
              <span className='text-xs font-medium text-muted-foreground hidden sm:inline'>
                Ruangan
              </span>
            </div>
          </div>

          {/* STEP 1: Select Meal Time with Cut-off Lock Check & Previous Batch Revision */}
          {currentStep === 0 && (
            <div className='space-y-4 animate-in fade-in-50 duration-300'>
              {/* Callout Notice */}
              <div className='flex items-start gap-3 bg-muted/40 p-3.5 px-4 rounded-xl border text-xs text-muted-foreground'>
                <ShieldAlert className='w-4 h-4 text-amber-500 shrink-0 mt-0.5' />
                <div>
                  <strong className='text-foreground font-semibold'>
                    Aturan Revisi Post-Snapshot:
                  </strong>
                  <span className='ml-1'>
                    Jika batch yang berjalan sudah berpindah, hanya{' '}
                    <strong>BATCH SEBELUMNYA</strong> yang dapat direvisi secara
                    langsung. Batch yang lebih lampau terkunci permanen.
                  </span>
                </div>
              </div>

              {isLoading ? (
                <div className='flex flex-col items-center justify-center p-8 space-y-3'>
                  <Loader2 className='w-8 h-8 animate-spin text-primary' />
                  <p className='text-xs text-muted-foreground'>
                    Memuat status waktu cut-off & master RS...
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                  {MEAL_TIMES_CONFIG.map((meal) => {
                    const lockInfo = getMealLockInfo(
                      meal.jenisMakan,
                      meal.defaultCutoff,
                    );

                    const { isLocked, isPreviousBatch, isOlderLocked } =
                      lockInfo;

                    return (
                      <Card
                        key={meal.key}
                        className={`border-2 transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                          isPreviousBatch
                            ? 'border-amber-500/60 bg-amber-500/[0.04] dark:bg-amber-950/20 cursor-pointer hover:border-amber-500 hover:shadow-md group'
                            : isOlderLocked
                              ? 'bg-muted/40 border-muted opacity-60 cursor-not-allowed'
                              : 'cursor-pointer hover:border-primary hover:shadow-md group'
                        }`}
                        onClick={() => handleSelectMealTime(meal.key, lockInfo)}
                      >
                        <CardContent className='p-5 flex flex-col items-center text-center space-y-3 flex-1 justify-between'>
                          {/* Top Lock / Revision Badge */}
                          <div className='w-full flex justify-end'>
                            {isPreviousBatch ? (
                              <Badge
                                variant='outline'
                                className='text-[10px] gap-1 font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 animate-pulse'
                              >
                                <Edit3 className='w-3 h-3 text-amber-600' />{' '}
                                BATCH SEBELUMNYA
                              </Badge>
                            ) : isOlderLocked ? (
                              <Badge
                                variant='secondary'
                                className='text-[10px] gap-1 font-semibold text-muted-foreground'
                              >
                                <Lock className='w-3 h-3' /> TERKUNCI
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='text-[10px] gap-1 font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              >
                                <Unlock className='w-3 h-3 text-emerald-600' />{' '}
                                AKTIF
                              </Badge>
                            )}
                          </div>

                          {/* Icon & Details */}
                          <div className='space-y-2 flex flex-col items-center'>
                            <div
                              className={`p-3 rounded-full ${
                                isPreviousBatch
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 group-hover:scale-110 transition-transform'
                                  : isOlderLocked
                                    ? 'bg-muted text-muted-foreground'
                                    : `${meal.bgLight} group-hover:scale-110 transition-transform`
                              }`}
                            >
                              {isPreviousBatch ? (
                                <Edit3 className='w-8 h-8' />
                              ) : isOlderLocked ? (
                                <Lock className='w-8 h-8' />
                              ) : (
                                meal.icon
                              )}
                            </div>
                            <div>
                              <h4 className='font-semibold text-base'>
                                {meal.title}
                              </h4>
                              <p className='text-xs text-muted-foreground mt-0.5'>
                                {meal.distribusi}
                              </p>
                              <p
                                className={`text-[11px] font-mono font-medium mt-1 ${
                                  isPreviousBatch
                                    ? 'text-amber-800 dark:text-amber-300 font-bold'
                                    : isOlderLocked
                                      ? 'text-muted-foreground'
                                      : 'text-amber-700 dark:text-amber-400'
                                }`}
                              >
                                {isPreviousBatch
                                  ? `(Post-Snapshot Cut-off ${lockInfo.cutoffTime} WIB)`
                                  : `Cut-off: ${lockInfo.cutoffTime} WIB`}
                              </p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button
                            size='sm'
                            variant={
                              isPreviousBatch
                                ? 'outline'
                                : isOlderLocked
                                  ? 'secondary'
                                  : 'default'
                            }
                            disabled={isOlderLocked}
                            className={`w-full mt-2 text-xs font-semibold ${
                              isPreviousBatch
                                ? 'border-amber-500/60 text-amber-900 dark:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20'
                                : isOlderLocked
                                  ? 'bg-muted text-muted-foreground cursor-not-allowed border'
                                  : ''
                            }`}
                          >
                            {isPreviousBatch ? (
                              <span className='flex items-center gap-1.5 justify-center'>
                                <Edit3 className='w-3.5 h-3.5' /> Revisi Batch
                              </span>
                            ) : isOlderLocked ? (
                              <span className='flex items-center gap-1.5 justify-center'>
                                <Lock className='w-3.5 h-3.5' /> Terkunci
                                (Selesai)
                              </span>
                            ) : (
                              `Pilih ${meal.title.replace('Makan ', '')}`
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Building */}
          {currentStep === 1 && (
            <div className='space-y-4 animate-in fade-in-50 duration-300'>
              {/* Back navigation header chip */}
              <div className='flex items-center justify-between bg-secondary/50 p-3 px-4 rounded-lg border border-border'>
                <span className='text-sm font-medium flex items-center gap-2'>
                  <Clock className='w-4 h-4 text-primary' />
                  Waktu Makan:{' '}
                  <strong className='text-primary'>{selectedMealTime}</strong>
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedMealTime(null)}
                  className='gap-1 text-xs hover:bg-secondary'
                >
                  <ArrowLeft className='w-3.5 h-3.5' /> Ganti Waktu Makan
                </Button>
              </div>

              {isLoading ? (
                <div className='flex flex-col items-center justify-center p-8 space-y-3'>
                  <Loader2 className='w-8 h-8 animate-spin text-primary' />
                  <p className='text-xs text-muted-foreground'>
                    Memuat data gedung...
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
                  {gedungList.map((gedung, index) => {
                    const isNewBuilding = gedung.namaGedung
                      .toLowerCase()
                      .includes('baru');
                    return (
                      <Card
                        key={gedung.idGedung || index}
                        className='cursor-pointer border-2 hover:border-primary hover:shadow-lg transition-all duration-200 group'
                        onClick={() => handleSelectGedung(gedung)}
                      >
                        <CardContent className='p-6 flex flex-col items-center justify-center space-y-4 text-center'>
                          <div className='p-4 rounded-full bg-secondary text-primary group-hover:scale-110 transition-transform duration-200'>
                            {isNewBuilding ? (
                              <Building2 className='w-10 h-10' />
                            ) : (
                              <Building className='w-10 h-10' />
                            )}
                          </div>
                          <div>
                            <h3 className='font-semibold text-lg'>
                              {gedung.namaGedung}
                            </h3>
                            <p className='text-xs text-muted-foreground mt-1'>
                              {gedung.ruanganList.length > 0
                                ? `${gedung.ruanganList.length} Ruangan Tersedia`
                                : 'Fasilitas & Instalasi Gizi'}
                            </p>
                          </div>
                          <Button
                            size='lg'
                            className='w-full'
                            variant={isNewBuilding ? 'default' : 'outline'}
                          >
                            Pilih {gedung.namaGedung}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Select Room */}
          {currentStep === 2 && selectedGedung && (
            <div className='space-y-4 animate-in fade-in-50 duration-300'>
              {/* Back navigation header chips */}
              <div className='flex flex-wrap items-center justify-between bg-secondary/50 p-3 px-4 rounded-lg border border-border gap-2'>
                <div className='flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium'>
                  <span className='flex items-center gap-1.5'>
                    <Clock className='w-3.5 h-3.5 text-primary' />
                    Waktu:{' '}
                    <strong className='text-primary'>{selectedMealTime}</strong>
                  </span>
                  <span className='text-muted-foreground'>•</span>
                  <span className='flex items-center gap-1.5'>
                    <Building2 className='w-3.5 h-3.5 text-primary' />
                    Gedung:{' '}
                    <strong className='text-primary'>
                      {selectedGedung.namaGedung}
                    </strong>
                  </span>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedGedung(null)}
                  className='gap-1 text-xs hover:bg-secondary'
                >
                  <ArrowLeft className='w-3.5 h-3.5' /> Ganti Gedung
                </Button>
              </div>

              {selectedGedung.ruanganList.length === 0 ? (
                <Card className='p-8 text-center border-dashed'>
                  <DoorOpen className='w-10 h-10 text-muted-foreground mx-auto mb-2' />
                  <p className='text-sm text-muted-foreground'>
                    Belum ada ruangan yang terdaftar di gedung ini.
                  </p>
                </Card>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                  {selectedGedung.ruanganList.map((ruangan) => (
                    <Card
                      key={ruangan.idRuangan}
                      className='cursor-pointer border-2 hover:border-primary hover:shadow-md transition-all duration-200 group'
                      onClick={() => handleSelectRuangan(ruangan)}
                    >
                      <CardContent className='p-5 flex flex-col items-center text-center space-y-3'>
                        <div className='p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform'>
                          <DoorOpen className='w-6 h-6' />
                        </div>
                        <div>
                          <h4 className='font-semibold text-sm sm:text-base'>
                            {ruangan.namaRuangan}
                          </h4>
                          <p className='text-xs text-muted-foreground mt-0.5'>
                            ID: #{ruangan.idRuangan}
                          </p>
                        </div>
                        <Button size='sm' className='w-full mt-1'>
                          Pilih Ruangan
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Final Selection Summary */}
          {currentStep === 3 &&
            selectedMealTime &&
            selectedGedung &&
            selectedRuangan && (
              <Card className='border-2 border-primary/30 shadow-lg animate-in fade-in-50 duration-300'>
                <CardHeader className='text-center pb-2'>
                  <div className='mx-auto p-3 rounded-full bg-primary/10 text-primary w-fit mb-2'>
                    <CheckCircle2 className='w-8 h-8' />
                  </div>
                  <CardTitle className='text-xl'>Konfirmasi Pilihan</CardTitle>
                  <CardDescription>
                    Detail pemilihan distribusi gizi rumah sakit
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 pt-2'>
                  <div className='bg-secondary/40 rounded-lg p-4 space-y-3 border border-border/50'>
                    <div className='flex justify-between items-center pb-2 border-b border-border/50'>
                      <span className='text-sm text-muted-foreground flex items-center gap-2'>
                        <Clock className='w-4 h-4 text-primary' />
                        Waktu Makan
                      </span>
                      <span className='font-semibold text-primary flex items-center gap-1.5'>
                        {selectedMealTime}
                        {(() => {
                          const lock = getMealLockInfo(
                            selectedMealTime === 'Makan Pagi'
                              ? 'PAGI'
                              : selectedMealTime === 'Makan Siang'
                                ? 'SIANG'
                                : 'MALAM',
                            '12:00',
                          );
                          return lock.isPreviousBatch ? (
                            <Badge
                              variant='outline'
                              className='text-[10px] bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/40'
                            >
                              Mode Revisi
                            </Badge>
                          ) : null;
                        })()}
                      </span>
                    </div>

                    <div className='flex justify-between items-center pb-2 border-b border-border/50'>
                      <span className='text-sm text-muted-foreground flex items-center gap-2'>
                        <Building2 className='w-4 h-4 text-primary' />
                        Lokasi Gedung
                      </span>
                      <span className='font-semibold text-primary'>
                        {selectedGedung.namaGedung}
                      </span>
                    </div>

                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground flex items-center gap-2'>
                        <DoorOpen className='w-4 h-4 text-primary' />
                        Ruangan
                      </span>
                      <span className='font-semibold text-primary'>
                        {selectedRuangan.namaRuangan}
                      </span>
                    </div>
                  </div>

                  <div className='flex gap-3 pt-2'>
                    <Button
                      variant='outline'
                      className='flex-1 gap-2'
                      onClick={handleReset}
                    >
                      <RefreshCw className='w-4 h-4' /> Reset Pilihan
                    </Button>
                    <Button
                      className='flex-1'
                      onClick={() => {
                        const jenisMakan =
                          selectedMealTime === 'Makan Pagi'
                            ? 'PAGI'
                            : selectedMealTime === 'Makan Siang'
                              ? 'SIANG'
                              : 'MALAM';
                        const lock = getMealLockInfo(jenisMakan, '12:00');
                        const isRevisi = lock.isPreviousBatch;

                        const params = new URLSearchParams({
                          ruangan: selectedRuangan!.namaRuangan,
                          gedung: selectedGedung!.namaGedung,
                          ruanganId: String(selectedRuangan!.idRuangan),
                          gedungId: String(selectedGedung!.idGedung),
                          ...(isRevisi
                            ? { isRevisi: 'true', revisiMeal: selectedMealTime }
                            : {}),
                        });
                        router.push(
                          `/dashboard/ag-rs/data-pasien?${params.toString()}`,
                        );
                      }}
                    >
                      Lanjutkan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </main>
    </div>
  );
}
