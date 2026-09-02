import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CetakEtiketLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full'>
      {/* Header Banner Skeleton */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-card'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2.5'>
            <Skeleton className='h-6 w-6 rounded-md' />
            <Skeleton className='h-7 w-64 rounded-lg' />
          </div>
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='flex items-center gap-2.5'>
          <Skeleton className='h-9 w-32 rounded-xl' />
          <Skeleton className='h-9 w-28 rounded-xl' />
          <Skeleton className='h-9 w-24 rounded-xl' />
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='p-4 rounded-2xl border bg-card flex items-start justify-between'
          >
            <div className='space-y-2'>
              <Skeleton className='h-3.5 w-28' />
              <Skeleton className='h-8 w-16' />
              <Skeleton className='h-3 w-36' />
            </div>
            <Skeleton className='h-9 w-9 rounded-xl' />
          </div>
        ))}
      </div>

      {/* Tab Skeleton */}
      <div className='flex items-center gap-6 border-b border-border/80 px-1 pb-3'>
        <Skeleton className='h-6 w-48 rounded-lg' />
        <Skeleton className='h-6 w-48 rounded-lg' />
      </div>

      {/* Filter Bar Skeleton */}
      <div className='flex flex-wrap items-center gap-2.5 bg-card p-3 rounded-2xl border'>
        <Skeleton className='h-9 flex-1 min-w-[240px] rounded-xl' />
        <Skeleton className='h-9 w-28 rounded-xl' />
        <Skeleton className='h-9 w-28 rounded-xl' />
        <Skeleton className='h-9 w-28 rounded-xl' />
        <Skeleton className='h-9 w-28 rounded-xl' />
      </div>

      {/* Table Skeleton */}
      <div className='border rounded-2xl bg-card overflow-hidden'>
        <div className='p-4 border-b bg-muted/30 flex items-center justify-between'>
          <Skeleton className='h-5 w-full max-w-md' />
        </div>
        <div className='divide-y'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='p-4 flex items-center justify-between gap-4'>
              <Skeleton className='h-4 w-6' />
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-6 w-16 rounded-md' />
              <Skeleton className='h-4 w-12' />
              <Skeleton className='h-6 w-14 rounded-full' />
              <Skeleton className='h-7 w-20 rounded-lg' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
