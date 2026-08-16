import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft, Loader2 } from 'lucide-react';
import GedungCard from '@/components/ag-rs/selection/ui/GedungCard';
import type { GedungWithRuangan } from '@/servers/tempat.service';
import type { MealTimeType } from '@/types/ag-rs-types';

interface StepGedungSectionProps {
  selectedMealTime: MealTimeType;
  isLoading: boolean;
  gedungList: GedungWithRuangan[];
  onBack: () => void;
  onSelectGedung: (gedung: GedungWithRuangan) => void;
}

export default function StepGedungSection({
  selectedMealTime,
  isLoading,
  gedungList,
  onBack,
  onSelectGedung,
}: StepGedungSectionProps) {
  return (
    <div className='space-y-4 animate-in fade-in-50 duration-300'>
      {/* Back navigation header chip */}
      <div className='flex items-center justify-between bg-secondary/50 p-3 px-4 rounded-lg border border-border'>
        <span className='text-sm font-medium flex items-center gap-2'>
          <Clock className='w-4 h-4 text-primary' />
          Waktu Makan: <strong className='text-primary'>{selectedMealTime}</strong>
        </span>
        <Button
          variant='ghost'
          size='sm'
          onClick={onBack}
          className='gap-1 text-xs hover:bg-secondary cursor-pointer'
        >
          <ArrowLeft className='w-3.5 h-3.5' /> Ganti Waktu Makan
        </Button>
      </div>

      {isLoading ? (
        <div className='flex flex-col items-center justify-center p-8 space-y-3'>
          <Loader2 className='w-8 h-8 animate-spin text-primary' />
          <p className='text-xs text-muted-foreground'>
            Memuat data gedung...
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
          {gedungList.map((gedung, index) => (
            <GedungCard
              key={gedung.idGedung || index}
              gedung={gedung}
              onSelect={() => onSelectGedung(gedung)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
