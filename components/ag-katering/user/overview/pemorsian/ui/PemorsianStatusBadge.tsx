import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PemorsianStatusBadgeProps {
  status: string;
  isEmergent?: boolean;
}

export default function PemorsianStatusBadge({
  status,
  isEmergent = false,
}: PemorsianStatusBadgeProps) {
  if (isEmergent || status === 'EMERGENT') {
    return (
      <Badge
        variant='outline'
        className='bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold px-2 py-0.5'
      >
        Emergent (+1)
      </Badge>
    );
  }

  const normalized = (status || '').toUpperCase();

  if (normalized === 'NPO' || normalized === 'PUASA') {
    return (
      <Badge
        variant='outline'
        className='bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs font-semibold px-2 py-0.5'
      >
        NPO / Puasa
      </Badge>
    );
  }

  if (normalized === 'PULANG') {
    return (
      <Badge
        variant='outline'
        className='bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 text-xs font-semibold px-2 py-0.5'
      >
        Pulang
      </Badge>
    );
  }

  return (
    <Badge
      variant='outline'
      className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold px-2 py-0.5'
    >
      Aktif
    </Badge>
  );
}
