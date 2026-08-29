'use client';

import React, { useState } from 'react';
import type {
  InvoiceDailySummary,
  InvoicePageProps,
} from '@/types/invoicetypes';
import { getInvoiceDailyData } from '@/servers/invoice.service';
import InvoiceHeader from './InvoiceHeader';
import InvoiceStatsCards from './InvoiceStatsCards';
import InvoiceClassTable from './InvoiceClassTable';
import InvoicePrintModal from './InvoicePrintModal';
import { toast } from 'sonner';

export default function InvoiceClient({ initialData }: InvoicePageProps) {
  const [data, setData] = useState<InvoiceDailySummary>(initialData);
  const [selectedDate, setSelectedDate] = useState<string>(initialData.tanggal);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  async function handleDateChange(newDate: string) {
    if (!newDate) return;
    setSelectedDate(newDate);
    setIsRefreshing(true);
    try {
      const freshData = await getInvoiceDailyData(newDate);
      setData(freshData);
    } catch (err) {
      console.error('Error fetching date data:', err);
      toast.error('Gagal memuat data konsumsi untuk tanggal yang dipilih.');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const freshData = await getInvoiceDailyData(selectedDate);
      setData(freshData);
      toast.success('Data konsumsi berhasil diperbarui.');
    } catch (err) {
      console.error('Error refreshing invoice data:', err);
      toast.error('Gagal memperbarui data.');
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header with Actions & Date Filter */}
      <InvoiceHeader
        data={data}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* 2. Key KPI Stats Cards */}
      <InvoiceStatsCards data={data} />

      {/* 3. Main Daily Food Consumption Table per Class */}
      <InvoiceClassTable data={data} />

      {/* 4. Print & PDF Modal */}
      <InvoicePrintModal
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        data={data}
      />
    </div>
  );
}
