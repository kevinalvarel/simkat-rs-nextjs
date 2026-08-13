'use client';

import React, { useState, useMemo } from 'react';
import type {
  RiwayatDietItem,
  RiwayatDietStats,
  GiziRsUser,
} from '@/servers/riwayat-diet.service';
import {
  getRiwayatDietPasienList,
  getRiwayatDietStats,
} from '@/servers/riwayat-diet.service';
import { toast } from 'sonner';

import { RiwayatDietHeader } from './RiwayatDietHeader';
import { RiwayatDietStatsGrid } from './RiwayatDietStatsGrid';
import { RiwayatDietFilterBar } from './RiwayatDietFilterBar';
import { RiwayatDietTable } from './RiwayatDietTable';
import { RiwayatDietDetailModal } from './RiwayatDietDetailModal';
import { LogDietChangeModal } from './LogDietChangeModal';

interface RiwayatDietClientProps {
  initialItems: RiwayatDietItem[];
  initialStats: RiwayatDietStats;
  giziRsUsers: GiziRsUser[];
}

export default function RiwayatDietClient({
  initialItems,
  initialStats,
  giziRsUsers,
}: RiwayatDietClientProps) {
  const [items, setItems] = useState<RiwayatDietItem[]>(initialItems);
  const [stats, setStats] = useState<RiwayatDietStats>(initialStats);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffEmail, setSelectedStaffEmail] = useState('ALL');
  const [selectedWaktuMakan, setSelectedWaktuMakan] = useState('ALL');
  const [selectedJenisPerubahan, setSelectedJenisPerubahan] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal States
  const [detailItem, setDetailItem] = useState<RiwayatDietItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.nama_pasien.toLowerCase().includes(q) ||
        item.no_rm.toLowerCase().includes(q) ||
        item.gizi_rs_name.toLowerCase().includes(q) ||
        item.gizi_rs_email.toLowerCase().includes(q) ||
        item.ruangan.toLowerCase().includes(q) ||
        (item.data_baru?.diet && item.data_baru.diet.toLowerCase().includes(q));

      // 2. Staff Email Filter
      const matchesStaff =
        selectedStaffEmail === 'ALL' ||
        item.gizi_rs_email.toLowerCase() === selectedStaffEmail.toLowerCase();

      // 3. Waktu Makan Filter
      const matchesWaktu =
        selectedWaktuMakan === 'ALL' || item.waktu_makan === selectedWaktuMakan;

      // 4. Jenis Perubahan Filter
      const matchesJenis =
        selectedJenisPerubahan === 'ALL' ||
        item.jenis_perubahan === selectedJenisPerubahan;

      // 5. Status Filter
      const matchesStatus =
        selectedStatus === 'ALL' || item.status === selectedStatus;

      return matchesSearch && matchesStaff && matchesWaktu && matchesJenis && matchesStatus;
    });
  }, [
    items,
    searchQuery,
    selectedStaffEmail,
    selectedWaktuMakan,
    selectedJenisPerubahan,
    selectedStatus,
  ]);

  // Recalculate stats dynamically
  async function refreshStats(currentItems: RiwayatDietItem[]) {
    const updatedStats = await getRiwayatDietStats(currentItems);
    setStats(updatedStats);
  }

  // Refresh handler
  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const refreshed = await getRiwayatDietPasienList();
      setItems(refreshed);
      await refreshStats(refreshed);
      toast.success('Data riwayat perubahan diet berhasil diperbarui.');
    } catch {
      toast.error('Gagal memperbarui data.');
    } finally {
      setIsRefreshing(false);
    }
  }

  // Reset Filters handler
  function handleResetFilters() {
    setSearchQuery('');
    setSelectedStaffEmail('ALL');
    setSelectedWaktuMakan('ALL');
    setSelectedJenisPerubahan('ALL');
    setSelectedStatus('ALL');
  }

  // Export to CSV Functionality
  function handleExportCsv() {
    if (filteredItems.length === 0) {
      toast.error('Tidak ada data riwayat untuk diekspor.');
      return;
    }

    const headers = [
      'ID Audit',
      'Tanggal & Waktu',
      'Waktu Makan',
      'Nama Pasien',
      'No RM',
      'Ruangan & Bed',
      'Kelas',
      'Staf Gizi-RS (Nama)',
      'Staf Gizi-RS (Email)',
      'Jenis Perubahan',
      'Diet Lama',
      'Diet Baru',
      'Alasan Klinis',
      'Status',
    ];

    const rows = filteredItems.map((item) => [
      item.id,
      `"${new Date(item.requested_at).toLocaleString('id-ID')}"`,
      item.waktu_makan,
      `"${item.nama_pasien}"`,
      `"${item.no_rm}"`,
      `"${item.ruangan} - ${item.bed}"`,
      `"${item.kelas}"`,
      `"${item.gizi_rs_name}"`,
      `"${item.gizi_rs_email}"`,
      item.jenis_perubahan,
      `"${item.data_lama?.diet || '-'}"`,
      `"${item.data_baru?.diet || '-'}"`,
      `"${item.alasan.replace(/"/g, '""')}"`,
      item.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Riwayat_Diet_Pasien_GiziRS_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Berhasil mengekspor ${filteredItems.length} baris riwayat ke CSV.`);
  }

  // Handle new item added
  async function handleItemCreated() {
    const refreshed = await getRiwayatDietPasienList();
    setItems(refreshed);
    await refreshStats(refreshed);
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header Component */}
      <RiwayatDietHeader
        totalItems={filteredItems.length}
        onRefresh={handleRefresh}
        onExportCsv={handleExportCsv}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isRefreshing={isRefreshing}
      />

      {/* 2. Stat Summary Cards */}
      <RiwayatDietStatsGrid stats={stats} />

      {/* 3. Filter Bar */}
      <RiwayatDietFilterBar
        giziRsUsers={giziRsUsers}
        searchQuery={searchQuery}
        selectedStaffEmail={selectedStaffEmail}
        selectedWaktuMakan={selectedWaktuMakan}
        selectedJenisPerubahan={selectedJenisPerubahan}
        selectedStatus={selectedStatus}
        onSearchChange={setSearchQuery}
        onStaffEmailChange={setSelectedStaffEmail}
        onWaktuMakanChange={setSelectedWaktuMakan}
        onJenisPerubahanChange={setSelectedJenisPerubahan}
        onStatusChange={setSelectedStatus}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Main History Table */}
      <RiwayatDietTable
        items={filteredItems}
        onSelectDetail={(item) => setDetailItem(item)}
      />

      {/* 5. Detail Audit Modal */}
      <RiwayatDietDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />

      {/* 6. Modal Log Perubahan Diet Baru */}
      <LogDietChangeModal
        isOpen={isAddModalOpen}
        giziRsUsers={giziRsUsers}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleItemCreated}
      />
    </div>
  );
}
