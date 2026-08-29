'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  Plus,
  Search,
  Copy,
  Download,
  RotateCcw,
  RefreshCw,
  Filter,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { SiklusMenuItem } from '@/servers/siklus-menu.service';
import {
  getSiklusMenuList,
  resetSiklusToDefault,
} from '@/servers/siklus-menu.service';
import SiklusStats from './SiklusStats';
import SiklusMenuMatrixTable from './SiklusMenuMatrixTable';
import SiklusItemDialog from './SiklusItemDialog';
import SiklusSlotEditorDialog from './SiklusSlotEditorDialog';
import DuplicateSiklusDialog from './DuplicateSiklusDialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface KonfigurasiSiklusMenuClientProps {
  initialItems: SiklusMenuItem[];
  availableCycles: number[];
  dietOptions: Array<{ kode: string; label: string; kategori: string }>;
}

const CYCLE_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function KonfigurasiSiklusMenuClient({
  initialItems,
  availableCycles,
  dietOptions,
}: KonfigurasiSiklusMenuClientProps) {
  const [activeSiklus, setActiveSiklus] = useState<number>(1);
  const [items, setItems] = useState<SiklusMenuItem[]>(initialItems);
  const [cyclesList, setCyclesList] = useState<number[]>(
    Array.from(new Set([...CYCLE_PRESETS, ...availableCycles])).sort((a, b) => a - b)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenisFilter, setSelectedJenisFilter] = useState<string>('ALL');

  // Dialog States
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<SiklusMenuItem | null>(null);
  const [defaultSlotForAdd, setDefaultSlotForAdd] = useState<{
    siklus_ke?: number;
    kelas?: string;
    jenis_makanan?: string;
    waktu_makan?: string;
  } | null>(null);

  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [slotContext, setSlotContext] = useState<{
    siklus_ke: number;
    kelas: string;
    jenis_makanan: string;
    waktu_makan: string;
    existingItems: SiklusMenuItem[];
  } | null>(null);

  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Refresh items for active cycle
  async function refreshData(siklusNumber: number = activeSiklus) {
    setIsRefreshing(true);
    try {
      const freshData = await getSiklusMenuList(siklusNumber);
      setItems(freshData);
    } catch (err) {
      console.error('Gagal mengambil data siklus menu:', err);
      toast.error('Gagal memperbarui data siklus menu.');
    } finally {
      setIsRefreshing(false);
    }
  }

  // Change active cycle
  async function handleSelectCycle(siklusNumber: number) {
    setActiveSiklus(siklusNumber);
    await refreshData(siklusNumber);
  }

  // Filter items based on search and jenis makanan
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter jenis
      if (selectedJenisFilter !== 'ALL') {
        if (selectedJenisFilter === 'SARING') {
          if (item.jenis_makanan !== 'SARING' && item.waktu_makan !== 'SARING_SIANG') {
            return false;
          }
        } else if (item.jenis_makanan !== selectedJenisFilter) {
          return false;
        }
      }

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNama = item.nama_makanan.toLowerCase().includes(q);
        const matchKategori = (item.kategori_menu || '').toLowerCase().includes(q);
        const matchKelas = item.kelas.toLowerCase().includes(q);
        const matchCatatan = (item.catatan || '').toLowerCase().includes(q);
        return matchNama || matchKategori || matchKelas || matchCatatan;
      }

      return true;
    });
  }, [items, selectedJenisFilter, searchQuery]);

  // Open Add Modal for a specific slot
  function handleAddItemToSlot(slot: {
    siklus_ke: number;
    kelas: string;
    jenis_makanan: string;
    waktu_makan: string;
  }) {
    setItemToEdit(null);
    setDefaultSlotForAdd(slot);
    setIsItemDialogOpen(true);
  }

  // Open Edit Modal for a single item
  function handleEditItem(item: SiklusMenuItem) {
    setItemToEdit(item);
    setDefaultSlotForAdd(null);
    setIsItemDialogOpen(true);
  }

  // Open Bulk Slot Modal
  function handleEditSlot(slot: {
    siklus_ke: number;
    kelas: string;
    jenis_makanan: string;
    waktu_makan: string;
    existingItems: SiklusMenuItem[];
  }) {
    setSlotContext(slot);
    setIsSlotDialogOpen(true);
  }

  // Reset current cycle to default hospital reference
  async function handleResetToDefault() {
    setIsResetting(true);
    try {
      const res = await resetSiklusToDefault(activeSiklus);
      if (res.success) {
        toast.success(res.message);
        await refreshData(activeSiklus);
        setIsResetConfirmOpen(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal me-reset siklus.');
    } finally {
      setIsResetting(false);
    }
  }

  // Export current cycle to Excel (matching format)
  function handleExportExcel() {
    try {
      const rows = items.map((item) => ({
        'Siklus Ke': item.siklus_ke,
        Kelas: item.kelas,
        'Jenis Makanan': item.jenis_makanan,
        'Waktu Makan': item.waktu_makan,
        'Nama Hidangan': item.nama_makanan,
        'Kategori Menu / Diet': item.kategori_menu || '-',
        Catatan: item.catatan || '-',
        Urutan: item.urutan,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Siklus ${activeSiklus}`);

      XLSX.writeFile(workbook, `Siklus_Menu_${activeSiklus}_Rumah_Sakit.xlsx`);
      toast.success(`Matriks Siklus #${activeSiklus} berhasil diunduh dalam format Excel.`);
    } catch (err) {
      console.error('Error exporting excel:', err);
      toast.error('Gagal mengekspor file Excel.');
    }
  }

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto'>
      {/* Header Page */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2.5 flex-wrap'>
            <h1 className='text-2xl font-bold tracking-tight text-foreground flex items-center gap-2'>
              <CalendarDays className='w-6 h-6 text-primary' />
              Konfigurasi Siklus Menu
            </h1>
            <Badge
              variant='outline'
              className='bg-primary/10 text-primary border-primary/30 text-xs font-semibold gap-1 px-2.5 py-0.5'
            >
              <ShieldCheck className='w-3.5 h-3.5' /> Modul Khusus Admin
            </Badge>
          </div>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Kelola matriks hidangan per siklus menu (1–10 hari), tingkatan kelas, waktu makan (Pagi, Siang, Sore, Saring Siang), dan tag diet pasien.
          </p>
        </div>

        <div className='flex items-center gap-2 shrink-0 flex-wrap'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => refreshData(activeSiklus)}
            disabled={isRefreshing}
            className='gap-1.5 text-xs'
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={handleExportExcel}
            className='gap-1.5 text-xs'
          >
            <Download className='w-3.5 h-3.5' />
            Export Excel
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsDuplicateOpen(true)}
            className='gap-1.5 text-xs'
          >
            <Copy className='w-3.5 h-3.5' />
            Duplikasi Siklus
          </Button>

          <Button
            onClick={() => {
              setItemToEdit(null);
              setDefaultSlotForAdd({
                siklus_ke: activeSiklus,
                kelas: 'Semua Kelas',
                jenis_makanan: 'HEWANI',
                waktu_makan: 'PAGI',
              });
              setIsItemDialogOpen(true);
            }}
            size='sm'
            className='gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground'
          >
            <Plus className='w-4 h-4' />
            Tambah Menu
          </Button>
        </div>
      </div>

      {/* Cycle Selector Bar */}
      <div className='bg-card p-2 rounded-2xl border shadow-xs space-y-2'>
        <div className='flex items-center justify-between px-2 pt-1'>
          <span className='text-xs font-bold text-foreground flex items-center gap-1.5'>
            <CalendarDays className='w-4 h-4 text-primary' />
            Pilih Siklus Menu:
          </span>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='xs'
              onClick={() => setIsResetConfirmOpen(true)}
              className='text-[11px] text-muted-foreground hover:text-foreground gap-1'
            >
              <RotateCcw className='w-3 h-3' /> Reset ke Standar RS
            </Button>
          </div>
        </div>

        {/* Cycle Tabs */}
        <div className='flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none'>
          {cyclesList.map((num) => {
            const isActive = activeSiklus === num;
            return (
              <button
                key={num}
                type='button'
                onClick={() => handleSelectCycle(num)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs scale-102'
                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>Siklus {num}</span>
                {isActive && (
                  <span className='w-2 h-2 rounded-full bg-primary-foreground animate-pulse' />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <SiklusStats items={items} activeSiklus={activeSiklus} />

      {/* Filter & Search Toolbar */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Cari hidangan (mis. Telur Puyuh, Ayam) atau tag diet (mis. B, RG, DM)...'
            className='pl-9 h-9 text-xs bg-background'
          />
        </div>

        {/* Quick Filter Buttons for Jenis */}
        <div className='flex items-center gap-1.5 overflow-x-auto'>
          {[
            { id: 'ALL', label: 'Semua Lauk' },
            { id: 'HEWANI', label: '🍗 Hewani' },
            { id: 'NABATI', label: '🫘 Nabati' },
            { id: 'SAYUR', label: '🥦 Sayur' },
            { id: 'SARING', label: '🥣 Saring' },
          ].map((tab) => {
            const isActive = selectedJenisFilter === tab.id;
            return (
              <button
                key={tab.id}
                type='button'
                onClick={() => setSelectedJenisFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-foreground text-background border-foreground shadow-2xs'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matrix Table */}
      <SiklusMenuMatrixTable
        items={filteredItems}
        activeSiklus={activeSiklus}
        onEditItem={handleEditItem}
        onAddItemToSlot={handleAddItemToSlot}
        onEditSlot={handleEditSlot}
        onRefresh={() => refreshData(activeSiklus)}
      />

      {/* Single Item Create / Edit Dialog */}
      <SiklusItemDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        itemToEdit={itemToEdit}
        defaultSlot={defaultSlotForAdd}
        dietOptions={dietOptions}
        onSuccess={() => refreshData(activeSiklus)}
      />

      {/* Batch Slot Editor Dialog */}
      <SiklusSlotEditorDialog
        open={isSlotDialogOpen}
        onOpenChange={setIsSlotDialogOpen}
        slotContext={slotContext}
        onSuccess={() => refreshData(activeSiklus)}
      />

      {/* Duplicate Cycle Dialog */}
      <DuplicateSiklusDialog
        open={isDuplicateOpen}
        onOpenChange={setIsDuplicateOpen}
        currentSiklus={activeSiklus}
        availableSiklusList={cyclesList}
        onSuccess={(targetSiklus) => {
          if (!cyclesList.includes(targetSiklus)) {
            setCyclesList((prev) => [...prev, targetSiklus].sort((a, b) => a - b));
          }
          handleSelectCycle(targetSiklus);
        }}
      />

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <DialogContent className='sm:max-w-md p-6'>
          <DialogHeader className='gap-2'>
            <div className='p-3 rounded-full bg-amber-500/10 text-amber-600 w-fit'>
              <RotateCcw className='w-6 h-6' />
            </div>
            <DialogTitle className='text-base font-bold'>
              Reset Siklus #{activeSiklus} ke Standar RS?
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Tindakan ini akan mengembalikan seluruh hidangan pada Siklus #{activeSiklus} ke susunan menu referensi standar rumah sakit (seperti pada tabel standar). Perubahan kustom sebelumnya akan ditimpa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 pt-2 border-t'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsResetConfirmOpen(false)}
              disabled={isResetting}
            >
              Batal
            </Button>
            <Button
              variant='default'
              size='sm'
              onClick={handleResetToDefault}
              disabled={isResetting}
              className='bg-amber-600 hover:bg-amber-700 text-white'
            >
              {isResetting ? 'Mengatur ulang...' : 'Ya, Reset Siklus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
