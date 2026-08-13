'use client';

import React from 'react';
import { UserPlus, ShieldCheck } from 'lucide-react';

export function TambahPenggunaHeader() {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-purple-500/10 via-primary/5 to-transparent p-6 rounded-2xl border border-purple-500/20 shadow-xs'>
      <div className='space-y-1.5'>
        <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2.5'>
          <div className='p-2 bg-purple-500/10 rounded-xl border border-purple-500/20'>
            <UserPlus className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          </div>
          Tambah & Manajemen Pengguna
        </h1>
        <p className='text-xs sm:text-sm text-muted-foreground max-w-2xl'>
          Modul khusus <strong>Supervisor</strong> untuk pendaftaran dan pengelolaan akun akses pengguna sistem (Ahli Gizi Katering, Ahli Gizi RS, & Supervisor).
        </p>
      </div>

      <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold self-start sm:self-auto shrink-0'>
        <ShieldCheck className='w-4 h-4' />
        Akses Khusus Supervisor
      </div>
    </div>
  );
}
