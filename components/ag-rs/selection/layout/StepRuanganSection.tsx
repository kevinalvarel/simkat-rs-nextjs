import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Building2, DoorOpen, ArrowLeft } from 'lucide-react';
import RuanganCard from '@/components/ag-rs/selection/ui/RuanganCard';
import type {
  GedungWithRuangan,
  RuanganItem,
} from '@/servers/tempat.service';
import type { MealTimeType } from '@/types/ag-rs-types';

interface StepRuanganSectionProps {
  selectedMealTime: MealTimeType;
  selectedGedung: GedungWithRuangan;
  selectedRuangan?: RuanganItem | null;
  onBack: () => void;
  onSelectRuangan: (ruangan: RuanganItem) => void;
}

export default function StepRuanganSection({
  selectedMealTime,
  selectedGedung,
  selectedRuangan,
  onBack,
  onSelectRuangan,
}: StepRuanganSectionProps) {
  return (
    <div className='space-y-4 animate-in fade-in-50 duration-300'>
      {/* Back navigation header chips */}
      <div className='flex flex-wrap items-center justify-between bg-secondary/50 p-3 px-4 rounded-lg border border-border gap-2'>
        <div className='flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium'>
          <span className='flex items-center gap-1.5'>
            <Clock className='w-3.5 h-3.5 text-primary' />
            Waktu: <strong className='text-primary'>{selectedMealTime}</strong>
          </span>
          <span className='text-muted-foreground'>•</span>
          <span className='flex items-center gap-1.5'>
            <Building2 className='w-3.5 h-3.5 text-primary' />
            Gedung:{' '}
            <strong className='text-primary'>{selectedGedung.namaGedung}</strong>
          </span>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={onBack}
          className='gap-1 text-xs hover:bg-secondary cursor-pointer'
        >
          <ArrowLeft className='w-3.5 h-3.5' /> Ganti Gedung
        </Button>
      </div>

      {selectedGedung.ruanganList.length === 0 ? (
        <Card className='p-8 text-center border-dashed'>
          <DoorOpen className='w-10 h-10 text-muted-foreground mx-auto mb-2' />
          <p className='text-sm text-muted-foreground'>
            Belum ada ruangan yang terdaftar di gedung ini.
          </p>
        </Card>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
          {selectedGedung.ruanganList.map((ruangan) => (
            <RuanganCard
              key={ruangan.idRuangan}
              ruangan={ruangan}
              isSelected={selectedRuangan?.idRuangan === ruangan.idRuangan}
              onSelect={() => onSelectRuangan(ruangan)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
