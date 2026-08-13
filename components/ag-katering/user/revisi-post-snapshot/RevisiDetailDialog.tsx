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
import { Badge } from '@/components/ui/badge';
import {
  User,
  Clock,
  FileText,
  AlertTriangle,
  Printer,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  UserX,
} from 'lucide-react';

interface RevisiDetailDialogProps {
  item: RevisiPostSnapshotItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrintSlip?: (item: RevisiPostSnapshotItem) => void;
}

export default function RevisiDetailDialog({
  item,
  open,
  onOpenChange,
  onPrintSlip,
}: RevisiDetailDialogProps) {
  if (!item) return null;

  const formattedDate = new Date(item.requested_at).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return (
          <span className='inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'>
            <Clock className='w-3 h-3' /> PENDING (Menunggu Otorisasi)
          </span>
        );
      case 'APPROVED':
        return (
          <span className='inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'>
            <CheckCircle2 className='w-3 h-3' /> APPROVED (Disetujui Admin)
          </span>
        );
      case 'SELESAI':
        return (
          <span className='inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'>
            <UserCheck className='w-3 h-3' /> SELESAI
          </span>
        );
      case 'REJECTED':
        return (
          <span className='inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'>
            <UserX className='w-3 h-3' /> DITOLAK
          </span>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto p-6'>
        <DialogHeader className='gap-1 border-b pb-4'>
          <div className='flex items-center justify-between gap-2 flex-wrap'>
            <Badge variant='outline' className='font-mono text-xs'>
              {item.batch_code || 'BATCH-LOCKED'}
            </Badge>
            <span className='text-xs font-medium text-muted-foreground'>
              Siklus: <strong className='text-foreground'>{item.waktu_makan}</strong>
            </span>
          </div>
          <DialogTitle className='text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-1'>
            Rincian Log Revisi Post-Snapshot
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Data rincian perubahan diet yang tercatat pasca pembekuan snapshot.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5 py-2 text-xs'>
          {/* Status Badge Banner */}
          <div className='flex items-center justify-between bg-muted/30 p-3 rounded-xl border'>
            <span className='font-semibold text-muted-foreground'>Status Otorisasi:</span>
            {getStatusBadge(item.status)}
          </div>

          {/* Patient Profile */}
          <div className='bg-muted/40 p-4 rounded-xl border space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='font-bold text-sm text-foreground flex items-center gap-1.5'>
                <User className='w-4 h-4 text-primary' /> {item.nama_pasien}
              </span>
              <span className='font-mono bg-background px-2 py-0.5 rounded-md border font-semibold text-xs text-muted-foreground'>
                {item.no_rm}
              </span>
            </div>
            <div className='grid grid-cols-2 gap-2 text-muted-foreground pt-1'>
              <div>
                <span>Ruangan:</span>{' '}
                <strong className='text-foreground'>{item.ruangan}</strong> ({item.bed})
              </div>
              <div>
                <span>Gedung / Kelas:</span>{' '}
                <strong className='text-foreground'>
                  {item.gedung} / {item.kelas}
                </strong>
              </div>
            </div>
          </div>

          {/* Diff Section */}
          <div className='space-y-2'>
            <h4 className='font-semibold text-xs text-foreground uppercase tracking-wider'>
              Perubahan Data & Dampak Dapur
            </h4>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {/* Data Lama */}
              <div className='bg-rose-500/5 p-3.5 rounded-xl border border-rose-200/60 dark:border-rose-950 space-y-1'>
                <span className='text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block'>
                  Data Sebelum (Snapshot Locked)
                </span>
                <p className='font-medium text-foreground text-xs'>
                  {item.data_lama?.diet || 'Tidak Ada Data Diet / Belum Terdaftar'}
                </p>
                {item.data_lama?.ruangan && (
                  <p className='text-[11px] text-muted-foreground'>
                    Lokasi: {item.data_lama.ruangan} ({item.data_lama.bed || '-'})
                  </p>
                )}
              </div>

              {/* Data Baru */}
              <div className='bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-950 space-y-1'>
                <span className='text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block'>
                  Data Baru (Revisi Diajukan)
                </span>
                <p className='font-medium text-foreground text-xs'>
                  {item.data_baru?.diet || item.dampak_dapur}
                </p>
                {item.data_baru?.ruangan && (
                  <p className='text-[11px] text-muted-foreground'>
                    Lokasi Baru: {item.data_baru.ruangan} ({item.data_baru.bed || '-'})
                  </p>
                )}
              </div>
            </div>

            {/* Impact Banner */}
            <div className='flex items-center gap-2 bg-amber-50 dark:bg-amber-950/60 p-3 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'>
              <AlertTriangle className='w-4 h-4 text-amber-600 shrink-0' />
              <div>
                <strong>Instruksi Produksi Dapur:</strong> {item.dampak_dapur}
              </div>
            </div>
          </div>

          {/* Clinical Reason & Requester */}
          <div className='bg-card p-4 rounded-xl border space-y-2'>
            <div>
              <span className='text-[11px] font-semibold text-muted-foreground block mb-0.5'>
                Alasan / Catatan Klinis Pengajuan:
              </span>
              <p className='text-xs text-foreground italic bg-muted/30 p-2.5 rounded-lg border'>
                "{item.alasan}"
              </p>
            </div>

            <div className='flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-2 border-t mt-2'>
              <span className='flex items-center gap-1'>
                <FileText className='w-3.5 h-3.5' /> Diajukan oleh:{' '}
                <strong className='text-foreground'>{item.requested_by}</strong>
              </span>
              <span className='flex items-center gap-1'>
                <Clock className='w-3.5 h-3.5' /> {formattedDate} WIB
              </span>
            </div>
          </div>

          {/* Review Info if exists */}
          {item.reviewed_by && (
            <div className='bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900 text-xs space-y-1'>
              <div className='flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-semibold'>
                <ShieldCheck className='w-4 h-4' /> Catatan Otorisasi Admin:
              </div>
              <p className='text-muted-foreground italic'>"{item.review_notes || 'Telah diverifikasi'}"</p>
              <p className='text-[10px] text-muted-foreground pt-1'>
                Oleh: {item.reviewed_by}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className='gap-2 sm:gap-2 flex-wrap pt-2 border-t'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
          {onPrintSlip && (
            <Button
              size='sm'
              onClick={() => {
                onOpenChange(false);
                onPrintSlip(item);
              }}
              className='gap-1.5 bg-blue-600 hover:bg-blue-700 text-white'
            >
              <Printer className='w-4 h-4' /> Cetak Slip Dapur
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
