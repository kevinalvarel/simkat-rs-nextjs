import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OverviewPemorsianLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full'>
      {/* Header Banner Skeleton */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Skeleton className='h-7 w-64 rounded-lg' />
            <Skeleton className='h-5 w-28 rounded-full' />
          </div>
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-9 w-40 rounded-xl' />
          <Skeleton className='h-9 w-24 rounded-xl' />
        </div>
      </div>

      {/* 3 Top Stat Cards Skeleton */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 w-full'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='p-4 sm:p-5 rounded-2xl border bg-card/60 flex items-center justify-between'
          >
            <div className='space-y-2'>
              <Skeleton className='h-3.5 w-24' />
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-3 w-36' />
            </div>
            <Skeleton className='h-11 w-11 rounded-2xl' />
          </div>
        ))}
      </div>

      {/* Full-width Cards Grid Skeleton */}
      <div className='w-full space-y-4'>
        <div className='p-4 rounded-2xl border bg-card/60 space-y-3'>
          <div className='flex items-center justify-between gap-3'>
            <Skeleton className='h-9 w-64 rounded-xl' />
            <Skeleton className='h-9 w-32 rounded-xl' />
          </div>
          <div className='flex items-center gap-2 pt-1'>
            <Skeleton className='h-8 w-28 rounded-xl' />
            <Skeleton className='h-8 w-28 rounded-xl' />
            <Skeleton className='h-8 w-28 rounded-xl' />
          </div>
        </div>

        {/* Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full'>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className='p-4 rounded-2xl border bg-card/60 space-y-3'
            >
              <div className='flex items-center justify-between'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-12 rounded-full' />
              </div>
              <div className='space-y-1.5'>
                <Skeleton className='h-5 w-40' />
                <Skeleton className='h-3.5 w-24' />
              </div>
              <div className='p-2 rounded-xl border bg-muted/30 space-y-1'>
                <Skeleton className='h-3 w-16' />
                <Skeleton className='h-4 w-36' />
              </div>
              <div className='flex items-center justify-between pt-2 border-t'>
                <Skeleton className='h-5 w-24 rounded-full' />
                <Skeleton className='h-7 w-16 rounded-lg' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
