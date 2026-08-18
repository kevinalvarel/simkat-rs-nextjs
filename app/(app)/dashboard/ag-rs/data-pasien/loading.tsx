import React from 'react';
import Navbar from '@/components/ag-rs/navbar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function DataPasienLoading() {
  return (
    <div className='min-h-dvh flex flex-col bg-background text-foreground'>
      <Navbar />

      <main className='flex-1 p-4 sm:p-6 md:p-8'>
        <div className='mx-auto max-w-7xl space-y-6'>
          {/* Header Skeleton */}
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='space-y-2'>
              <div className='h-8 w-48 bg-muted animate-pulse rounded-md' />
              <div className='h-4 w-64 bg-muted/60 animate-pulse rounded-md' />
            </div>
            <div className='flex gap-2'>
              <div className='h-9 w-24 bg-muted animate-pulse rounded-md' />
              <div className='h-9 w-36 bg-muted animate-pulse rounded-md' />
            </div>
          </div>

          {/* Search Toolbar Skeleton */}
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
            <div className='h-9 w-full sm:max-w-sm bg-muted animate-pulse rounded-md' />
            <div className='h-4 w-32 bg-muted/60 animate-pulse rounded-md' />
          </div>

          {/* Table Skeleton */}
          <div className='rounded-lg border overflow-hidden'>
            <Table>
              <TableHeader className='bg-muted/50'>
                <TableRow>
                  <TableHead className='w-12 text-center'>No</TableHead>
                  <TableHead className='min-w-[150px]'>Nama Pasien</TableHead>
                  <TableHead className='min-w-[120px]'>No. RM</TableHead>
                  <TableHead className='min-w-[140px]'>Diet</TableHead>
                  <TableHead className='min-w-[100px]'>Kelas</TableHead>
                  <TableHead className='min-w-[120px]'>Ruangan</TableHead>
                  <TableHead className='min-w-[80px]'>Bed</TableHead>
                  <TableHead className='min-w-[120px]'>Gedung</TableHead>
                  <TableHead className='min-w-[130px]'>Status</TableHead>
                  <TableHead className='w-16 text-right'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <TableRow key={i} className='animate-pulse'>
                    <TableCell className='text-center'>
                      <div className='h-4 w-4 bg-muted rounded mx-auto' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-32 bg-muted rounded' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-20 bg-muted/80 rounded font-mono' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-24 bg-muted rounded' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-16 bg-muted/70 rounded' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-20 bg-muted/60 rounded' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-12 bg-muted/80 rounded' />
                    </TableCell>
                    <TableCell>
                      <div className='h-4 w-24 bg-muted/60 rounded' />
                    </TableCell>
                    <TableCell>
                      <div className='h-5 w-20 bg-muted rounded-full' />
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='h-7 w-7 bg-muted rounded-md ml-auto' />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
