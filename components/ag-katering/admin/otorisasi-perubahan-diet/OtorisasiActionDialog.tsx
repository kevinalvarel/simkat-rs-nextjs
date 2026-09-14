'use client';

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { approveRevisiDiet, rejectRevisiDiet } from '@/servers/otorisasi-diet.service';
import { broadcastProductionUpdate } from '@/lib/realtime-sync';
import { toast } from 'sonner';

interface OtorisasiActionDialogProps {
  item: RevisiPostSnapshotItem | null;
  mode: 'APPROVE' | 'REJECT' | 'VIEW' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function OtorisasiActionDialog({
  item,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: OtorisasiActionDialogProps) {
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setReviewNotes(item.review_notes || '');
    }
  }, [item]);

  if (!item || !mode) return null;

  async function handleApprove() {
    if (!item) return;
    setIsSubmitting(true);
    try {
      const res = await approveRevisiDiet(item.id, reviewNotes, 'Admin Head Gizi');
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
      toast.error('Gagal menyetujui otorisasi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!item) return;
    if (!reviewNotes.trim()) {
      toast.error('Mohon isi catatan alasan penolakan terlebih dahulu.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await rejectRevisiDiet(item.id, reviewNotes, 'Admin Head Gizi');
      if (res.success) {
        toast.success(res.message);
        broadcastProductionUpdate('REVISION_REJECTED');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menolak otorisasi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const formattedDate = new Date(item.requested_at).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
            {mode === 'APPROVE' && (
              <>
                <CheckCircle2 className='w-5 h-5 text-emerald-600' /> Keputusan Otorisasi: Setujui
              </>
            )}
            {mode === 'REJECT' && (
              <>
                <XCircle className='w-5 h-5 text-rose-600' /> Keputusan Otorisasi: Tolak
              </>
            )}
            {mode === 'VIEW' && (
              <>
                <ShieldCheck className='w-5 h-5 text-blue-600' /> Detail Otorisasi Admin
              </>
            )}
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Tinjau perubahan diet pasien pasca-snapshot dan berikan otorisasi resmi Admin.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2 text-xs'>
          {/* Patient Details */}
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

          {/* Diff Box — per field yang berubah */}
          {(() => {
            const defs: { key: 'nama_pasien' | 'no_rm' | 'diet' | 'kelas' | 'gedung' | 'ruangan' | 'bed'; label: string }[] = [
              { key: 'nama_pasien', label: 'Nama Pasien' },
              { key: 'no_rm', label: 'No RM' },
              { key: 'diet', label: 'Diet' },
              { key: 'kelas', label: 'Kelas' },
              { key: 'gedung', label: 'No Kamar' },
              { key: 'ruangan', label: 'Ruangan' },
              { key: 'bed', label: 'Bed' },
            ];
            const rows = defs
              .map((d) => ({
                ...d,
                lama: (item.data_lama?.[d.key] || '').trim(),
                baru: (item.data_baru?.[d.key] || '').trim(),
              }))
              .filter(
                (r) =>
                  r.lama.toLowerCase() !== r.baru.toLowerCase() &&
                  (r.lama !== '' || r.baru !== ''),
              );
            if (
              rows.length === 0 ||
              item.jenis_perubahan === 'NEW_PATIENT' ||
              item.jenis_perubahan === 'DISCHARGE' ||
              item.jenis_perubahan === 'NPO'
            ) {
              return (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div className='bg-rose-500/5 p-3.5 rounded-xl border border-rose-200/60 dark:border-rose-950 space-y-1'>
                    <span className='text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block'>
                      Sebelum (Snapshot Locked)
                    </span>
                    <p className='font-medium text-foreground text-xs'>
                      {item.data_lama?.diet || 'Belum Ada Data'}
                    </p>
                  </div>
                  <div className='bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-950 space-y-1'>
                    <span className='text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block'>
                      Sesudah (Diajukan)
                    </span>
                    <p className='font-medium text-foreground text-xs'>
                      {item.data_baru?.diet || item.dampak_dapur}
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <div className='rounded-xl border overflow-hidden'>
                <div className='grid grid-cols-[110px_1fr_1fr] gap-0 bg-muted/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
                  <span className='px-3 py-2'>Field</span>
                  <span className='px-3 py-2 text-rose-600 dark:text-rose-400'>Sebelum</span>
                  <span className='px-3 py-2 text-emerald-600 dark:text-emerald-400'>Sesudah</span>
                </div>
                {rows.map((r) => (
                  <div
                    key={r.key}
                    className='grid grid-cols-[110px_1fr_1fr] gap-0 text-xs border-t'
                  >
                    <span className='px-3 py-2 font-semibold text-muted-foreground bg-muted/30'>
                      {r.label}
                    </span>
                    <span className='px-3 py-2 text-muted-foreground line-through bg-rose-500/5'>
                      {r.lama || '-'}
                    </span>
                    <span className='px-3 py-2 font-semibold text-foreground bg-emerald-500/5'>
                      {r.baru || '-'}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Impact Banner */}
          <div className='flex items-center gap-2 bg-amber-50 dark:bg-amber-950/60 p-3 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'>
            <AlertTriangle className='w-4 h-4 text-amber-600 shrink-0' />
            <div>
              <strong>Dampak Produksi Dapur:</strong> {item.dampak_dapur}
            </div>
          </div>

          {/* Clinical Reason */}
          <div className='bg-card p-3.5 rounded-xl border space-y-1.5'>
            <span className='text-[11px] font-semibold text-muted-foreground block'>
              Alasan Medical / Clinical Note:
            </span>
            <p className='text-xs text-foreground italic bg-muted/30 p-2.5 rounded-lg border'>
              "{item.alasan}"
            </p>
            <div className='flex items-center justify-between text-[11px] text-muted-foreground pt-1'>
              <span>Diajukan oleh: {item.requested_by}</span>
              <span>{formattedDate} WIB</span>
            </div>
          </div>

          {/* Reviewer Note Input */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground block'>
              Catatan Otorisasi Admin {mode === 'REJECT' && <span className='text-rose-500'>* (Wajib jika menolak)</span>}:
            </label>
            <textarea
              rows={2.5}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              disabled={mode === 'VIEW'}
              placeholder={
                mode === 'REJECT'
                  ? 'Tuliskan alasan penolakan (misal: Kurang bukti form instruksi DPJP)...'
                  : 'Catatan tambahan untuk tim dapur (opsional)...'
              }
              className='w-full rounded-lg border border-input bg-background p-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-75'
            />
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-2 flex-wrap pt-2 border-t'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {mode === 'VIEW' ? 'Tutup' : 'Batal'}
          </Button>

          {mode === 'APPROVE' && (
            <Button
              size='sm'
              onClick={handleApprove}
              disabled={isSubmitting}
              className='gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white'
            >
              <CheckCircle2 className='w-4 h-4' /> Konfirmasi Setujui
            </Button>
          )}

          {mode === 'REJECT' && (
            <Button
              variant='destructive'
              size='sm'
              onClick={handleReject}
              disabled={isSubmitting}
              className='gap-1.5'
            >
              <XCircle className='w-4 h-4' /> Konfirmasi Tolak
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
