'use client';

import { useState, useTransition } from 'react';
import { FileQuestion, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { TabulasiDashboardData } from '@/types/tabulasitypes';
import { getTabulasiSnackData } from '@/servers/tabulasi.service';
import { exportTabulasiSnackExcel } from '@/lib/exportTabulasiSnackExcel';
import TabulasiHeader from './TabulasiHeader';
import TabulasiStatsCards from './TabulasiStatsCards';
import TabulasiHospitalTable from './TabulasiHospitalTable';
import TabulasiPrintModal from './TabulasiPrintModal';

export default function TabulasiSnackClient({ initialData }: { initialData: TabulasiDashboardData }) {
  const [data, setData] = useState(initialData);
  const [selectedDate, setSelectedDate] = useState(initialData.hospitalData.tanggal);
  const [selectedMeal, setSelectedMeal] = useState<'PAGI' | 'SIANG'>(
    initialData.hospitalData.waktuMakan === 'SIANG' ? 'SIANG' : 'PAGI',
  );
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function refresh(date = selectedDate, meal = selectedMeal) {
    startTransition(async () => {
      const refreshed = await getTabulasiSnackData(date, meal);
      if (!refreshed.success) {
        toast.error('Gagal memuat tabulasi snack. Silakan coba lagi.');
        return;
      }
      setData(refreshed);
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

  const hospitalData = data.hospitalData;
  return (
    <div className='flex flex-1 flex-col gap-6 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      <TabulasiHeader mode='snack' hospitalData={hospitalData} selectedDate={selectedDate}
        onDateChange={changeDate} selectedMeal={selectedMeal} onMealChange={changeMeal}
        onOpenExport={() => exportTabulasiSnackExcel(hospitalData)}
        onOpenPrintModal={() => setIsPrintOpen(true)} isRefreshing={isPending}
        onRefresh={() => refresh()} />
      {isPending ? (
        <div className='flex flex-col items-center justify-center p-16 space-y-3 border rounded-2xl bg-card'>
          <RefreshCw className='w-8 h-8 animate-spin text-primary' />
          <p className='text-sm font-bold'>Menghitung porsi dari mapping snack pasien...</p>
        </div>
      ) : !data.success ? (
        <div className='text-center p-16 border border-dashed rounded-2xl bg-card space-y-3'>
          <FileQuestion className='w-10 h-10 text-primary mx-auto' />
          <h2 className='text-base font-bold'>Tabulasi Snack Belum Dapat Dimuat</h2>
          <p className='text-xs text-muted-foreground'>Periksa koneksi data, lalu gunakan tombol Refresh.</p>
        </div>
      ) : hospitalData.allItems.length ? (
        <div className='space-y-6'>
          <TabulasiStatsCards hospitalData={hospitalData} mode='snack' />
          <TabulasiHospitalTable hospitalData={hospitalData} mode='snack' />
        </div>
      ) : (
        <div className='text-center p-16 border border-dashed rounded-2xl bg-card space-y-3'>
          <FileQuestion className='w-10 h-10 text-primary mx-auto' />
          <h2 className='text-base font-bold'>Belum Ada Porsi Snack</h2>
          <p className='text-xs text-muted-foreground max-w-md mx-auto'>
            Tidak ada pasien dengan mapping snack untuk {selectedMeal.toLowerCase()} pada tanggal ini.
            Periksa mapping diet pasien dan snapshot yang dipilih.
          </p>
        </div>
      )}
      <TabulasiPrintModal open={isPrintOpen} onOpenChange={setIsPrintOpen}
        hospitalData={hospitalData} mode='snack' />
    </div>
  );
}
