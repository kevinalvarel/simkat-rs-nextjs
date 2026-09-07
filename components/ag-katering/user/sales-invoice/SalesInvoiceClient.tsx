'use client';

import React, { useState, useCallback } from 'react';
import type {
  SalesInvoiceSummary,
  SalesInvoicePageProps,
} from '@/types/invoicetypes';
import {
  getSalesInvoiceData,
  getMonthlySalesInvoiceData,
} from '@/servers/sales-invoice.service';
import SalesInvoiceHeader from './SalesInvoiceHeader';
import type { DateRangeValue } from '../invoice/InvoiceDateRangePicker';
import SalesInvoiceStatsCards from './SalesInvoiceStatsCards';
import SalesInvoiceClassTable from './SalesInvoiceClassTable';
import SalesInvoicePrintModal from './SalesInvoicePrintModal';
import MonthlyInvoiceModal from './MonthlyInvoiceModal';
import { toast } from 'sonner';

export default function SalesInvoiceClient({
  initialData,
}: SalesInvoicePageProps) {
  const [data, setData] = useState<SalesInvoiceSummary>(initialData);
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
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [monthlyData, setMonthlyData] = useState<SalesInvoiceSummary | null>(
    null,
  );
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

  const handleSnapshotChange = useCallback(
    async (date: string, waktu: string) => {
      setSelectedDate(date);
      setSelectedWaktu(waktu);
      setIsRefreshing(true);
      try {
        const isMultiDay = Boolean(
          dateRange.to && dateRange.to !== dateRange.from,
        );
        const start = isMultiDay ? dateRange.from : date;
        const end = isMultiDay ? dateRange.to : undefined;
        const freshData = await getSalesInvoiceData(start, end, waktu);
        setData(freshData);
      } catch (err) {
        console.error('Error fetching snapshot sales invoice:', err);
        toast.error('Gagal memuat data faktur penjualan.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [dateRange],
  );

  const handleDateRangeChange = useCallback(
    async (range: DateRangeValue) => {
      if (!range.from) return;
      setDateRange(range);
      setSelectedDate(range.from);
      setIsRefreshing(true);
      try {
        const isMultiDay = Boolean(range.to && range.to !== range.from);
        const targetWaktu = isMultiDay ? 'ALL' : selectedWaktu;
        const freshData = await getSalesInvoiceData(
          range.from,
          range.to,
          targetWaktu,
        );
        setData(freshData);
      } catch (err) {
        console.error('Error fetching date data:', err);
        toast.error('Gagal memuat data faktur penjualan.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [selectedWaktu],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const isMultiDay = Boolean(
        dateRange.to && dateRange.to !== dateRange.from,
      );
      const freshData = await getSalesInvoiceData(
        dateRange.from,
        dateRange.to,
        isMultiDay ? 'ALL' : selectedWaktu,
      );
      setData(freshData);
      toast.success('Data faktur penjualan berhasil diperbarui.');
    } catch (err) {
      console.error('Error refreshing sales invoice data:', err);
      toast.error('Gagal memperbarui data.');
    } finally {
      setIsRefreshing(false);
    }
  }, [dateRange, selectedWaktu]);

  const handleOpenMonthlyModal = useCallback(() => {
    setIsMonthlyModalOpen(true);
  }, []);

  const handleLoadMonthlyData = useCallback(
    async (month: number, year: number) => {
      setIsLoadingMonthly(true);
      try {
        const result = await getMonthlySalesInvoiceData(month, year);
        setMonthlyData(result);
      } catch (err) {
        console.error('Error loading monthly data:', err);
        toast.error('Gagal memuat data faktur bulanan.');
      } finally {
        setIsLoadingMonthly(false);
      }
    },
    [],
  );

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header with Snapshot Selector & Date Filter */}
      <SalesInvoiceHeader
        data={data}
        selectedDate={selectedDate}
        selectedWaktu={selectedWaktu}
        onSnapshotChange={handleSnapshotChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenMonthlyModal={handleOpenMonthlyModal}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* 2. Key KPI Stats Cards */}
      <SalesInvoiceStatsCards data={data} />

      {/* 3. Sales Invoice Line Items Table */}
      <SalesInvoiceClassTable data={data} />

      {/* 4. Print Modal (Harian / Periode) */}
      <SalesInvoicePrintModal
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        data={data}
      />

      {/* 5. Monthly Invoice Modal */}
      <MonthlyInvoiceModal
        open={isMonthlyModalOpen}
        onOpenChange={setIsMonthlyModalOpen}
        onLoadData={handleLoadMonthlyData}
        monthlyData={monthlyData}
        isLoading={isLoadingMonthly}
      />
    </div>
  );
}
