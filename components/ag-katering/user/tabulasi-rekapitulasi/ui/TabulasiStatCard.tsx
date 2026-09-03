'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

export interface TabulasiStatCardProps {
  title: string;
  value: number | string;
  unit: string;
  subtext: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

export default function TabulasiStatCard({
  title,
  value,
  unit,
  subtext,
  icon: Icon,
  color,
  bg,
  border,
}: TabulasiStatCardProps) {
  return (
    <Card
      className={`border ${border} bg-card rounded-2xl shadow-2xs transition-all hover:shadow-xs`}
    >
      <CardContent className='p-4 sm:p-5 flex flex-col justify-between h-full space-y-3'>
        {/* Top: Icon & Title */}
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[11px] sm:text-xs font-semibold text-muted-foreground line-clamp-1'>
            {title}
          </span>
          <div className={`p-2 rounded-xl ${bg} ${color} shrink-0`}>
            <Icon className='w-4 h-4' />
          </div>
        </div>

        {/* Middle: Number & Unit */}
        <div className='space-y-0.5'>
          <div className='flex items-baseline gap-1.5'>
            <span className='text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono'>
              {value}
            </span>
            <span className='text-xs font-medium text-muted-foreground'>
              {unit}
            </span>
          </div>
          <p className='text-[11px] text-muted-foreground line-clamp-1'>
            {subtext}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
