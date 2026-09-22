'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, UtensilsCrossed, Loader2, Tag, X } from 'lucide-react';
import {
  getMenuTagOptions,
  normalizeMenuTags,
  parseMenuTags,
  countUniqueMenuTags,
  type MenuTagOption,
} from '@/lib/siklus-menu-tags';
import type {
  SiklusMenuItem,
  MasterSiklusItem,
} from '@/servers/siklus-menu.service';
import {
  createSiklusMenuItem,
  updateSiklusMenuItem,
} from '@/servers/siklus-menu.service';
import { toast } from 'sonner';

interface SiklusItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit: SiklusMenuItem | null;
  defaultSlot?: {
    siklus_ke?: number;
    kelas?: string;
    jenis_makanan?: string;
    waktu_makan?: string;
  } | null;
  dietOptions?: MenuTagOption[];
  availableCycles?: MasterSiklusItem[] | number[];
  kelasOptions?: string[];
  onSuccess: () => void;
}

/** Opsi kanonis — "Semua Kelas" wildcard + kelas dari sistem (DB). */
const KELAS_FALLBACK_LIST = ['KELAS I', 'KELAS II', 'KELAS III'];

const JENIS_MAKANAN_OPTIONS = [
  { value: 'HEWANI', label: 'HEWANI (Lauk Hewani)' },
  { value: 'NABATI', label: 'NABATI (Lauk Nabati)' },
  { value: 'SAYUR', label: 'SAYUR (Sayur Mayur)' },
  { value: 'SARING', label: 'SARING (Makanan Saring / Lunak)' },
  { value: 'BUAH', label: 'BUAH (Buah Pagi / Siang)' },
  { value: 'SNACK', label: 'SNACK (Snack Pagi / Siang)' },
];

const WAKTU_MAKAN_OPTIONS = [
  { value: 'PAGI', label: 'PAGI' },
  { value: 'SIANG', label: 'SIANG' },
  { value: 'SORE', label: 'SORE' },
  { value: 'SARING', label: 'SARING' },
];

const ItemSchema = z.object({
  siklus_ke: z.number().min(1, 'Siklus minimal 1.'),
  kelas: z.string().min(1, 'Kelas wajib dipilih.'),
  jenis_makanan: z.string().min(1, 'Jenis makanan wajib dipilih.'),
  waktu_makan: z.string().min(1, 'Waktu makan wajib dipilih.'),
  nama_makanan: z.string().min(2, 'Nama makanan minimal 2 karakter.'),
  kategori_menu: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
}).refine(
  (value) => value.jenis_makanan !== 'BUAH' || ['PAGI', 'SIANG'].includes(value.waktu_makan),
  { path: ['waktu_makan'], message: 'Buah hanya tersedia untuk Pagi dan Siang.' },
);

type ItemFormValues = z.infer<typeof ItemSchema>;

