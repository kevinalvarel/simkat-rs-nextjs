import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full'>
      {/* Header Banner Skeleton */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-muted/20'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-7 w-48 rounded-lg' />
            <Skeleton className='h-5 w-28 rounded-full' />
          </div>
          <Skeleton className='h-4 w-72 max-w-full' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-24 rounded-md' />
          <Skeleton className='h-9 w-28 rounded-md' />
        </div>
      </div>

      {/* Summary Cards Grid Skeleton */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='p-4 rounded-xl border bg-card/60 space-y-3'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-8 w-8 rounded-lg' />
            </div>
            <Skeleton className='h-8 w-16' />
            <Skeleton className='h-3 w-32' />
          </div>
        ))}
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border bg-card/40'>
        <Skeleton className='h-9 w-full sm:max-w-xs rounded-lg' />
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-32 rounded-lg' />
          <Skeleton className='h-9 w-28 rounded-lg' />
        </div>
      </div>

      {/* Content / Table Skeleton */}
      <div className='rounded-xl border bg-card/60 overflow-hidden'>
        <div className='h-12 bg-muted/40 border-b px-4 flex items-center gap-4'>
          <Skeleton className='h-4 w-10' />
          <Skeleton className='h-4 w-36' />
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-20 ml-auto' />
        </div>
        <div className='divide-y divide-border/40'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className='p-4 flex items-center gap-4'>
              <Skeleton className='h-4 w-6' />
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-8 w-20 rounded-md ml-auto' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
