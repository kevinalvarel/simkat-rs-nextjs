import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OtorisasiPerubahanDietLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full'>
      {/* Header Banner Skeleton */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-gradient-to-r from-purple-500/10 via-primary/5 to-transparent'>
        <div className='space-y-1.5'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Skeleton className='h-7 w-64 rounded-lg' />
            <Skeleton className='h-5 w-44 rounded-full' />
          </div>
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-24 rounded-lg' />
        </div>
      </div>

      {/* Summary Cards Skeleton (3 cards) */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='p-4 rounded-xl border bg-card/60 space-y-2.5'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-3.5 w-28' />
              <Skeleton className='h-7 w-7 rounded-lg' />
            </div>
            <Skeleton className='h-7 w-12' />
            <Skeleton className='h-3 w-36' />
          </div>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border bg-card/40'>
        <Skeleton className='h-9 w-full sm:max-w-xs rounded-lg' />
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-32 rounded-lg' />
          <Skeleton className='h-9 w-32 rounded-lg' />
          <Skeleton className='h-9 w-20 rounded-lg' />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className='rounded-xl border bg-card/60 overflow-hidden'>
        <div className='h-11 bg-muted/40 border-b px-4 flex items-center gap-4'>
          <Skeleton className='h-4 w-4 rounded' />
          <Skeleton className='h-4 w-8' />
          <Skeleton className='h-4 w-36' />
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-28 ml-auto' />
        </div>
        <div className='divide-y divide-border/30'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className='p-3.5 px-4 flex items-center gap-4'>
              <Skeleton className='h-4 w-4 rounded' />
              <Skeleton className='h-4 w-6' />
              <div className='space-y-1 w-36'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-3 w-16' />
              </div>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-5 w-24 rounded-full' />
              <Skeleton className='h-5 w-20 rounded-full' />
              <div className='flex items-center gap-1.5 ml-auto'>
                <Skeleton className='h-8 w-20 rounded-md' />
                <Skeleton className='h-8 w-16 rounded-md' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
