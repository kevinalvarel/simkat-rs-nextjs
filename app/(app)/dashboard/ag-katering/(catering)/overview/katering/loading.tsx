import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OverviewPemorsianLoading() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full'>
      {/* Header ringkas */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-7 w-64 rounded-lg' />
            <Skeleton className='h-5 w-20 rounded-full' />
          </div>
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-32 rounded-lg' />
          <Skeleton className='h-8 w-24 rounded-lg' />
        </div>
      </div>

      {/* Tabel utama */}
      <div className='rounded-2xl border bg-card/60 overflow-hidden'>
        <div className='px-4 py-3 border-b flex flex-col sm:flex-row gap-2.5'>
          <Skeleton className='h-9 flex-1 rounded-xl' />
          <Skeleton className='h-4 w-32 rounded-full self-center' />
        </div>
        <div className='divide-y'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className='px-4 py-3 flex items-center gap-4'>
              <Skeleton className='h-4 w-8' />
              <div className='space-y-1.5 flex-1'>
                <Skeleton className='h-4 w-40' />
                <Skeleton className='h-3 w-24' />
              </div>
              <Skeleton className='h-4 w-28 hidden sm:block' />
              <Skeleton className='h-6 w-32 rounded-md' />
              <Skeleton className='h-5 w-24 rounded-full' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
