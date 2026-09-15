'use client';

import { useState, useTransition } from 'react';
import { Apple, Cookie, FileQuestion, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { TabulasiDashboardData } from '@/types/tabulasitypes';
import { getTabulasiSnackBuahData } from '@/servers/tabulasi.service';
import { exportTabulasiBuahExcel, exportTabulasiSnackExcel } from '@/lib/exportTabulasiSnackExcel';
import TabulasiHeader from './TabulasiHeader';
import TabulasiStatsCards from './TabulasiStatsCards';
import TabulasiHospitalTable from './TabulasiHospitalTable';
import TabulasiPrintModal from './TabulasiPrintModal';

type SupplementTab = 'SNACK' | 'BUAH';

interface TabulasiSnackClientProps {
  initialSnackData: TabulasiDashboardData;
  initialBuahData: TabulasiDashboardData;
  /** Legacy single-data prop (dipertahankan agar kompatibel). */
  initialData?: TabulasiDashboardData;
}

export default function TabulasiSnackClient({ initialSnackData, initialBuahData, initialData }: TabulasiSnackClientProps) {
  const fallbackSnack = initialSnackData ?? initialData;
  const [snackData, setSnackData] = useState<TabulasiDashboardData>(fallbackSnack);
  const [buahData, setBuahData] = useState<TabulasiDashboardData>(initialBuahData ?? initialData);
  const [activeTab, setActiveTab] = useState<SupplementTab>('SNACK');
  const [selectedDate, setSelectedDate] = useState(fallbackSnack.hospitalData.tanggal);
  const [selectedMeal, setSelectedMeal] = useState<'PAGI' | 'SIANG'>(
    fallbackSnack.hospitalData.waktuMakan === 'SIANG' ? 'SIANG' : 'PAGI',
  );
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeData = activeTab === 'SNACK' ? snackData : buahData;
  const activeMode = activeTab === 'SNACK' ? ('snack' as const) : ('buah' as const);
  const activeLabel = activeTab === 'SNACK' ? 'Snack' : 'Buah';

  function refresh(date = selectedDate, meal = selectedMeal) {
    startTransition(async () => {
      const refreshed = await getTabulasiSnackBuahData(date, meal);
      if (!refreshed.snack.success && !refreshed.buah.success) {
        toast.error('Gagal memuat tabulasi snack & buah. Silakan coba lagi.');
        return;
      }
      if (!refreshed.snack.success) toast.error('Gagal memuat tabulasi snack.');
      if (!refreshed.buah.success) toast.error('Gagal memuat tabulasi buah.');
      setSnackData(refreshed.snack);
      setBuahData(refreshed.buah);
    });
  }

  function changeDate(date: string) {
    if (!date) return;
    setSelectedDate(date);
    refresh(date, selectedMeal);
  }

  function changeMeal(meal: string) {
    const slot = meal.toUpperCase() === 'SIANG' ? 'SIANG' : 'PAGI';
    setSelectedMeal(slot);
    refresh(selectedDate, slot);
  }

  function handleExport() {
    if (activeTab === 'SNACK') exportTabulasiSnackExcel(snackData.hospitalData);
    else exportTabulasiBuahExcel(buahData.hospitalData);
  }

  const hospitalData = activeData.hospitalData;
  const tabs: { key: SupplementTab; label: string; total: number; icon: typeof Cookie }[] = [
    { key: 'SNACK', label: 'Snack', total: snackData.hospitalData.grandTotalPorsi, icon: Cookie },
    { key: 'BUAH', label: 'Buah', total: buahData.hospitalData.grandTotalPorsi, icon: Apple },
  ];

  return (
    <div className='flex flex-1 flex-col gap-6 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      <TabulasiHeader mode='snack' hospitalData={snackData.hospitalData} selectedDate={selectedDate}
        onDateChange={changeDate} selectedMeal={selectedMeal} onMealChange={changeMeal}
        onOpenExport={handleExport}
        onOpenPrintModal={() => setIsPrintOpen(true)} isRefreshing={isPending}
        onRefresh={() => refresh()} />

      {/* Tab Switcher: Snack / Buah (filter tanggal & PAGI/SIANG berlaku untuk keduanya) */}
      <div className='flex items-center gap-1.5 bg-muted/50 border border-border/70 rounded-2xl p-1.5 w-full sm:w-fit no-print'>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type='button'
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none flex-1 sm:flex-none justify-center ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className='w-4 h-4' />
              <span>{tab.label}</span>
              <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                isActive ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.total} porsi
              </span>
            </button>
          );
        })}
      </div>

      {isPending ? (
        <div className='flex flex-col items-center justify-center p-16 space-y-3 border rounded-2xl bg-card'>
          <RefreshCw className='w-8 h-8 animate-spin text-primary' />
          <p className='text-sm font-bold'>Menghitung porsi snack & buah dari mapping pasien...</p>
        </div>
      ) : !activeData.success ? (
        <div className='text-center p-16 border border-dashed rounded-2xl bg-card space-y-3'>
          <FileQuestion className='w-10 h-10 text-primary mx-auto' />
          <h2 className='text-base font-bold'>Tabulasi {activeLabel} Belum Dapat Dimuat</h2>
          <p className='text-xs text-muted-foreground'>Periksa koneksi data, lalu gunakan tombol Refresh.</p>
        </div>
      ) : hospitalData.allItems.length ? (
        <div className='space-y-6'>
          <TabulasiStatsCards hospitalData={hospitalData} mode={activeMode} />
          <TabulasiHospitalTable hospitalData={hospitalData} mode={activeMode} />
        </div>
      ) : (
        <div className='text-center p-16 border border-dashed rounded-2xl bg-card space-y-3'>
          <FileQuestion className='w-10 h-10 text-primary mx-auto' />
          <h2 className='text-base font-bold'>Belum Ada Porsi {activeLabel}</h2>
          <p className='text-xs text-muted-foreground max-w-md mx-auto'>
            Tidak ada pasien dengan mapping {activeLabel.toLowerCase()} untuk {selectedMeal.toLowerCase()} pada tanggal ini.
            Periksa mapping diet pasien dan snapshot yang dipilih.
          </p>
        </div>
      )}
      <TabulasiPrintModal open={isPrintOpen} onOpenChange={setIsPrintOpen}
        hospitalData={hospitalData} mode={activeMode} />
    </div>
  );
}
