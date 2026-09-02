'use client';

import React, { useState } from 'react';
import type {
  DpmpSummaryData,
  DpmpPageProps,
  DpmpPatientItem,
} from '@/types/dpmptypes';
import { getDpmpData } from '@/servers/dpmp.service';
import DpmpHeader from './DpmpHeader';
import type { WaktuMakanType } from './DpmpDateWaktuPicker';
import DpmpStatsCards from './DpmpStatsCards';
import RuanganCardGrid from './RuanganCardGrid';
import RuanganDetailDialog from './RuanganDetailDialog';
import DpmpPrintModal from './DpmpPrintModal';
import { toast } from 'sonner';

export default function DpmpClient({ initialData }: DpmpPageProps) {
  const [data, setData] = useState<DpmpSummaryData>(initialData);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialData.selectedDate ||
      initialData.batch?.tanggal_produksi ||
      new Date().toISOString().slice(0, 10),
  );
  const [selectedWaktu, setSelectedWaktu] = useState<WaktuMakanType>(
    (
      initialData.selectedWaktu ||
      initialData.batch?.waktu_makan ||
      'PAGI'
    ).toUpperCase() as WaktuMakanType,
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // 1. Room Detail Modal state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [activeRuanganName, setActiveRuanganName] = useState<string | null>(
    null,
  );
  const [activeRuanganPatients, setActiveRuanganPatients] = useState<
    DpmpPatientItem[]
  >([]);

  // 2. Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [patientsToPrint, setPatientsToPrint] = useState<DpmpPatientItem[]>([]);
  const [printDocumentTitle, setPrintDocumentTitle] = useState<
    string | undefined
  >(undefined);

  // 3. Date & Meal Time Data Fetching Handlers
  async function handleFilterChange(date: string, waktu: WaktuMakanType) {
    setSelectedDate(date);
    setSelectedWaktu(waktu);
    setIsRefreshing(true);
    try {
      const freshData = await getDpmpData(date, waktu);
      setData(freshData);
    } catch (err) {
      console.error('Error changing DPMP filter:', err);
      toast.error('Gagal memuat data DPMP.');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const freshData = await getDpmpData(selectedDate, selectedWaktu);
      setData(freshData);
      toast.success('Data DPMP berhasil diperbarui.');
    } catch (err) {
      console.error('Error refreshing DPMP data:', err);
      toast.error('Gagal memperbarui data.');
    } finally {
      setIsRefreshing(false);
    }
  }

  // 4. Modal Handlers
  function handleOpenRuanganModal(
    ruanganName: string,
    patientList: DpmpPatientItem[],
  ) {
    setActiveRuanganName(ruanganName);
    setActiveRuanganPatients(patientList);
    setIsRoomModalOpen(true);
  }

  // 5. Print Handlers
  function handleQuickPrintRuangan(
    ruanganName: string,
    patientList: DpmpPatientItem[],
  ) {
    if (patientList.length === 0) {
      toast.error(`Tidak ada data pasien di ${ruanganName}.`);
      return;
    }
    setPatientsToPrint(patientList);
    setPrintDocumentTitle(
      `DPMP_${ruanganName}_${data.batch?.batch_code || 'Batch'}`,
    );
    setIsPrintModalOpen(true);
  }

  function handlePrintFromRoomModal(
    selectedPatients: DpmpPatientItem[],
    ruanganTitle: string,
  ) {
    if (selectedPatients.length === 0) {
      toast.error('Pilih minimal 1 pasien untuk dicetak.');
      return;
    }
    setPatientsToPrint(selectedPatients);
    setPrintDocumentTitle(
      `DPMP_${ruanganTitle}_${data.batch?.batch_code || 'Batch'}`,
    );
    setIsPrintModalOpen(true);
  }

  function handlePrintAllRooms() {
    if (data.patients.length === 0) {
      toast.error('Tidak ada data pasien untuk dicetak.');
      return;
    }
    setPatientsToPrint(data.patients);
    setPrintDocumentTitle(
      `DPMP_Semua_Ruangan_${data.batch?.batch_code || 'Batch'}`,
    );
    setIsPrintModalOpen(true);
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header with Calendar Date & Meal Time Selection & Actions */}
      <DpmpHeader
        data={data}
        selectedDate={selectedDate}
        selectedWaktu={selectedWaktu}
        onFilterChange={handleFilterChange}
        onOpenPrintModal={handlePrintAllRooms}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        selectedCount={data.patients.length}
      />

      {/* 2. Key Stats KPI Cards */}
      <DpmpStatsCards data={data} selectedCount={data.patients.length} />

      {/* 3. Clean Ruangan Card Grid View */}
      <RuanganCardGrid
        patients={data.patients}
        onOpenRuanganModal={handleOpenRuanganModal}
        onQuickPrintRuangan={handleQuickPrintRuangan}
      />

      {/* 4. Room Patient Detail Dialog (Shadcn Modal) */}
      <RuanganDetailDialog
        open={isRoomModalOpen}
        onOpenChange={setIsRoomModalOpen}
        ruanganName={activeRuanganName}
        patients={activeRuanganPatients}
        summaryData={data}
        onPrintPatients={handlePrintFromRoomModal}
      />

      {/* 5. Print Modal (Official Hospital Layout useReactToPrint) */}
      <DpmpPrintModal
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        patientsToPrint={patientsToPrint}
        summaryData={data}
        title={printDocumentTitle}
      />
    </div>
  );
}
