'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw } from 'lucide-react';
import type { KwitansiFilterState } from '@/types/kwitansitypes';

interface KwitansiFilterBarProps {
  filter: KwitansiFilterState;
  onFilterChange: (newFilter: Partial<KwitansiFilterState>) => void;
  onResetFilter: () => void;
  gedungOptions: string[];
  ruanganOptions: string[];
  dietOptions: string[];
  totalFiltered: number;
  totalAll: number;
}

export default function KwitansiFilterBar({
  filter,
  onFilterChange,
  onResetFilter,
  gedungOptions,
  ruanganOptions,
  dietOptions,
  totalFiltered,
  totalAll,
}: KwitansiFilterBarProps) {
  const isFiltered =
    Boolean(filter.search.trim()) ||
    filter.gedung !== 'ALL' ||
    filter.ruangan !== 'ALL' ||
    filter.kelas !== 'ALL' ||
    filter.diet !== 'ALL' ||
    filter.status !== 'ALL';

  return (
    <div className='bg-card border rounded-2xl p-4 shadow-2xs space-y-3'>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-center'>
        {/* Search */}
        <div className='relative lg:col-span-2'>
          <Search className='w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Cari nama pasien / No RM...'
            value={filter.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className='pl-8.5 h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20'
          />
        </div>

        {/* Gedung Filter */}
        <div>
          <Select
            value={filter.gedung}
            onValueChange={(val) => onFilterChange({ gedung: val || 'ALL' })}
          >
            <SelectTrigger className='h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20'>
              <SelectValue placeholder='Semua Gedung' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL' className='text-xs'>
                Semua Gedung
              </SelectItem>
              {gedungOptions.map((g) => (
                <SelectItem key={g} value={g} className='text-xs'>
                  Gedung {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ruangan Filter */}
        <div>
          <Select
            value={filter.ruangan}
            onValueChange={(val) => onFilterChange({ ruangan: val || 'ALL' })}
          >
            <SelectTrigger className='h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20'>
              <SelectValue placeholder='Semua Ruangan' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL' className='text-xs'>
                Semua Ruangan
              </SelectItem>
              {ruanganOptions.map((r) => (
                <SelectItem key={r} value={r} className='text-xs'>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Kelas Filter */}
        <div>
          <Select
            value={filter.kelas}
            onValueChange={(val) => onFilterChange({ kelas: val || 'ALL' })}
          >
            <SelectTrigger className='h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20'>
              <SelectValue placeholder='Semua Kelas' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL' className='text-xs'>
                Semua Kelas
              </SelectItem>
              <SelectItem value='VIP' className='text-xs'>
                VIP
              </SelectItem>
              <SelectItem value='Kelas 1' className='text-xs'>
                Kelas 1
              </SelectItem>
              <SelectItem value='Kelas 2' className='text-xs'>
                Kelas 2
              </SelectItem>
              <SelectItem value='Kelas 3' className='text-xs'>
                Kelas 3
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter & Reset */}
        <div className='flex items-center gap-1.5'>
          <Select
            value={filter.status}
            onValueChange={(val) => onFilterChange({ status: val || 'ALL' })}
          >
            <SelectTrigger className='h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 flex-1'>
              <SelectValue placeholder='Semua Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL' className='text-xs'>
                Semua Status
              </SelectItem>
              <SelectItem value='AKTIF' className='text-xs'>
                Aktif (Makan)
              </SelectItem>
              <SelectItem value='NPO' className='text-xs'>
                NPO (Puasa)
              </SelectItem>
              <SelectItem value='EMERGENT' className='text-xs'>
                Emergent / Cito
              </SelectItem>
            </SelectContent>
          </Select>

          {isFiltered && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onResetFilter}
              className='h-9 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded-xl shrink-0'
              title='Reset Filter'
            >
              <RotateCcw className='w-3.5 h-3.5' />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Info Footer */}
      <div className='flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-dashed border-border/80'>
        <span>
          Menampilkan <strong className='text-foreground'>{totalFiltered}</strong> dari total{' '}
          <strong>{totalAll}</strong> pasien
        </span>
        {isFiltered && (
          <span className='text-primary font-medium'>
            Filter sedang aktif
          </span>
        )}
      </div>
    </div>
  );
}
