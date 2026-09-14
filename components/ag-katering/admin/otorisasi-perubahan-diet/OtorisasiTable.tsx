'use client';

import React from 'react';
import type { RevisiPostSnapshotItem } from '@/servers/revisi-snapshot.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Eye,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  UserCheck,
  UserX,
  Building2,
  UtensilsCrossed,
  ShieldAlert,
} from 'lucide-react';

interface OtorisasiTableProps {
  items: RevisiPostSnapshotItem[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onOpenActionDialog: (item: RevisiPostSnapshotItem, mode: 'APPROVE' | 'REJECT' | 'VIEW') => void;
}

export default function OtorisasiTable({
  items,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenActionDialog,
}: OtorisasiTableProps) {
  if (items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center p-12 bg-card rounded-2xl border text-center shadow-xs'>
        <div className='w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3'>
          <UtensilsCrossed className='w-6 h-6' />
        </div>
        <h4 className='font-semibold text-base text-foreground'>
          Tidak ada antrean otorisasi
        </h4>
        <p className='text-xs text-muted-foreground max-w-sm mt-1'>
          Tidak ditemukan pengajuan otorisasi perubahan diet yang sesuai dengan kriteria filter Anda.
        </p>
      </div>
    );
  }

  const allPendingItems = items.filter((i) => i.status === 'PENDING');
  const isAllPendingSelected =
    allPendingItems.length > 0 &&
    allPendingItems.every((i) => selectedIds.includes(i.id));

