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
import { Search, X, Filter } from 'lucide-react';
import type { PemorsianFilterState } from '@/types/pemorsiantypes';

interface PemorsianFilterBarProps {
  filter: PemorsianFilterState;
  onFilterChange: (newFilter: Partial<PemorsianFilterState>) => void;
  onReset: () => void;
  gedungOptions: string[];
  ruanganOptions: string[];
  dietOptions: string[];
}

export default function PemorsianFilterBar({
  filter,
  onFilterChange,
  onReset,
  gedungOptions,
  ruanganOptions,
  dietOptions,
}: PemorsianFilterBarProps) {
  const isFiltered =
    filter.search.trim() !== '' ||
    filter.gedung !== 'ALL' ||
    filter.ruangan !== 'ALL' ||
    filter.diet !== 'ALL' ||
    filter.status !== 'ALL';

  return (
    <div className='flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-xl border border-border shadow-2xs'>
      {/* Search Input */}
      <div className='relative flex-1 min-w-[200px]'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Cari nama pasien / No RM...'
          value={filter.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className='pl-9 h-9 text-xs sm:text-sm bg-background'
        />
        {filter.search && (
          <button
            onClick={() => onFilterChange({ search: '' })}
            className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
          >
            <X className='w-3.5 h-3.5' />
          </button>
        )}
      </div>

      {/* Dropdown Filters */}
      <div className='flex flex-wrap items-center gap-2'>
        {/* Gedung Filter */}
        <div className='w-full sm:w-auto min-w-[130px]'>
          <Select
            value={filter.gedung}
            onValueChange={(val) => onFilterChange({ gedung: val || 'ALL' })}
          >
            <SelectTrigger className='h-9 text-xs bg-background'>
              <SelectValue placeholder='Semua Gedung' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Semua Gedung</SelectItem>
              {gedungOptions.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ruangan Filter */}
        <div className='w-full sm:w-auto min-w-[130px]'>
          <Select
            value={filter.ruangan}
            onValueChange={(val) => onFilterChange({ ruangan: val || 'ALL' })}
          >
            <SelectTrigger className='h-9 text-xs bg-background'>
              <SelectValue placeholder='Semua Ruangan' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Semua Ruangan</SelectItem>
              {ruanganOptions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Diet Filter */}
        <div className='w-full sm:w-auto min-w-[130px]'>
          <Select
            value={filter.diet}
            onValueChange={(val) => onFilterChange({ diet: val || 'ALL' })}
          >
            <SelectTrigger className='h-9 text-xs bg-background'>
              <SelectValue placeholder='Semua Diet' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Semua Diet</SelectItem>
              {dietOptions.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className='w-full sm:w-auto min-w-[110px]'>
          <Select
            value={filter.status}
            onValueChange={(val) => onFilterChange({ status: val || 'ALL' })}
          >
            <SelectTrigger className='h-9 text-xs bg-background'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Semua Status</SelectItem>
              <SelectItem value='AKTIF'>Aktif</SelectItem>
              <SelectItem value='NPO'>NPO / Puasa</SelectItem>
              <SelectItem value='EMERGENT'>Emergent (+1)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onReset}
            className='h-9 px-2 text-xs text-muted-foreground hover:text-foreground gap-1'
          >
            <X className='w-3.5 h-3.5' /> Reset
          </Button>
        )}
      </div>
    </div>
  );
}
