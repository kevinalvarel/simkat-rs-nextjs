'use client';

import React, { useState, useMemo, useTransition } from 'react';
import type {
  UnmappedDietItem,
  KategoriMenuOption,
} from '@/servers/mapping-diet.service';
import type { SiklusDietOption } from '@/servers/siklus-menu.service';
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
import { hasFormFoodMapping, applyBentukSaringTransition, getTugasKateringCodes, isBentukTugasKatering, isLegacyKateringMapping, isBentukSaring, getMasterOptionsForKind, getSaringDietCodes, hewaniMappingOptions, validateSaringPartition } from '@/lib/mapping-diet-fields';

interface MappingDietTableProps {
  items: UnmappedDietItem[];
  allItems: UnmappedDietItem[];
  options: KategoriMenuOption[];
  siklusDietOptions?: SiklusDietOption[];
  selectedRaws: string[];
  onToggleSelect: (raw: string) => void;
  onToggleSelectAll: () => void;
  onRefresh?: () => void;
  onEditItem?: (item: UnmappedDietItem) => void;
  isMappedTab?: boolean;
}

interface RowFormState {
  bentukMakanan: string;
  karbohidrat: string;
  hewani: string;
  nabati: string;
  sayur: string;
  buah: string;
  snack: string;
  mode: 'STANDARD' | 'NPO';
  status: 'idle' | 'saving' | 'saved' | 'error';
  isDirty?: boolean;
}

function rowFromItem(item: UnmappedDietItem): RowFormState {
  const legacyParts = item.extra?.split(',').map((part) => part.trim()) || [];
  const useLegacyExtra = !item.nabati && !item.sayur;
  const isNpo = item.diet_rs_raw.trim().toUpperCase() === 'NPO' || item.bentuk_makanan === 'NPO';
  return {
    bentukMakanan: item.bentuk_makanan ?? '',
    karbohidrat: isNpo ? 'NPO' : item.karbohidrat ?? '',
    hewani: item.kategori_diet ?? '',
    nabati: item.nabati || (useLegacyExtra ? legacyParts[0] : '') || '',
    sayur: item.sayur || (useLegacyExtra ? legacyParts[1] : '') || '',
    buah: item.buah ?? '',
    snack: item.snack ?? '',
    mode: isNpo ? 'NPO' : 'STANDARD',
    status: 'idle',
    isDirty: false,
  };
}

interface CategoryCellProps {
  value: string;
  options: KategoriMenuOption[];
  onChange: (val: string) => void;
  isBold?: boolean;
  disabled?: boolean;
  includeSpecial?: boolean;
  saringMode?: boolean;
}

