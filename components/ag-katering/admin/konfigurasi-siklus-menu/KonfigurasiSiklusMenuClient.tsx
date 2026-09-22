'use client';

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  CalendarCheck2,
  Calendar as CalendarIcon,
  ChevronDown,
  Search,
  Copy,
  Download,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  Trash2,
  PlusCircle,
  Settings2,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';
import type { MenuTagOption } from '@/lib/siklus-menu-tags';
import {
  getCycleNumForDate,
  getRollingCycleDates,
  resolveTodayCycleNum,
} from '@/lib/siklus-menu-utils';
import type {
  SiklusMenuItem,
  MasterSiklusItem,
} from '@/servers/siklus-menu.service';
import {
  deleteAllItemSiklusMenu,
  getSiklusMenuList,
  getMasterSiklusList,
  applyStartDateRotation,
} from '@/servers/siklus-menu.service';
import SiklusStats from './SiklusStats';
import SiklusMenuMatrixTable from './SiklusMenuMatrixTable';
import SiklusItemDialog from './SiklusItemDialog';
import SiklusSlotEditorDialog from './SiklusSlotEditorDialog';
import DuplicateSiklusDialog from './DuplicateSiklusDialog';
import DeleteCycleDialog from './DeleteCycleDialog';
import TambahSiklusDialog from './TambahSiklusDialog';
import KelolaSiklusDialog from './KelolaSiklusDialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

function parseCycleDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = parseISO(dateStr);
    return isValid(d) ? d : null;
  }
  const parsed = new Date(dateStr);
  return isValid(parsed) ? parsed : null;
}

function formatDisplayTanggal(
  tanggal?: string | null,
  nomorSiklus?: number,
): string {
  if (nomorSiklus === 11) {
    return 'Khusus Tanggal 31';
  }
  const d = parseCycleDate(tanggal);
  if (d) {
    return format(d, 'd MMMM yyyy', { locale: id });
  }
  if (tanggal) return tanggal;
  if (nomorSiklus) return `Tanggal ${nomorSiklus}`;
  return '-';
}

function formatShortTanggal(
  tanggal?: string | null,
  nomorSiklus?: number,
): string {
  if (nomorSiklus === 11) {
    return 'Tgl 31';
  }
  const d = parseCycleDate(tanggal);
  if (d) {
    return format(d, 'd MMM', { locale: id });
  }
  if (tanggal) return tanggal;
  if (nomorSiklus) return `Tgl ${nomorSiklus}`;
  return '-';
}


interface KonfigurasiSiklusMenuClientProps {
  initialItems: SiklusMenuItem[];
  initialMasterSiklus: MasterSiklusItem[];
  dietOptions: MenuTagOption[];
  kelasOptions?: string[];
}

