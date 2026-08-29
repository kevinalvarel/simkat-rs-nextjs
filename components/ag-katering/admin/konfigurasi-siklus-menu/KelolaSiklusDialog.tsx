'use client';

import React, { useState, useEffect } from 'react';
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
import {
  Settings2,
  Loader2,
  Save,
  Trash2,
  AlertTriangle,
  CalendarDays,
} from 'lucide-react';
import type { MasterSiklusItem } from '@/servers/siklus-menu.service';
import {
  updateMasterSiklus,
  deleteMasterSiklus,
} from '@/servers/siklus-menu.service';
import { toast } from 'sonner';

interface KelolaSiklusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: MasterSiklusItem | null;
  onSuccessUpdate: () => void;
  onSuccessDelete: (deletedCycleNum: number) => void;
}

const HARI_OPTIONS = [
  'SENIN',
  'SELASA',
  'RABU',
  'KAMIS',
  'JUMAT',
  'SABTU',
  'MINGGU',
];

export default function KelolaSiklusDialog({
  open,
  onOpenChange,
  cycle,
  onSuccessUpdate,
  onSuccessDelete,
}: KelolaSiklusDialogProps) {
  const [namaSiklus, setNamaSiklus] = useState('');
  const [hari, setHari] = useState('SENIN');
  const [deskripsi, setDeskripsi] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open && cycle) {
      setNamaSiklus(cycle.nama_siklus);
      setHari(cycle.hari || 'SENIN');
      setDeskripsi(cycle.deskripsi || '');
      setIsConfirmDeleteOpen(false);
    }
  }, [open, cycle]);

  if (!cycle) return null;

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!namaSiklus.trim()) {
      toast.error('Nama siklus tidak boleh kosong.');
      return;
    }

    if (!cycle) return;

    setIsUpdating(true);
    try {
      const res = await updateMasterSiklus(cycle.nomor_siklus, {
        nama_siklus: namaSiklus.trim(),
        hari: hari || null,
        deskripsi: deskripsi.trim() || null,
      });

      if (res.success) {
        toast.success(res.message);
        onSuccessUpdate();
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error('Error updating cycle:', err);
      toast.error('Gagal memperbarui siklus menu.');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete() {
    if (!cycle) return;

    setIsDeleting(true);
    try {
      const res = await deleteMasterSiklus(cycle.nomor_siklus);
      if (res.success) {
        toast.success(res.message);
        onSuccessDelete(cycle.nomor_siklus);
        setIsConfirmDeleteOpen(false);
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error('Error deleting cycle:', err);
      toast.error('Gagal menghapus siklus menu.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-md p-6'>
          <DialogHeader className='gap-1 border-b pb-4'>
            <div className='flex items-center gap-2'>
              <Badge
                variant='outline'
                className='bg-primary/10 text-primary border-primary/30 text-[11px] font-mono'
              >
                Siklus #{cycle.nomor_siklus}
              </Badge>
            </div>
            <DialogTitle className='text-lg font-bold tracking-tight flex items-center gap-2'>
              <Settings2 className='w-5 h-5 text-primary' />
              Pengaturan Siklus Menu
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Sesuaikan label penamaan, hari rotasi, keterangan, atau hapus
              siklus dari sistem.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className='space-y-4 py-3'>
            <div className='grid grid-cols-3 gap-3'>
              <div className='col-span-2 space-y-1.5'>
                <Label className='text-xs font-semibold'>
                  Label / Nama Siklus <span className='text-rose-500'>*</span>
                </Label>
                <Input
                  value={namaSiklus}
                  onChange={(e) => setNamaSiklus(e.target.value)}
                  placeholder='mis. Siklus 1, Siklus Tgl 31'
                  className='h-9 text-xs'
                  required
                />
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold'>Hari Rotasi</Label>
                <Select
                  value={hari}
                  onValueChange={(val) => val && setHari(val)}
                >
                  <SelectTrigger className='h-9 text-xs bg-background font-medium'>
                    <SelectValue placeholder='Pilih hari...' />
                  </SelectTrigger>
                  <SelectContent>
                    {HARI_OPTIONS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>
                Deskripsi / Catatan Rotasi
              </Label>
              <Input
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder='contoh: Menu makanan rotasi tanggal 1, 11, 21, 31'
                className='h-9 text-xs'
              />
            </div>


            {/* Danger Zone */}
            <div className='p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-bold text-destructive flex items-center gap-1.5'>
                  <AlertTriangle className='w-3.5 h-3.5' />
                  Hapus Siklus dari Sistem
                </span>
              </div>
              <p className='text-[11px] text-muted-foreground leading-relaxed'>
                Menghapus siklus #{cycle.nomor_siklus} akan menghapus nomor
                siklus dari master dan seluruh hidangan yang ada di dalamnya.
              </p>
              <Button
                type='button'
                variant='destructive'
                size='xs'
                onClick={() => setIsConfirmDeleteOpen(true)}
                className='gap-1 text-xs'
              >
                <Trash2 className='w-3 h-3' />
                Hapus Siklus #{cycle.nomor_siklus}
              </Button>
            </div>

            <DialogFooter className='gap-2 pt-2 border-t'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => onOpenChange(false)}
                disabled={isUpdating}
              >
                Batal
              </Button>
              <Button
                type='submit'
                size='sm'
                disabled={isUpdating}
                className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground'
              >
                {isUpdating ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className='w-4 h-4' />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nested Confirm Delete Modal */}
      <Dialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <DialogContent className='sm:max-w-md p-6'>
          <DialogHeader className='gap-2'>
            <div className='p-3 rounded-full bg-rose-500/10 text-rose-600 w-fit'>
              <Trash2 className='w-6 h-6' />
            </div>
            <DialogTitle className='text-base font-bold'>
              Hapus Permanen Siklus #{cycle.nomor_siklus}?
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Tindakan ini akan menghapus <strong>{cycle.nama_siklus}</strong>{' '}
              beserta seluruh daftar hidangan makanan di dalamnya dari master
              database. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 pt-2 border-t'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsConfirmDeleteOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Siklus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
