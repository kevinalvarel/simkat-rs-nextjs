'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  { value: 'KARBO', label: '🌾 KARBO (Karbohidrat)' },
  { value: 'HEWANI', label: '🍗 HEWANI (Lauk Hewani)' },
  { value: 'NABATI', label: '🫘 NABATI (Lauk Nabati)' },
  { value: 'SAYUR', label: '🥦 SAYUR (Sayur Mayur)' },
  { value: 'BUAH', label: '🍊 BUAH (Buah Segar)' },
  { value: 'SNACK', label: '🍪 SNACK (Makanan Selingan)' },
  { value: 'EXTRA', label: '🥛 EXTRA (Extra Makanan)' },
];

const MenuSchema = z.object({
  nama_kategori: z.string().min(1, 'Kategori menu wajib dipilih.'),
  kode_item: z
    .string()
    .min(1, 'Kode item wajib diisi.')
    .max(15, 'Maksimal 15 karakter.'),
  label_item: z.string().min(2, 'Label item minimal 2 karakter.'),
  urutan: z.number().min(0, 'Urutan minimal 0.'),
  is_active: z.boolean(),
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
    formState: { errors, isSubmitting },
  } = useForm<MenuFormValues>({
    resolver: zodResolver(MenuSchema),
    defaultValues: {
      nama_kategori: 'KARBO',
      kode_item: '',
      label_item: '',
      urutan: 1,
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (itemToEdit) {
        reset({
          nama_kategori: itemToEdit.nama_kategori,
          kode_item: itemToEdit.kode_item,
          label_item: itemToEdit.label_item,
          urutan: itemToEdit.urutan,
          is_active: itemToEdit.is_active,
        });
      } else {
        reset({
          nama_kategori: 'KARBO',
          kode_item: '',
          label_item: '',
          urutan: 1,
          is_active: true,
        });
      }
    }
  }, [open, itemToEdit, reset]);

  async function onSubmit(data: MenuFormValues) {
    try {
      if (isEdit && itemToEdit) {
        const res = await updateKategoriMenuItem(itemToEdit.id, data);
        if (res.success) {
          toast.success(res.message);
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await createKategoriMenuItem(data);
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
                    <SelectValue placeholder='Pilih kategori menu...' />
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

          {/* Kode Item & Urutan */}
          <div className='grid grid-cols-2 gap-3'>
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

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>Urutan Tampil</Label>
              <Input
                type='number'
                {...register('urutan', { valueAsNumber: true })}
                placeholder='1'
                className='h-9 text-xs font-mono'
              />
              {errors.urutan && (
                <p className='text-[11px] text-destructive'>
                  {errors.urutan.message}
                </p>
              )}
            </div>
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
                    <SelectValue placeholder='Pilih status...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='true'>
                      🟢 Aktif (Tampil di Mapping)
                    </SelectItem>
                    <SelectItem value='false'>
                      🔴 Non-Aktif (Disembunyikan)
                    </SelectItem>
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
