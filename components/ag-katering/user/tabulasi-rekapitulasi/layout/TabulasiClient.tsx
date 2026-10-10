"use client";

import React, { useState, useTransition } from "react";
import type { TabulasiDashboardData } from "@/types/tabulasitypes";
import { getTabulasiDashboardData } from "@/servers/tabulasi.service";
import TabulasiHeader from "./TabulasiHeader";
import TabulasiStatsCards from "./TabulasiStatsCards";
import TabulasiHospitalTable from "./TabulasiHospitalTable";
import TabulasiPrintModal from "./TabulasiPrintModal";
import TabulasiGenerateModal from "./TabulasiGenerateModal";
import TabulasiExportModal from "./TabulasiExportModal";
import { RefreshCw, FileQuestion, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TabulasiClientProps {
  initialData: TabulasiDashboardData;
}

export default function TabulasiClient({ initialData }: TabulasiClientProps) {
  const [data, setData] = useState<TabulasiDashboardData>(initialData);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialData.hospitalData?.tanggal ||
      initialData.batch?.tanggal_produksi ||
      new Date().toISOString().slice(0, 10),
  );
  const [selectedMeal, setSelectedMeal] = useState<string>(
    initialData.hospitalData?.waktuMakan ||
      initialData.batch?.waktu_makan ||
      "Siang",
  );

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Refresh / Fetch data with parameters (Cycle is automatically determined from date)
  function handleFetchData(dateParam?: string, mealParam?: string) {
    const targetDate = dateParam || selectedDate;
    const targetMeal = mealParam || selectedMeal;

    startTransition(async () => {
      try {
        const refreshed = await getTabulasiDashboardData(
          undefined,
          targetDate,
          targetMeal,
        );
        setData(refreshed);
        toast.success(
          `Data tabulasi ${targetMeal} (${targetDate}) - ${refreshed.hospitalData?.siklusNama || "Siklus Otomatis"} berhasil dimuat.`,
        );
      } catch (err) {
        console.error("Error refreshing tabulation data:", err);
        toast.error("Gagal memuat data tabulasi.");
      }
    });
  }

  // Handle date change
  function handleDateChange(newDate: string) {
    if (!newDate) return;
    setSelectedDate(newDate);
    handleFetchData(newDate, selectedMeal);
  }

  // Handle meal change (Pagi / Siang / Malam / Snack)
  function handleMealChange(newMeal: string) {
    setSelectedMeal(newMeal);
    handleFetchData(selectedDate, newMeal);
  }

  const hospitalData = data?.hospitalData;

  return (
    <div className="flex flex-1 flex-col gap-6 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      {/* 1. Header with Actions, Date Filter, Automatic Cycle Badge, & Meal Selector */}
      {hospitalData && (
        <TabulasiHeader
          hospitalData={hospitalData}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          selectedMeal={selectedMeal}
          onMealChange={handleMealChange}
          onOpenGenerate={() => setIsGenerateOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenPrintModal={() => setIsPrintModalOpen(true)}
          isRefreshing={isPending}
          onRefresh={() => handleFetchData()}
        />
      )}

      {/* Loading Overlay */}
      {isPending ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 border border-border/80 rounded-2xl bg-card shadow-2xs">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-bold text-foreground">
            Menghitung ulang porsi hidangan dari siklus menu realtime...
          </p>
          <p className="text-xs text-muted-foreground">
            Menyelaraskan data pasien Gedung Lama & Gedung Baru dengan standar
            diet RS.
          </p>
        </div>
      ) : hospitalData &&
        (hospitalData.allItems.length > 0 || hospitalData.tktpGabungan) ? (
        <div className="space-y-6">
          {/* 2. Key KPI Stats Cards (Porsi, Gedung Lama, Gedung Baru, Pasien Makan, Diet Khusus) */}
          <TabulasiStatsCards hospitalData={hospitalData} />

          {/* 3. Main Hospital Tabulation Table (Matching Excel Reference: Gedung Lama vs Gedung Baru) */}
          <TabulasiHospitalTable hospitalData={hospitalData} />
        </div>
      ) : (
        /* Empty State */
        <div className="text-center p-16 border border-dashed border-border rounded-2xl bg-card space-y-4">
          <div className="p-4 rounded-full bg-primary/10 text-primary w-fit mx-auto">
            <FileQuestion className="w-10 h-10" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              Belum Ada Tabulasi untuk Waktu Makan Ini
            </h3>
            <p className="text-xs text-muted-foreground">
              Belum ada data porsi makanan untuk tanggal dan waktu makan yang
              dipilih. Silakan generate tabulasi baru untuk memulai
              rekapitulasi.
            </p>
          </div>
          <Button
            onClick={() => setIsGenerateOpen(true)}
            className="gap-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Generate Tabulasi Sekarang
          </Button>
        </div>
      )}

      {/* 4. Print & PDF Modal (A4 Landscape Official Kitchen Worksheet) */}
      {hospitalData && (
        <TabulasiPrintModal
          open={isPrintModalOpen}
          onOpenChange={setIsPrintModalOpen}
          hospitalData={hospitalData}
        />
      )}

      {/* 5. Generate Tabulasi Modal */}
      <TabulasiGenerateModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        defaultDate={selectedDate}
        defaultMeal={selectedMeal}
        onSuccess={() => handleFetchData()}
      />

      {/* 6. Export Modal */}
      {data && (
        <TabulasiExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          onPrint={() => setIsPrintModalOpen(true)}
          data={data}
          selectedDate={selectedDate}
          selectedMeal={selectedMeal}
        />
      )}
    </div>
  );
}
