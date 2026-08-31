import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatusSnapshotLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full'>
      {/* Header Banner Skeleton */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent'>
        <div className='space-y-1.5'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Skeleton className='h-7 w-56 rounded-lg' />
            <Skeleton className='h-5 w-44 rounded-full' />
          </div>
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-24 rounded-lg' />
        </div>
      </div>

      {/* 3 Cutoff Config Cards Skeleton */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-5 w-48' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='p-5 rounded-xl border bg-card/60 space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <Skeleton className='h-5 w-28' />
                  <Skeleton className='h-3.5 w-32' />
                </div>
                <Skeleton className='h-6 w-16 rounded-full' />
              </div>
              <div className='p-3 rounded-lg border bg-muted/20 space-y-2'>
                <Skeleton className='h-3 w-20' />
                <Skeleton className='h-8 w-28' />
              </div>
              <div className='flex items-center justify-between pt-1'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-8 w-20 rounded-md' />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Snapshot History Table Skeleton */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-5 w-44' />
          <Skeleton className='h-4 w-24' />
        </div>

        <div className='rounded-xl border bg-card/60 overflow-hidden'>
          <div className='h-11 bg-muted/40 border-b px-4 flex items-center gap-4'>
            <Skeleton className='h-4 w-8' />
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-20 ml-auto' />
          </div>
          <div className='divide-y divide-border/30'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='p-4 flex items-center gap-4'>
                <Skeleton className='h-4 w-6' />
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-5 w-20 rounded-full' />
                <Skeleton className='h-8 w-20 rounded-md ml-auto' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
