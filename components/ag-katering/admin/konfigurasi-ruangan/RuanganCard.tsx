'use client';

import React from 'react';
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
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { getKelasBadgeStyle } from '@/lib/kelas-utils';

interface RuanganCardProps {
  ruangan: RuanganDetail;
  gedungNama?: string;
  savedGedungList: GedungHierarkis[];
  onOpenManageKamar: (ruangan: RuanganDetail) => void;
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

export function renderKelasBadge(kelas: string, kelasOrder: string[] = []) {
  const label = kelas || 'KELAS I';
  return (
    <Badge className={`${getKelasBadgeStyle(label, kelasOrder)} font-semibold text-xs shadow-2xs`}>
      {label}
    </Badge>
  );
}

export function RuanganCard({
  ruangan,
  savedGedungList,
  onOpenManageKamar,
  onOpenAddKamar,
  onEditRuangan,
  onDeleteRuangan,
}: RuanganCardProps) {
  // Find saved state of this ruangan to detect modified kamar/beds
  const savedGedung = savedGedungList.find(
    (g) => g.idGedung === ruangan.gedungId,
  );
  const savedRuangan = savedGedung?.ruanganList.find(
    (r) => r.idRuangan === ruangan.idRuangan,
  );

  const hasModifiedBeds = ruangan.kamarList.some((k) => {
    const savedKamar = savedRuangan?.kamarList.find(
      (sk) => sk.idKamar === k.idKamar,
    );
    if (!savedKamar) return true; // new kamar
    return (
      savedKamar.jumlahBed !== k.jumlahBed ||
      savedKamar.nomorKamar !== k.nomorKamar ||
      savedKamar.kelas !== k.kelas
    );
  });

  const totalKamar = ruangan.kamarList.length;
  const totalBed = ruangan.kamarList.reduce(
    (acc, k) => acc + (k.jumlahBed || 0),
    0,
  );

  // Take first 4 kamars for compact preview chips in column card
  const previewKamars = ruangan.kamarList.slice(0, 4);
  const extraKamarsCount = totalKamar - previewKamars.length;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border bg-card/90 backdrop-blur-xs p-4 sm:p-5 transition-all duration-200 hover:shadow-md h-full ${
        hasModifiedBeds
          ? 'border-amber-500/50 dark:border-amber-500/40 ring-1 ring-amber-500/20 bg-amber-500/5'
          : 'border-border/80 hover:border-emerald-500/40 hover:bg-card'
      }`}
    >
      {/* Top Header Section */}
      <div className='space-y-3'>
        <div className='flex items-start justify-between gap-2.5'>
          <div className='flex items-center gap-2.5 min-w-0 flex-1'>
            <div className='p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0'>
              <DoorOpen className='w-5 h-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <h4
                className='font-bold text-base text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate'
                title={ruangan.namaRuangan}
              >
                {ruangan.namaRuangan}
              </h4>
              <div className='flex items-center gap-1.5 pt-0.5 flex-wrap'>
                {renderKelasBadge(ruangan.kelas)}
                {hasModifiedBeds && (
                  <span className='text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 rounded-full animate-pulse'>
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Edit & Delete Icon Actions */}
          <div className='flex items-center gap-0.5 shrink-0'>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer'
              onClick={() => onEditRuangan(ruangan)}
              title='Edit Ruangan'
            >
              <Pencil className='w-3.5 h-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer'
              onClick={() => onDeleteRuangan(ruangan)}
              title='Hapus Ruangan'
            >
              <Trash2 className='w-3.5 h-3.5' />
            </Button>
          </div>
        </div>

        {/* Stats Row Badges */}
        <div className='grid grid-cols-2 gap-2 text-xs font-semibold'>
          <div className='flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-lg text-foreground'>
            <DoorClosed className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0' />
            <span className='truncate'>{totalKamar} Kamar</span>
          </div>
          <div className='flex items-center gap-1.5 bg-purple-500/10 px-2.5 py-1.5 rounded-lg text-purple-700 dark:text-purple-300 border border-purple-500/20'>
            <Bed className='w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0' />
            <span className='truncate'>{totalBed} Bed</span>
          </div>
        </div>

        {/* Kamar Chips Preview Area */}
        <div className='space-y-1.5 pt-1'>
          <div className='text-[11px] font-medium text-muted-foreground flex items-center gap-1'>
            <Layers className='w-3 h-3 text-muted-foreground' /> Rincian Kamar:
          </div>

          <div className='flex items-center gap-1.5 flex-wrap min-h-[26px]'>
            {previewKamars.length === 0 ? (
              <span className='text-[11px] text-muted-foreground italic'>
                Belum ada kamar
              </span>
            ) : (
              <>
                {previewKamars.map((kamar) => (
                  <span
                    key={kamar.idKamar}
                    className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border/80 text-[11px] font-mono text-foreground'
                    title={`${kamar.nomorKamar} (${kamar.jumlahBed} Bed)`}
                  >
                    <DoorClosed className='w-2.5 h-2.5 text-emerald-600 shrink-0' />
                    <span className='font-sans font-medium truncate max-w-[80px]'>
                      {kamar.nomorKamar}
                    </span>
                    <span className='text-[10px] text-purple-600 dark:text-purple-400 font-bold shrink-0'>
                      ({kamar.jumlahBed}B)
                    </span>
                  </span>
                ))}
                {extraKamarsCount > 0 && (
                  <span
                    onClick={() => onOpenManageKamar(ruangan)}
                    className='inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors'
                    title={`Lihat ${extraKamarsCount} kamar lainnya`}
                  >
                    +{extraKamarsCount} lagi
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className='pt-4 border-t border-border/60 mt-3.5 flex items-center gap-2'>
        <Button
          size='sm'
          onClick={() => onOpenManageKamar(ruangan)}
          className='flex-1 h-8.5 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer'
          title='Buka Modal Kelola Kamar'
        >
          <SlidersHorizontal className='w-3.5 h-3.5' />
          Lihat & Kelola Kamar
        </Button>

        <Button
          variant='outline'
          size='icon'
          className='h-8.5 w-8.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer shrink-0'
          onClick={() => onOpenAddKamar(ruangan)}
          title='Tambah Kamar Cepat'
        >
          <Plus className='w-4 h-4' />
        </Button>
      </div>
    </div>
  );
}
