'use client';

import React, { useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, UtensilsCrossed, Loader2 } from 'lucide-react';
import {
  KategoriMenuItem,
  createKategoriMenuItem,
  updateKategoriMenuItem,
} from '@/servers/konfigurasi-menu.service';
import { toast } from 'sonner';

interface MenuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit: KategoriMenuItem | null;
  onSuccess: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'BENTUK_MAKANAN', label: 'BENTUK MAKANAN' },
  { value: 'HEWANI', label: 'HEWANI' },
  { value: 'NABATI', label: 'NABATI' },
  { value: 'SAYUR', label: 'SAYUR' },
  { value: 'BUAH', label: 'BUAH' },
  { value: 'SNACK', label: 'SNACK' },
];

const STATUS_OPTIONS = [
  { value: 'true', label: '🟢 Aktif (Tampil di Mapping)' },
  { value: 'false', label: '🔴 Non-Aktif (Disembunyikan)' },
];

const MenuSchema = z
  .object({
    nama_kategori: z.string().min(1, 'Kategori menu wajib dipilih.'),
    kode_item: z
      .string()
      .min(1, 'Kode item wajib diisi.')
      .max(15, 'Maksimal 15 karakter.'),
    label_item: z.string().min(2, 'Label item minimal 2 karakter.'),
    is_active: z.boolean(),
    is_tugas_ag_katering: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (val.is_tugas_ag_katering && val.nama_kategori !== 'BENTUK_MAKANAN') {
      ctx.addIssue({
        code: 'custom',
        path: ['is_tugas_ag_katering'],
        message: 'Tugas AG Katering hanya berlaku untuk Bentuk Makanan.',
      });
    }
  });

type MenuFormValues = z.infer<typeof MenuSchema>;

export default function MenuFormDialog({
  open,
  onOpenChange,
  itemToEdit,
  onSuccess,
}: MenuFormDialogProps) {
  const isEdit = Boolean(itemToEdit);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MenuFormValues>({
    resolver: zodResolver(MenuSchema),
    defaultValues: {
      nama_kategori: '',
      kode_item: '',
      label_item: '',
      is_active: true,
      is_tugas_ag_katering: false,
    },
  });

  const watchedKategori = useWatch({ control, name: 'nama_kategori' });
  const isBentukMakanan = watchedKategori === 'BENTUK_MAKANAN';

  useEffect(() => {
    if (open) {
      if (itemToEdit) {
        reset({
          nama_kategori: itemToEdit.nama_kategori,
          kode_item: itemToEdit.kode_item,
          label_item: itemToEdit.label_item,
          is_active: itemToEdit.is_active,
          is_tugas_ag_katering: itemToEdit.is_tugas_ag_katering ?? false,
        });
      } else {
        reset({
          nama_kategori: '',
          kode_item: '',
          label_item: '',
          is_active: true,
          is_tugas_ag_katering: false,
        });
      }
    }
  }, [open, itemToEdit, reset]);

  // Tugas AG Katering hanya relevan untuk Bentuk Makanan — reset saat kategori diganti.
  useEffect(() => {
    if (!isBentukMakanan) {
      setValue('is_tugas_ag_katering', false, { shouldValidate: false });
    }
  }, [isBentukMakanan, setValue]);

  async function onSubmit(data: MenuFormValues) {
    const payload = {
      ...data,
      is_tugas_ag_katering:
        data.nama_kategori === 'BENTUK_MAKANAN'
          ? data.is_tugas_ag_katering
          : false,
    };
    try {
      if (isEdit && itemToEdit) {
        const res = await updateKategoriMenuItem(itemToEdit.id, payload);
        if (res.success) {
          toast.success(res.message);
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await createKategoriMenuItem(payload);
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
      toast.error('Gagal menyimpan menu item.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-6'>
        <DialogHeader className='gap-1 border-b pb-4'>
          <DialogTitle className='text-lg font-bold tracking-tight flex items-center gap-2'>
            <UtensilsCrossed className='w-5 h-5 text-primary' />
            {isEdit ? 'Edit Master Item Menu' : 'Tambah Master Item Menu Baru'}
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Isi rincian kategori, kode unik item, dan label tampilan menu
            katering.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 py-2'>
          {/* Kategori Menu */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold'>
              Kategori Menu <span className='text-rose-500'>*</span>
            </Label>
            <Controller
              name='nama_kategori'
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => val && field.onChange(val)}
                >
                  <SelectTrigger className='w-full h-9 text-xs bg-background'>
                    <SelectValue placeholder='Pilih kategori menu...'>
                      {field.value
                        ? CATEGORY_OPTIONS.find(
                            (opt) => opt.value === field.value,
                          )?.label || field.value
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.nama_kategori && (
              <p className='text-[11px] text-destructive'>
                {errors.nama_kategori.message}
              </p>
            )}
          </div>

          {/* Tugas AG Katering — hanya untuk Bentuk Makanan */}
          {isBentukMakanan && (
            <div className='rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] p-3'>
              <Controller
                name='is_tugas_ag_katering'
                control={control}
                render={({ field }) => (
                  <div className='flex items-start gap-2.5'>
                    <Checkbox
                      id='tugas-ag-katering'
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                      className='mt-0.5'
                    />
                    <div className='space-y-0.5'>
                      <Label
                        htmlFor='tugas-ag-katering'
                        className='text-xs font-semibold cursor-pointer'
                      >
                        Tugas AG Katering
                      </Label>
                      <p className='text-[11px] text-muted-foreground leading-snug'>
                        Centang jika item Bentuk Makanan ini dikerjakan oleh AG
                        Katering.
                      </p>
                    </div>
                  </div>
                )}
              />
              {errors.is_tugas_ag_katering && (
                <p className='text-[11px] text-destructive mt-1.5'>
                  {errors.is_tugas_ag_katering.message}
                </p>
              )}
            </div>
          )}

          {/* Kode Item */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold'>
              Kode Item <span className='text-rose-500'>*</span>
            </Label>
            <Input
              {...register('kode_item')}
              placeholder='mis. AYM-G, BN'
              className='h-9 text-xs font-mono font-bold uppercase'
            />
            {errors.kode_item && (
              <p className='text-[11px] text-destructive'>
                {errors.kode_item.message}
              </p>
            )}
          </div>

          {/* Label Item */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold'>
              Label Item Menu <span className='text-rose-500'>*</span>
            </Label>
            <Input
              {...register('label_item')}
              placeholder='mis. Ayam Ungkep Goreng, Nasi Biasa'
              className='h-9 text-xs'
            />
            {errors.label_item && (
              <p className='text-[11px] text-destructive'>
                {errors.label_item.message}
              </p>
            )}
          </div>

          {/* Status Aktif */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold'>Status Item</Label>
            <Controller
              name='is_active'
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? 'true' : 'false'}
                  onValueChange={(val) => field.onChange(val === 'true')}
                >
                  <SelectTrigger className='w-full h-9 text-xs bg-background'>
                    <SelectValue placeholder='Pilih status...'>
                      {STATUS_OPTIONS.find(
                        (opt) => opt.value === (field.value ? 'true' : 'false'),
                      )?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
                  {isEdit ? 'Update Menu' : 'Simpan Menu'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
