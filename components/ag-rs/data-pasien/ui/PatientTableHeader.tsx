'use client';

import { TableHeader, TableRow, TableHead } from '@/components/ui/table';

export function PatientTableHeader() {
  return (
    <TableHeader>
      <TableRow className='bg-muted/50'>
        <TableHead className='font-semibold w-12 text-center'>No</TableHead>
        <TableHead className='font-semibold'>Nama Pasien</TableHead>
        <TableHead className='font-semibold'>No. RM</TableHead>
        <TableHead className='font-semibold'>Diet</TableHead>
        <TableHead className='font-semibold'>Kelas</TableHead>
        <TableHead className='font-semibold'>Ruangan</TableHead>
        <TableHead className='font-semibold'>Bed</TableHead>
        <TableHead className='font-semibold'>Gedung</TableHead>
        <TableHead className='font-semibold'>Status</TableHead>
        <TableHead className='font-semibold text-right'>Action</TableHead>
      </TableRow>
    </TableHeader>
  );
}
