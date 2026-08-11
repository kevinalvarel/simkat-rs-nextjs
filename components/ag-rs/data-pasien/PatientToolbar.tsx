'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface PatientToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  totalCount: number;
  filteredCount: number;
}

export default function PatientToolbar({
  searchQuery,
  onSearchChange,
  totalCount,
  filteredCount,
}: PatientToolbarProps) {
  return (
    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
      <div className='relative flex-1 w-full sm:max-w-sm'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          id='search-pasien'
          placeholder='Cari nama pasien atau No. RM...'
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-9'
        />
      </div>
      <p className='text-sm text-muted-foreground whitespace-nowrap'>
        {searchQuery ? (
          <>
            Menampilkan{' '}
            <strong className='text-foreground'>{filteredCount}</strong> dari{' '}
            <strong className='text-foreground'>{totalCount}</strong> pasien
          </>
        ) : (
          <>
            Total{' '}
            <strong className='text-foreground'>{totalCount}</strong> pasien
          </>
        )}
      </p>
    </div>
  );
}
