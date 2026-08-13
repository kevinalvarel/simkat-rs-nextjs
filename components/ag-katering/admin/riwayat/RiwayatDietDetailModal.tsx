'use client';

import React from 'react';
import type { RiwayatDietItem } from '@/servers/riwayat-diet.service';
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
  UserCheck,
  Mail,
  Clock,
  Building,
  Bed,
  FileText,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface RiwayatDietDetailModalProps {
  item: RiwayatDietItem | null;
  onClose: () => void;
}

export function RiwayatDietDetailModal({ item, onClose }: RiwayatDietDetailModalProps) {
  if (!item) return null;

  const formattedDate = new Date(item.requested_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border-border/80'>
        <DialogHeader className='space-y-2 border-b border-border/60 pb-4'>
          <div className='flex items-center justify-between gap-3'>
            <Badge variant='outline' className='text-xs font-semibold px-2.5 py-0.5 border-primary/30 text-primary bg-primary/5'>
              Audit Log #{item.id}
            </Badge>
            <Badge className='text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'>
              {item.status}
            </Badge>
          </div>
          <DialogTitle className='text-xl font-bold text-foreground'>
            Detail Riwayat Perubahan Diet
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Tercatat pada {formattedDate} untuk waktu makan{' '}
            <strong className='text-primary'>{item.waktu_makan}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5 py-3 text-xs sm:text-sm'>
          {/* Section 1: Explicit Gizi-RS Staff Card */}
          <div className='bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2.5'>
            <div className='flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider'>
              <Shield className='w-4 h-4' /> Petugas Ahli Gizi RS (Role: gizi-rs)
            </div>
            <div className='flex items-center gap-3 bg-card p-3 rounded-lg border border-border/60'>
              <div className='w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm'>
                {item.gizi_rs_name.charAt(0)}
              </div>
              <div className='space-y-0.5 min-w-0 flex-1'>
                <h4 className='font-bold text-sm text-foreground flex items-center gap-1.5'>
                  <UserCheck className='w-4 h-4 text-primary shrink-0' />
                  {item.gizi_rs_name}
                </h4>
                <p className='text-xs text-muted-foreground font-mono flex items-center gap-1.5'>
                  <Mail className='w-3.5 h-3.5 text-primary shrink-0' />
                  {item.gizi_rs_email}
                </p>
              </div>
              <Badge className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px]'>
                Terverifikasi Sistem
              </Badge>
            </div>
          </div>

          {/* Section 2: Patient Info Header */}
          <div className='bg-muted/40 p-4 rounded-xl space-y-2 border border-border/50'>
            <h4 className='font-bold text-sm text-foreground flex items-center gap-2'>
              <FileText className='w-4 h-4 text-primary' /> Data Pasien
            </h4>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1'>
              <div>
                <span className='text-muted-foreground block text-[11px]'>Nama Pasien</span>
                <span className='font-semibold text-foreground'>{item.nama_pasien}</span>
              </div>
              <div>
                <span className='text-muted-foreground block text-[11px]'>No RM</span>
                <span className='font-mono font-medium text-foreground'>{item.no_rm}</span>
              </div>
              <div>
                <span className='text-muted-foreground block text-[11px]'>Ruangan & Bed</span>
                <span className='font-medium text-foreground flex items-center gap-1'>
                  <Building className='w-3 h-3 text-muted-foreground' /> {item.ruangan} - {item.bed}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground block text-[11px]'>Kelas</span>
                <span className='font-medium text-foreground'>{item.kelas}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Data Diff (Before vs After) */}
          <div className='space-y-2'>
            <h4 className='font-bold text-xs uppercase tracking-wider text-muted-foreground'>
              Perbandingan Data Perubahan
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {/* Box Before */}
              <div className='p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2'>
                <div className='flex items-center justify-between text-xs font-semibold text-rose-700 dark:text-rose-400'>
                  <span>Data Sebelum</span>
                  <Badge variant='outline' className='text-[10px] border-rose-300 text-rose-700'>
                    LAMA
                  </Badge>
                </div>
                <div className='space-y-1.5 text-xs text-foreground'>
                  <div>
                    <span className='text-muted-foreground text-[11px] block'>Instruksi Diet:</span>
                    <span className='font-medium'>
                      {item.data_lama?.diet || '-'}
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground text-[11px] block'>Lokasi Ruangan:</span>
                    <span>
                      {item.data_lama?.ruangan ? `${item.data_lama.ruangan} (${item.data_lama.bed || ''})` : item.ruangan}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box After */}
              <div className='p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2'>
                <div className='flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400'>
                  <span className='flex items-center gap-1'>
                    Data Baru <ArrowRight className='w-3 h-3' />
                  </span>
                  <Badge variant='outline' className='text-[10px] border-emerald-300 text-emerald-700'>
                    BARU
                  </Badge>
                </div>
                <div className='space-y-1.5 text-xs text-foreground'>
                  <div>
                    <span className='text-muted-foreground text-[11px] block'>Instruksi Diet Baru:</span>
                    <span className='font-bold text-primary'>
                      {item.data_baru?.diet || '-'}
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground text-[11px] block'>Lokasi Baru:</span>
                    <span>
                      {item.data_baru?.ruangan ? `${item.data_baru.ruangan} (${item.data_baru.bed || ''})` : item.ruangan}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Clinical Reason */}
          <div className='space-y-1.5 bg-card p-3.5 rounded-xl border border-border/60'>
            <span className='text-xs font-semibold text-muted-foreground block'>
              Alasan Klinis / Keterangan Dokter:
            </span>
            <p className='text-xs font-medium text-foreground bg-muted/30 p-2.5 rounded-lg italic border border-border/40'>
              &ldquo;{item.alasan}&rdquo;
            </p>
          </div>

          {/* Section 5: Verification & Audit Trail */}
          {item.reviewed_by && (
            <div className='flex items-center gap-2 text-xs bg-muted/40 p-3 rounded-xl border border-border/50 text-muted-foreground'>
              <CheckCircle2 className='w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0' />
              <div>
                Verifikasi & Catatan Admin:{' '}
                <strong className='text-foreground'>{item.reviewed_by}</strong>
                {item.review_notes && <span> &mdash; &ldquo;{item.review_notes}&rdquo;</span>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='border-t border-border/60 pt-3'>
          <Button variant='outline' onClick={onClose} className='w-full sm:w-auto text-xs'>
            Tutup Detail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
