import React from 'react';
import Navbar from '@/components/ag-rs/navbar';
import { Card, CardContent } from '@/components/ui/card';

export default function AhliGiziRSLoading() {
  return (
    <div className='min-h-dvh flex flex-col bg-background text-foreground'>
      <Navbar />

      <main className='flex-1 grid place-items-center p-4 sm:p-6 md:p-8'>
        <div className='w-full max-w-2xl space-y-6'>
          {/* Header Skeleton */}
          <div className='text-center space-y-2'>
            <div className='h-8 w-64 bg-muted animate-pulse rounded-md mx-auto' />
            <div className='h-4 w-80 max-w-full bg-muted/60 animate-pulse rounded-md mx-auto' />
          </div>

          {/* Progress Indicator Skeleton */}
          <div className='flex items-center justify-center gap-3'>
            <div className='flex items-center gap-1.5'>
              <div className='h-2.5 w-12 rounded-full bg-primary/40 animate-pulse' />
              <div className='h-3 w-16 bg-muted animate-pulse rounded hidden sm:inline-block' />
            </div>
            <div className='flex items-center gap-1.5'>
              <div className='h-2.5 w-8 rounded-full bg-muted animate-pulse' />
              <div className='h-3 w-12 bg-muted/60 animate-pulse rounded hidden sm:inline-block' />
            </div>
            <div className='flex items-center gap-1.5'>
              <div className='h-2.5 w-8 rounded-full bg-muted animate-pulse' />
              <div className='h-3 w-14 bg-muted/60 animate-pulse rounded hidden sm:inline-block' />
            </div>
          </div>

          {/* Callout Notice Skeleton */}
          <div className='h-12 w-full bg-muted/40 rounded-xl border border-border/40 animate-pulse' />

          {/* 3 Meal Card Skeletons */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            {[1, 2, 3].map((i) => (
              <Card key={i} className='border-2 border-border/50 animate-pulse'>
                <CardContent className='p-5 flex flex-col items-center text-center space-y-4 justify-between min-h-[220px]'>
                  <div className='w-full flex justify-end'>
                    <div className='h-5 w-16 bg-muted rounded-full' />
                  </div>
                  <div className='space-y-2 flex flex-col items-center w-full'>
                    <div className='w-14 h-14 rounded-full bg-muted' />
                    <div className='h-5 w-24 bg-muted rounded mx-auto' />
                    <div className='h-3 w-32 bg-muted/70 rounded mx-auto' />
                    <div className='h-3 w-20 bg-muted/50 rounded mx-auto' />
                  </div>
                  <div className='h-8 w-full bg-muted rounded-md' />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
