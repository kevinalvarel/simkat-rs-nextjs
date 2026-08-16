import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Building2, DoorOpen, RefreshCw } from 'lucide-react';
import type {
  GedungWithRuangan,
  RuanganItem,
} from '@/servers/tempat.service';
import type { MealTimeType } from '@/types/ag-rs-types';

interface StepConfirmationSectionProps {
  selectedMealTime: MealTimeType;
  selectedGedung: GedungWithRuangan;
  selectedRuangan: RuanganItem;
  isRevisi: boolean;
  onReset: () => void;
  onContinue: () => void;
}

export default function StepConfirmationSection({
  selectedMealTime,
  selectedGedung,
  selectedRuangan,
  isRevisi,
  onReset,
  onContinue,
}: StepConfirmationSectionProps) {
  return (
    <Card className='border-2 border-primary/30 shadow-lg animate-in fade-in-50 duration-300'>
      <CardHeader className='text-center pb-2'>
        <div className='mx-auto p-3 rounded-full bg-primary/10 text-primary w-fit mb-2'>
          <CheckCircle2 className='w-8 h-8' />
        </div>
        <CardTitle className='text-xl'>Konfirmasi Pilihan</CardTitle>
        <CardDescription>
          Detail pemilihan distribusi gizi rumah sakit
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 pt-2'>
        <div className='bg-secondary/40 rounded-lg p-4 space-y-3 border border-border/50'>
          <div className='flex justify-between items-center pb-2 border-b border-border/50'>
            <span className='text-sm text-muted-foreground flex items-center gap-2'>
              <Clock className='w-4 h-4 text-primary' />
              Waktu Makan
            </span>
            <span className='font-semibold text-primary flex items-center gap-1.5'>
              {selectedMealTime}
              {isRevisi && (
                <Badge
                  variant='outline'
                  className='text-[10px] bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/40'
                >
                  Mode Revisi
                </Badge>
              )}
            </span>
          </div>

          <div className='flex justify-between items-center pb-2 border-b border-border/50'>
            <span className='text-sm text-muted-foreground flex items-center gap-2'>
              <Building2 className='w-4 h-4 text-primary' />
              Lokasi Gedung
            </span>
            <span className='font-semibold text-primary'>
              {selectedGedung.namaGedung}
            </span>
          </div>

          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground flex items-center gap-2'>
              <DoorOpen className='w-4 h-4 text-primary' />
              Ruangan
            </span>
            <span className='font-semibold text-primary'>
              {selectedRuangan.namaRuangan}
            </span>
          </div>
        </div>

        <div className='flex gap-3 pt-2'>
          <Button
            variant='outline'
            className='flex-1 gap-2 cursor-pointer'
            onClick={onReset}
          >
            <RefreshCw className='w-4 h-4' /> Reset Pilihan
          </Button>
          <Button className='flex-1 cursor-pointer' onClick={onContinue}>
            Lanjutkan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
