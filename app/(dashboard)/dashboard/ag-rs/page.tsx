'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ag-rs/navbar';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import {
  getGedungWithRuangan,
  GedungWithRuangan,
  RuanganItem,
} from '@/servers/tempat.service';

type MealTimeType = 'Makan Pagi' | 'Makan Siang' | 'Makan Malam' | null;

export default function AhliGiziRSPage() {
  const router = useRouter();
  const [selectedMealTime, setSelectedMealTime] = useState<MealTimeType>(null);
  const [selectedGedung, setSelectedGedung] =
    useState<GedungWithRuangan | null>(null);
  const [selectedRuangan, setSelectedRuangan] = useState<RuanganItem | null>(
    null,
  );

  const [gedungList, setGedungList] = useState<GedungWithRuangan[]>([]);
  const [isLoadingGedung, setIsLoadingGedung] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoadingGedung(true);
      try {
        const data = await getGedungWithRuangan();
        setGedungList(data);
      } catch (err) {
        console.error('Gagal mengambil data gedung:', err);
      } finally {
        setIsLoadingGedung(false);
      }
    }
    loadData();
  }, []);

  const handleSelectMealTime = (
    meal: 'Makan Pagi' | 'Makan Siang' | 'Makan Malam',
  ) => {
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

          {/* STEP 1: Select Meal Time */}
          {currentStep === 0 && (
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in-50 duration-300'>
              {/* Makan Pagi */}
              <Card
                className='cursor-pointer border-2 hover:border-primary hover:shadow-md transition-all duration-200 group'
                onClick={() => handleSelectMealTime('Makan Pagi')}
              >
                <CardContent className='p-5 flex flex-col items-center text-center space-y-3'>
                  <div className='p-3 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 group-hover:scale-110 transition-transform'>
                    <Sun className='w-8 h-8' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-base'>Makan Pagi</h4>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      06:00 - 08:00 WIB
                    </p>
                  </div>
                  <Button size='sm' className='w-full mt-2'>
                    Pilih Pagi
                  </Button>
                </CardContent>
              </Card>

              {/* Makan Siang */}
              <Card
                className='cursor-pointer border-2 hover:border-primary hover:shadow-md transition-all duration-200 group'
                onClick={() => handleSelectMealTime('Makan Siang')}
              >
                <CardContent className='p-5 flex flex-col items-center text-center space-y-3'>
                  <div className='p-3 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 group-hover:scale-110 transition-transform'>
                    <SunMedium className='w-8 h-8' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-base'>Makan Siang</h4>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      11:30 - 13:30 WIB
                    </p>
                  </div>
                  <Button size='sm' className='w-full mt-2'>
                    Pilih Siang
                  </Button>
                </CardContent>
              </Card>

              {/* Makan Malam */}
              <Card
                className='cursor-pointer border-2 hover:border-primary hover:shadow-md transition-all duration-200 group'
                onClick={() => handleSelectMealTime('Makan Malam')}
              >
                <CardContent className='p-5 flex flex-col items-center text-center space-y-3'>
                  <div className='p-3 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 group-hover:scale-110 transition-transform'>
                    <Moon className='w-8 h-8' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-base'>Makan Malam</h4>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      17:00 - 19:00 WIB
                    </p>
                  </div>
                  <Button size='sm' className='w-full mt-2'>
                    Pilih Malam
                  </Button>
                </CardContent>
              </Card>
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

              {isLoadingGedung ? (
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
                      <span className='font-semibold text-primary'>
                        {selectedMealTime}
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
                        const params = new URLSearchParams({
                          ruangan: selectedRuangan!.namaRuangan,
                          gedung: selectedGedung!.namaGedung,
                          ruanganId: String(selectedRuangan!.idRuangan),
                          gedungId: String(selectedGedung!.idGedung),
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
