'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import type {
  UnmappedDietItem,
  KategoriMenuOption,
} from '@/servers/mapping-diet.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { broadcastProductionUpdate } from '@/lib/realtime-sync';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  UtensilsCrossed,
  Check,
  Loader2,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Pencil,
  Send,
} from 'lucide-react';
import { saveDietMapping } from '@/servers/mapping-diet.service';
import { toast } from 'sonner';
import MappingDietFloatingBar, {
  type ReadyDietRow,
} from './MappingDietFloatingBar';
import MappingDietConfirmDialog from './MappingDietConfirmDialog';

interface MappingDietTableProps {
  items: UnmappedDietItem[];
  options: KategoriMenuOption[];
  selectedRaws: string[];
  onToggleSelect: (raw: string) => void;
  onToggleSelectAll: () => void;
  onRefresh?: () => void;
  onEditItem?: (item: UnmappedDietItem) => void;
  isMappedTab?: boolean;
}

interface RowFormState {
  karbo: string;
  hewani: string;
  nabati: string;
  sayur: string;
  buah: string;
  snack: string;
  status: 'idle' | 'saving' | 'saved' | 'error';
  isDirty?: boolean;
}

interface CategoryCellProps {
  value: string;
  options: KategoriMenuOption[];
  onChange: (val: string) => void;
  isBold?: boolean;
}

