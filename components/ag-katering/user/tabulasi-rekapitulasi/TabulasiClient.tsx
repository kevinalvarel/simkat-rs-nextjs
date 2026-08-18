'use client';

import React, { useState, useMemo, useTransition } from 'react';
import type { 
  TabulasiDashboardData, 
  TabulasiFilterState, 
  TabulasiMenuItem 
} from '@/types/tabulasitypes';
import { getTabulasiDashboardData } from '@/servers/tabulasi.service';
import TabulasiHeader from './TabulasiHeader';
import TabulasiFilters from './TabulasiFilters';
import TabulasiPatientSummary from './TabulasiPatientSummary';
import TabulasiLocationDistribution from './TabulasiLocationDistribution';
import TabulasiDietDistribution from './TabulasiDietDistribution';
import TabulasiMenuCards from './TabulasiMenuCards';
import TabulasiMenuDetailModal from './TabulasiMenuDetailModal';
import TabulasiSnackSection from './TabulasiSnackSection';
import TabulasiScheduleTimeline from './TabulasiScheduleTimeline';
import TabulasiQuickActions from './TabulasiQuickActions';
import TabulasiGenerateModal from './TabulasiGenerateModal';
import TabulasiExportModal from './TabulasiExportModal';
import TabulasiPrintView from './TabulasiPrintView';
import { RefreshCw, FileQuestion, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TabulasiClientProps {
  initialData: TabulasiDashboardData;
}

export default function TabulasiClient({ initialData }: TabulasiClientProps) {
  const [data, setData] = useState<TabulasiDashboardData>(initialData);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialData.batch?.tanggal_produksi || new Date().toISOString().slice(0, 10)
  );
  const [selectedMeal, setSelectedMeal] = useState<string>(
    initialData.batch?.waktu_makan || 'Pagi'
  );

  // Filters State
  const [filters, setFilters] = useState<TabulasiFilterState>({
    date: selectedDate,
    mealTime: 'Semua',
    gedung: 'Semua',
    lantai: 'Semua',
    diet: 'Semua',
    status: 'Semua',
    search: '',
  });

  // Modal States
  const [selectedMenuDetail, setSelectedMenuDetail] = useState<TabulasiMenuItem | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Handle filter updates
  function handleFilterChange(newFilters: Partial<TabulasiFilterState>) {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }

  function handleResetFilters() {
    setFilters({
      date: selectedDate,
      mealTime: 'Semua',
      gedung: 'Semua',
      lantai: 'Semua',
      diet: 'Semua',
      status: 'Semua',
      search: '',
    });
    toast.info('Filter operasional telah di-reset.');
  }

  // Handle date change from header
  function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    setFilters((prev) => ({ ...prev, date: newDate }));
    handleRefreshData(newDate, selectedMeal);
  }

  // Handle meal change from header
  function handleMealChange(newMeal: string) {
    setSelectedMeal(newMeal);
    handleRefreshData(selectedDate, newMeal);
  }

  // Refresh data from server
  function handleRefreshData(dateParam?: string, mealParam?: string) {
    startTransition(async () => {
      try {
        const refreshed = await getTabulasiDashboardData(
          undefined,
          dateParam || selectedDate,
          mealParam || selectedMeal
        );
        setData(refreshed);
        toast.success(`Data tabulasi ${mealParam || selectedMeal} (${dateParam || selectedDate}) diperbarui.`);
      } catch (err) {
        toast.error('Gagal menyegarkan data tabulasi.');
      }
    });
  }

  // Print handler
  function handlePrint() {
    window.print();
  }

  // Dynamic Filtering on Menu Items
  const filteredMenuItems = useMemo(() => {
    return data.menuItems.filter((item) => {
      // 1. Search Query
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        const matchDiet = item.dietBreakdown.some((d) => d.diet.toLowerCase().includes(q) || (d.label && d.label.toLowerCase().includes(q)));
        if (!matchName && !matchCategory && !matchDiet) return false;
      }

      // 2. Diet Filter
      if (filters.diet !== 'Semua') {
        const hasDiet = item.dietBreakdown.some(
          (d) => d.diet.toUpperCase() === filters.diet.toUpperCase()
        );
        if (!hasDiet) return false;
      }

      // 3. Status Filter
      if (filters.status !== 'Semua') {
        const normStatus = filters.status.toUpperCase();
        if (normStatus === 'READY' && item.status !== 'READY') return false;
        if (normStatus === 'PENDING' && item.status !== 'PENDING') return false;
        if (normStatus.includes('PERIKSA') && item.status !== 'CHECK') return false;
      }

      // 4. Gedung Filter
      if (filters.gedung !== 'Semua') {
        const hasGedung = item.locationBreakdown.some((loc) =>
          loc.gedung.toLowerCase().includes(filters.gedung.toLowerCase())
        );
        if (!hasGedung) return false;
      }

      // 5. Lantai Filter
      if (filters.lantai !== 'Semua') {
        const hasFloor = item.locationBreakdown.some((loc) =>
          loc.floors?.some((fl) => fl.floor.toLowerCase() === filters.lantai.toLowerCase())
        );
        if (!hasFloor) return false;
      }

      return true;
    });
  }, [data.menuItems, filters]);

  // Compute filtered total portions
  const totalFilteredPortions = useMemo(() => {
    return filteredMenuItems.reduce((sum, item) => sum + item.totalPortions, 0);
  }, [filteredMenuItems]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden print:p-0 print:max-w-none">
      
      {/* CSS @media print styling overrides */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          aside, header, nav, button, select, [role="tablist"], .no-print {
            display: none !important;
          }
          #tabulasi-print-view, #tabulasi-print-view * {
            visibility: visible;
          }
          #tabulasi-print-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            background: white !important;
            color: black !important;
            font-size: 11px;
          }
        }
      `}</style>

      {/* 1. Header (Hidden on Print) */}
      <TabulasiHeader
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        selectedMeal={selectedMeal}
        onMealChange={handleMealChange}
        onOpenGenerate={() => setIsGenerateOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        isRefreshing={isPending}
        onRefresh={() => handleRefreshData()}
      />

      {/* Loading Overlay */}
      {isPending ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 border border-border/80 rounded-2xl bg-card">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-bold text-foreground">Menghitung ulang tabulasi porsi makanan...</p>
          <p className="text-xs text-muted-foreground">Menghubungkan data snapshot dengan standar gizi pasien.</p>
        </div>
      ) : data ? (
        
        <div className="space-y-6 no-print">
          
          {/* 2. Operational Filters */}
          <TabulasiFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />

          {/* 3. Patient Summary Cards (5 Key Metrics) */}
          <TabulasiPatientSummary summary={data.summary} />

          {/* 4. Patient Location Distribution (Horizontal Progress Bars) */}
          <TabulasiLocationDistribution
            locations={data.locationDistribution}
            totalAllPatients={data.summary.totalPatients}
          />

          {/* 5. Diet Type Distribution Chips (Clickable to Filter) */}
          <TabulasiDietDistribution
            diets={data.dietDistribution}
            selectedDiet={filters.diet}
            onSelectDiet={(dietCode) => handleFilterChange({ diet: dietCode })}
          />

          {/* 6. Core Menu Tabulation Cards (NOT Tables) */}
          <TabulasiMenuCards
            menuItems={filteredMenuItems}
            onSelectMenu={(menu) => setSelectedMenuDetail(menu)}
            totalFilteredPortions={totalFilteredPortions}
          />

          {/* 7. Snack Tabulation Section */}
          <TabulasiSnackSection snackSummary={data.snackSummary} />

          {/* 8. Meal Schedule & Distribution Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <TabulasiScheduleTimeline schedule={data.schedule} />
            </div>

            {/* Side Status & Information Card */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Catatan Ahli Gizi Jaga
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tabulasi porsi dihitung berdasarkan cut-off snapshot terkunci. Perubahan diet mendadak (cito/emergent) akan otomatis tercatat di modul <strong>Revisi Post-Snapshot</strong>.
              </p>
              <div className="pt-2 border-t border-border text-[11px] text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Batch Aktif:</span>
                  <strong className="text-foreground">{data.batch?.batch_code || 'LIVE-PREVIEW'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Siklus Terpilih:</span>
                  <strong className="text-foreground">{selectedMeal} ({selectedDate})</strong>
                </div>
                <div className="flex justify-between">
                  <span>Terakhir Diperbarui:</span>
                  <strong className="text-foreground">{data.lastUpdated} WIB</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 9. Quick Actions Bar */}
          <TabulasiQuickActions
            onOpenGenerate={() => setIsGenerateOpen(true)}
            onPrint={handlePrint}
            onExportPdf={handlePrint}
            onExportExcel={() => {
              import('@/lib/exportTabulasiExcel').then(({ exportTabulasiToExcel }) => {
                exportTabulasiToExcel(data, selectedDate, selectedMeal);
                toast.success('File Excel (.xlsx) berhasil diunduh.');
              });
            }}
            onRefresh={() => handleRefreshData()}
            isRefreshing={isPending}
          />

        </div>

      ) : (
        /* Empty State */
        <div className="text-center p-16 border border-dashed border-border rounded-2xl bg-card space-y-4 no-print">
          <div className="p-4 rounded-full bg-primary/10 text-primary w-fit mx-auto">
            <FileQuestion className="w-10 h-10" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">Belum Ada Tabulasi</h3>
            <p className="text-xs text-muted-foreground">
              Belum ada data makanan untuk tanggal dan waktu makan yang dipilih. Silakan generate tabulasi baru untuk memulai rekapitulasi.
            </p>
          </div>
          <Button
            onClick={() => setIsGenerateOpen(true)}
            className="gap-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Generate Tabulasi Sekarang
          </Button>
        </div>
      )}

      {/* Menu Detail Drawer / Sheet */}
      <TabulasiMenuDetailModal
        menu={selectedMenuDetail}
        isOpen={Boolean(selectedMenuDetail)}
        onClose={() => setSelectedMenuDetail(null)}
      />

      {/* Generate Tabulasi Modal */}
      <TabulasiGenerateModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        defaultDate={selectedDate}
        defaultMeal={selectedMeal}
        onSuccess={() => handleRefreshData()}
      />

      {/* Export Modal */}
      <TabulasiExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onPrint={handlePrint}
        data={data}
        selectedDate={selectedDate}
        selectedMeal={selectedMeal}
      />

      {/* Clean Printable A4 Layout for Hospital Kitchen */}
      {data && (
        <TabulasiPrintView
          data={data}
          date={selectedDate}
          mealTime={selectedMeal}
          filteredMenuItems={filteredMenuItems}
        />
      )}

    </div>
  );
}
