'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface CetakEtiketStatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconContainerClass?: string;
  cardBorderClass?: string;
}

export default function CetakEtiketStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconContainerClass = 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  cardBorderClass = '',
}: CetakEtiketStatCardProps) {
  return (
    <Card className={`rounded-2xl border shadow-2xs bg-card ${cardBorderClass}`}>
      <CardContent className='p-4 flex items-start justify-between'>
        <div className='space-y-1'>
          <p className='text-xs font-medium text-muted-foreground'>{title}</p>
          <p className='text-3xl font-extrabold tracking-tight text-foreground'>
            {value}
          </p>
          <p className='text-[11px] text-muted-foreground'>{subtitle}</p>
        </div>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconContainerClass}`}
        >
          <Icon className='w-4 h-4' />
        </div>
      </CardContent>
    </Card>
  );
}
