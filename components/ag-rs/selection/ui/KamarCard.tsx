'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DoorClosed, BedDouble, LayoutGrid } from 'lucide-react';
import type { SelectedKamarItem } from '@/types/ag-rs-types';

interface KamarCardProps {
  kamar: SelectedKamarItem;
  isSelected?: boolean;
  isAllOption?: boolean;
  onSelect: () => void;
}

export default function KamarCard({
  kamar,
  isSelected = false,
  isAllOption = false,
  onSelect,
}: KamarCardProps) {
  return (
    <Card
      className={`cursor-pointer border-2 transition-all duration-200 group relative overflow-hidden ${
        isSelected
          ? 'border-primary ring-2 ring-primary/40 shadow-md scale-[1.02] bg-primary/5'
          : isAllOption
            ? 'border-dashed border-primary/40 hover:border-primary hover:shadow-md bg-secondary/30'
            : 'hover:border-primary hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <CardContent className='p-5 flex flex-col items-center text-center space-y-3'>
        <div
          className={`p-3 rounded-full transition-transform group-hover:scale-110 ${
            isAllOption
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary'
          }`}
        >
          {isAllOption ? (
            <LayoutGrid className='w-6 h-6' />
          ) : (
            <DoorClosed className='w-6 h-6' />
          )}
        </div>

        <div>
          <h4 className='font-semibold text-sm sm:text-base text-foreground'>
            {kamar.nomorKamar}
          </h4>
          <div className='flex items-center justify-center gap-1.5 flex-wrap mt-1.5'>
            <Badge
              variant='secondary'
              className='text-[11px] font-medium gap-1 px-2 py-0.5'
            >
              <BedDouble className='w-3 h-3 text-primary' />
              {kamar.jumlahBed} Bed
            </Badge>
            {kamar.kelas && (
              <Badge
                variant='outline'
                className='text-[11px] font-normal text-muted-foreground'
              >
                {kamar.kelas}
              </Badge>
            )}
          </div>
        </div>

        <Button
          size='sm'
          variant={isAllOption ? 'default' : 'default'}
          className='w-full mt-1 cursor-pointer'
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isAllOption ? 'Pilih Semua Kamar' : 'Pilih Kamar'}
        </Button>
      </CardContent>
    </Card>
  );
}
