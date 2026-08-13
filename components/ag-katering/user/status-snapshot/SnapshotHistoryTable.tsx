'use client';

import { useState } from 'react';
import type { SnapshotBatch } from '@/servers/snapshot.service';
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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Lock, Eye, History, Calendar, Users, FileCheck } from 'lucide-react';

interface SnapshotHistoryTableProps {
  batches: SnapshotBatch[];
  onSelectBatch: (batch: SnapshotBatch) => void;
}

export default function SnapshotHistoryTable({
  batches,
  onSelectBatch,
}: SnapshotHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredBatches = batches.filter(
    (b) =>
      b.batch_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.waktu_makan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tanggal_produksi.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Card className='shadow-sm border'>
      <CardHeader className='pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <CardTitle className='text-lg font-bold flex items-center gap-2'>
            <History className='w-5 h-5 text-primary' />
            Riwayat Batch Snapshot Terkunci
          </CardTitle>
          <CardDescription className='text-xs mt-0.5'>
            Daftar snapshot batch data pasien yang telah dibekukan untuk produksi makanan katering
          </CardDescription>
        </div>

        {/* Search */}
        <div className='relative w-full sm:w-72'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Cari kode batch, tanggal, atau waktu...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9 h-9 text-xs'
          />
        </div>
      </CardHeader>

      <CardContent>
        {batches.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 border border-dashed rounded-lg text-center space-y-2'>
            <FileCheck className='w-10 h-10 text-muted-foreground' />
            <h4 className='font-semibold text-sm'>Belum Ada Snapshot Batch</h4>
            <p className='text-xs text-muted-foreground max-w-sm'>
              Belum ada data snapshot batch yang tersimpan. Gunakan tombol &quot;Snapshot Now&quot; atau tunggu jadwal cut-off otomatis.
            </p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-10 border border-dashed rounded-lg text-center space-y-1'>
            <Search className='w-8 h-8 text-muted-foreground' />
            <p className='text-sm font-medium'>Batch Tidak Ditemukan</p>
            <p className='text-xs text-muted-foreground'>
              Pencarian &quot;{searchQuery}&quot; tidak cocok dengan riwayat batch snapshot mana pun.
            </p>
          </div>
        ) : (
          <div className='rounded-lg border overflow-hidden'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/50 text-xs'>
                    <TableHead className='font-semibold'>Kode Batch</TableHead>
                    <TableHead className='font-semibold'>Tgl Produksi</TableHead>
                    <TableHead className='font-semibold'>Waktu Makan</TableHead>
                    <TableHead className='font-semibold'>Timestamp Snapshot</TableHead>
                    <TableHead className='font-semibold text-center'>Total Pasien</TableHead>
                    <TableHead className='font-semibold text-center'>Cut-Off Time</TableHead>
                    <TableHead className='font-semibold text-center'>Status</TableHead>
                    <TableHead className='font-semibold text-right'>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className='text-xs'>
                  {filteredBatches.map((batch) => {
                    const formattedTimestamp = new Date(
                      batch.timestamp_snapshot,
                    ).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <TableRow
                        key={batch.id}
                        className='hover:bg-muted/30 transition-colors group'
                      >
                        {/* Batch Code */}
                        <TableCell className='font-mono font-semibold text-primary'>
                          <div className='flex items-center gap-1.5'>
                            <Lock className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                            <span>{batch.batch_code}</span>
                          </div>
                        </TableCell>

                        {/* Tanggal Produksi */}
                        <TableCell className='whitespace-nowrap'>
                          <div className='flex items-center gap-1.5'>
                            <Calendar className='w-3.5 h-3.5 text-muted-foreground' />
                            <span>{batch.tanggal_produksi}</span>
                          </div>
                        </TableCell>

                        {/* Waktu Makan */}
                        <TableCell>
                          <Badge
                            variant='secondary'
                            className='font-semibold text-[11px]'
                          >
                            {batch.waktu_makan}
                          </Badge>
                        </TableCell>

                        {/* Timestamp */}
                        <TableCell className='text-muted-foreground whitespace-nowrap font-mono text-[11px]'>
                          {formattedTimestamp} WIB
                        </TableCell>

                        {/* Total Pasien */}
                        <TableCell className='text-center font-bold text-emerald-600 text-sm font-mono'>
                          <div className='flex items-center justify-center gap-1'>
                            <Users className='w-3.5 h-3.5 text-emerald-600' />
                            <span>{batch.total_pasien}</span>
                          </div>
                        </TableCell>

                        {/* Cut-off time */}
                        <TableCell className='text-center font-mono text-muted-foreground'>
                          {batch.cutoff_time || '-'} WIB
                        </TableCell>

                        {/* Status */}
                        <TableCell className='text-center'>
                          <Badge className='bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 text-[10px]'>
                            <Lock className='w-3 h-3 mr-1' /> {batch.status_batch}
                          </Badge>
                        </TableCell>

                        {/* Action */}
                        <TableCell className='text-right'>
                          <Button
                            size='sm'
                            variant='outline'
                            className='h-7 text-[11px] gap-1'
                            onClick={() => onSelectBatch(batch)}
                          >
                            <Eye className='w-3.5 h-3.5' /> Lihat Pasien
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
