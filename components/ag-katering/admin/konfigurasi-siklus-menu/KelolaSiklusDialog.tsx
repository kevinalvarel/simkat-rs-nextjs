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
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';
import { getWibHari, getWibTodayKey } from '@/lib/wib';
import {
  Settings2,
  Loader2,
  Save,
  Trash2,
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronDown,
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

export default function KelolaSiklusDialog({
  open,
  onOpenChange,
  cycle,
  onSuccessUpdate,
  onSuccessDelete,
}: KelolaSiklusDialogProps) {
  const [namaSiklus, setNamaSiklus] = useState('');
  const [tanggal, setTanggal] = useState<Date | undefined>(undefined);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [deskripsi, setDeskripsi] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open && cycle) {
      const timer = setTimeout(() => {
        setNamaSiklus(cycle.nama_siklus);
        if (cycle.tanggal) {
          const parsed = parseISO(cycle.tanggal);
          setTanggal(isValid(parsed) ? parsed : new Date());
        } else {
          setTanggal(new Date());
        }
        setDeskripsi(cycle.deskripsi || '');
        setIsConfirmDeleteOpen(false);
      }, 0);
      return () => clearTimeout(timer);
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
      const isoDate = tanggal ? getWibTodayKey(tanggal) : null;
      const assignedDay = isoDate ? getWibHari(isoDate) : null;

      const res = await updateMasterSiklus(cycle.nomor_siklus, {
        nama_siklus: namaSiklus.trim(),
        tanggal: isoDate,
        hari: assignedDay,
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
              Sesuaikan label penamaan, tanggal rotasi, keterangan, atau hapus
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
                <Label className='text-xs font-semibold'>Tanggal Rotasi</Label>
                <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                  <PopoverTrigger
                    type='button'
                    className='flex items-center justify-between w-full h-9 px-3 text-xs bg-background font-medium border rounded-md shadow-2xs cursor-pointer hover:bg-muted/80 select-none'
                  >
                    <span className='flex items-center gap-1.5 truncate'>
                      <CalendarIcon className='w-3.5 h-3.5 text-primary shrink-0' />
                      {tanggal
                        ? format(tanggal, 'd MMM yyyy', { locale: id })
                        : 'Pilih tanggal...'}
                    </span>
                    <ChevronDown className='w-3 h-3 text-muted-foreground opacity-70 shrink-0' />
                  </PopoverTrigger>
                  <PopoverContent
                    align='start'
                    side='bottom'
                    sideOffset={4}
                    className='w-auto p-0 rounded-2xl shadow-xl border border-border bg-popover text-popover-foreground overflow-hidden z-50'
                  >
                    <Calendar
                      mode='single'
                      selected={tanggal}
                      onSelect={(d) => {
                        if (d) {
                          setTanggal(d);
                          setIsDateOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
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
