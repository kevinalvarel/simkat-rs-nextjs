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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import type { MasterSiklusItem } from '@/servers/siklus-menu.service';
import { deleteMasterSiklus } from '@/servers/siklus-menu.service';
import { toast } from 'sonner';

interface DeleteCycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSiklus: number;
  availableCycles: MasterSiklusItem[];
  onSuccess: (deletedCycleNum: number) => void;
}

export default function DeleteCycleDialog({
  open,
  onOpenChange,
  currentSiklus,
  availableCycles,
  onSuccess,
}: DeleteCycleDialogProps) {
  const [selectedCycleNum, setSelectedCycleNum] = useState<number>(currentSiklus);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedCycleNum(currentSiklus);
    }
  }, [open, currentSiklus]);

  const targetCycleObj = availableCycles.find(
    (c) => c.nomor_siklus === selectedCycleNum,
  );

  const isOnlyOneCycle = availableCycles.length <= 1;

  async function handleDelete() {
    if (isOnlyOneCycle) {
      toast.error('Tidak dapat menghapus siklus terakhir yang ada di sistem.');
      return;
    }

    if (!selectedCycleNum) {
      toast.error('Pilih siklus yang ingin dihapus.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteMasterSiklus(selectedCycleNum);
      if (res.success) {
        toast.success(res.message);
        onSuccess(selectedCycleNum);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-6'>
        <DialogHeader className='gap-1 border-b pb-4'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='bg-destructive/10 text-destructive border-destructive/30 text-[11px]'
            >
              Hapus Siklus
            </Badge>
          </div>
          <DialogTitle className='text-lg font-bold tracking-tight flex items-center gap-2 text-destructive'>
            <Trash2 className='w-5 h-5 text-destructive' />
            Hapus Siklus Menu dari Sistem
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Pilih nomor siklus menu yang ingin dihapus dari master database
            beserta seluruh hidangannya.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-3'>
          {/* Cycle Selector */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold text-foreground'>
              Pilih Siklus yang akan Dihapus
            </Label>
            <Select
              value={String(selectedCycleNum)}
              onValueChange={(val) => setSelectedCycleNum(Number(val) || 1)}
            >
              <SelectTrigger className='w-full h-9 text-xs bg-background font-medium'>
                <SelectValue placeholder='Pilih siklus...' />
              </SelectTrigger>
              <SelectContent>
                {availableCycles.map((c) => (
                  <SelectItem
                    key={c.nomor_siklus}
                    value={String(c.nomor_siklus)}
                    className='text-xs'
                  >
                    {c.nama_siklus} (#{c.nomor_siklus})
                    {c.deskripsi ? ` — ${c.deskripsi}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warning Card */}
          <div className='p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2'>
            <div className='flex items-start gap-2.5'>
              <AlertTriangle className='w-4 h-4 text-destructive shrink-0 mt-0.5' />
              <div className='space-y-1 text-xs text-destructive'>
                <p className='font-bold'>
                  Perhatian: Data akan dihapus permanen!
                </p>
                <p className='text-[11px] leading-relaxed text-destructive/90'>
                  Menghapus{' '}
                  <strong>
                    {targetCycleObj?.nama_siklus || `Siklus #${selectedCycleNum}`}
                  </strong>{' '}
                  akan menghapus definisi nomor siklus dari tabel master dan
                  seluruh susunan menu hidangan (Pagi, Siang, Sore, Saring) yang
                  terdaftar di dalamnya.
                </p>
              </div>
            </div>
          </div>

          {isOnlyOneCycle && (
            <p className='text-[11px] text-amber-600 dark:text-amber-400 font-medium'>
              ⚠️ Sistem harus memiliki minimal 1 siklus menu. Anda tidak dapat
              menghapus siklus terakhir.
            </p>
          )}
        </div>

        <DialogFooter className='gap-2 pt-2 border-t'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Batal
          </Button>
          <Button
            type='button'
            variant='destructive'
            size='sm'
            onClick={handleDelete}
            disabled={isDeleting || isOnlyOneCycle}
            className='gap-1.5'
          >
            {isDeleting ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className='w-4 h-4' />
                Ya, Hapus Siklus #{selectedCycleNum}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
