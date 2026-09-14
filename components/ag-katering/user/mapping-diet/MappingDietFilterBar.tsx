'use client';

import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MappingDietFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  onReset: () => void;
  tab?: 'UNMAPPED' | 'MAPPED';
}

export default function MappingDietFilterBar({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onReset,
  tab = 'UNMAPPED',
}: MappingDietFilterBarProps) {
  const isFiltered = searchQuery !== '' || selectedStatus !== 'ALL';

  return (
    <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3.5 sm:p-4 rounded-xl border shadow-xs w-full min-w-0'>
      {/* Search */}
      <div className='relative flex-1 w-full min-w-0'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          type='text'
          placeholder={
            tab === 'MAPPED'
              ? 'Cari raw text di Master Mapping... (mis. "BN TKTP", "NPO")'
              : 'Cari diet RS raw... (mis. "RG Lunak", "DM 1700")'
          }
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-9 text-xs sm:text-sm rounded-lg bg-background w-full'
        />
      </div>

      {/* Filters */}
      <div className='flex items-center gap-2 flex-wrap w-full sm:w-auto'>
        {/* Status Filter */}
        <Select
          value={selectedStatus}
          onValueChange={(value) => onStatusChange(value || 'ALL')}
        >
          <SelectTrigger className='h-9 text-xs bg-background min-w-[150px]'>
            <SelectValue placeholder='Semua Status' />
          </SelectTrigger>
          <SelectContent className='w-full'>
            <SelectItem value='ALL'>Semua Status</SelectItem>
            {tab === 'UNMAPPED' ? (
              <>
                <SelectItem value='UNMAPPED'>
                  UNMAPPED (Belum Dipetakan)
                </SelectItem>
                <SelectItem value='PARTIAL'>
                  PARTIAL (Data Lama)
                </SelectItem>
              </>
            ) : (
              <>
                <SelectItem value='STANDARD'>Menu Standar Siklus</SelectItem>
                <SelectItem value='NPO'>NPO / Puasa</SelectItem>
                <SelectItem value='KATERING'>Alihkan ke AG Katering</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        {/* Reset */}
        {isFiltered && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onReset}
            className='h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1'
          >
            <RotateCcw className='w-3.5 h-3.5' />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
