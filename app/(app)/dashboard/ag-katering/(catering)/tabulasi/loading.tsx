import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TabulasiLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full'>
      {/* Header Bar Skeleton */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Skeleton className='h-7 w-52 rounded-lg' />
            <Skeleton className='h-5 w-24 rounded-full' />
          </div>
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          <Skeleton className='h-9 w-32 rounded-lg' />
          <Skeleton className='h-9 w-24 rounded-lg' />
        </div>
      </div>

      {/* Control Bar: Date, Meal Chips, Cycle Selector */}
      <div className='flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl border bg-card/40'>
        <div className='flex items-center gap-2 flex-wrap'>
          <Skeleton className='h-9 w-40 rounded-lg' />
          <div className='flex items-center gap-1.5'>
            <Skeleton className='h-9 w-20 rounded-lg' />
            <Skeleton className='h-9 w-20 rounded-lg' />
            <Skeleton className='h-9 w-20 rounded-lg' />
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-32 rounded-lg' />
          <Skeleton className='h-9 w-28 rounded-lg' />
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
            <Skeleton className='h-7 w-16' />
            <Skeleton className='h-3 w-28' />
          </div>
        ))}
      </div>

      {/* Matrix Table Skeleton */}
      <div className='rounded-xl border bg-card/60 overflow-hidden'>
        <div className='h-12 bg-muted/40 border-b px-4 flex items-center gap-4'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-20 ml-auto' />
        </div>
        <div className='divide-y divide-border/30'>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className='p-3.5 px-4 flex items-center gap-4'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-6 w-12 rounded-md' />
              <Skeleton className='h-6 w-12 rounded-md' />
              <Skeleton className='h-6 w-12 rounded-md' />
              <Skeleton className='h-6 w-12 rounded-md' />
              <Skeleton className='h-6 w-16 rounded-md ml-auto' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
