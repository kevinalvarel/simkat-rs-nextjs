'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Utensils, CheckCircle, XCircle, Layers } from 'lucide-react';
import type { KategoriMenuItem } from '@/servers/konfigurasi-menu.service';

interface MenuStatsProps {
  items: KategoriMenuItem[];
}

export default function MenuStats({ items }: MenuStatsProps) {
  const totalItems = items.length;
  const activeItems = items.filter((i) => i.is_active).length;
  const inactiveItems = items.filter((i) => !i.is_active).length;
  const uniqueCategories = new Set(items.map((i) => i.nama_kategori)).size;

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
      {/* Total Item Menu */}
      <Card className='border bg-card shadow-xs'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div>
            <p className='text-xs text-muted-foreground font-medium'>
              Total Item Menu
            </p>
            <h3 className='text-2xl font-bold tracking-tight text-foreground mt-0.5'>
              {totalItems}
            </h3>
            <p className='text-[11px] text-muted-foreground mt-1'>
              Terdaftar di database
            </p>
          </div>
          <div className='p-3 rounded-xl bg-primary/10 text-primary'>
            <Utensils className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* Item Aktif */}
      <Card className='border bg-card shadow-xs'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div>
            <p className='text-xs text-muted-foreground font-medium'>
              Menu Status Aktif
            </p>
            <h3 className='text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5'>
              {activeItems}
            </h3>
            <p className='text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1'>
              Tampil di Opsi Mapping
            </p>
          </div>
          <div className='p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
            <CheckCircle className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* Non-Aktif */}
      <Card className='border bg-card shadow-xs'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div>
            <p className='text-xs text-muted-foreground font-medium'>
              Non-Aktif
            </p>
            <h3 className='text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 mt-0.5'>
              {inactiveItems}
            </h3>
            <p className='text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1'>
              Disembunyikan
            </p>
          </div>
          <div className='p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400'>
            <XCircle className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* Kategori Menu */}
      <Card className='border bg-card shadow-xs'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div>
            <p className='text-xs text-muted-foreground font-medium'>
              Kelompok Kategori
            </p>
            <h3 className='text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 mt-0.5'>
              {uniqueCategories}
            </h3>
            <p className='text-[11px] text-indigo-700/80 dark:text-indigo-400/80 mt-1'>
              Kelompok Standar
            </p>
          </div>
          <div className='p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'>
            <Layers className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
