'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CetakEtiketFilterOptions } from '@/types/cetaketikettypes';

interface CetakEtiketFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterRuangan: string;
  onFilterRuanganChange: (value: string) => void;
  filterKelas: string;
  onFilterKelasChange: (value: string) => void;
  filterDiet: string;
  onFilterDietChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterOptions: CetakEtiketFilterOptions;
  showFilters?: boolean;
}

export default function CetakEtiketFilters({
  searchQuery,
  onSearchChange,
  filterRuangan,
  onFilterRuanganChange,
  filterKelas,
  onFilterKelasChange,
  filterDiet,
  onFilterDietChange,
  filterStatus,
  onFilterStatusChange,
  filterOptions,
  showFilters = true,
}: CetakEtiketFiltersProps) {
  return (
    <div className='flex flex-wrap items-center gap-2.5 bg-card p-3 rounded-2xl border shadow-2xs'>
      {/* Search Input */}
      <div className='relative flex-1 min-w-[240px]'>
        <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder='Cari nama pasien / No RM...'
          className='pl-9 h-9 text-xs rounded-xl bg-background border-border font-medium'
        />
      </div>

      {showFilters && (
        <>
          {/* Filter Ruangan */}
          <div className='w-[110px] sm:w-[130px]'>
            <Select
              value={filterRuangan}
              onValueChange={(val) => onFilterRuanganChange(val ?? 'ALL')}
            >
              <SelectTrigger className='h-9 text-xs bg-background rounded-xl font-medium border-border'>
                <SelectValue placeholder='Ruangan' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL' className='text-xs font-semibold'>
                  ALL
                </SelectItem>
                {filterOptions.ruangan.map((ruang) => (
                  <SelectItem
                    key={ruang}
                    value={ruang}
                    className='text-xs font-medium'
                  >
                    {ruang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Kelas */}
          <div className='w-[100px] sm:w-[120px]'>
            <Select
              value={filterKelas}
              onValueChange={(val) => onFilterKelasChange(val ?? 'ALL')}
            >
              <SelectTrigger className='h-9 text-xs bg-background rounded-xl font-medium border-border'>
                <SelectValue placeholder='Kelas' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL' className='text-xs font-semibold'>
                  ALL
                </SelectItem>
                {filterOptions.kelas.map((k) => (
                  <SelectItem
                    key={k}
                    value={k}
                    className='text-xs font-medium'
                  >
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Diet */}
          <div className='w-[110px] sm:w-[130px]'>
            <Select
              value={filterDiet}
              onValueChange={(val) => onFilterDietChange(val ?? 'ALL')}
            >
              <SelectTrigger className='h-9 text-xs bg-background rounded-xl font-medium border-border'>
                <SelectValue placeholder='Diet' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL' className='text-xs font-semibold'>
                  ALL
                </SelectItem>
                {filterOptions.diet.map((d) => (
                  <SelectItem
                    key={d}
                    value={d}
                    className='text-xs font-medium'
                  >
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Status */}
          <div className='w-[100px] sm:w-[120px]'>
            <Select
              value={filterStatus}
              onValueChange={(val) => onFilterStatusChange(val ?? 'ALL')}
            >
              <SelectTrigger className='h-9 text-xs bg-background rounded-xl font-medium border-border'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL' className='text-xs font-semibold'>
                  ALL Status
                </SelectItem>
                <SelectItem
                  value='SUDAH_DICETAK'
                  className='text-xs font-medium text-emerald-700'
                >
                  ✓ Sudah Dicetak
                </SelectItem>
                <SelectItem
                  value='BELUM_DICETAK'
                  className='text-xs font-medium text-amber-700'
                >
                  ⏳ Belum Dicetak
                </SelectItem>
                <SelectItem
                  value='AKTIF'
                  className='text-xs font-medium text-emerald-700'
                >
                  Aktif
                </SelectItem>
                <SelectItem
                  value='PUASA'
                  className='text-xs font-medium text-rose-700'
                >
                  Puasa
                </SelectItem>
                <SelectItem
                  value='PULANG'
                  className='text-xs font-medium text-slate-700'
                >
                  Pulang
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}
