'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import type {
  UnmappedDietItem,
  KategoriMenuOption,
} from '@/servers/mapping-diet.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { broadcastProductionUpdate } from '@/lib/realtime-sync';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UtensilsCrossed,
  Check,
  Loader2,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { saveDietMapping } from '@/servers/mapping-diet.service';
import { toast } from 'sonner';

interface MappingDietTableProps {
  items: UnmappedDietItem[];
  options: KategoriMenuOption[];
  selectedRaws: string[];
  onToggleSelect: (raw: string) => void;
  onToggleSelectAll: () => void;
  onRefresh?: () => void;
}

interface RowFormState {
  karbo: string;
  hewani: string;
  nabati: string;
  sayur: string;
  buah: string;
  snack: string;
  status: 'idle' | 'saving' | 'saved' | 'error';
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
          {value ? (
            <span className='font-mono font-bold text-foreground'>{value}</span>
          ) : (
            <span className='text-muted-foreground/40 font-normal'>-</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className='max-h-64 min-w-[170px] z-50'>
        <SelectItem
          value='__EMPTY__'
          className='text-xs text-muted-foreground italic'
        >
          -- Kosong / Hapus --
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
}: MappingDietTableProps) {
  const [, startTransition] = useTransition();

  // Local state for each row to allow instant responsive inline edits
  const [rowStates, setRowStates] = useState<Record<string, RowFormState>>({});

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

  const nabatiOptions = useMemo(
    () =>
      options.filter(
        (o) => o.namaKategori === 'NABATI' || o.namaKategori === 'EXTRA',
      ),
    [options],
  );

  const sayurOptions = useMemo(
    () => options.filter((o) => o.namaKategori === 'SAYUR'),
    [options],
  );

  const buahOptions = useMemo(
    () => options.filter((o) => o.namaKategori === 'BUAH'),
    [options],
  );

  const snackOptions = useMemo(
    () => options.filter((o) => o.namaKategori === 'SNACK'),
    [options],
  );

  // Sync items from server into local rowStates
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
          };
        } else {
          // If already in local state but not currently saving, ensure values are synced if empty
          const curr = next[item.diet_rs_raw];
          if (curr.status === 'idle') {
            next[item.diet_rs_raw] = {
              ...curr,
              karbo: curr.karbo || item.bentuk_makanan || '',
              hewani: curr.hewani || item.kategori_diet || '',
              nabati: curr.nabati || nabati || '',
              sayur: curr.sayur || sayur || '',
              buah: curr.buah || item.buah || '',
              snack: curr.snack || item.snack || '',
            };
          }
        }
      });
      return next;
    });
  }, [items]);

  // Handle instant inline change of a single cell
  async function handleCellChange(
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
    };

    const updatedRow: RowFormState = {
      ...currentRow,
      [field]: value,
      status: 'saving',
    };

    // 1. Optimistically update local state immediately
    setRowStates((prev) => ({
      ...prev,
      [diet_rs_raw]: updatedRow,
    }));

    // 2. Persist to server in background
    try {
      const res = await saveDietMapping({
        diet_rs_raw,
        bentuk_makanan: updatedRow.karbo || null,
        kategori_diet: updatedRow.hewani || null,
        nabati: updatedRow.nabati || null,
        sayur: updatedRow.sayur || null,
        buah: updatedRow.buah || null,
        snack: updatedRow.snack || null,
        mapped_by: 'Admin Gizi',
      });

      if (res.success) {
        setRowStates((prev) => ({
          ...prev,
          [diet_rs_raw]: {
            ...prev[diet_rs_raw],
            status: 'saved',
          },
        }));

        // Revert saved status back to idle after 1.5s
        setTimeout(() => {
          setRowStates((prev) => {
            if (prev[diet_rs_raw]?.status === 'saved') {
              return {
                ...prev,
                [diet_rs_raw]: {
                  ...prev[diet_rs_raw],
                  status: 'idle',
                },
              };
            }
            return prev;
          });
        }, 1500);

        startTransition(() => {
          onRefresh?.();
        });
        broadcastProductionUpdate('SYNC_NOW', 'mapping-diet');
      } else {
        setRowStates((prev) => ({
          ...prev,
          [diet_rs_raw]: {
            ...prev[diet_rs_raw],
            status: 'error',
          },
        }));
        toast.error(res.message);
      }
    } catch (err) {
      console.error('Error saving inline mapping:', err);
      setRowStates((prev) => ({
        ...prev,
        [diet_rs_raw]: {
          ...prev[diet_rs_raw],
          status: 'error',
        },
      }));
      toast.error('Gagal menyimpan perubahan.');
    }
  }

  if (items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center p-12 bg-card rounded-2xl border text-center shadow-xs'>
        <div className='w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3'>
          <UtensilsCrossed className='w-6 h-6' />
        </div>
        <h4 className='font-semibold text-base text-foreground'>
          Tidak ada diet yang belum termapping
        </h4>
        <p className='text-xs text-muted-foreground max-w-sm mt-1'>
          Semua diet pasien aktif sudah memiliki mapping atau tidak ada data
          yang sesuai filter pencarian.
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
                  <span>DIET</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              {/* Category Columns */}
              <TableHead className='min-w-[130px] w-[140px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>KARBO</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              <TableHead className='min-w-[130px] w-[140px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>HEWANI</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              <TableHead className='min-w-[130px] w-[140px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>NABATI</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              <TableHead className='min-w-[130px] w-[140px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>SAYUR</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              <TableHead className='min-w-[130px] w-[140px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>BUAH</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              <TableHead className='min-w-[130px] w-[140px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                <div className='flex items-center justify-center gap-1'>
                  <span>SNACK</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              {/* Save Status / Indicator Column */}
              <TableHead className='w-[60px] text-center font-bold text-slate-800 dark:text-slate-100 text-[10px] uppercase py-2.5'>
                Status
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

              const isComplete = Boolean(row.karbo && row.hewani);

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
                    <span>{item.diet_rs_raw}</span>
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
                  <TableCell className='p-1 text-center align-middle'>
                    {row.status === 'saving' ? (
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


