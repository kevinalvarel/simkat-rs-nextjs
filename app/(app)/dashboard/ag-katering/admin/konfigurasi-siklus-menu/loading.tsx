import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function KonfigurasiSiklusMenuLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full'>
      {/* Header Banner Skeleton */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent'>
        <div className='space-y-1.5'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Skeleton className='h-7 w-64 rounded-lg' />
            <Skeleton className='h-5 w-32 rounded-full' />
          </div>
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          <Skeleton className='h-9 w-32 rounded-lg' />
          <Skeleton className='h-9 w-24 rounded-lg' />
        </div>
      </div>

      {/* Cycle Selector Tab Bar Skeleton */}
      <div className='flex items-center gap-2 overflow-x-auto pb-2'>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className='h-9 w-24 shrink-0 rounded-lg' />
        ))}
      </div>

      {/* Toolbar Skeleton */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border bg-card/40'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-36 rounded-lg' />
          <Skeleton className='h-9 w-28 rounded-lg' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-28 rounded-lg' />
          <Skeleton className='h-9 w-28 rounded-lg' />
        </div>
      </div>

      {/* Matrix Table Skeleton */}
      <div className='rounded-xl border bg-card/60 overflow-hidden'>
        <div className='h-12 bg-muted/40 border-b px-4 flex items-center gap-4'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-24' />
        </div>
        <div className='divide-y divide-border/30'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='p-4 flex items-start gap-4'>
              <Skeleton className='h-5 w-28 mt-1' />
              <div className='flex-1 grid grid-cols-4 gap-3'>
                <div className='space-y-1.5 p-2 rounded-lg border bg-muted/20'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-3 w-16' />
                </div>
                <div className='space-y-1.5 p-2 rounded-lg border bg-muted/20'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-3 w-16' />
                </div>
                <div className='space-y-1.5 p-2 rounded-lg border bg-muted/20'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-3 w-16' />
                </div>
                <div className='space-y-1.5 p-2 rounded-lg border bg-muted/20'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-3 w-16' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
