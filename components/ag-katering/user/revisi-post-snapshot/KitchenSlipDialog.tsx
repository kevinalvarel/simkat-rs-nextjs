'use client';

import React from 'react';
import type { RevisiPostSnapshotItem } from '@/servers/revisi-snapshot.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, ChefHat, CheckSquare } from 'lucide-react';

interface KitchenSlipDialogProps {
  item: RevisiPostSnapshotItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KitchenSlipDialog({
  item,
  open,
  onOpenChange,
}: KitchenSlipDialogProps) {
  if (!item) return null;

  function handlePrint() {
    window.print();
  }

  const printDate = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md max-h-[90vh] overflow-y-auto p-6'>
        <DialogHeader className='gap-1 border-b pb-3'>
          <DialogTitle className='text-base font-bold text-foreground flex items-center gap-2'>
            <ChefHat className='w-5 h-5 text-primary' /> Slip Instruksi Dapur (Revisi Susulan)
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Slip ini dilampirkan pada nampan/troley makanan untuk juru masak & pengantar katering.
          </DialogDescription>
        </DialogHeader>

        {/* Printable Ticket Area */}
        <div id='printable-kitchen-slip' className='bg-card border-2 border-dashed rounded-xl p-5 space-y-4 text-xs font-mono my-2'>
          {/* Ticket Header */}
          <div className='text-center border-b pb-3 space-y-1'>
            <h3 className='font-bold text-sm text-foreground tracking-wide uppercase font-sans'>
              SIMKAT RS — KATERING GIZI
            </h3>
            <p className='text-[10px] text-muted-foreground uppercase font-sans'>
              SLIP REVISI POST-SNAPSHOT #{item.id}
            </p>
            <div className='inline-block bg-primary/10 text-primary font-bold text-[11px] px-2.5 py-0.5 rounded-full mt-1 font-sans'>
              SIKLUS {item.waktu_makan} • {item.batch_code}
            </div>
          </div>

          {/* Patient Details */}
          <div className='space-y-1.5 font-sans'>
            <div className='flex justify-between items-baseline border-b pb-1 text-xs'>
              <span className='text-muted-foreground'>PASIEN:</span>
              <strong className='text-foreground font-bold'>{item.nama_pasien}</strong>
            </div>
            <div className='flex justify-between items-baseline border-b pb-1 text-xs'>
              <span className='text-muted-foreground'>NO. RM:</span>
              <span className='font-mono font-semibold'>{item.no_rm}</span>
            </div>
            <div className='flex justify-between items-baseline border-b pb-1 text-xs'>
              <span className='text-muted-foreground'>LOKASI:</span>
              <strong className='text-primary font-bold'>
                {item.ruangan} — {item.bed} ({item.gedung})
              </strong>
            </div>
            <div className='flex justify-between items-baseline border-b pb-1 text-xs'>
              <span className='text-muted-foreground'>KELAS:</span>
              <span>{item.kelas}</span>
            </div>
          </div>

          {/* Revision Instruction Box */}
          <div className='bg-amber-500/10 border border-amber-300 dark:border-amber-900 rounded-lg p-3 space-y-1 font-sans'>
            <span className='text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block'>
              INSTRUKSI PRODUKSI DAPUR:
            </span>
            <p className='font-bold text-xs text-foreground text-amber-900 dark:text-amber-200'>
              {item.dampak_dapur}
            </p>
            <div className='text-[11px] text-muted-foreground pt-1 border-t border-amber-200/60 mt-1'>
              <strong>Menu / Etiket Diet Baru:</strong>{' '}
              {item.data_baru?.diet || item.data_baru?.ruangan || 'Sesuaikan Catatan'}
            </div>
          </div>

          {/* Clinical Reason */}
          <div className='text-[11px] font-sans text-muted-foreground space-y-0.5'>
            <span>Catatan Pengajuan:</span>
            <p className='italic text-foreground bg-muted/40 p-2 rounded-md border'>
              "{item.alasan}"
            </p>
          </div>

          {/* Footer Timestamp & Sign */}
          <div className='pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground font-sans'>
            <div>
              <span>Dicetak: {printDate} WIB</span>
              <br />
              <span>Oleh: {item.requested_by}</span>
            </div>
            <div className='border-l pl-3 text-center'>
              <span className='block mb-4 text-[9px]'>Paraf Koki Dapur</span>
              <span className='font-semibold text-foreground'>( ____________ )</span>
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2 pt-2 border-t'>
          <Button variant='outline' size='sm' onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button size='sm' onClick={handlePrint} className='gap-1.5 bg-blue-600 hover:bg-blue-700 text-white'>
            <Printer className='w-4 h-4' /> Cetak Slip Dapur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
