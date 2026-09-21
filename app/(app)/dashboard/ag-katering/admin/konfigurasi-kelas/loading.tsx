import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function KonfigurasiKelasLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent'>
        <div className='space-y-1.5'>
          <Skeleton className='h-7 w-56 rounded-lg' />
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <Skeleton className='h-9 w-36 rounded-lg' />
      </div>
      <div className='rounded-xl border bg-card/60 p-5 space-y-3'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'
          >
            <Skeleton className='h-5 w-32' />
            <div className='flex gap-2'>
              <Skeleton className='h-8 w-16 rounded-md' />
              <Skeleton className='h-8 w-16 rounded-md' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
