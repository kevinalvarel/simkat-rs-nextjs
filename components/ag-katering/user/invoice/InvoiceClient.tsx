'use client';

import React, { useState } from 'react';
import type {
  InvoiceDailySummary,
  InvoicePageProps,
} from '@/types/invoicetypes';
import { getInvoiceDailyData } from '@/servers/invoice.service';
import InvoiceHeader from './InvoiceHeader';
import type { DateRangeValue } from './InvoiceDateRangePicker';
import InvoiceStatsCards from './InvoiceStatsCards';
import InvoiceClassTable from './InvoiceClassTable';
import InvoicePrintModal from './InvoicePrintModal';
import { toast } from 'sonner';

export default function InvoiceClient({ initialData }: InvoicePageProps) {
  const [data, setData] = useState<InvoiceDailySummary>(initialData);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialData.startDate ||
      initialData.tanggal.split(' ')[0] ||
      new Date().toISOString().slice(0, 10),
  );
  const [selectedWaktu, setSelectedWaktu] = useState<string>(
    initialData.waktuMakan || 'SIANG',
  );
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: initialData.startDate || initialData.tanggal.split(' ')[0],
    to: initialData.endDate || initialData.tanggal.split(' ')[0],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  async function handleSnapshotChange(date: string, waktu: string) {
    setSelectedDate(date);
    setSelectedWaktu(waktu);
    setIsRefreshing(true);
    try {
      const isMultiDay = Boolean(
        dateRange.to && dateRange.to !== dateRange.from,
      );
      const start = isMultiDay ? dateRange.from : date;
      const end = isMultiDay ? dateRange.to : undefined;
      const freshData = await getInvoiceDailyData(start, end, waktu);
      setData(freshData);
    } catch (err) {
      console.error('Error fetching snapshot invoice:', err);
      toast.error('Gagal memuat data snapshot invoice.');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleDateRangeChange(range: DateRangeValue) {
    if (!range.from) return;
    setDateRange(range);
    setSelectedDate(range.from);
    setIsRefreshing(true);
    try {
      const isMultiDay = Boolean(range.to && range.to !== range.from);
      const targetWaktu = isMultiDay ? 'ALL' : selectedWaktu;
      const freshData = await getInvoiceDailyData(
        range.from,
        range.to,
        targetWaktu,
      );
      setData(freshData);
    } catch (err) {
      console.error('Error fetching date data:', err);
      toast.error('Gagal memuat data konsumsi.');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const isMultiDay = Boolean(
        dateRange.to && dateRange.to !== dateRange.from,
      );
      const freshData = await getInvoiceDailyData(
        dateRange.from,
        dateRange.to,
        isMultiDay ? 'ALL' : selectedWaktu,
      );
      setData(freshData);
      toast.success('Data invoice berhasil diperbarui.');
    } catch (err) {
      console.error('Error refreshing invoice data:', err);
      toast.error('Gagal memperbarui data.');
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header with Snapshot Selector & Date Filter */}
      <InvoiceHeader
        data={data}
        selectedDate={selectedDate}
        selectedWaktu={selectedWaktu}
        onSnapshotChange={handleSnapshotChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* 2. Key KPI Stats Cards (Baseline vs Post-Snapshot Revisions) */}
      <InvoiceStatsCards data={data} />

      {/* 3. Main Daily / Snapshot Food Consumption Table per Class & Revisions */}
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
