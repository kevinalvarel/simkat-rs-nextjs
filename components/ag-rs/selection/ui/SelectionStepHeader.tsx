import React from 'react';
import type { MealTimeType } from '@/types/ag-rs-types';

interface SelectionStepHeaderProps {
  currentStep: number;
  selectedMealTime: MealTimeType;
  selectedGedungName?: string;
  selectedRuanganName?: string;
}

export default function SelectionStepHeader({
  currentStep,
  selectedMealTime,
  selectedGedungName,
  selectedRuanganName,
}: SelectionStepHeaderProps) {
  return (
    <div className='text-center space-y-2'>
      <h2 className='text-2xl font-bold tracking-tight text-primary'>
        {currentStep === 0 && 'Pilih Waktu Makan'}
        {currentStep === 1 && 'Pilih Lokasi Gedung'}
        {currentStep === 2 && 'Pilih Ruangan'}
        {currentStep === 3 && 'Pilih Kamar / Pintu'}
        {currentStep === 4 && 'Pilihan Berhasil Disimpan'}
      </h2>
      <p className='text-sm text-muted-foreground'>
        {currentStep === 0 &&
          'Silakan tentukan jadwal distribusi gizi rumah sakit'}
        {currentStep === 1 &&
          `Waktu terpilih: ${selectedMealTime}. Pilih gedung fasilitas RS.`}
        {currentStep === 2 &&
          `Gedung terpilih: ${selectedGedungName}. Pilih ruangan rawat/instalasi.`}
        {currentStep === 3 &&
          `Ruangan terpilih: ${selectedRuanganName}. Pilih nomor kamar / pintu rawat.`}
        {currentStep === 4 &&
          'Berikut adalah ringkasan waktu makan, gedung, ruangan, dan kamar yang Anda pilih'}
      </p>
    </div>
  );
}
