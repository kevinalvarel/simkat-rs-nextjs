'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Building2, DoorOpen, ArrowLeft, DoorClosed, Layers } from 'lucide-react';
import KamarCard from '@/components/ag-rs/selection/ui/KamarCard';
import type {
  GedungWithRuangan,
  RuanganItem,
  KamarDetail,
} from '@/servers/tempat.service';
import type { MealTimeType, SelectedKamarItem } from '@/types/ag-rs-types';

interface StepKamarSectionProps {
  selectedMealTime: MealTimeType;
  selectedGedung: GedungWithRuangan;
  selectedRuangan: RuanganItem;
  selectedKamar?: SelectedKamarItem | null;
  onBack: () => void;
  onSelectKamar: (kamar: SelectedKamarItem) => void;
}

export default function StepKamarSection({
  selectedMealTime,
  selectedGedung,
  selectedRuangan,
  selectedKamar,
  onBack,
  onSelectKamar,
}: StepKamarSectionProps) {
  const kamarList: KamarDetail[] =
    selectedRuangan.kamarList && selectedRuangan.kamarList.length > 0
      ? selectedRuangan.kamarList
      : [
          {
            idKamar: `kamar-${selectedRuangan.idRuangan}-1`,
            nomorKamar: 'Kamar 1',
            jumlahBed: selectedRuangan.jumlahBed || 6,
            kelas: selectedRuangan.kelas || 'Kelas 1',
          },
        ];

  const totalBeds = kamarList.reduce((acc, k) => acc + (k.jumlahBed || 0), 0);

  const allKamarOption: SelectedKamarItem = {
    idKamar: 'all',
    nomorKamar: `Semua Kamar (${selectedRuangan.namaRuangan})`,
    jumlahBed: totalBeds,
    kelas: selectedRuangan.kelas,
  };

  return (
    <div className='space-y-4 animate-in fade-in-50 duration-300'>
      {/* Back navigation header chips */}
      <div className='flex flex-wrap items-center justify-between bg-secondary/50 p-3 px-4 rounded-lg border border-border gap-2'>
        <div className='flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-medium'>
          <span className='flex items-center gap-1.5'>
            <Clock className='w-3.5 h-3.5 text-primary' />
            <span className='text-muted-foreground hidden sm:inline'>Waktu:</span>
            <strong className='text-primary'>{selectedMealTime}</strong>
          </span>
          <span className='text-muted-foreground'>•</span>
          <span className='flex items-center gap-1.5'>
            <Building2 className='w-3.5 h-3.5 text-primary' />
            <span className='text-muted-foreground hidden sm:inline'>Gedung:</span>
            <strong className='text-primary'>{selectedGedung.namaGedung}</strong>
          </span>
          <span className='text-muted-foreground'>•</span>
          <span className='flex items-center gap-1.5'>
            <DoorOpen className='w-3.5 h-3.5 text-primary' />
            <span className='text-muted-foreground hidden sm:inline'>Ruangan:</span>
            <strong className='text-primary'>{selectedRuangan.namaRuangan}</strong>
          </span>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={onBack}
          className='gap-1 text-xs hover:bg-secondary cursor-pointer'
        >
          <ArrowLeft className='w-3.5 h-3.5' /> Ganti Ruangan
        </Button>
      </div>

      {/* Helper Info Banner */}
      <div className='flex items-center gap-2.5 bg-primary/5 text-xs text-muted-foreground p-3 rounded-lg border border-primary/20'>
        <Layers className='w-4 h-4 text-primary shrink-0' />
        <span>
          Ruangan <strong className='text-foreground'>{selectedRuangan.namaRuangan}</strong> memiliki{' '}
          <strong className='text-primary'>{kamarList.length} kamar / pintu</strong> dengan kapasitas total{' '}
          <strong className='text-primary'>{totalBeds} bed</strong>. Silakan pilih nomor kamar / pintu yang ingin dikelola.
        </span>
      </div>

      {kamarList.length === 0 ? (
        <Card className='p-8 text-center border-dashed'>
          <DoorClosed className='w-10 h-10 text-muted-foreground mx-auto mb-2' />
          <p className='text-sm text-muted-foreground'>
            Belum ada nomor pintu / kamar yang terdaftar di ruangan ini.
          </p>
        </Card>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
          {/* If there are 2 or more kamars, offer "Semua Kamar" option first */}
          {kamarList.length > 1 && (
            <KamarCard
              key='all-kamars'
              kamar={allKamarOption}
              isAllOption={true}
              isSelected={selectedKamar?.idKamar === 'all'}
              onSelect={() => onSelectKamar(allKamarOption)}
            />
          )}

          {/* Individual Kamar / Pintu cards */}
          {kamarList.map((kamar) => (
            <KamarCard
              key={kamar.idKamar}
              kamar={kamar}
              isSelected={selectedKamar?.idKamar === kamar.idKamar}
              onSelect={() => onSelectKamar(kamar)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