function CategorySelectCell({
  value,
  options,
  onChange,
  isBold = false,
}: CategoryCellProps) {
  return (
    <Select
      value={value || '__EMPTY__'}
      onValueChange={(val) => onChange(!val || val === '__EMPTY__' ? '' : val)}
    >
      <SelectTrigger
        className={`w-full h-9 px-2 text-xs bg-transparent border-0 rounded-none shadow-none hover:bg-black/5 dark:hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-primary transition-colors cursor-pointer data-[state=open]:bg-background ${
          isBold ? 'font-bold' : 'font-medium'
        }`}
      >
        <SelectValue placeholder='-'>
          {value === 'NPO' ? (
            <span className='font-mono font-bold text-foreground'>NPO</span>
          ) : value === 'KATERING' ? (
            <span className='font-mono font-bold text-foreground'>
              KATERING
            </span>
          ) : value ? (
            <span className='font-mono font-bold text-foreground'>{value}</span>
          ) : (
            <span className='text-muted-foreground/40 font-normal'>-</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className='max-h-64 min-w-[180px] w-full z-50'>
        <SelectItem
          value='__EMPTY__'
          className='text-xs text-muted-foreground italic cursor-pointer'
        >
          -- Kosong / Hapus --
        </SelectItem>

        {/* Khusus: NPO & KATERING */}
        <SelectItem
          value='NPO'
          className='text-xs font-bold text-purple-700 dark:text-purple-300 cursor-pointer bg-purple-500/5 hover:bg-purple-500/10'
        >
          <span className='font-mono font-bold mr-1.5'>NPO</span>
          <span className='text-muted-foreground text-[11px]'>
            (Puasa / NPO)
          </span>
        </SelectItem>
        <SelectItem
          value='KATERING'
          className='text-xs font-bold text-blue-700 dark:text-blue-300 cursor-pointer bg-blue-500/5 hover:bg-blue-500/10 border-b pb-1 mb-1'
        >
          <span className='font-mono font-bold mr-1.5'>KATERING</span>
          <span className='text-muted-foreground text-[11px]'>
            (Alihkan ke AG Katering)
          </span>
        </SelectItem>

        {options.map((opt) => (
          <SelectItem
            key={opt.id}
            value={opt.kodeItem}
            className='text-xs cursor-pointer'
          >
            <span className='font-bold font-mono text-foreground mr-1.5'>
              {opt.kodeItem}
            </span>
            {opt.labelItem !== opt.kodeItem && (
              <span className='text-muted-foreground text-[11px] truncate'>
                ({opt.labelItem})
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function MappingDietTable({
  items,
  options,
  selectedRaws,
  onToggleSelect,
  onToggleSelectAll,
  onRefresh,
  onEditItem,
  isMappedTab = false,
}: MappingDietTableProps) {
  const [, startTransition] = useTransition();

  // Local state for each row to allow instant responsive inline edits
  const [rowStates, setRowStates] = useState<Record<string, RowFormState>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  // Group master options by category
  const karboOptions = useMemo(
    () =>
      options.filter(
        (o) =>
          o.namaKategori === 'KARBO' || o.namaKategori === 'BENTUK_MAKANAN',
      ),
    [options],
  );

  const hewaniOptions = useMemo(
    () =>
      options.filter(
        (o) => o.namaKategori === 'HEWANI' || o.namaKategori === 'DIIT',
      ),
    [options],
  );

  const nabatiOptions = useMemo(() => {
    const list = [
      ...options.filter(
        (o) =>
          o.namaKategori === 'NABATI' ||
          o.namaKategori === 'DIIT' ||
          o.namaKategori === 'EXTRA' ||
          o.kodeItem === 'B',
      ),
    ];
    const seen = new Set<string>();
    return list.filter((o) => {
      if (seen.has(o.kodeItem)) return false;
      seen.add(o.kodeItem);
      return true;
    });
  }, [options]);

  const sayurOptions = useMemo(() => {
    const list = [
      ...options.filter(
        (o) =>
          o.namaKategori === 'SAYUR' ||
          o.namaKategori === 'DIIT' ||
          o.kodeItem === 'B',
      ),
    ];
    const seen = new Set<string>();
    return list.filter((o) => {
      if (seen.has(o.kodeItem)) return false;
      seen.add(o.kodeItem);
      return true;
    });
  }, [options]);

  const buahOptions = useMemo(
    () => options.filter((o) => o.namaKategori === 'BUAH'),
    [options],
  );

  const snackOptions = useMemo(
    () => options.filter((o) => o.namaKategori === 'SNACK'),
    [options],
  );

  // Sync items from server into local rowStates (preserve uncommitted dirty drafts)
  useEffect(() => {
    setRowStates((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        let nabati = item.nabati ?? '';
        let sayur = item.sayur ?? '';
        if (!nabati && !sayur && item.extra) {
          const parts = item.extra.split(',').map((s) => s.trim());
          if (parts.length >= 2) {
            nabati = parts[0];
            sayur = parts[1];
          } else if (parts.length === 1 && parts[0]) {
            nabati = parts[0];
          }
        }

        // If not already in local state, initialize
        if (!next[item.diet_rs_raw]) {
          next[item.diet_rs_raw] = {
            karbo: item.bentuk_makanan ?? '',
            hewani: item.kategori_diet ?? '',
            nabati: nabati,
            sayur: sayur,
            buah: item.buah ?? '',
            snack: item.snack ?? '',
            status: 'idle',
            isDirty: false,
          };
        } else {
          // If already in local state, only overwrite if not dirty
          const curr = next[item.diet_rs_raw];
          if (!curr.isDirty) {
            next[item.diet_rs_raw] = {
              ...curr,
              karbo: item.bentuk_makanan ?? '',
              hewani: item.kategori_diet ?? '',
              nabati: nabati,
              sayur: sayur,
              buah: item.buah ?? '',
              snack: item.snack ?? '',
              status: 'idle',
            };
          }
        }
      });
      return next;
    });
  }, [items]);

  // Handle instant inline change of a single cell — DRAFT ONLY, NO AUTO-SAVE!
  function handleCellChange(
    diet_rs_raw: string,
    field: 'karbo' | 'hewani' | 'nabati' | 'sayur' | 'buah' | 'snack',
    value: string,
  ) {
    const currentRow = rowStates[diet_rs_raw] || {
      karbo: '',
      hewani: '',
      nabati: '',
      sayur: '',
      buah: '',
      snack: '',
      status: 'idle',
      isDirty: false,
    };

    let updatedRow: RowFormState;

    if (value === 'NPO' && (field === 'karbo' || field === 'hewani')) {
      updatedRow = {
        karbo: 'NPO',
        hewani: 'NPO',
        nabati: 'NPO',
        sayur: 'NPO',
        buah: 'NPO',
        snack: 'NPO',
        status: 'idle',
        isDirty: true,
      };
    } else if (
      value === 'KATERING' &&
      (field === 'karbo' || field === 'hewani')
    ) {
      updatedRow = {
        karbo: 'KATERING',
        hewani: 'KATERING',
        nabati: '',
        sayur: '',
        buah: '',
        snack: '',
        status: 'idle',
        isDirty: true,
      };
    } else {
      updatedRow = {
        ...currentRow,
        [field]: value,
        status: 'idle',
        isDirty: true,
      };
    }

    setRowStates((prev) => ({
      ...prev,
      [diet_rs_raw]: updatedRow,
    }));
  }

  // Detect rows where 2 main diets are filled and pending confirmation
  const readyToConfirmRows: ReadyDietRow[] = useMemo(() => {
    const result: ReadyDietRow[] = [];
    for (const item of items) {
      const state = rowStates[item.diet_rs_raw];
      if (!state || !state.isDirty) continue;

      const isNpo =
        state.karbo === 'NPO' ||
        state.hewani === 'NPO' ||
        item.diet_rs_raw.trim().toUpperCase() === 'NPO';

      const isKatering =
        state.karbo === 'KATERING' || state.hewani === 'KATERING';

      const isStandardReady = Boolean(
        state.karbo &&
        state.hewani &&
        state.nabati &&
        state.sayur &&
        state.buah &&
        state.snack,
      );

      if (isNpo || isKatering || isStandardReady) {
        result.push({
          diet_rs_raw: item.diet_rs_raw,
          karbo: state.karbo,
          hewani: state.hewani,
          nabati: state.nabati,
          sayur: state.sayur,
          buah: state.buah,
          snack: state.snack,
          jumlahPasien: item.jumlah_pasien,
        });
      }
    }
    return result;
  }, [items, rowStates]);

  // Reset all uncommitted draft changes back to initial server values
  function handleResetDrafts() {
    setRowStates((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        let nabati = item.nabati ?? '';
        let sayur = item.sayur ?? '';
        if (!nabati && !sayur && item.extra) {
          const parts = item.extra.split(',').map((s) => s.trim());
          if (parts.length >= 2) {
            nabati = parts[0];
            sayur = parts[1];
          } else if (parts.length === 1 && parts[0]) {
            nabati = parts[0];
          }
        }

        next[item.diet_rs_raw] = {
          karbo: item.bentuk_makanan ?? '',
          hewani: item.kategori_diet ?? '',
          nabati,
          sayur,
          buah: item.buah ?? '',
          snack: item.snack ?? '',
          status: 'idle',
          isDirty: false,
        };
      });
      return next;
    });
    toast.info('Perubahan draft dibatalkan.');
  }

  // Final save invoked from Floating Bar confirmation dialog
  async function handleFinalConfirmSave() {
    if (readyToConfirmRows.length === 0) return;
    setIsSubmittingConfirm(true);

    try {
      let savedCount = 0;
      for (const row of readyToConfirmRows) {
        const mode =
          row.karbo === 'NPO' || row.hewani === 'NPO'
            ? 'NPO'
            : row.karbo === 'KATERING' || row.hewani === 'KATERING'
              ? 'KATERING'
              : 'STANDARD';

        const res = await saveDietMapping({
          diet_rs_raw: row.diet_rs_raw,
          mode,
          bentuk_makanan: row.karbo || null,
          kategori_diet: row.hewani || null,
          nabati: row.nabati || null,
          sayur: row.sayur || null,
          buah: row.buah || null,
          snack: row.snack || null,
          mapped_by: 'Admin Gizi',
        });
        if (res.success) savedCount++;
      }

      toast.success(
        `${savedCount} mapping diet berhasil dikonfirmasi dan disimpan.`,
      );
      setIsConfirmOpen(false);

      setRowStates((prev) => {
        const next = { ...prev };
        for (const row of readyToConfirmRows) {
          if (next[row.diet_rs_raw]) {
            next[row.diet_rs_raw] = {
              ...next[row.diet_rs_raw],
              status: 'saved',
              isDirty: false,
            };
          }
        }
        return next;
      });

      startTransition(() => {
        onRefresh?.();
      });
      broadcastProductionUpdate('SYNC_NOW', 'mapping-diet');
    } catch (err) {
      console.error('Error confirming mappings:', err);
      toast.error('Gagal menyimpan konfirmasi mapping diet.');
    } finally {
      setIsSubmittingConfirm(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center p-12 bg-card rounded-2xl border text-center shadow-xs'>
        <div className='w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3'>
          <UtensilsCrossed className='w-6 h-6' />
        </div>
        <h4 className='font-semibold text-base text-foreground'>
          {isMappedTab
            ? 'Belum ada diet yang termapping'
            : 'Tidak ada diet yang belum termapping'}
        </h4>
        <p className='text-xs text-muted-foreground max-w-sm mt-1'>
          {isMappedTab
            ? 'Diet yang telah berhasil dipetakan ke standar katering akan muncul dan tersimpan di tab ini.'
            : 'Semua diet pasien aktif sudah memiliki mapping atau tidak ada data yang sesuai filter pencarian.'}
        </p>
      </div>
    );
  }

  const isAllSelected =
    items.length > 0 &&
    items.every((i) => selectedRaws.includes(i.diet_rs_raw));

  return (
    <div className='rounded-xl border border-slate-300 dark:border-slate-800 bg-card shadow-xs overflow-hidden w-full min-w-0'>
      <div className='overflow-x-auto w-full'>
        <Table className='border-collapse text-xs'>
          {/* Excel-style Header */}
          <TableHeader>
            <TableRow className='bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900'>
              <TableHead className='w-[36px] px-2 text-center border-r border-slate-300 dark:border-slate-700'>
                <input
                  type='checkbox'
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className='rounded border-slate-400 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer align-middle'
                  title='Pilih semua baris'
                />
              </TableHead>

              {/* DIET Column */}
              <TableHead className='min-w-[280px] max-w-[400px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>DIET RAW RS</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              {/* Category Columns */}
              <TableHead className='min-w-[125px] w-[135px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>KARBO</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              <TableHead className='min-w-[125px] w-[135px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>HEWANI</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              <TableHead className='min-w-[125px] w-[135px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>NABATI</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              <TableHead className='min-w-[125px] w-[135px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>SAYUR</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              <TableHead className='min-w-[125px] w-[135px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>BUAH</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              <TableHead className='min-w-[125px] w-[135px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>SNACK</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              {/* Save Status / Indicator Column */}
              <TableHead className='w-[60px] text-center font-bold text-slate-800 dark:text-slate-100 text-[10px] uppercase py-2.5 border-r border-slate-300 dark:border-slate-700'>
                Status
              </TableHead>

              {/* Action Column */}
              <TableHead className='w-[75px] text-center font-bold text-slate-800 dark:text-slate-100 text-[10px] uppercase py-2.5'>
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          {/* Excel-style Body */}
          <TableBody>
            {items.map((item, idx) => {
              const isSelected = selectedRaws.includes(item.diet_rs_raw);
              const row = rowStates[item.diet_rs_raw] || {
                karbo: item.bentuk_makanan ?? '',
                hewani: item.kategori_diet ?? '',
                nabati: item.nabati ?? '',
                sayur: item.sayur ?? '',
                buah: item.buah ?? '',
                snack: item.snack ?? '',
                status: 'idle',
              };

              const isNpoRow =
                row.karbo === 'NPO' ||
                row.hewani === 'NPO' ||
                item.diet_rs_raw.trim().toUpperCase() === 'NPO';

              const isKateringRow =
                item.status_mapping === 'KATERING' ||
                row.karbo === 'KATERING' ||
                row.hewani === 'KATERING';

              const isComplete =
                isNpoRow ||
                isKateringRow ||
                Boolean(
                  row.karbo &&
                  row.hewani &&
                  row.nabati &&
                  row.sayur &&
                  row.buah &&
                  row.snack,
                );

              return (
                <TableRow
                  key={item.diet_rs_raw}
                  className={`border-b border-slate-200 dark:border-slate-800 transition-colors ${
                    isSelected
                      ? 'bg-primary/10'
                      : idx % 2 === 0
                        ? 'bg-background'
                        : 'bg-slate-50/40 dark:bg-slate-900/40'
                  } hover:bg-slate-100/50 dark:hover:bg-slate-800/50`}
                >
                  {/* Checkbox Cell */}
                  <TableCell className='px-2 text-center border-r border-slate-200 dark:border-slate-800 align-middle py-1'>
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.diet_rs_raw)}
                      className='rounded border-slate-400 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer align-middle'
                    />
                  </TableCell>

                  {/* DIET Cell (Free text) */}
                  <TableCell
                    className='px-3 py-2 text-xs font-mono font-bold text-foreground border-r border-slate-200 dark:border-slate-800 align-middle break-words max-w-[380px]'
                    title={item.diet_rs_raw}
                  >
                    <div className='flex items-center gap-1.5 flex-wrap'>
                      <span>{item.diet_rs_raw}</span>
                      {isKateringRow && (
                        <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200'>
                          <Send className='w-3 h-3' /> AG Katering
                        </span>
                      )}
                    </div>
                    {item.jumlah_pasien > 0 && (
                      <div className='text-[11px] text-muted-foreground font-sans font-normal mt-0.5 flex items-center gap-1 flex-wrap'>
                        <span className='text-blue-600 dark:text-blue-400 font-semibold'>
                          {item.jumlah_pasien} pasien aktif
                        </span>
                        {item.kelas_list && item.kelas_list.length > 0 && (
                          <span className='text-muted-foreground'>
                            ({item.kelas_list.join(', ')})
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* KARBO Select Cell */}
                  <TableCell className='p-0 border-r border-slate-200 dark:border-slate-800 align-middle bg-[#ffe8ec]/60 dark:bg-[#381a22]/30 hover:bg-[#ffe8ec] dark:hover:bg-[#381a22]/50 transition-colors'>
                    <CategorySelectCell
                      value={row.karbo}
                      options={karboOptions}
                      onChange={(val) =>
                        handleCellChange(item.diet_rs_raw, 'karbo', val)
                      }
                      isBold
                    />
                  </TableCell>

                  {/* HEWANI Select Cell */}
                  <TableCell className='p-0 border-r border-slate-200 dark:border-slate-800 align-middle bg-[#ffe8ec]/60 dark:bg-[#381a22]/30 hover:bg-[#ffe8ec] dark:hover:bg-[#381a22]/50 transition-colors'>
                    <CategorySelectCell
                      value={row.hewani}
                      options={hewaniOptions}
                      onChange={(val) =>
                        handleCellChange(item.diet_rs_raw, 'hewani', val)
                      }
                      isBold
                    />
                  </TableCell>

                  {/* NABATI Select Cell */}
                  <TableCell className='p-0 border-r border-slate-200 dark:border-slate-800 align-middle bg-[#ffe8ec]/60 dark:bg-[#381a22]/30 hover:bg-[#ffe8ec] dark:hover:bg-[#381a22]/50 transition-colors'>
                    <CategorySelectCell
                      value={row.nabati}
                      options={nabatiOptions}
                      onChange={(val) =>
                        handleCellChange(item.diet_rs_raw, 'nabati', val)
                      }
                    />
                  </TableCell>

                  {/* SAYUR Select Cell */}
                  <TableCell className='p-0 border-r border-slate-200 dark:border-slate-800 align-middle bg-[#ffe8ec]/60 dark:bg-[#381a22]/30 hover:bg-[#ffe8ec] dark:hover:bg-[#381a22]/50 transition-colors'>
                    <CategorySelectCell
                      value={row.sayur}
                      options={sayurOptions}
                      onChange={(val) =>
                        handleCellChange(item.diet_rs_raw, 'sayur', val)
                      }
                    />
                  </TableCell>

                  {/* BUAH Select Cell */}
                  <TableCell className='p-0 border-r border-slate-200 dark:border-slate-800 align-middle bg-[#ffe8ec]/60 dark:bg-[#381a22]/30 hover:bg-[#ffe8ec] dark:hover:bg-[#381a22]/50 transition-colors'>
                    <CategorySelectCell
                      value={row.buah}
                      options={buahOptions}
                      onChange={(val) =>
                        handleCellChange(item.diet_rs_raw, 'buah', val)
                      }
                    />
                  </TableCell>

                  {/* SNACK Select Cell */}
                  <TableCell className='p-0 border-r border-slate-200 dark:border-slate-800 align-middle bg-[#ffe8ec]/60 dark:bg-[#381a22]/30 hover:bg-[#ffe8ec] dark:hover:bg-[#381a22]/50 transition-colors'>
                    <CategorySelectCell
                      value={row.snack}
                      options={snackOptions}
                      onChange={(val) =>
                        handleCellChange(item.diet_rs_raw, 'snack', val)
                      }
                    />
                  </TableCell>

                  {/* Status Indicator */}
                  <TableCell className='p-1 text-center align-middle border-r border-slate-200 dark:border-slate-800'>
                    {row.isDirty ? (
                      isComplete ? (
                        <span
                          className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300'
                          title='Seluruh komponen terisi — siap dikonfirmasi lewat tombol floating'
                        >
                          Siap Simpan
                        </span>
                      ) : (
                        <span
                          className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground'
                          title='Lengkapi seluruh 6 kolom komponen diet'
                        >
                          Draft
                        </span>
                      )
                    ) : row.status === 'saving' ? (
                      <span title='Menyimpan...'>
                        <Loader2 className='w-4 h-4 animate-spin text-primary mx-auto' />
                      </span>
                    ) : row.status === 'saved' ? (
                      <span title='Tersimpan!'>
                        <Check className='w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto animate-in zoom-in-75' />
                      </span>
                    ) : row.status === 'error' ? (
                      <span title='Gagal menyimpan'>
                        <AlertCircle className='w-4 h-4 text-rose-600 mx-auto' />
                      </span>
                    ) : isComplete ? (
                      <span title='Lengkap (MAPPED)'>
                        <CheckCircle2 className='w-3.5 h-3.5 text-emerald-500/80 mx-auto' />
                      </span>
                    ) : (
                      <span title='Wajib minimal isi Karbo & Hewani'>
                        <HelpCircle className='w-3.5 h-3.5 text-muted-foreground/40 mx-auto' />
                      </span>
                    )}
                  </TableCell>

                  {/* Action Cell */}
                  <TableCell className='px-2 py-1 text-center align-middle'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => onEditItem?.(item)}
                      className='h-7 px-2 text-[11px] gap-1 font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer shadow-none'
                      title={`Edit mapping ${item.diet_rs_raw}`}
                    >
                      <Pencil className='w-3 h-3 text-primary' />
                      <span>Edit</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Floating Confirmation Bar */}
      <MappingDietFloatingBar
        readyRows={readyToConfirmRows}
        onConfirm={() => setIsConfirmOpen(true)}
        onReset={handleResetDrafts}
        isSubmitting={isSubmittingConfirm}
      />

      {/* Confirmation Modal Dialog */}
      <MappingDietConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        diet_rs_raw={
          readyToConfirmRows.length === 1
            ? readyToConfirmRows[0].diet_rs_raw
            : `${readyToConfirmRows.length} Diet Siap Dikonfirmasi`
        }
        mode={
          readyToConfirmRows.length === 1 &&
          readyToConfirmRows[0].karbo === 'NPO'
            ? 'NPO'
            : readyToConfirmRows.length === 1 &&
                readyToConfirmRows[0].karbo === 'KATERING'
              ? 'KATERING'
              : 'STANDARD'
        }
        values={
          readyToConfirmRows.length === 1
            ? readyToConfirmRows[0]
            : undefined
        }
        items={readyToConfirmRows}
        jumlahPasien={readyToConfirmRows.reduce(
          (acc, r) => acc + (r.jumlahPasien || 0),
          0,
        )}
        isSubmitting={isSubmittingConfirm}
        onConfirm={handleFinalConfirmSave}
      />
    </div>
  );
}
