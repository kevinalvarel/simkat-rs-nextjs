'use client';

import React, { useState } from 'react';
import type {
  RuanganDetail,
  KamarDetail,
  GedungHierarkis,
} from '@/servers/tempat.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DoorOpen,
  DoorClosed,
  Bed,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { KamarCard } from './KamarCard';

interface RuanganCardProps {
  ruangan: RuanganDetail;
  savedGedungList: GedungHierarkis[];
  onOpenAddKamar: (ruangan: RuanganDetail) => void;
  onEditKamar: (ruangan: RuanganDetail, kamar: KamarDetail) => void;
  onDeleteKamar: (ruangan: RuanganDetail, kamar: KamarDetail) => void;
  onQuickAdjustBed: (
    ruangan: RuanganDetail,
    kamarId: string,
    delta: number,
  ) => void;
  onEditRuangan: (ruangan: RuanganDetail) => void;
  onDeleteRuangan: (ruangan: RuanganDetail) => void;
}

export function renderKelasBadge(kelas: string) {
  const normalized = (kelas || '').toUpperCase();
  if (normalized.includes('VVIP')) {
    return (
      <Badge className='bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-extrabold gap-1 text-xs'>
        <Sparkles className='w-3 h-3 text-amber-500' />
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('VIP')) {
    return (
      <Badge className='bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-bold text-xs'>
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('KELAS 1') || normalized.includes('1')) {
    return (
      <Badge className='bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-semibold text-xs'>
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('KELAS 2') || normalized.includes('2')) {
    return (
      <Badge className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold text-xs'>
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('ICU') || normalized.includes('HCU')) {
    return (
      <Badge className='bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold text-xs'>
        {kelas}
      </Badge>
    );
  }
  return (
    <Badge variant='outline' className='font-medium text-xs'>
      {kelas || 'Kelas 1'}
    </Badge>
  );
}

export function RuanganCard({
  ruangan,
  savedGedungList,
  onOpenAddKamar,
  onEditKamar,
  onDeleteKamar,
  onQuickAdjustBed,
  onEditRuangan,
  onDeleteRuangan,
}: RuanganCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Find saved state of this ruangan to detect modified kamar/beds
  const savedGedung = savedGedungList.find((g) => g.idGedung === ruangan.gedungId);
  const savedRuangan = savedGedung?.ruanganList.find(
    (r) => r.idRuangan === ruangan.idRuangan,
  );

  const hasModifiedBeds = ruangan.kamarList.some((k) => {
    const savedKamar = savedRuangan?.kamarList.find(
      (sk) => sk.idKamar === k.idKamar,
    );
    if (!savedKamar) return true; // new kamar
    return savedKamar.jumlahBed !== k.jumlahBed;
  });

  const totalKamar = ruangan.kamarList.length;
  const totalBed = ruangan.kamarList.reduce((acc, k) => acc + (k.jumlahBed || 0), 0);

  return (
    <div
      className={`border rounded-2xl bg-card shadow-xs transition-all overflow-hidden ${
        hasModifiedBeds
          ? 'border-amber-500/50 dark:border-amber-500/40 ring-1 ring-amber-500/20'
          : 'border-border/80 hover:border-primary/30'
      }`}
    >
      {/* Ruangan Header */}
      <div className='p-4 bg-muted/20 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div
          className='flex items-center gap-3 cursor-pointer group flex-1 min-w-0'
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <div className='p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0'>
            <DoorOpen className='w-5 h-5' />
          </div>

          <div className='min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h4
                className='font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate'
                title={ruangan.namaRuangan}
              >
                {ruangan.namaRuangan}
              </h4>
              {renderKelasBadge(ruangan.kelas)}
              {hasModifiedBeds && (
                <span className='text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full'>
                  Perubahan Belum Disimpan
                </span>
              )}
            </div>

            <div className='flex items-center gap-2 text-xs text-muted-foreground pt-0.5 font-medium'>
              <span className='flex items-center gap-1'>
                <DoorClosed className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400' />
                <strong>{totalKamar}</strong> Kamar/Pintu
              </span>
              <span>·</span>
              <span className='flex items-center gap-1'>
                <Bed className='w-3.5 h-3.5 text-purple-600 dark:text-purple-400' />
                <strong>{totalBed}</strong> Total Bed
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-1.5 shrink-0 self-end sm:self-auto'>
          <Button
            variant='outline'
            size='sm'
            className='h-8 text-xs gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10'
            onClick={() => onOpenAddKamar(ruangan)}
          >
            <Plus className='w-3.5 h-3.5' /> Tambah Kamar / Pintu
          </Button>

          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-muted-foreground hover:text-foreground'
            onClick={() => onEditRuangan(ruangan)}
            title='Edit Ruangan & Kelola Kamar'
          >
            <Pencil className='w-3.5 h-3.5' />
          </Button>

          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
            onClick={() => onDeleteRuangan(ruangan)}
            title='Hapus Ruangan'
          >
            <Trash2 className='w-3.5 h-3.5' />
          </Button>

          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-muted-foreground'
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? 'Sembunyikan Kamar' : 'Tampilkan Kamar'}
          >
            {isExpanded ? (
              <ChevronUp className='w-4 h-4' />
            ) : (
              <ChevronDown className='w-4 h-4' />
            )}
          </Button>
        </div>
      </div>

      {/* Ruangan Content: Kamar / Nomor Pintu List */}
      {isExpanded && (
        <div className='p-4 bg-background/50 animate-in fade-in duration-200'>
          {ruangan.kamarList.length === 0 ? (
            <div className='text-center py-6 border border-dashed rounded-xl space-y-2 bg-muted/10'>
              <DoorClosed className='w-6 h-6 text-muted-foreground mx-auto' />
              <p className='text-xs text-muted-foreground'>
                Belum ada nomor pintu/kamar di ruangan{' '}
                <strong>{ruangan.namaRuangan}</strong>.
              </p>
              <Button
                size='sm'
                variant='outline'
                className='h-7 text-xs gap-1'
                onClick={() => onOpenAddKamar(ruangan)}
              >
                <Plus className='w-3 h-3' /> Tambah Kamar / Pintu Pertama
              </Button>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
              {ruangan.kamarList.map((kamar) => {
                const savedKamar = savedRuangan?.kamarList.find(
                  (sk) => sk.idKamar === kamar.idKamar,
                );
                const isBedModified = savedKamar
                  ? savedKamar.jumlahBed !== kamar.jumlahBed
                  : true;

                return (
                  <KamarCard
                    key={kamar.idKamar}
                    kamar={kamar}
                    ruangan={ruangan}
                    isBedModified={isBedModified}
                    onQuickAdjustBed={onQuickAdjustBed}
                    onEditKamar={onEditKamar}
                    onDeleteKamar={onDeleteKamar}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