export default function KonfigurasiSiklusMenuClient({
  initialItems,
  initialMasterSiklus,
  dietOptions,
  kelasOptions = [],
}: KonfigurasiSiklusMenuClientProps) {
  const [masterSiklusList, setMasterSiklusList] =
    useState<MasterSiklusItem[]>(initialMasterSiklus);

  // Default tab mengikuti siklus hari ini (anchor Siklus 1 customizable).
  const [activeSiklus, setActiveSiklus] = useState<number>(() =>
    resolveTodayCycleNum(
      initialMasterSiklus,
      initialMasterSiklus.length > 0
        ? initialMasterSiklus[0].nomor_siklus
        : 1,
      new Date(),
    ),
  );
  const [items, setItems] = useState<SiklusMenuItem[]>(initialItems);
  const userHasManuallySelected = useRef(false);

  // Nomor siklus untuk hari ini berdasarkan anchor terkini.
  const todayCycleNum = useMemo(
    () =>
      resolveTodayCycleNum(
        masterSiklusList,
        masterSiklusList.length > 0
          ? masterSiklusList[0].nomor_siklus
          : activeSiklus,
        new Date(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [masterSiklusList],
  );

  // Tanggal tampilan rolling: jendela periode berjalan yang memuat hari ini.
  // Menggantikan kolom `tanggal` statis agar tab otomatis reset tiap putaran.
  const rollingDates = useMemo(
    () => getRollingCycleDates(masterSiklusList, new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [masterSiklusList],
  );

  function formatRollingShort(nomorSiklus: number): string {
    if (nomorSiklus === 11 || nomorSiklus === 31) return 'Tgl 31';
    const d = rollingDates.get(nomorSiklus);
    if (d && isValid(d)) return format(d, 'd MMM', { locale: id });
    const fallback = masterSiklusList.find(
      (c) => c.nomor_siklus === nomorSiklus,
    );
    return formatShortTanggal(fallback?.tanggal, nomorSiklus);
  }

  function formatRollingLong(nomorSiklus: number): string {
    if (nomorSiklus === 11 || nomorSiklus === 31)
      return 'Khusus Tanggal 31';
    const d = rollingDates.get(nomorSiklus);
    if (d && isValid(d)) return format(d, 'd MMMM yyyy', { locale: id });
    const fallback = masterSiklusList.find(
      (c) => c.nomor_siklus === nomorSiklus,
    );
    return formatDisplayTanggal(fallback?.tanggal, nomorSiklus);
  }

  // Sinkronisasi awal client (koreksi drift tanggal server vs browser).
  useEffect(() => {
    if (!userHasManuallySelected.current && activeSiklus !== todayCycleNum) {
      setActiveSiklus(todayCycleNum);
      getSiklusMenuList(todayCycleNum)
        .then(setItems)
        .catch((err) =>
          console.error('Gagal sinkron siklus hari ini:', err),
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolver badge kalender: tanggal → nomor siklus (mengikuti anchor terkini).
  const getCycleForDate = useCallback(
    (date: Date) => getCycleNumForDate(date, masterSiklusList),
    [masterSiklusList],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenisFilter, setSelectedJenisFilter] = useState<string>('ALL');

  // Dialog States
  const [isTambahSiklusOpen, setIsTambahSiklusOpen] = useState(false);
  const [isKelolaSiklusOpen, setIsKelolaSiklusOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isDeleteCycleOpen, setIsDeleteCycleOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApplyingRotation, setIsApplyingRotation] = useState(false);

  // Active Cycle metadata object
  const activeCycleObj = useMemo(() => {
    return (
      masterSiklusList.find((c) => c.nomor_siklus === activeSiklus) || {
        id: activeSiklus,
        nomor_siklus: activeSiklus,
        nama_siklus: `Siklus ${activeSiklus}`,
        hari: null,
        deskripsi: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }
    );
  }, [masterSiklusList, activeSiklus]);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Current starting date for Cycle 1
  const currentStartDate = useMemo(() => {
    const cycle1 = masterSiklusList.find((c) => c.nomor_siklus === 1);
    const parsed = parseCycleDate(cycle1?.tanggal);
    return parsed || new Date();
  }, [masterSiklusList]);

  // Refresh master cycles list from server
  async function refreshMasterCycles(targetToSelect?: number) {
    try {
      const freshCycles = await getMasterSiklusList();
      setMasterSiklusList(freshCycles);
      if (
        targetToSelect &&
        freshCycles.some((c) => c.nomor_siklus === targetToSelect)
      ) {
        setActiveSiklus(targetToSelect);
        await refreshData(targetToSelect);
      } else if (
        freshCycles.length > 0 &&
        !freshCycles.some((c) => c.nomor_siklus === activeSiklus)
      ) {
        const nextCycle = freshCycles[0].nomor_siklus;
        setActiveSiklus(nextCycle);
        await refreshData(nextCycle);
      }
      return freshCycles;
    } catch (err) {
      console.error('Gagal mengambil daftar master siklus:', err);
      return null;
    }
  }

  // Handle setting the starting date for Cycle 1
  async function handleApplyStartDate(newStartDate: Date) {
    setIsApplyingRotation(true);
    try {
      const yyyy = newStartDate.getFullYear();
      const mm = String(newStartDate.getMonth() + 1).padStart(2, '0');
      const dd = String(newStartDate.getDate()).padStart(2, '0');
      const isoDate = `${yyyy}-${mm}-${dd}`;

      const res = await applyStartDateRotation(isoDate);
      if (res.success) {
        toast.success(res.message);
        const freshCycles = await refreshMasterCycles();
        // Anchor berubah → auto-loncat ke tab siklus hari ini yang baru.
        if (freshCycles && freshCycles.length > 0) {
          const todayNum = resolveTodayCycleNum(
            freshCycles,
            freshCycles[0].nomor_siklus,
            new Date(),
          );
          userHasManuallySelected.current = false;
          setActiveSiklus(todayNum);
          await refreshData(todayNum);
        }
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error('Gagal mengatur tanggal rotasi siklus:', err);
      toast.error('Gagal mengatur jadwal tanggal rotasi siklus.');
    } finally {
      setIsApplyingRotation(false);
    }
  }

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
    userHasManuallySelected.current = true;
    setActiveSiklus(siklusNumber);
    await refreshData(siklusNumber);
  }

  async function handleDeleteAllItemSiklusMenu(siklusNumber: number) {
    setIsDeleting(true);
    try {
      await deleteAllItemSiklusMenu(siklusNumber);
      toast.success('Seluruh hidangan pada siklus berhasil dikosongkan.');
      await refreshData(siklusNumber);
    } catch (err) {
      console.error('Gagal mengosongkan siklus menu:', err);
      toast.error('Gagal mengosongkan siklus menu.');
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  }

  // Filter items based on search and jenis makanan
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter jenis
      if (selectedJenisFilter !== 'ALL') {
        if (selectedJenisFilter === 'SARING') {
          if (
            item.jenis_makanan !== 'SARING' &&
            item.waktu_makan !== 'SARING'
          ) {
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
        const matchKategori = (item.kategori_menu || '')
          .toLowerCase()
          .includes(q);
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

  // Export current cycle to Excel (matching format)
  function handleExportExcel() {
    try {
      const rows = items.map((item) => ({
        'Siklus Ke': item.siklus_ke,
        'Nama Siklus': activeCycleObj.nama_siklus,
        'Tanggal Rotasi': formatRollingLong(activeSiklus),
        Kelas: item.kelas,
        'Jenis Makanan': item.jenis_makanan,
        'Waktu Makan': item.waktu_makan,
        'Nama Hidangan': item.nama_makanan,
        'Kategori Menu / Diet': item.kategori_menu || '-',
        Catatan: item.catatan || '-',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        `Siklus ${activeSiklus}`,
      );

      XLSX.writeFile(workbook, `Siklus_Menu_${activeSiklus}_Rumah_Sakit.xlsx`);
      toast.success(
        `Matriks Siklus #${activeSiklus} berhasil diunduh dalam format Excel.`,
      );
    } catch (err) {
      console.error('Error exporting excel:', err);
      toast.error('Gagal mengekspor file Excel.');
    }
  }

  const availableNumbers = useMemo(() => {
    return masterSiklusList.map((c) => c.nomor_siklus);
  }, [masterSiklusList]);

  return (
    <div className='flex flex-1 min-w-0 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-clip'>
      {/* Header Banner */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-xs'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2.5 flex-wrap'>
            <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
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
            Kelola matriks hidangan per siklus menu, penentuan tanggal rotasi,
            tingkatan kelas, waktu makan (Pagi, Siang, Sore, Saring Siang), dan
            tag diet pasien secara dinamis.
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
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
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
            variant='outline'
            size='sm'
            onClick={() => setIsDeleteCycleOpen(true)}
            className='gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10'
          >
            <Trash2 className='w-3.5 h-3.5' />
            Hapus Siklus
          </Button>
        </div>
      </div>

      {/* Cycle Selector & Rotation Settings Bar */}
      <div className='bg-card p-3.5 rounded-2xl border shadow-xs space-y-3 min-w-0 max-w-full overflow-hidden'>
        <div className='flex items-center justify-between px-1 flex-wrap gap-2.5'>
          {/* Active Cycle Info */}
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='text-xs font-bold text-foreground flex items-center gap-1.5'>
              <CalendarDays className='w-4 h-4 text-primary' />
              Pilih Siklus Menu:
            </span>

            <Badge
              variant='secondary'
              className='text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 gap-1 px-2 py-0.5'
            >
              📅 Tanggal: {formatRollingLong(activeSiklus)}
            </Badge>

            {activeCycleObj.deskripsi && (
              <span className='text-[11px] text-muted-foreground italic hidden sm:inline'>
                — {activeCycleObj.deskripsi}
              </span>
            )}
          </div>

          {/* Rotation Schedule Configuration & Action buttons */}
          <div className='flex items-center gap-2 flex-wrap'>
            {/* Start Date of Cycle 1 DatePicker (Shadcn Popover + Calendar) */}
            <div className='flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-xl border border-border/80'>
              <span className='text-[11px] font-semibold text-muted-foreground whitespace-nowrap flex items-center gap-1'>
                <CalendarCheck2 className='w-3.5 h-3.5 text-primary' />
                Siklus #1 Mulai:
              </span>
              <Popover
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
              >
                <PopoverTrigger
                  disabled={isApplyingRotation}
                  className='inline-flex items-center gap-1.5 h-7 px-2.5 text-xs bg-background font-bold border border-primary/30 rounded-lg shadow-2xs cursor-pointer hover:bg-muted/80 select-none text-foreground'
                >
                  {isApplyingRotation ? (
                    <Loader2 className='w-3 h-3 animate-spin text-primary mx-auto' />
                  ) : (
                    <>
                      <CalendarIcon className='w-3 h-3 text-primary' />
                      <span>
                        {format(currentStartDate, 'd MMMM yyyy', {
                          locale: id,
                        })}
                      </span>
                      <ChevronDown className='w-3 h-3 text-muted-foreground ml-0.5 opacity-70' />
                    </>
                  )}
                </PopoverTrigger>
                <PopoverContent
                  align='end'
                  side='bottom'
                  sideOffset={6}
                  className='w-auto p-0 rounded-2xl shadow-xl border border-border bg-popover text-popover-foreground overflow-hidden z-50'
                >
                  <Calendar
                    mode='single'
                    selected={currentStartDate}
                    showCycleBadges
                    getCycleForDate={getCycleForDate}
                    onSelect={(d) => {
                      if (d) {
                        handleApplyStartDate(d);
                        setIsDatePickerOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              variant='ghost'
              size='xs'
              onClick={() => setIsKelolaSiklusOpen(true)}
              className='text-[11px] text-muted-foreground hover:text-foreground gap-1'
              title='Ubah nama, tanggal, atau deskripsi siklus ini'
            >
              <Settings2 className='w-3.5 h-3.5 text-primary' /> Pengaturan
              Siklus #{activeSiklus}
            </Button>

            <Button
              variant='ghost'
              size='xs'
              onClick={() => setIsDeleteConfirmOpen(true)}
              className='text-[11px] text-muted-foreground hover:text-rose-600 gap-1'
              title='Kosongkan seluruh menu dalam siklus ini'
            >
              <Trash2 className='w-3 h-3 text-rose-500' /> Kosongkan Menu
            </Button>
          </div>
        </div>

        {/* Dynamic Cycle Tabs + Tambah Siklus Button */}
        <div className='flex flex-wrap items-center gap-1.5'>
          {masterSiklusList.map((cycle) => {
            const num = cycle.nomor_siklus;
            const isActive = activeSiklus === num;
            const isToday = todayCycleNum === num;
            return (
              <button
                key={num}
                type='button'
                onClick={() => handleSelectCycle(num)}
                title={
                  isToday
                    ? `${cycle.nama_siklus} — siklus hari ini (${formatRollingLong(num)})`
                    : `${cycle.nama_siklus} — ${formatRollingLong(num)}`
                }
                className={`flex min-w-0 items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] sm:px-3.5 sm:py-2 sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs scale-102'
                    : isToday
                      ? 'bg-primary/10 text-primary border-primary/40 hover:bg-primary/15'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{cycle.nama_siklus}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wide transition-colors ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted-foreground/15 text-foreground/80'
                  }`}
                >
                  {formatRollingShort(num)}
                </span>
                {isToday && !isActive && (
                  <span className='text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground'>
                    Hari ini
                  </span>
                )}
                {isActive && (
                  <span className='w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse' />
                )}
              </button>
            );
          })}

          {/* Quick Add Cycle Button */}
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setIsTambahSiklusOpen(true)}
            className='h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/10 shrink-0'
          >
            <PlusCircle className='w-3.5 h-3.5' /> Tambah Siklus
          </Button>
        </div>
      </div>


      {/* Stats Cards */}
      <SiklusStats items={items} activeSiklus={activeSiklus} />

      {/* Filter & Search Toolbar */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border min-w-0 max-w-full overflow-hidden'>
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
        <div className='flex items-center gap-1.5 overflow-x-auto min-w-0 max-w-full pb-1'>
          {[
            { id: 'ALL', label: 'Semua Lauk' },
            { id: 'HEWANI', label: '🍗 Hewani' },
            { id: 'NABATI', label: '🫘 Nabati' },
            { id: 'SAYUR', label: '🥦 Sayur' },
            { id: 'SARING', label: '🥣 Saring' },
            { id: 'BUAH', label: '🍎 Buah' },
            { id: 'SNACK', label: '🍪 Snack' },
          ].map((tab) => {
            const isActive = selectedJenisFilter === tab.id;
            return (
              <button
                key={tab.id}
                type='button'
                onClick={() => setSelectedJenisFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
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

      {/* Tambah Siklus Baru Dialog */}
      <TambahSiklusDialog
        open={isTambahSiklusOpen}
        onOpenChange={setIsTambahSiklusOpen}
        existingCycles={masterSiklusList}
        onSuccess={async (newCycleNum) => {
          await refreshMasterCycles(newCycleNum);
        }}
      />

      {/* Kelola Siklus Dialog */}
      <KelolaSiklusDialog
        open={isKelolaSiklusOpen}
        onOpenChange={setIsKelolaSiklusOpen}
        cycle={activeCycleObj}
        onSuccessUpdate={async () => {
          await refreshMasterCycles();
        }}
        onSuccessDelete={async () => {
          await refreshMasterCycles();
        }}
      />

      {/* Hapus Siklus Dialog */}
      <DeleteCycleDialog
        open={isDeleteCycleOpen}
        onOpenChange={setIsDeleteCycleOpen}
        currentSiklus={activeSiklus}
        availableCycles={masterSiklusList}
        onSuccess={async () => {
          await refreshMasterCycles();
        }}
      />

      {/* Duplicate Cycle Dialog */}
      <DuplicateSiklusDialog
        open={isDuplicateOpen}
        onOpenChange={setIsDuplicateOpen}
        currentSiklus={activeSiklus}
        availableSiklusList={availableNumbers}
        onSuccess={async (targetSiklus) => {
          await refreshMasterCycles(targetSiklus);
        }}
      />

      {/* Single Item Create / Edit Dialog */}
      <SiklusItemDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        itemToEdit={itemToEdit}
        defaultSlot={defaultSlotForAdd}
        dietOptions={dietOptions}
        availableCycles={masterSiklusList}
        kelasOptions={kelasOptions}
        onSuccess={() => refreshData(activeSiklus)}
      />

      {/* Batch Slot Editor Dialog */}
      <SiklusSlotEditorDialog
        open={isSlotDialogOpen}
        onOpenChange={setIsSlotDialogOpen}
        slotContext={slotContext}
        dietOptions={dietOptions}
        onSuccess={() => refreshData(activeSiklus)}
      />

      {/* Reset Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className='sm:max-w-md p-6'>
          <DialogHeader className='gap-2'>
            <div className='p-3 rounded-full bg-amber-500/10 text-amber-600 w-fit'>
              <RotateCcw className='w-6 h-6' />
            </div>
            <DialogTitle className='text-base font-bold'>
              Kosongkan Menu {activeCycleObj.nama_siklus}?
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Tindakan ini akan menghapus seluruh hidangan yang terdaftar pada{' '}
              <strong>{activeCycleObj.nama_siklus}</strong> tanpa menghapus
              nomor siklus dari sistem. Apakah Anda yakin ingin melanjutkan?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 pt-2 border-t'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant='default'
              size='sm'
              onClick={() => handleDeleteAllItemSiklusMenu(activeSiklus)}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isDeleting ? 'Mengosongkan...' : 'Ya, Kosongkan Menu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
