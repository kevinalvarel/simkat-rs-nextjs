import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FakturPenjualanLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header Skeleton */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Skeleton className='h-7 w-64 rounded-lg' />
            <Skeleton className='h-5 w-28 rounded-full' />
            <Skeleton className='h-5 w-36 rounded-full' />
          </div>
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          <Skeleton className='h-9 w-9 rounded-xl' />
          <Skeleton className='h-9 w-28 rounded-xl' />
          <Skeleton className='h-9 w-28 rounded-xl' />
          <Skeleton className='h-9 w-32 rounded-xl' />
        </div>
      </div>

      {/* 2. Stats Cards Skeleton */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5'>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className='p-4 rounded-2xl border bg-card/60 space-y-2.5'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-3.5 w-24' />
              <Skeleton className='h-7 w-7 rounded-lg' />
            </div>
            <Skeleton className='h-7 w-20' />
            <Skeleton className='h-3 w-28' />
          </div>
        ))}
      </div>

      {/* 3. Sales Table Skeleton */}
      <div className='rounded-2xl border bg-card/60 overflow-hidden'>
        <div className='h-14 bg-muted/30 border-b px-4 flex items-center gap-4'>
          <Skeleton className='h-5 w-48' />
          <Skeleton className='h-6 w-32 rounded-lg ml-auto' />
        </div>
        <div className='h-12 bg-muted/20 border-b px-4 flex items-center gap-4'>
          <Skeleton className='h-4 w-8' />
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-4 w-12' />
          <Skeleton className='h-4 w-24 ml-auto' />
          <Skeleton className='h-4 w-28' />
        </div>
        <div className='divide-y divide-border/30'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className='p-4 flex items-center gap-4'>
              <Skeleton className='h-4 w-6' />
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-5 w-16 rounded-full' />
              <Skeleton className='h-4 w-12' />
              <Skeleton className='h-4 w-10' />
              <Skeleton className='h-4 w-20 ml-auto' />
              <Skeleton className='h-4 w-24' />
            </div>
          ))}
        </div>
        <div className='h-12 bg-emerald-500/5 border-t-2 border-emerald-500/30 px-4 flex items-center gap-4'>
          <Skeleton className='h-4 w-6' />
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-12' />
          <Skeleton className='h-4 w-10' />
          <Skeleton className='h-4 w-20 ml-auto' />
          <Skeleton className='h-5 w-28' />
        </div>
      </div>
    </div>
  );
}
