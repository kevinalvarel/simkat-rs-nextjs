import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function KonfigurasiRuanganLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full'>
      {/* Header Banner Skeleton */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent'>
        <div className='space-y-1.5'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Skeleton className='h-7 w-64 rounded-lg' />
            <Skeleton className='h-5 w-32 rounded-full' />
          </div>
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-36 rounded-lg' />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='p-4 rounded-xl border bg-card/60 space-y-2.5'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-3.5 w-24' />
              <Skeleton className='h-7 w-7 rounded-lg' />
            </div>
            <Skeleton className='h-7 w-12' />
            <Skeleton className='h-3 w-28' />
          </div>
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className='flex items-center justify-between gap-3 p-3 rounded-xl border bg-card/40'>
        <Skeleton className='h-9 w-full sm:max-w-sm rounded-lg' />
        <Skeleton className='h-9 w-32 rounded-lg' />
      </div>

      {/* Gedung Cards List Skeleton */}
      <div className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='rounded-xl border bg-card/60 overflow-hidden space-y-4 p-5'>
            <div className='flex items-center justify-between border-b pb-4'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-10 w-10 rounded-lg' />
                <div className='space-y-1'>
                  <Skeleton className='h-5 w-36' />
                  <Skeleton className='h-3.5 w-24' />
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-8 w-28 rounded-md' />
                <Skeleton className='h-8 w-8 rounded-md' />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1'>
              {[1, 2, 3].map((j) => (
                <div key={j} className='p-3.5 rounded-lg border bg-muted/20 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-5 w-16 rounded-full' />
                  </div>
                  <Skeleton className='h-3 w-32' />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