export default function SiklusItemDialog({
  open,
  onOpenChange,
  itemToEdit,
  defaultSlot,
  dietOptions = [],
  availableCycles = [],
  kelasOptions = [],
  onSuccess,
}: SiklusItemDialogProps) {
  const kelasSelectOptions = useMemo(() => {
    const fromSystem =
      kelasOptions.length > 0 ? kelasOptions : KELAS_FALLBACK_LIST;
    const set = new Set<string>(['Semua Kelas', ...fromSystem]);
    if (itemToEdit?.kelas) set.add(itemToEdit.kelas);
    if (defaultSlot?.kelas) set.add(defaultSlot.kelas);
    return Array.from(set).map((v) => ({
      value: v,
      label: v === 'Semua Kelas' ? 'Semua Kelas (semua kelas)' : v,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasOptions, itemToEdit, defaultSlot]);
  const isEdit = Boolean(itemToEdit);

  const cycleOptions = useMemo<{ value: number; label: string }[]>(() => {
    if (availableCycles && availableCycles.length > 0) {
      return availableCycles.map((c) => {
        if (typeof c === 'number') {
          return { value: c, label: `Siklus ${c}` };
        }
        return { value: c.nomor_siklus, label: c.nama_siklus };
      });
    }
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => ({
      value: num,
      label: `Siklus ${num}`,
    }));
  }, [availableCycles]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(ItemSchema),
    defaultValues: {
      siklus_ke: 1,
      kelas: 'Semua Kelas',
      jenis_makanan: 'HEWANI',
      waktu_makan: 'PAGI',
      nama_makanan: '',
      kategori_menu: '',
      catatan: '',
    },
  });

  const selectedTagsString = useWatch({ control, name: 'kategori_menu' }) || '';
  const selectedJenis = useWatch({ control, name: 'jenis_makanan' });
  const selectedWaktu = useWatch({ control, name: 'waktu_makan' });
  const currentTags = parseMenuTags(selectedTagsString);
  const tagCount = countUniqueMenuTags(selectedTagsString);
  const availableTags = getMenuTagOptions(dietOptions, selectedJenis);
  const { invalid: invalidTags } = normalizeMenuTags(selectedTagsString, availableTags);

  useEffect(() => {
    if (open) {
      if (itemToEdit) {
        reset({
          siklus_ke: itemToEdit.siklus_ke,
          kelas: itemToEdit.kelas,
          jenis_makanan: itemToEdit.jenis_makanan,
          waktu_makan: itemToEdit.waktu_makan,
          nama_makanan: itemToEdit.nama_makanan,
          kategori_menu: itemToEdit.kategori_menu || '',
          catatan: itemToEdit.catatan || '',
        });
      } else {
        reset({
          siklus_ke: defaultSlot?.siklus_ke ?? 1,
          kelas: defaultSlot?.kelas ?? 'Semua Kelas',
          jenis_makanan: defaultSlot?.jenis_makanan ?? 'HEWANI',
          waktu_makan: defaultSlot?.waktu_makan ?? 'PAGI',
          nama_makanan: '',
          kategori_menu: '',
          catatan: '',
        });
      }
    }
  }, [open, itemToEdit, defaultSlot, reset]);

  function handleToggleTag(tag: string) {
    let nextTags: string[];
    if (currentTags.some((current) => current.toUpperCase() === tag.toUpperCase())) {
      nextTags = currentTags.filter((current) => current.toUpperCase() !== tag.toUpperCase());
    } else {
      nextTags = [...currentTags, tag];
    }
    const nextValue = nextTags.join(', ');
    setValue('kategori_menu', nextValue, { shouldDirty: true, shouldValidate: true });
  }

  function handleRemoveTag(tag: string) {
    const nextValue = currentTags.filter((current) => current !== tag).join(', ');
    setValue('kategori_menu', nextValue, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(data: ItemFormValues) {
    if (normalizeMenuTags(data.kategori_menu, getMenuTagOptions(dietOptions, data.jenis_makanan)).invalid.length) {
      toast.error('Hapus tag yang tidak tersedia untuk jenis makanan ini.');
      return;
    }
    try {
      if (isEdit && itemToEdit) {
        const res = await updateSiklusMenuItem(itemToEdit.id, data);
        if (res.success) {
          toast.success(res.message);
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await createSiklusMenuItem(data);
        if (res.success) {
          toast.success(res.message);
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(res.message);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan hidangan siklus menu.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='gap-1 border-b pb-4'>
          <DialogTitle className='text-lg font-bold tracking-tight flex items-center gap-2'>
            <UtensilsCrossed className='w-5 h-5 text-primary' />
            {isEdit
              ? 'Edit Hidangan Siklus Menu'
              : 'Tambah Hidangan ke Siklus Menu'}
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Tentukan nama hidangan, kategori diet (mis. B, DM, RG), waktu makan,
            dan kelas pasien.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 py-2'>
          {/* Siklus & Waktu Makan */}
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>
                Siklus Ke- <span className='text-rose-500'>*</span>
              </Label>
              <Controller
                name='siklus_ke'
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value || 1)}
                    onValueChange={(val) => val && field.onChange(Number(val))}
                  >
                    <SelectTrigger className='w-full h-9 text-xs bg-background font-medium'>
                      <SelectValue placeholder='Pilih siklus...' />
                    </SelectTrigger>
                    <SelectContent>
                      {cycleOptions.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.siklus_ke && (
                <p className='text-[11px] text-destructive'>
                  {errors.siklus_ke.message}
                </p>
              )}
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>
                Waktu Makan <span className='text-rose-500'>*</span>
              </Label>
              <Controller
                name='waktu_makan'
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => val && field.onChange(val)}
                  >
                    <SelectTrigger className='w-full h-9 text-xs bg-background'>
                      <SelectValue placeholder='Pilih waktu makan...' />
                    </SelectTrigger>
                    <SelectContent>
                      {WAKTU_MAKAN_OPTIONS.filter((opt) =>
                        selectedJenis !== 'BUAH' || opt.value === 'PAGI' || opt.value === 'SIANG',
                      ).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.waktu_makan && (
                <p className='text-[11px] text-destructive'>{errors.waktu_makan.message}</p>
              )}
            </div>
          </div>

          {/* Kelas & Jenis Makanan */}
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>
                Kelas Perawatan <span className='text-rose-500'>*</span>
              </Label>
              <Controller
                name='kelas'
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => val && field.onChange(val)}
                  >
                    <SelectTrigger className='w-full h-9 text-xs bg-background'>
                      <SelectValue placeholder='Pilih kelas...' />
                    </SelectTrigger>
                    <SelectContent>
                      {kelasSelectOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>
                Jenis Makanan <span className='text-rose-500'>*</span>
              </Label>
              <Controller
                name='jenis_makanan'
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      if (!val || val === field.value) return;
                      const nextOptions = getMenuTagOptions(dietOptions, val);
                      const retained = normalizeMenuTags(selectedTagsString, nextOptions).codes;
                      const retainedValue = retained.join(', ');
                      field.onChange(val);
                      setValue('kategori_menu', retainedValue, { shouldDirty: true, shouldValidate: true });
                      if (val === 'BUAH' && selectedWaktu !== 'PAGI' && selectedWaktu !== 'SIANG') {
                        setValue('waktu_makan', 'PAGI', { shouldDirty: true, shouldValidate: true });
                      }
                    }}
                  >
                    <SelectTrigger className='w-full h-9 text-xs bg-background'>
                      <SelectValue placeholder='Pilih jenis...' />
                    </SelectTrigger>
                    <SelectContent>
                      {JENIS_MAKANAN_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Nama Makanan */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold'>
              Nama Makanan / Hidangan <span className='text-rose-500'>*</span>
            </Label>
            <Input
              {...register('nama_makanan')}
              placeholder='contoh: Telur Puyuh BB Kecap, Ayam Fillet Panggang'
              className='h-9 text-xs'
            />
            {errors.nama_makanan && (
              <p className='text-[11px] text-destructive'>
                {errors.nama_makanan.message}
              </p>
            )}
          </div>

          {/* Tag Kategori Menu / Diet */}
          <div className='space-y-2 bg-muted/40 p-3 rounded-xl border'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold flex items-center gap-1.5'>
                <Tag className='w-3.5 h-3.5 text-primary' />
                Kategori Menu / Tag Diet Pasien
              </Label>
              <span className='text-[11px] text-muted-foreground'>
                Klik tag untuk memilih
              </span>
            </div>

            {/* Quick Clickable Tag Chips */}
            <div className='flex flex-wrap gap-1.5 max-h-28 overflow-y-auto py-1'>
              {availableTags.map((option) => {
                const isSelected = currentTags.some((tag) => tag.toUpperCase() === option.kode.toUpperCase());
                return (
                  <button
                    key={option.kode}
                    type='button'
                    onClick={() => handleToggleTag(option.kode)}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    {option.kode} · {option.label}
                  </button>
                );
              })}
            </div>

            {availableTags.length === 0 && (
              <p className='text-[11px] text-muted-foreground'>
                Belum ada tag aktif untuk kategori {selectedJenis}. Tambahkan di Konfigurasi Master Menu.
              </p>
            )}
            {invalidTags.length > 0 && (
              <div className='space-y-1.5'>
                <p className='text-[11px] text-destructive'>Tag lama berikut tidak tersedia untuk kategori ini. Hapus sebelum menyimpan.</p>
                <div className='flex flex-wrap gap-1.5'>
                  {invalidTags.map((tag) => (
                    <Badge key={tag} variant='destructive' className='gap-1'>
                      {tag}
                      <button type='button' onClick={() => handleRemoveTag(tag)} aria-label={`Hapus tag ${tag}`}>
                        <X className='w-3 h-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <p className='text-[11px] text-muted-foreground'>
              Kode tersimpan: {selectedTagsString || 'Tanpa tag'}
              {tagCount > 1
                ? ` — ${tagCount} tag, otomatis dianggap diet gabungan.`
                : tagCount === 1
                  ? ' — boleh tambah tag lain untuk diet gabungan.'
                  : ''}
            </p>
          </div>

          {/* Catatan Khusus */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold'>Catatan Khusus</Label>
            <Input
              {...register('catatan')}
              placeholder='contoh: *ptg dadu, fillet, Cetak D'
              className='h-9 text-xs'
            />
          </div>

          <DialogFooter className='gap-2 pt-3 border-t'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type='submit'
              size='sm'
              disabled={isSubmitting}
              className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4' />
                  {isEdit ? 'Update Hidangan' : 'Simpan Hidangan'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
