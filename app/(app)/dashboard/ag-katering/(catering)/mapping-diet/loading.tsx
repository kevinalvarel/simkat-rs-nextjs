import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MappingDietLoading() {
  return (
    <div className='flex flex-1 flex-col gap-5 sm:gap-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header Banner Skeleton */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 rounded-2xl border bg-gradient-to-r from-rose-500/5 via-primary/5 to-transparent shadow-xs'>
        <div className='space-y-1.5'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Skeleton className='h-7 w-48 rounded-lg' />
            <Skeleton className='h-5 w-36 rounded-full' />
          </div>
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-20 rounded-md' />
        </div>
      </div>

      {/* 2. Info Banner Skeleton */}
      <div className='flex items-start gap-3 p-3.5 px-4 rounded-xl border bg-blue-500/5'>
        <Skeleton className='h-4 w-4 rounded-full mt-0.5 shrink-0' />
        <div className='space-y-1 w-full'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-3.5 w-full max-w-2xl' />
        </div>
      </div>

      {/* 3. Stats Cards Skeleton */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='p-4 rounded-xl border bg-card/60 space-y-2.5'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-3.5 w-24' />
              <Skeleton className='h-7 w-7 rounded-lg' />
            </div>
            <Skeleton className='h-7 w-16' />
            <Skeleton className='h-3 w-32' />
          </div>
        ))}
      </div>

      {/* 4. Filter Bar Skeleton */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border bg-card/40'>
        <Skeleton className='h-9 w-full sm:max-w-xs rounded-lg' />
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-32 rounded-lg' />
          <Skeleton className='h-9 w-20 rounded-lg' />
        </div>
      </div>

      {/* 5. Results Count Skeleton */}
      <div className='flex items-center justify-between px-1'>
        <Skeleton className='h-3.5 w-40' />
      </div>

      {/* 6. Main Table Skeleton */}
      <div className='rounded-xl border bg-card/60 overflow-hidden'>
        <div className='h-11 bg-muted/40 border-b px-4 flex items-center gap-4'>
          <Skeleton className='h-4 w-4 rounded' />
          <Skeleton className='h-4 w-8' />
          <Skeleton className='h-4 w-48' />
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-16 ml-auto' />
        </div>
        <div className='divide-y divide-border/30'>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className='p-3.5 px-4 flex items-center gap-4'>
              <Skeleton className='h-4 w-4 rounded' />
              <Skeleton className='h-4 w-6' />
              <div className='space-y-1 w-48'>
                <Skeleton className='h-4 w-36' />
                <Skeleton className='h-3 w-24' />
              </div>
              <Skeleton className='h-6 w-36 rounded-md' />
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-5 w-20 rounded-full' />
              <Skeleton className='h-8 w-20 rounded-md ml-auto' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
