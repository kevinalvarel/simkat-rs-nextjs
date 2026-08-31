import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OverviewProduksiLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full'>
      {/* Header Banner with Live Clock Placeholder */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Skeleton className='h-7 w-56 rounded-lg' />
            <Skeleton className='h-5 w-24 rounded-full' />
          </div>
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card/60'>
            <Skeleton className='h-3 w-3 rounded-full' />
            <Skeleton className='h-5 w-20' />
          </div>
          <Skeleton className='h-9 w-24 rounded-lg' />
        </div>
      </div>

      {/* Grid: Summary Sidebar + Production Cards */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Left Column: Summary Metric Cards */}
        <div className='space-y-4 lg:col-span-1'>
          <div className='p-5 rounded-xl border bg-card/60 space-y-4'>
            <Skeleton className='h-4 w-32' />
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='p-3 rounded-lg border bg-muted/20 space-y-2'>
                  <Skeleton className='h-3.5 w-20' />
                  <Skeleton className='h-6 w-14' />
                  <Skeleton className='h-2 w-full rounded-full' />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Menu Production Grid */}
        <div className='space-y-4 lg:col-span-3'>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-4 w-28' />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className='p-4 rounded-xl border bg-card/60 space-y-3'>
                <div className='flex items-center justify-between'>
                  <Skeleton className='h-5 w-28 rounded-md' />
                  <Skeleton className='h-5 w-14 rounded-full' />
                </div>
                <div className='space-y-1.5'>
                  <Skeleton className='h-4 w-36' />
                  <div className='flex justify-between items-baseline'>
                    <Skeleton className='h-7 w-16' />
                    <Skeleton className='h-3.5 w-16' />
                  </div>
                </div>
                <Skeleton className='h-2.5 w-full rounded-full' />
                <div className='flex justify-between text-xs pt-1'>
                  <Skeleton className='h-3 w-16' />
                  <Skeleton className='h-3 w-16' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
