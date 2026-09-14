'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PemorsianRevisiItem } from '@/types/cetaketikettypes';
import { canPrintRevision, revisionTypeLabel } from '@/lib/revisi-etiket';

interface CetakEtiketRevisiTableProps {
  revisions: PemorsianRevisiItem[];
  waktuMakan?: string;
  onPrintRevisi: (revisi: PemorsianRevisiItem) => void;
  onPrintAll: (revisions: PemorsianRevisiItem[]) => void;
}

export default function CetakEtiketRevisiTable({
  revisions,
  waktuMakan,
  onPrintRevisi,
  onPrintAll,
}: CetakEtiketRevisiTableProps) {
  const printable = revisions.filter((item) => canPrintRevision(item.jenis_perubahan));
  return (
    <div className='border rounded-2xl bg-card overflow-hidden shadow-2xs'>
      <div className='flex items-center justify-between gap-3 border-b p-3'>
        <span className='text-xs text-muted-foreground'>{printable.length} etiket revisi siap dicetak</span>
        <Button size='sm' disabled={printable.length === 0} onClick={() => onPrintAll(printable)}>
          <Printer className='w-3.5 h-3.5' /> Cetak Semua Revisi ({printable.length})
        </Button>
      </div>
      <Table>
        <TableHeader className='bg-muted/30'>
          <TableRow className='hover:bg-transparent border-b'>
            <TableHead className='w-[45px] pl-4 text-xs font-bold text-foreground'>
              No
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              Nama Pasien
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              No RM
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              Ruangan & Bed
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              Jenis Perubahan
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>Status Cetak Revisi</TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              Komparasi Data
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              Waktu
            </TableHead>
            <TableHead className='text-right pr-4 text-xs font-bold text-foreground'>
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {revisions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className='h-32 text-center text-xs text-muted-foreground'
              >
                Tidak ada perubahan atau revisi susulan pada snapshot ini.
              </TableCell>
            </TableRow>
          ) : (
            revisions.map((revisi, index) => (
              <TableRow
                key={revisi.id}
                className='hover:bg-muted/40 transition-colors text-xs'
              >
                <TableCell className='pl-4 font-mono font-medium text-muted-foreground'>
                  {index + 1}
                </TableCell>

                <TableCell>
                  <div className='flex flex-col'>
                    <span className='font-bold text-foreground text-xs'>
                      {revisi.nama_pasien}
                    </span>
                    <span className='text-[11px] text-muted-foreground'>
                      {revisi.kelas || 'Kelas Umum'}
                    </span>
                  </div>
                </TableCell>

                <TableCell className='font-mono font-semibold text-foreground/90'>
                  {revisi.no_rm || '-'}
                </TableCell>

                <TableCell className='text-foreground'>
                  {revisi.data_baru?.ruangan || revisi.ruangan} (
                  {revisi.data_baru?.bed || revisi.bed || '-'})
                </TableCell>

                <TableCell>
                  <Badge
                    variant='outline'
                    className='bg-amber-500/10 text-amber-700 border-amber-300 font-semibold text-[11px] px-2 py-0.5'
                  >
                    {revisionTypeLabel(revisi.jenis_perubahan)}
                  </Badge>
                </TableCell>

                <TableCell>
                  {canPrintRevision(revisi.jenis_perubahan) ? (
                    <Badge variant='outline' className={revisi.revision_print_status === 'SUDAH_DICETAK' ? 'border-emerald-500 text-emerald-700' : 'border-amber-500 text-amber-700'}>
                      {revisi.revision_print_status === 'SUDAH_DICETAK' ? 'Revisi Sudah Tercetak' : 'Revisi Belum Tercetak'}
                    </Badge>
                  ) : <span className='text-xs text-muted-foreground'>Tidak perlu etiket</span>}
                </TableCell>

                <TableCell>
                  <div className='flex flex-col gap-0.5'>
                    {revisi.data_lama?.diet && revisi.data_baru?.diet && (
                      <span className='text-[11px]'>
                        <span className='line-through text-rose-500'>
                          {revisi.data_lama.diet}
                        </span>{' '}
                        &rarr;{' '}
                        <span className='font-bold text-emerald-700'>
                          {revisi.data_baru.diet}
                        </span>
                      </span>
                    )}
                    {revisi.alasan && (
                      <span className='text-[10px] text-muted-foreground italic'>
                        {revisi.alasan}
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <span className='font-semibold text-emerald-600 capitalize'>
                    {(
                      revisi.waktu_makan ||
                      waktuMakan ||
                      'SIANG'
                    ).toLowerCase()}
                  </span>
                </TableCell>

                <TableCell className='text-right pr-4'>
                  {canPrintRevision(revisi.jenis_perubahan) ? <Button
                    variant='outline'
                    size='xs'
                    onClick={() => onPrintRevisi(revisi)}
                    className='h-7 px-2.5 text-xs font-semibold gap-1.5 border-amber-600/30 text-amber-800 hover:bg-amber-50 rounded-lg shadow-2xs'
                  >
                    <Printer className='w-3.5 h-3.5' />
                    {revisi.revision_print_status === 'SUDAH_DICETAK' ? 'Cetak Ulang' : 'Cetak Revisi'}
                  </Button> : <span className='text-xs text-muted-foreground'>Tidak dicetak</span>}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className='p-3 bg-muted/20 border-t flex items-center justify-between text-xs text-muted-foreground font-medium'>
        <span>Menampilkan {revisions.length} pasien revisi</span>
      </div>
    </div>
  );
}
