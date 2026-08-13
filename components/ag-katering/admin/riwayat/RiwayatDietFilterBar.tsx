'use client';

import React from 'react';
import type { GiziRsUser } from '@/servers/riwayat-diet.service';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, UserCheck, Utensils, Tag, ShieldAlert } from 'lucide-react';

interface RiwayatDietFilterBarProps {
  giziRsUsers: GiziRsUser[];
  searchQuery: string;
  selectedStaffEmail: string;
  selectedWaktuMakan: string;
  selectedJenisPerubahan: string;
  selectedStatus: string;
  onSearchChange: (value: string) => void;
  onStaffEmailChange: (value: string) => void;
  onWaktuMakanChange: (value: string) => void;
  onJenisPerubahanChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onResetFilters: () => void;
}

export function RiwayatDietFilterBar({
  giziRsUsers,
  searchQuery,
  selectedStaffEmail,
  selectedWaktuMakan,
  selectedJenisPerubahan,
  selectedStatus,
  onSearchChange,
  onStaffEmailChange,
  onWaktuMakanChange,
  onJenisPerubahanChange,
  onStatusChange,
  onResetFilters,
}: RiwayatDietFilterBarProps) {
  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedStaffEmail !== 'ALL' ||
    selectedWaktuMakan !== 'ALL' ||
    selectedJenisPerubahan !== 'ALL' ||
    selectedStatus !== 'ALL';

  return (
    <div className='bg-card/70 backdrop-blur-md border border-border/80 p-4 rounded-xl shadow-sm space-y-3.5'>
      <div className='flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between'>
        {/* Search Input */}
        <div className='relative flex-1 min-w-[240px]'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Cari Pasien, No RM, Staf Gizi, atau Email...'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className='pl-9 text-xs sm:text-sm h-10 bg-background/80 border-border/80 focus:ring-primary/20'
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-wrap'>
          {/* Filter 1: Staf Gizi-RS (Displays Registered Name & Email) */}
          <Select value={selectedStaffEmail} onValueChange={(val) => onStaffEmailChange(val || 'ALL')}>
            <SelectTrigger className='h-10 text-xs bg-background/80 border-border/80 min-w-[170px]'>
              <div className='flex items-center gap-1.5 truncate'>
                <UserCheck className='w-3.5 h-3.5 text-primary shrink-0' />
                <SelectValue placeholder='Filter Staf Gizi-RS' />
              </div>
            </SelectTrigger>
            <SelectContent className='max-h-60'>
              <SelectItem value='ALL' className='text-xs font-medium'>
                Semua Staf Gizi-RS
              </SelectItem>
              {giziRsUsers.map((usr) => (
                <SelectItem key={usr.id} value={usr.email} className='text-xs'>
                  <div className='flex flex-col py-0.5'>
                    <span className='font-semibold text-foreground'>{usr.name}</span>
                    <span className='text-[11px] text-muted-foreground'>{usr.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter 2: Waktu Makan */}
          <Select value={selectedWaktuMakan} onValueChange={(val) => onWaktuMakanChange(val || 'ALL')}>
            <SelectTrigger className='h-10 text-xs bg-background/80 border-border/80'>
              <div className='flex items-center gap-1.5 truncate'>
                <Utensils className='w-3.5 h-3.5 text-amber-500 shrink-0' />
                <SelectValue placeholder='Waktu Makan' />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL' className='text-xs'>Semua Jam Makan</SelectItem>
              <SelectItem value='PAGI' className='text-xs'>Makan Pagi</SelectItem>
              <SelectItem value='SIANG' className='text-xs'>Makan Siang</SelectItem>
              <SelectItem value='MALAM' className='text-xs'>Makan Malam</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter 3: Jenis Perubahan */}
          <Select value={selectedJenisPerubahan} onValueChange={(val) => onJenisPerubahanChange(val || 'ALL')}>
            <SelectTrigger className='h-10 text-xs bg-background/80 border-border/80'>
              <div className='flex items-center gap-1.5 truncate'>
                <Tag className='w-3.5 h-3.5 text-indigo-500 shrink-0' />
                <SelectValue placeholder='Jenis Perubahan' />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL' className='text-xs'>Semua Jenis Perubahan</SelectItem>
              <SelectItem value='DIET_CHANGE' className='text-xs'>Perubahan Diet</SelectItem>
              <SelectItem value='NEW_PATIENT' className='text-xs'>Pasien Baru (Emergent)</SelectItem>
              <SelectItem value='NPO' className='text-xs'>Puasa / NPO</SelectItem>
              <SelectItem value='ROOM_TRANSFER' className='text-xs'>Pindah Ruangan</SelectItem>
              <SelectItem value='DISCHARGE' className='text-xs'>Pasien Pulang</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter 4: Status */}
          <Select value={selectedStatus} onValueChange={(val) => onStatusChange(val || 'ALL')}>
            <SelectTrigger className='h-10 text-xs bg-background/80 border-border/80'>
              <div className='flex items-center gap-1.5 truncate'>
                <ShieldAlert className='w-3.5 h-3.5 text-emerald-500 shrink-0' />
                <SelectValue placeholder='Status Histori' />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL' className='text-xs'>Semua Status</SelectItem>
              <SelectItem value='APPROVED' className='text-xs'>Approved (Disetujui)</SelectItem>
              <SelectItem value='SELESAI' className='text-xs'>Selesai</SelectItem>
              <SelectItem value='PENDING' className='text-xs'>Pending</SelectItem>
              <SelectItem value='REJECTED' className='text-xs'>Rejected (Ditolak)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        {isFiltered && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onResetFilters}
            className='gap-1.5 text-xs h-10 text-muted-foreground hover:text-foreground shrink-0'
          >
            <RotateCcw className='w-3.5 h-3.5' /> Reset
          </Button>
        )}
      </div>
    </div>
  );
}
