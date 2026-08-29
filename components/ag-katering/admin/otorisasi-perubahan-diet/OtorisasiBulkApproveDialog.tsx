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
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { bulkApproveRevisiDiet } from '@/servers/otorisasi-diet.service';
import { broadcastProductionUpdate } from '@/lib/realtime-sync';
import { toast } from 'sonner';

interface OtorisasiBulkApproveDialogProps {
  selectedIds: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function OtorisasiBulkApproveDialog({
  selectedIds,
  open,
  onOpenChange,
  onSuccess,
}: OtorisasiBulkApproveDialogProps) {
  const [reviewNotes, setReviewNotes] = useState<string>(
    'Persetujuan otorisasi massal (Batch Approve) oleh Admin Head Gizi'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function handleBulkApprove() {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await bulkApproveRevisiDiet(
        selectedIds,
        reviewNotes,
        'Admin Head Gizi'
      );
      if (res.success) {
        toast.success(res.message);
        broadcastProductionUpdate('REVISION_APPROVED');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal melakukan persetujuan massal.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-6'>
        <DialogHeader className='gap-1 border-b pb-3'>
          <DialogTitle className='text-lg font-bold tracking-tight text-foreground flex items-center gap-2'>
            <CheckCircle2 className='w-5 h-5 text-emerald-600' /> Persetujuan Massal (Bulk Approve)
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Anda akan menyetujui sekaligus <strong className='text-foreground'>{selectedIds.length} permintaan</strong> otorisasi perubahan diet.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-2 text-xs'>
          <div className='bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex items-start gap-2'>
            <ShieldAlert className='w-4 h-4 text-amber-600 shrink-0 mt-0.5' />
            <div>
              <strong>Konfirmasi Admin:</strong> Seluruh permintaan tercentang akan diubah statusnya menjadi <strong>APPROVED</strong> dan langsung masuk ke antrean produksi dapur katering.
            </div>
          </div>

          <div className='space-y-1.5'>
            <label className='font-semibold text-foreground block'>
              Catatan Otorisasi Massal:
            </label>
            <textarea
              rows={2}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className='w-full rounded-lg border border-input bg-background p-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20'
            />
          </div>
        </div>

        <DialogFooter className='gap-2 pt-2 border-t'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            size='sm'
            onClick={handleBulkApprove}
            disabled={isSubmitting}
            className='gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white'
          >
            <CheckCircle2 className='w-4 h-4' /> Setujui {selectedIds.length} Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
