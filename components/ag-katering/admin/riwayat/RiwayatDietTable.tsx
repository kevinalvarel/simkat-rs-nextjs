'use client';

import React from 'react';
import type { RiwayatDietItem } from '@/servers/riwayat-diet.service';
import { revisionTypeLabel } from '@/lib/revisi-etiket';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Mail,
  UserCheck,
  ArrowRight,
  Clock,
  Building,
  Bed,
  FileText,
} from 'lucide-react';

interface RiwayatDietTableProps {
  items: RiwayatDietItem[];
  onSelectDetail: (item: RiwayatDietItem) => void;
}

export function RiwayatDietTable({ items, onSelectDetail }: RiwayatDietTableProps) {
  if (items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center p-12 bg-card/60 rounded-2xl border border-dashed border-border text-center space-y-3'>
        <div className='p-4 rounded-full bg-muted text-muted-foreground'>
          <FileText className='w-8 h-8' />
        </div>
        <div className='space-y-1'>
          <h3 className='font-semibold text-base text-foreground'>
            Tidak ada riwayat perubahan diet ditemukan
          </h3>
          <p className='text-xs text-muted-foreground max-w-md'>
            Coba atur ulang kata kunci pencarian atau sesuaikan filter staf Gizi-RS dan jenis perubahan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md overflow-hidden shadow-sm'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader className='bg-muted/40'>
            <TableRow className='hover:bg-transparent border-b border-border/80'>
              <TableHead className='w-[140px] text-xs font-semibold text-foreground py-3.5'>
                Waktu & Sesi
              </TableHead>
              <TableHead className='min-w-[180px] text-xs font-semibold text-foreground py-3.5'>
                Pasien & Lokasi
              </TableHead>
              <TableHead className='min-w-[220px] text-xs font-semibold text-foreground py-3.5 bg-primary/5 dark:bg-primary/10 border-x border-primary/10'>
                Staf Gizi-RS (Pencatat)
              </TableHead>
              <TableHead className='min-w-[240px] text-xs font-semibold text-foreground py-3.5'>
                Detail Perubahan Diet
              </TableHead>
              <TableHead className='w-[130px] text-xs font-semibold text-foreground py-3.5'>
                Status
              </TableHead>
              <TableHead className='w-[80px] text-xs font-semibold text-foreground text-center py-3.5'>
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='divide-y divide-border/60'>
            {items.map((item) => {
              const formattedDate = new Date(item.requested_at).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const formattedTime = new Date(item.requested_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              }) + ' WIB';

              // Badge styling for status
              let statusBadgeClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
              if (item.status === 'PENDING') {
                statusBadgeClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
              } else if (item.status === 'REJECTED') {
                statusBadgeClass = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
              } else if (item.status === 'SELESAI') {
                statusBadgeClass = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
              }

              // Badge for Waktu Makan
              let waktuBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
              if (item.waktu_makan === 'SIANG') {
                waktuBadgeClass = 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
              } else if (item.waktu_makan === 'MALAM') {
                waktuBadgeClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
              }

              // Badge for Jenis Perubahan
              let jenisBadge = { label: 'Perubahan Diet', variant: 'outline' };
              if (item.jenis_perubahan === 'NEW_PATIENT') {
                jenisBadge = { label: 'Pasien Baru (+1 Emergent)', variant: 'default' };
              } else if (item.jenis_perubahan === 'NPO') {
                jenisBadge = { label: 'Puasa / NPO (-1 Porsi)', variant: 'secondary' };
              } else if (item.jenis_perubahan === 'DISCHARGE') {
                jenisBadge = { label: 'Pasien Pulang', variant: 'destructive' };
              } else if (item.jenis_perubahan === 'ROOM_TRANSFER') {
                jenisBadge = { label: 'Pindah Ruangan', variant: 'outline' };
              } else if (item.jenis_perubahan.startsWith('KOREKSI_')) {
                jenisBadge = {
                  label: revisionTypeLabel(item.jenis_perubahan),
                  variant: 'secondary',
                };
              }

              return (
                <TableRow
                  key={item.id}
                  className='hover:bg-muted/30 transition-colors group'
                >
                  {/* Column 1: Waktu & Sesi */}
                  <TableCell className='py-3.5 align-top'>
                    <div className='space-y-1.5'>
                      <Badge variant='outline' className={`text-[10px] px-2 py-0.5 border-none font-semibold ${waktuBadgeClass}`}>
                        {item.waktu_makan}
                      </Badge>
                      <div className='text-xs font-medium text-foreground flex items-center gap-1.5'>
                        <Clock className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
                        {formattedTime}
                      </div>
                      <div className='text-[11px] text-muted-foreground'>
                        {formattedDate}
                      </div>
                    </div>
                  </TableCell>

                  {/* Column 2: Pasien & Lokasi */}
                  <TableCell className='py-3.5 align-top'>
                    <div className='space-y-1'>
                      <div className='font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors'>
                        {item.nama_pasien}
                      </div>
                      <div className='text-[11px] text-muted-foreground font-mono'>
                        {item.no_rm}
                      </div>
                      <div className='text-xs text-muted-foreground flex items-center gap-1 mt-1 flex-wrap'>
                        <span className='inline-flex items-center gap-1 bg-secondary/60 px-1.5 py-0.5 rounded text-[11px]'>
                          <Building className='w-3 h-3' /> {item.ruangan || 'Rawat Inap'}
                        </span>
                        <span className='inline-flex items-center gap-1 bg-secondary/60 px-1.5 py-0.5 rounded text-[11px]'>
                          <Bed className='w-3 h-3' /> {item.bed}
                        </span>
                        <span className='text-[10px] text-muted-foreground/80'>
                          ({item.kelas})
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Column 3: Explicit Registered Staf Gizi-RS (Nama & Email) */}
                  <TableCell className='py-3.5 align-top bg-primary/5 dark:bg-primary/10 border-x border-primary/10'>
                    <div className='space-y-1.5 p-2 rounded-xl bg-background/90 border border-primary/20 shadow-2xs'>
                      <div className='flex items-center gap-2'>
                        <div className='w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/30'>
                          {item.gizi_rs_name.charAt(0)}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <p className='text-xs font-bold text-foreground truncate flex items-center gap-1'>
                            <UserCheck className='w-3 h-3 text-primary shrink-0' />
                            {item.gizi_rs_name}
                          </p>
                          <p className='text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5 font-mono'>
                            <Mail className='w-3 h-3 text-primary/70 shrink-0' />
                            {item.gizi_rs_email}
                          </p>
                        </div>
                      </div>
                      <div className='pt-1 border-t border-border/40 flex items-center justify-between text-[10px]'>
                        <span className='text-primary font-medium bg-primary/10 px-1.5 py-0.2 rounded'>
                          Role: gizi-rs
                        </span>
                        <span className='text-muted-foreground'>Terdaftar</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Column 4: Detail Perubahan Diet (Before -> After) */}
                  <TableCell className='py-3.5 align-top'>
                    <div className='space-y-2'>
                      <Badge variant='outline' className='text-[10px] px-2 py-0.5'>
                        {jenisBadge.label}
                      </Badge>

                      {/* Before vs After diet box */}
                      <div className='flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs bg-muted/30 p-2 rounded-lg border border-border/50'>
                        {item.data_lama?.diet ? (
                          <span className='text-muted-foreground line-through text-[11px]'>
                            {item.data_lama.diet}
                          </span>
                        ) : (
                          <span className='text-muted-foreground text-[11px] font-mono'>
                            [Awal: -]
                          </span>
                        )}

                        <ArrowRight className='w-3 h-3 text-primary shrink-0 hidden sm:inline' />

                        {item.data_baru?.diet ? (
                          <span className='font-bold text-primary text-xs'>
                            {item.data_baru.diet}
                          </span>
                        ) : (
                          <span className='font-medium text-foreground text-xs'>
                            -
                          </span>
                        )}
                      </div>

                      {item.alasan && (
                        <p className='text-[11px] text-muted-foreground line-clamp-1 italic'>
                          &ldquo;{item.alasan}&rdquo;
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Column 5: Status */}
                  <TableCell className='py-3.5 align-top'>
                    <div className='space-y-1.5'>
                      <Badge className={`text-[10px] font-semibold ${statusBadgeClass}`}>
                        {item.status}
                      </Badge>
                      {item.reviewed_by && (
                        <div className='text-[10px] text-muted-foreground'>
                          Verifikator: <span className='font-medium text-foreground'>{item.reviewed_by}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Column 6: Aksi */}
                  <TableCell className='py-3.5 align-top text-center'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onSelectDetail(item)}
                      className='h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary'
                      title='Lihat Detail Audit'
                    >
                      <Eye className='w-4 h-4' />
                    </Button>
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
