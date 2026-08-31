import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AgKateringLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full'>
      {/* Header Banner Skeleton */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-gradient-to-r from-muted/40 via-muted/20 to-transparent'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-7 w-52 rounded-lg' />
            <Skeleton className='h-5 w-32 rounded-full' />
          </div>
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-24 rounded-md' />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='p-4 rounded-xl border bg-card/50 space-y-2.5'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-7 w-7 rounded-lg' />
            </div>
            <Skeleton className='h-8 w-16' />
            <Skeleton className='h-3 w-28' />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className='space-y-4'>
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border bg-card/30'>
          <Skeleton className='h-9 w-full sm:max-w-sm rounded-lg' />
          <div className='flex items-center gap-2'>
            <Skeleton className='h-9 w-28 rounded-lg' />
            <Skeleton className='h-9 w-24 rounded-lg' />
          </div>
        </div>

        <div className='rounded-xl border bg-card/50 overflow-hidden'>
          <div className='h-11 bg-muted/40 border-b px-4 flex items-center gap-4'>
            <Skeleton className='h-4 w-8' />
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-4 w-20 ml-auto' />
          </div>
          <div className='divide-y divide-border/30'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='p-4 flex items-center gap-4'>
                <Skeleton className='h-4 w-6' />
                <Skeleton className='h-4 w-36' />
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-8 w-24 rounded-md ml-auto' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
