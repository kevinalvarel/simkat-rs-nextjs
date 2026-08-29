'use client';

import React, { useState } from 'react';
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
import { Copy, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { duplicateSiklus } from '@/servers/siklus-menu.service';
import { toast } from 'sonner';

interface DuplicateSiklusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSiklus: number;
  availableSiklusList: number[];
  onSuccess: (targetSiklus: number) => void;
}

export default function DuplicateSiklusDialog({
  open,
  onOpenChange,
  currentSiklus,
  availableSiklusList,
  onSuccess,
}: DuplicateSiklusDialogProps) {
  const [fromSiklus, setFromSiklus] = useState<number>(currentSiklus);
  const [toSiklus, setToSiklus] = useState<number>(currentSiklus + 1);
  const [isCopying, setIsCopying] = useState(false);

  React.useEffect(() => {
    if (open) {
      setFromSiklus(currentSiklus);
      setToSiklus(currentSiklus === 10 ? 1 : currentSiklus + 1);
    }
  }, [open, currentSiklus]);

  async function handleDuplicate() {
    if (fromSiklus === toSiklus) {
      toast.error('Siklus sumber dan tujuan tidak boleh sama.');
      return;
    }

    setIsCopying(true);
    try {
      const res = await duplicateSiklus(fromSiklus, toSiklus);
      if (res.success) {
        toast.success(res.message);
        onSuccess(toSiklus);
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menduplikasi siklus menu.');
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-6'>
        <DialogHeader className='gap-1 border-b pb-4'>
          <DialogTitle className='text-lg font-bold tracking-tight flex items-center gap-2'>
            <Copy className='w-5 h-5 text-primary' />
            Duplikasi Siklus Menu
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Salin seluruh susunan hidangan dari satu siklus ke nomor siklus lainnya secara instan.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-3'>
          <div className='flex items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border'>
            {/* From */}
            <div className='space-y-1.5 flex-1'>
              <Label className='text-xs font-semibold text-muted-foreground'>
                Siklus Sumber
              </Label>
              <div className='relative'>
                <Input
                  type='number'
                  min={1}
                  max={31}
                  value={fromSiklus}
                  onChange={(e) => setFromSiklus(parseInt(e.target.value) || 1)}
                  className='h-10 text-center font-mono font-bold text-base bg-background'
                />
              </div>
            </div>

            <div className='pt-5 text-muted-foreground'>
              <ArrowRight className='w-5 h-5' />
            </div>

            {/* To */}
            <div className='space-y-1.5 flex-1'>
              <Label className='text-xs font-semibold text-muted-foreground'>
                Siklus Tujuan
              </Label>
              <div className='relative'>
                <Input
                  type='number'
                  min={1}
                  max={31}
                  value={toSiklus}
                  onChange={(e) => setToSiklus(parseInt(e.target.value) || 1)}
                  className='h-10 text-center font-mono font-bold text-base bg-background border-primary'
                />
              </div>
            </div>
          </div>

          <div className='p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5'>
            <AlertTriangle className='w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
            <p className='text-xs text-amber-900 dark:text-amber-300'>
              <strong>Perhatian:</strong> Jika Siklus #{toSiklus} sudah memiliki hidangan sebelumnya, seluruh hidangan lama akan ditimpa dengan hidangan dari Siklus #{fromSiklus}.
            </p>
          </div>
        </div>

        <DialogFooter className='gap-2 pt-2 border-t'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
            disabled={isCopying}
          >
            Batal
          </Button>
          <Button
            type='button'
            size='sm'
            onClick={handleDuplicate}
            disabled={isCopying}
            className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground'
          >
            {isCopying ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Menyalin...
              </>
            ) : (
              <>
                <Copy className='w-4 h-4' />
                Duplikasi Sekarang
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

