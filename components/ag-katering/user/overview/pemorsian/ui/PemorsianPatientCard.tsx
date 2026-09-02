'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bed,
  MapPin,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import type { PemorsianPatientItem } from '@/types/pemorsiantypes';

interface PemorsianPatientCardProps {
  patient: PemorsianPatientItem;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onPrintSingle: (patient: PemorsianPatientItem) => void;
  onTogglePrintedStatus?: (id: number, currentStatus: string) => void;
}

export default function PemorsianPatientCard({
  patient,
  isSelected,
  onToggleSelect,
  onPrintSingle,
  onTogglePrintedStatus,
}: PemorsianPatientCardProps) {
  const isPrinted = patient.print_status === 'SUDAH_DICETAK';
  const isRevisi = patient.print_status === 'BUTUH_REVISI';
  const isNpo =
    patient.status === 'NPO' ||
    patient.diet.toLowerCase().includes('npo') ||
    patient.diet.toLowerCase().includes('puasa');

  return (
    <Card
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-200 select-none ${
        isSelected
          ? 'ring-2 ring-primary border-primary shadow-md bg-primary/5'
          : isRevisi
          ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60 hover:shadow-md'
          : isPrinted
          ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 hover:shadow-md dark:bg-emerald-950/15'
          : 'border-border/80 bg-card hover:border-primary/40 hover:shadow-md'
      }`}
      onClick={() => onToggleSelect(patient.id)}
    >
      {/* ─── Top Bar: Location & Class Badge ─── */}
      <div className='flex items-center justify-between gap-2 border-b border-border/50 bg-muted/30 px-3.5 py-2.5'>
        <div className='flex items-center gap-1.5 min-w-0'>
          {/* Checkbox */}
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(patient.id);
            }}
            className='p-0.5 rounded text-foreground hover:bg-muted transition-colors'
            title={isSelected ? 'Batalkan pilihan' : 'Pilih kartu ini'}
          >
            {isSelected ? (
              <CheckSquare className='w-4 h-4 text-primary' />
            ) : (
              <Square className='w-4 h-4 text-muted-foreground/70' />
            )}
          </button>

          {/* Room & Bed */}
          <div className='flex items-center gap-1 text-xs font-semibold text-foreground truncate'>
            <MapPin className='w-3 h-3 text-muted-foreground shrink-0' />
            <span className='truncate'>{patient.ruangan}</span>
            {patient.bed && (
              <span className='inline-flex items-center gap-0.5 text-[11px] font-mono text-muted-foreground'>
                <Bed className='w-3 h-3 shrink-0 ml-0.5' />
                {patient.bed}
              </span>
            )}
          </div>
        </div>

        {/* Class Badge */}
        <Badge
          variant='secondary'
          className='text-[10px] font-semibold px-2 py-0.5 h-5 shrink-0 bg-background border'
        >
          {patient.kelas || 'Umum'}
        </Badge>
      </div>

      {/* ─── Body: Patient Name, RM & Diet Info ─── */}
      <CardContent className='p-3.5 space-y-2.5 flex-1 flex flex-col justify-between'>
        <div className='space-y-1.5'>
          {/* Patient Name */}
          <div className='flex items-baseline justify-between gap-2'>
            <h4
              className='font-bold text-sm text-foreground tracking-tight leading-snug truncate'
              title={patient.nama_pasien}
            >
              {patient.nama_pasien}
            </h4>
          </div>

          {/* No RM & Waktu Makan */}
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-mono font-medium text-[11px] text-muted-foreground/90'>
              RM: {patient.no_rm}
            </span>
            <span className='text-[10px] font-semibold uppercase tracking-wider text-primary/80'>
              Makan {patient.waktu}
            </span>
          </div>

          {/* Diet Display */}
          <div className='pt-1'>
            <div
              className={`p-2 rounded-xl border text-xs font-medium ${
                isNpo
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  : 'bg-muted/50 border-border/60 text-foreground'
              }`}
            >
              <div className='text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-0.5'>
                Diet Pasien
              </div>
              <div className='font-bold text-xs sm:text-[13px] leading-snug break-words'>
                {patient.diet}
              </div>

              {/* Extra Items if any */}
              {(patient.extra || patient.buah || patient.snack) && (
                <div className='mt-1.5 pt-1.5 border-t border-dashed border-border/60 text-[10px] text-muted-foreground space-y-0.5'>
                  {patient.extra && (
                    <div>
                      <strong className='text-foreground/80'>Extra:</strong>{' '}
                      {patient.extra}
                    </div>
                  )}
                  {patient.buah && (
                    <div>
                      <strong className='text-foreground/80'>Buah:</strong>{' '}
                      {patient.buah}
                    </div>
                  )}
                  {patient.snack && (
                    <div>
                      <strong className='text-foreground/80'>Snack:</strong>{' '}
                      {patient.snack}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Bottom: Status & Action Button ─── */}
        <div className='pt-2.5 border-t border-border/50 flex items-center justify-between gap-2 mt-auto'>
          {/* Status Badge */}
          {isRevisi ? (
            <Badge className='bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold px-2 py-0.5 gap-1 shrink-0'>
              <AlertTriangle className='w-3 h-3' />
              Butuh Revisi
            </Badge>
          ) : isPrinted ? (
            <Badge className='bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 gap-1 shrink-0'>
              <CheckCircle2 className='w-3 h-3' />
              Sudah Dicetak
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-[10px] font-bold px-2 py-0.5 gap-1 shrink-0'
            >
              <Clock className='w-3 h-3' />
              Belum Dicetak
            </Badge>
          )}

          {/* Actions */}
          <div
            className='flex items-center gap-1.5'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Toggle Status manually if needed */}
            {onTogglePrintedStatus && !isRevisi && (
              <Button
                variant='ghost'
                size='icon'
                onClick={() =>
                  onTogglePrintedStatus(
                    patient.id,
                    isPrinted ? 'SUDAH_DICETAK' : 'BELUM_DICETAK',
                  )
                }
                className='h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer'
                title={
                  isPrinted
                    ? 'Tandai belum dicetak'
                    : 'Tandai sudah dicetak manual'
                }
              >
                <RotateCcw className='w-3 h-3' />
              </Button>
            )}

            {/* Print Button */}
            <Button
              size='sm'
              onClick={() => onPrintSingle(patient)}
              className={`h-7 px-2.5 text-xs font-semibold gap-1.5 rounded-lg shadow-2xs cursor-pointer ${
                isPrinted
                  ? 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Printer className='w-3.5 h-3.5' />
              <span>{isPrinted ? 'Cetak Ulang' : 'Cetak'}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