function CategorySelectCell({
  value,
  options,
  onChange,
  isBold = false,
  disabled = false,
  includeSpecial = false,
  saringMode = false,
}: CategoryCellProps) {
  const isStale =
    Boolean(value) &&
    value !== 'NPO' &&
    !options.some(
      (opt) => opt.kodeItem.trim().toUpperCase() === value.trim().toUpperCase(),
    );
  return (
    <Select
      value={value || '__EMPTY__'}
      onValueChange={(val) => onChange(!val || val === '__EMPTY__' ? '' : val)}
      disabled={disabled}
    >
      <SelectTrigger
        className={`w-full h-9 px-2 text-xs bg-transparent border-0 rounded-none shadow-none hover:bg-black/5 dark:hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-primary transition-colors cursor-pointer data-[state=open]:bg-background ${
          isBold ? 'font-bold' : 'font-medium'
        }`}
      >
        <SelectValue placeholder='-'>
          {value === 'NPO' ? (
            <span className='font-mono font-bold text-foreground'>NPO</span>
          ) : value ? (
            <span
              className={`font-mono font-bold ${isStale ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}
              title={
                isStale
                  ? 'Nilai tersimpan tidak termasuk opsi mode ini — pilih ulang atau ganti Bentuk.'
                  : undefined
              }
            >
              {value}
              {isStale ? ' ⚠' : ''}
            </span>
          ) : (
            <span className='text-muted-foreground/40 font-normal'>-</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className='max-h-64 min-w-[180px] w-full z-50'>
        {includeSpecial && (
          <SelectItem value='NPO'>NPO / Puasa</SelectItem>
        )}
        <SelectItem
          value='__EMPTY__'
          className='text-xs text-muted-foreground italic cursor-pointer'
        >
          -- Kosong / Hapus --
        </SelectItem>

        <div className='px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 rounded-sm mb-1'>
          {saringMode ? 'Pilihan Saring' : 'Pilihan Standar'}
        </div>
        {options.length === 0 && (
          <div className='p-2 text-[11px] text-muted-foreground italic text-center'>
            {saringMode
              ? 'Tidak ada diet saring aktif — daftarkan di Konfigurasi Diet + centang Saring.'
              : 'Tidak ada pilihan standar'}
          </div>
        )}
        {options.filter((opt) => opt.kodeItem !== 'NPO').map((opt) => (
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
  allItems,
  options,
  siklusDietOptions = [],
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

  // Group master options by category dengan partisi Saring ketat.
  // Bentuk dari KARBO/BENTUK_MAKANAN. Hewani = union master HEWANI non-Saring +
  // tag HEWANI siklus (mode reguler) atau master HEWANI Saring (mode Saring).
  // Karbo/nabati/sayur/buah difilter flag Saring per mode; snack selalu normal.
  const bentukOptions = useMemo(
    () =>
      options.filter(
        (o) =>
          o.namaKategori === 'KARBO' || o.namaKategori === 'BENTUK_MAKANAN',
      ),
    [options],
  );

  const saringCodes = useMemo(() => getSaringDietCodes(options), [options]);

  const regulerKarbohidratOptions = useMemo(
    () => getMasterOptionsForKind(options, 'KARBOHIDRAT', false),
    [options],
  );
  const saringKarbohidratOptions = useMemo(
    () => getMasterOptionsForKind(options, 'KARBOHIDRAT', true),
    [options],
  );
  const regulerHewaniOptions = useMemo(
    () => hewaniMappingOptions(options, siklusDietOptions, false),
    [options, siklusDietOptions],
  );
  const saringHewaniOptions = useMemo(
    () => hewaniMappingOptions(options, siklusDietOptions, true),
    [options, siklusDietOptions],
  );
  const regulerNabatiOptions = useMemo(
    () => getMasterOptionsForKind(options, 'NABATI', false),
    [options],
  );
  const saringNabatiOptions = useMemo(
    () => getMasterOptionsForKind(options, 'NABATI', true),
    [options],
  );
  const regulerSayurOptions = useMemo(
    () => getMasterOptionsForKind(options, 'SAYUR', false),
    [options],
  );
  const saringSayurOptions = useMemo(
    () => getMasterOptionsForKind(options, 'SAYUR', true),
    [options],
  );
  const regulerBuahOptions = useMemo(
    () => getMasterOptionsForKind(options, 'BUAH', false),
    [options],
  );
  const saringBuahOptions = useMemo(
    () => getMasterOptionsForKind(options, 'BUAH', true),
    [options],
  );

  const snackOptions = useMemo(
    () => options.filter((o) => o.namaKategori === 'SNACK'),
    [options],
  );

  function optionsForRow(
    rowBentuk: string,
    reguler: KategoriMenuOption[],
    saring: KategoriMenuOption[],
  ) {
    return isBentukSaring(rowBentuk) ? saring : reguler;
  }

  // Kode bentuk yang berflag tugas AG Katering → otomatis masuk Live Katering
  const tugasKateringCodes = useMemo(
    () => getTugasKateringCodes(options),
    [options],
  );

  // Handle instant inline change of a single cell — DRAFT ONLY, NO AUTO-SAVE!
  function handleCellChange(
    diet_rs_raw: string,
    field: 'bentukMakanan' | 'karbohidrat' | 'hewani' | 'nabati' | 'sayur' | 'buah' | 'snack',
    value: string,
  ) {
    const item = allItems.find((entry) => entry.diet_rs_raw === diet_rs_raw);
    if (!item) return;
    const currentRow = rowStates[diet_rs_raw] || rowFromItem(item);

    if (field === 'bentukMakanan') {
      const next = applyBentukSaringTransition(
        currentRow,
        value,
        currentRow.bentukMakanan,
      );
      const wasSaring = isBentukSaring(currentRow.bentukMakanan);
      const cleared =
        wasSaring !== isBentukSaring(next.bentukMakanan) &&
        (currentRow.karbohidrat || currentRow.hewani || currentRow.nabati || currentRow.sayur || currentRow.buah) &&
        !next.karbohidrat && !next.hewani && !next.nabati && !next.sayur && !next.buah &&
        next.mode === 'STANDARD';
      setRowStates((prev) => ({
        ...prev,
        [diet_rs_raw]: {
          ...next,
          status: 'idle',
          isDirty: true,
        },
      }));
      if (cleared) {
        toast.info(
          isBentukSaring(next.bentukMakanan)
            ? 'Mode Saring: kolom Karbo/Hewani/Nabati/Sayur/Buah dikosongkan, pilih diet Saring.'
            : 'Keluar mode Saring: kolom Saring dikosongkan, pilih diet standar.',
        );
      }
      return;
    }

    const nextRow = { ...currentRow, [field]: value };
    const partitionErrors = validateSaringPartition(
      {
        karbohidrat: nextRow.karbohidrat,
        hewani: nextRow.hewani,
        nabati: nextRow.nabati,
        sayur: nextRow.sayur,
        buah: nextRow.buah,
      },
      saringCodes,
      isBentukSaring(nextRow.bentukMakanan),
    );
    if (partitionErrors.length > 0) {
      toast.error(partitionErrors[0]);
      return;
    }

    setRowStates((prev) => ({
      ...prev,
      [diet_rs_raw]: {
        ...nextRow,
        status: 'idle',
        isDirty: true,
      },
    }));
  }

  // Pending drafts across the active tab, including rows hidden by filters.
  const readyToConfirmRows: ReadyDietRow[] = useMemo(() => {
    const result: ReadyDietRow[] = [];
    for (const item of allItems) {
      const state = rowStates[item.diet_rs_raw];
      if (!state || !state.isDirty) continue;

      if (state.mode !== 'STANDARD' || hasFormFoodMapping(state)) {
        result.push({
          diet_rs_raw: item.diet_rs_raw,
          mode: state.mode,
          bentukMakanan: state.bentukMakanan,
          karbohidrat: state.karbohidrat,
          hewani: state.hewani,
          nabati: state.nabati,
          sayur: state.sayur,
          buah: state.buah,
          snack: state.snack,
          jumlahPasien: item.jumlah_pasien,
          isTugasKatering: isBentukTugasKatering(state.bentukMakanan, tugasKateringCodes),
        });
      }
    }
    return result;
  }, [allItems, rowStates, tugasKateringCodes]);

  const dirtyCount = useMemo(() => allItems.filter((item) => rowStates[item.diet_rs_raw]?.isDirty).length, [allItems, rowStates]);

  // Reset all uncommitted draft changes back to initial server values
  function handleResetDrafts() {
    setRowStates((prev) => {
      const next = { ...prev };
      allItems.forEach((item) => { delete next[item.diet_rs_raw]; });
      return next;
    });
    toast.info('Perubahan draft dibatalkan.');
  }

  // Final save invoked from Floating Bar confirmation dialog
  async function handleFinalConfirmSave() {
    if (readyToConfirmRows.length === 0) return;
    setIsSubmittingConfirm(true);

    try {
      const savedRaws: string[] = [];
      const failedRaws: string[] = [];
      for (const row of readyToConfirmRows) {
        const partitionErrors = validateSaringPartition(
          {
            karbohidrat: row.karbohidrat,
            hewani: row.hewani,
            nabati: row.nabati,
            sayur: row.sayur,
            buah: row.buah,
          },
          saringCodes,
          isBentukSaring(row.bentukMakanan),
        );
        if (partitionErrors.length > 0) {
          toast.error(`${row.diet_rs_raw}: ${partitionErrors[0]}`);
          failedRaws.push(row.diet_rs_raw);
          continue;
        }
        try {
          const res = await saveDietMapping({
            diet_rs_raw: row.diet_rs_raw,
            mode: row.mode || 'STANDARD',
            bentuk_makanan: row.bentukMakanan || null,
            karbohidrat: row.karbohidrat || null,
            kategori_diet: row.hewani || null,
            nabati: row.nabati || null,
            sayur: row.sayur || null,
            buah: row.buah || null,
            snack: row.snack || null,
            mapped_by: 'Admin Gizi',
          });
          if (res.success) savedRaws.push(row.diet_rs_raw);
          else failedRaws.push(row.diet_rs_raw);
        } catch {
          failedRaws.push(row.diet_rs_raw);
        }
      }

      if (savedRaws.length) toast.success(`${savedRaws.length} mapping diet berhasil disimpan.`);
      if (failedRaws.length) toast.error(`${failedRaws.length} mapping gagal: ${failedRaws.join(', ')}.`);
      setIsConfirmOpen(false);

      setRowStates((prev) => {
        const next = { ...prev };
        for (const raw of savedRaws) {
          if (next[raw]) next[raw] = { ...next[raw], status: 'saved', isDirty: false };
        }
        for (const raw of failedRaws) {
          if (next[raw]) next[raw] = { ...next[raw], status: 'error', isDirty: true };
        }
        return next;
      });

      if (savedRaws.length) {
        startTransition(() => onRefresh?.());
        broadcastProductionUpdate('SYNC_NOW', 'mapping-diet');
      }
    } catch (err) {
      console.error('Error confirming mappings:', err);
      toast.error('Gagal menyimpan konfirmasi mapping diet.');
    } finally {
      setIsSubmittingConfirm(false);
    }
  }

  if (allItems.length === 0) {
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
                  <span>BENTUK MAKANAN</span>
                  <Filter className='w-3 h-3 text-slate-400' />
                </div>
              </TableHead>

              <TableHead className='min-w-[125px] w-[135px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-center border-r border-slate-300 dark:border-slate-700 py-2.5'>
                KARBOHIDRAT
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
            {items.length === 0 && (
              <TableRow><TableCell colSpan={11} className='py-8 text-center text-xs text-muted-foreground'>Tidak ada diet yang cocok dengan filter. Draft di tab ini tetap dapat dikonfirmasi melalui tombol di bawah.</TableCell></TableRow>
            )}
            {items.map((item, idx) => {
              const isSelected = selectedRaws.includes(item.diet_rs_raw);
              const row = rowStates[item.diet_rs_raw] || rowFromItem(item);

              const isNpoRow = row.mode === 'NPO';
              const isSaringRow = isBentukSaring(row.bentukMakanan);

              // Baris teralihkan ke Live Katering: bentuk berflag tugas, atau data legacy 'KATERING'
              const isKateringRow =
                isBentukTugasKatering(row.bentukMakanan, tugasKateringCodes) ||
                isLegacyKateringMapping({
                  status_mapping: item.status_mapping,
                  bentuk_makanan: row.bentukMakanan,
                  kategori_diet: row.hewani,
                });

              const isComplete = isNpoRow || isKateringRow || hasFormFoodMapping(row);

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

                  {/* BENTUK MAKANAN Select Cell */}
                  <TableCell className='p-0 border-r border-slate-200 dark:border-slate-800 align-middle bg-[#ffe8ec]/60 dark:bg-[#381a22]/30 hover:bg-[#ffe8ec] dark:hover:bg-[#381a22]/50 transition-colors'>
                    <CategorySelectCell
                      value={row.bentukMakanan}
                      options={bentukOptions}
                      disabled={isSubmittingConfirm}
                      includeSpecial
                      onChange={(val) =>
                        handleCellChange(item.diet_rs_raw, 'bentukMakanan', val)
                      }
                      isBold
                    />
                  </TableCell>

                  {/* KARBOHIDRAT Select Cell */}
                  <TableCell className='p-0 border-r border-slate-200 dark:border-slate-800 align-middle bg-[#ffe8ec]/60 dark:bg-[#381a22]/30 hover:bg-[#ffe8ec] dark:hover:bg-[#381a22]/50 transition-colors'>
                    <CategorySelectCell
                      value={row.karbohidrat}
                      options={optionsForRow(row.bentukMakanan, regulerKarbohidratOptions, saringKarbohidratOptions)}
                      disabled={isSubmittingConfirm || row.mode !== 'STANDARD'}
                      saringMode={isSaringRow}
                      onChange={(val) => handleCellChange(item.diet_rs_raw, 'karbohidrat', val)}
                    />
                  </TableCell>

                  {/* HEWANI Select Cell */}
                  <TableCell className='p-0 border-r border-slate-200 dark:border-slate-800 align-middle bg-[#ffe8ec]/60 dark:bg-[#381a22]/30 hover:bg-[#ffe8ec] dark:hover:bg-[#381a22]/50 transition-colors'>
                    <CategorySelectCell
                      value={row.hewani}
                      options={optionsForRow(row.bentukMakanan, regulerHewaniOptions, saringHewaniOptions)}
                      disabled={isSubmittingConfirm || row.mode !== 'STANDARD'}
                      saringMode={isSaringRow}
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
                      options={optionsForRow(row.bentukMakanan, regulerNabatiOptions, saringNabatiOptions)}
                      disabled={isSubmittingConfirm || row.mode !== 'STANDARD'}
                      saringMode={isSaringRow}
                      onChange={(val) =>
                        handleCellChange(item.diet_rs_raw, 'nabati', val)
                      }
                    />
                  </TableCell>

                  {/* SAYUR Select Cell */}
                  <TableCell className='p-0 border-r border-slate-200 dark:border-slate-800 align-middle bg-[#ffe8ec]/60 dark:bg-[#381a22]/30 hover:bg-[#ffe8ec] dark:hover:bg-[#381a22]/50 transition-colors'>
                    <CategorySelectCell
                      value={row.sayur}
                      options={optionsForRow(row.bentukMakanan, regulerSayurOptions, saringSayurOptions)}
                      disabled={isSubmittingConfirm || row.mode !== 'STANDARD'}
                      saringMode={isSaringRow}
                      onChange={(val) =>
                        handleCellChange(item.diet_rs_raw, 'sayur', val)
                      }
                    />
                  </TableCell>

                  {/* BUAH Select Cell */}
                  <TableCell className='p-0 border-r border-slate-200 dark:border-slate-800 align-middle bg-[#ffe8ec]/60 dark:bg-[#381a22]/30 hover:bg-[#ffe8ec] dark:hover:bg-[#381a22]/50 transition-colors'>
                    <CategorySelectCell
                      value={row.buah}
                      options={optionsForRow(row.bentukMakanan, regulerBuahOptions, saringBuahOptions)}
                      disabled={isSubmittingConfirm || row.mode !== 'STANDARD'}
                      saringMode={isSaringRow}
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
                      disabled={isSubmittingConfirm || row.mode !== 'STANDARD'}
                      onChange={(val) =>
                        handleCellChange(item.diet_rs_raw, 'snack', val)
                      }
                    />
                  </TableCell>

                  {/* Status Indicator */}
                  <TableCell className='p-1 text-center align-middle border-r border-slate-200 dark:border-slate-800'>
                    {row.isDirty && row.status === 'error' ? (
                      <span className='text-[10px] font-semibold text-rose-600' title='Gagal menyimpan, coba konfirmasi lagi'>Gagal, coba lagi</span>
                    ) : row.isDirty ? (
                      isComplete ? (
                        <span
                          className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300'
                          title='Minimal satu jenis makanan terisi — siap dikonfirmasi'
                        >
                          Siap Simpan
                        </span>
                      ) : (
                        <span
                          className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground'
                          title='Isi minimal satu jenis makanan'
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
                      <span title='Mapping tersedia'>
                        <CheckCircle2 className='w-3.5 h-3.5 text-emerald-500/80 mx-auto' />
                      </span>
                    ) : (
                      <span title='Isi minimal satu jenis makanan'>
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
        dirtyCount={dirtyCount}
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
          readyToConfirmRows[0].mode
            ? readyToConfirmRows[0].mode
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