  function getJenisBadge(jenis: string) {
    switch (jenis) {
      case 'NEW_PATIENT':
        return (
          <Badge className='bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-500/25'>
            Pasien Baru
          </Badge>
        );
      case 'DIET_CHANGE':
        return (
          <Badge className='bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300 hover:bg-indigo-500/25'>
            Perubahan Diet
          </Badge>
        );
      case 'ROOM_TRANSFER':
        return (
          <Badge className='bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-300 hover:bg-cyan-500/25'>
            Pindah Ruangan
          </Badge>
        );
      case 'NPO':
        return (
          <Badge className='bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 hover:bg-purple-500/25'>
            NPO / Puasa
          </Badge>
        );
      case 'DISCHARGE':
        return (
          <Badge className='bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 hover:bg-rose-500/25'>
            Pasien Pulang
          </Badge>
        );
      case 'KOREKSI_NAMA':
        return (
          <Badge className='bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 hover:bg-slate-500/25'>
            Koreksi Nama
          </Badge>
        );
      case 'KOREKSI_NO_RM':
        return (
          <Badge className='bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300 hover:bg-orange-500/25'>
            Koreksi No RM
          </Badge>
        );
      case 'KOREKSI_KELAS':
        return (
          <Badge className='bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-300 hover:bg-teal-500/25'>
            Koreksi Kelas
          </Badge>
        );
      case 'KOREKSI_KAMAR':
        return (
          <Badge className='bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-300 hover:bg-lime-500/25'>
            Koreksi No Kamar
          </Badge>
        );
      case 'KOREKSI_BED':
        return (
          <Badge className='bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300 hover:bg-sky-500/25'>
            Koreksi Bed
          </Badge>
        );
      default:
        return <Badge variant='outline'>{jenis}</Badge>;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return (
          <span className='inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse'>
            <Clock className='w-3 h-3' /> PENDING
          </span>
        );
      case 'APPROVED':
        return (
          <span className='inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'>
            <CheckCircle2 className='w-3 h-3' /> APPROVED
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

  /** Field yang benar-benar berubah — dasar tampilan diff per field. */
  function getChangedFields(item: RevisiPostSnapshotItem) {
    const defs: { key: 'nama_pasien' | 'no_rm' | 'diet' | 'kelas' | 'gedung' | 'ruangan' | 'bed'; label: string }[] = [
      { key: 'nama_pasien', label: 'Nama' },
      { key: 'no_rm', label: 'No RM' },
      { key: 'diet', label: 'Diet' },
      { key: 'kelas', label: 'Kelas' },
      { key: 'gedung', label: 'No Kamar' },
      { key: 'ruangan', label: 'Ruangan' },
      { key: 'bed', label: 'Bed' },
    ];
    return defs
      .map((d) => {
        const lama = (item.data_lama?.[d.key] || '').trim();
        const baru = (item.data_baru?.[d.key] || '').trim();
        return { ...d, lama, baru, changed: lama.toLowerCase() !== baru.toLowerCase() && (lama !== '' || baru !== '') };
      })
      .filter((d) => d.changed);
  }

  function renderDiffView(item: RevisiPostSnapshotItem) {
    if (item.jenis_perubahan === 'NEW_PATIENT') {
      return (
        <div className='flex items-center gap-1.5 text-xs'>
          <span className='text-muted-foreground italic line-through'>
            [Belum Ada Data]
          </span>
          <ArrowRight className='w-3.5 h-3.5 text-emerald-500 shrink-0' />
          <span className='font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200'>
            {item.data_baru?.diet || 'Diet Standar RS'}
          </span>
        </div>
      );
    }

    if (item.jenis_perubahan === 'DISCHARGE') {
      return (
        <div className='flex items-center gap-1.5 text-xs'>
          <span className='text-muted-foreground line-through'>
            {item.data_lama?.diet || 'Diet Aktif'}
          </span>
          <ArrowRight className='w-3.5 h-3.5 text-rose-500 shrink-0' />
          <span className='font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200'>
            Dibatalkan / Pasien Pulang
          </span>
        </div>
      );
    }

    if (item.jenis_perubahan === 'NPO') {
      return (
        <div className='flex items-center gap-1.5 text-xs'>
          <span className='text-muted-foreground line-through'>
            {item.data_lama?.diet || 'Diet Makanan'}
          </span>
          <ArrowRight className='w-3.5 h-3.5 text-purple-500 shrink-0' />
          <span className='font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200'>
            NPO (Puasa Pre-Op)
          </span>
        </div>
      );
    }

    // DIET_CHANGE / ROOM_TRANSFER / KOREKSI_*: tampilkan per field yang berubah
    const changed = getChangedFields(item);
    if (changed.length === 0) {
      // Fallback untuk data lama yang diff-nya kosong
      if (item.jenis_perubahan === 'ROOM_TRANSFER') {
        return (
          <div className='flex flex-col gap-1 text-xs'>
            <div className='flex items-center gap-1 text-muted-foreground line-through'>
              <Building2 className='w-3 h-3' />
              <span>
                {item.data_lama?.ruangan || 'Lama'} ({item.data_lama?.bed || '-'})
              </span>
            </div>
            <div className='flex items-center gap-1 font-semibold text-cyan-700 dark:text-cyan-300'>
              <ArrowRight className='w-3 h-3 text-cyan-500' />
              <span>
                {item.data_baru?.ruangan || item.ruangan} (
                {item.data_baru?.bed || item.bed})
              </span>
            </div>
          </div>
        );
      }
      return (
        <div className='flex flex-col sm:flex-row sm:items-center gap-1 text-xs'>
          <span className='text-muted-foreground line-through bg-muted/60 px-2 py-0.5 rounded-md'>
            {item.data_lama?.diet || 'Diet Lama'}
          </span>
          <ArrowRight className='w-3.5 h-3.5 text-primary shrink-0 hidden sm:inline' />
          <span className='font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20'>
            {item.data_baru?.diet || 'Diet Baru'}
          </span>
        </div>
      );
    }

    return (
      <div className='flex flex-col gap-1 text-xs'>
        {changed.map((c) => (
          <div key={c.key} className='flex flex-wrap items-center gap-1'>
            <span className='font-semibold text-muted-foreground min-w-[62px]'>
              {c.label}:
            </span>
            <span className='text-muted-foreground line-through bg-muted/60 px-1.5 py-0.5 rounded-md'>
              {c.lama || '-'}
            </span>
            <ArrowRight className='w-3 h-3 text-primary shrink-0' />
            <span className='font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20'>
              {c.baru || '-'}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='rounded-2xl border bg-card shadow-xs overflow-hidden w-full min-w-0'>
      <div className='overflow-x-auto w-full'>
        <Table>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              {/* Checkbox Header */}
              <TableHead className='w-[40px] px-3'>
                {allPendingItems.length > 0 && (
                  <input
                    type='checkbox'
                    checked={isAllPendingSelected}
                    onChange={onToggleSelectAll}
                    className='rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer'
                    title='Pilih Semua Item Pending'
                  />
                )}
              </TableHead>
              <TableHead className='w-[150px] text-xs font-semibold'>
                Pengajuan & Batch
              </TableHead>
              <TableHead className='min-w-[180px] text-xs font-semibold'>
                Pasien & Lokasi
              </TableHead>
              <TableHead className='w-[130px] text-xs font-semibold'>
                Jenis Perubahan
              </TableHead>
              <TableHead className='min-w-[250px] text-xs font-semibold'>
                Rincian Perubahan
              </TableHead>
              <TableHead className='w-[170px] text-xs font-semibold'>
                Dampak Dapur
              </TableHead>
              <TableHead className='w-[120px] text-xs font-semibold'>
                Status
              </TableHead>
              <TableHead className='w-[160px] text-xs font-semibold text-right'>
                Aksi Admin
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const formattedTime = new Date(
                item.requested_at,
              ).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <TableRow
                  key={item.id}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-amber-500/10 dark:bg-amber-950/40'
                      : item.status === 'PENDING'
                      ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Checkbox Column */}
                  <TableCell className='px-3 align-top py-3.5'>
                    {item.status === 'PENDING' && (
                      <input
                        type='checkbox'
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className='rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer mt-0.5'
                      />
                    )}
                  </TableCell>

                  {/* 1. Pengajuan & Batch */}
                  <TableCell className='align-top py-3.5'>
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-1.5'>
                        <span className='font-bold text-xs text-foreground'>
                          {formattedTime} WIB
                        </span>
                        <Badge
                          variant='secondary'
                          className='text-[10px] px-1.5 py-0 h-4 font-semibold'
                        >
                          {item.waktu_makan}
                        </Badge>
                      </div>
                      <span className='text-[11px] text-muted-foreground font-mono truncate max-w-[130px]'>
                        {item.batch_code || 'LOCKED'}
                      </span>
                    </div>
                  </TableCell>

                  {/* 2. Pasien & Lokasi */}
                  <TableCell className='align-top py-3.5'>
                    <div className='flex flex-col gap-0.5'>
                      <span className='font-semibold text-xs text-foreground'>
                        {item.nama_pasien}
                      </span>
                      <div className='flex items-center gap-2 text-[11px] text-muted-foreground'>
                        <span className='font-mono bg-muted/80 px-1 rounded-xs'>
                          {item.no_rm}
                        </span>
                        <span>•</span>
                        <span>{item.kelas}</span>
                      </div>
                      <span className='text-[11px] font-medium text-foreground/80 mt-0.5'>
                        {item.ruangan} — {item.bed} ({item.gedung})
                      </span>
                    </div>
                  </TableCell>

                  {/* 3. Jenis Perubahan */}
                  <TableCell className='align-top py-3.5'>
                    {getJenisBadge(item.jenis_perubahan)}
                  </TableCell>

                  {/* 4. Perubahan (Diff View) */}
                  <TableCell className='align-top py-3.5'>
                    <div className='space-y-1.5'>
                      {renderDiffView(item)}
                      <p className='text-[11px] text-muted-foreground line-clamp-2 italic'>
                        "{item.alasan}"
                      </p>
                    </div>
                  </TableCell>

                  {/* 5. Dampak Dapur */}
                  <TableCell className='align-top py-3.5'>
                    <span className='text-xs font-semibold px-2 py-1 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 inline-block'>
                      {item.dampak_dapur}
                    </span>
                  </TableCell>

                  {/* 6. Status */}
                  <TableCell className='align-top py-3.5'>
                    {getStatusBadge(item.status)}
                  </TableCell>

                  {/* 7. Aksi Admin */}
                  <TableCell className='align-top py-3.5 text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      {item.status === 'PENDING' ? (
                        <>
                          <Button
                            size='sm'
                            onClick={() => onOpenActionDialog(item, 'APPROVE')}
                            className='h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs'
                            title='Setujui Otorisasi'
                          >
                            <CheckCircle2 className='w-3.5 h-3.5' /> Setujui
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => onOpenActionDialog(item, 'REJECT')}
                            className='h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1'
                            title='Tolak Otorisasi'
                          >
                            <XCircle className='w-3.5 h-3.5' /> Tolak
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          onClick={() => onOpenActionDialog(item, 'VIEW')}
                          title='Lihat Detail Decision Admin'
                          className='h-8 w-8 text-muted-foreground hover:text-foreground'
                        >
                          <Eye className='w-4 h-4' />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
