'use client';

import React from 'react';

interface PasienStatusBadgeProps {
  status?: string | null;
}

export default function PasienStatusBadge({ status }: PasienStatusBadgeProps) {
  const statusUpper = (status || 'AKTIF').toUpperCase();

  if (statusUpper === 'PULANG') {
    return (
      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200'>
        Pulang
      </span>
    );
  }

  if (statusUpper === 'NPO' || statusUpper === 'PUASA') {
    return (
      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200'>
        Puasa
      </span>
    );
  }

  return (
    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
      Aktif
    </span>
  );
}
