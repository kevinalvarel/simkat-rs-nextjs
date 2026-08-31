'use client';

import { useState, useEffect } from 'react';
import type { SnapshotBatch, SnapshotDetail } from '@/servers/snapshot.service';
import { getSnapshotDetailsByBatchId } from '@/servers/snapshot.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, Lock, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SnapshotDetailDialogProps {
  batch: SnapshotBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SnapshotDetailDialog({
  batch,
  open,
  onOpenChange,
}: SnapshotDetailDialogProps) {
  const [details, setDetails] = useState<SnapshotDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (open && batch) {
      setLoading(true);
      getSnapshotDetailsByBatchId(batch.id)
        .then((res) => setDetails(res))
        .catch(() => setDetails([]))
        .finally(() => setLoading(false));
    }
  }, [open, batch]);

  const filteredDetails = details.filter(
    (d) =>
      d.nama_pasien.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.no_rm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ruangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.diet_rs_raw.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!batch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[85vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Lock className='h-5 w-5 text-emerald-600' />
            Detail Batch Snapshot: {batch.batch_code}
          </DialogTitle>
          <DialogDescription className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs pt-1'>
            <span>
              Waktu Makan: <strong className='text-foreground'>{batch.waktu_makan}</strong>
            </span>
            <span>•</span>
            <span>
              Tanggal: <strong className='text-foreground'>{batch.tanggal_produksi}</strong>
            </span>
            <span>•</span>
            <span>
              Total Pasien: <strong className='text-emerald-600 font-semibold'>{batch.total_pasien} Pasien</strong>
            </span>
            <span>•</span>
            <span>
              Waktu Cut-Off: <strong className='text-foreground'>{batch.cutoff_time || '-'} WIB</strong>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className='flex items-center gap-3 py-2'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Cari nama pasien, No. RM, ruangan, atau diet...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 h-9 text-xs'
            />
          </div>
          <span className='text-xs text-muted-foreground whitespace-nowrap'>
            {filteredDetails.length} dari {details.length} pasien
          </span>
        </div>

        <div className='flex-1 overflow-y-auto rounded-lg border'>
          {loading ? (
            <div className='p-4 space-y-3'>
              <div className='flex items-center gap-4 py-2 border-b border-muted'>
                <Skeleton className='h-4 w-6' />
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-4 w-12' />
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-4 w-24 ml-auto' />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className='flex items-center gap-4 py-2.5'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-36' />
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-28' />
                  <Skeleton className='h-4 w-12' />
                  <Skeleton className='h-5 w-16 rounded-full' />
                  <Skeleton className='h-5 w-24 rounded-full ml-auto' />
                </div>
              ))}
            </div>
          ) : filteredDetails.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center space-y-2'>
              <Users className='h-8 w-8 text-muted-foreground' />
              <p className='text-sm font-medium'>Tidak ada data pasien</p>
              <p className='text-xs text-muted-foreground'>
                {searchQuery
                  ? 'Pencarian tidak cocok dengan data pasien.'
                  : 'Batch snapshot ini tidak memiliki record pasien.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50 text-xs'>
                  <TableHead className='w-10 text-center font-semibold'>No</TableHead>
                  <TableHead className='font-semibold'>Nama Pasien</TableHead>
                  <TableHead className='font-semibold'>No. RM</TableHead>
                  <TableHead className='font-semibold'>Gedung / Ruangan</TableHead>
                  <TableHead className='font-semibold'>Bed</TableHead>
                  <TableHead className='font-semibold'>Kelas</TableHead>
                  <TableHead className='font-semibold'>Diet Terkunci</TableHead>
                  <TableHead className='font-semibold text-center'>Emergent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='text-xs'>
                {filteredDetails.map((p, index) => (
                  <TableRow key={p.id || index} className='hover:bg-muted/30'>
                    <TableCell className='text-center text-muted-foreground font-mono'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='font-medium'>{p.nama_pasien}</TableCell>
                    <TableCell className='font-mono'>{p.no_rm}</TableCell>
                    <TableCell>
                      <span className='font-medium'>{p.ruangan}</span>
                      <span className='text-muted-foreground block text-[11px]'>
                        {p.gedung}
                      </span>
                    </TableCell>
                    <TableCell className='font-mono font-medium'>{p.no_bed}</TableCell>
                    <TableCell>{p.kelas}</TableCell>
                    <TableCell className='font-semibold text-primary'>
                      {p.diet_rs_raw}
                    </TableCell>
                    <TableCell className='text-center'>
                      {p.is_emergent ? (
                        <Badge variant='outline' className='bg-amber-100 text-amber-800 border-amber-300 text-[10px]'>
                          <ShieldAlert className='w-3 h-3 mr-1' /> Emergent
                        </Badge>
                      ) : (
                        <span className='text-muted-foreground text-[11px]'>Reguler</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
