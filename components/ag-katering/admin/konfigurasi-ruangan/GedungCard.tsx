'use client';

import React from 'react';
import type { GedungHierarkis, RuanganDetail } from '@/servers/tempat.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, DoorOpen, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { RuanganCard } from './RuanganCard';

interface GedungCardProps {
  gedung: GedungHierarkis;
  isExpanded: boolean;
  savedGedungList: GedungHierarkis[];
  onToggleExpand: (idGedung: number) => void;
  onOpenAddRuangan: (gedungId: number) => void;
  onOpenEditGedung: (gedung: GedungHierarkis) => void;
  onDeleteGedung: (gedung: GedungHierarkis) => void;
  onQuickAdjustBed: (ruangan: RuanganDetail, delta: number) => void;
  onEditRuangan: (ruangan: RuanganDetail) => void;
  onDeleteRuangan: (ruangan: RuanganDetail) => void;
}

export function GedungCard({
  gedung,
  isExpanded,
  savedGedungList,
  onToggleExpand,
  onOpenAddRuangan,
  onOpenEditGedung,
  onDeleteGedung,
  onQuickAdjustBed,
  onEditRuangan,
  onDeleteRuangan,
}: GedungCardProps) {
  return (
    <Card className='border shadow-sm rounded-2xl overflow-hidden transition-all duration-200'>
      {/* Gedung Parent Header */}
      <CardHeader className='bg-gradient-to-r from-muted/60 via-muted/30 to-background py-4 px-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none'>
        <div
          className='flex items-center gap-3 cursor-pointer group flex-1'
          onClick={() => onToggleExpand(gedung.idGedung)}
        >
          <div className='p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform'>
            <Building className='w-5 h-5' />
          </div>
          <div>
            <CardTitle className='text-base font-bold text-foreground flex items-center gap-2 group-hover:text-blue-600 transition-colors'>
              {gedung.namaGedung}
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6 rounded-full'
                title={isExpanded ? 'Sembunyikan ruangan' : 'Tampilkan ruangan'}
              >
                {isExpanded ? (
                  <ChevronUp className='w-4 h-4 text-muted-foreground' />
                ) : (
                  <ChevronDown className='w-4 h-4 text-muted-foreground' />
                )}
              </Button>
            </CardTitle>
            <CardDescription className='text-xs flex items-center gap-2 pt-0.5'>
              <span>{gedung.ruanganList.length} Ruangan</span>
              <span>·</span>
              <span>{gedung.totalBed} Total Kapasitas Bed</span>
            </CardDescription>
          </div>
        </div>

        {/* Gedung Action Buttons */}
        <div className='flex items-center gap-2 shrink-0'>
          <Button
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 text-xs border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10'
            onClick={() => onOpenAddRuangan(gedung.idGedung)}
          >
            <Plus className='w-3.5 h-3.5' /> Tambah Ruangan
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-muted-foreground hover:text-foreground'
            onClick={() => onOpenEditGedung(gedung)}
            title='Edit Nama Gedung'
          >
            <Pencil className='w-4 h-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
            onClick={() => onDeleteGedung(gedung)}
            title='Hapus Gedung'
          >
            <Trash2 className='w-4 h-4' />
          </Button>
        </div>
      </CardHeader>

      {/* Gedung Children: Ruangan List */}
      {isExpanded && (
        <CardContent className='p-4 sm:p-5 bg-card space-y-3 animate-in fade-in duration-200'>
          {gedung.ruanganList.length === 0 ? (
            <div className='text-center py-6 border border-dashed rounded-xl space-y-2 bg-muted/20'>
              <DoorOpen className='w-6 h-6 text-muted-foreground mx-auto' />
              <p className='text-xs text-muted-foreground'>
                Belum ada ruangan terdaftar di <strong>{gedung.namaGedung}</strong>.
              </p>
              <Button
                size='sm'
                variant='outline'
                className='h-7 text-xs gap-1'
                onClick={() => onOpenAddRuangan(gedung.idGedung)}
              >
                <Plus className='w-3 h-3' /> Tambah Ruangan Sekarang
              </Button>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5'>
              {gedung.ruanganList.map((ruangan) => {
                const savedG = savedGedungList.find(
                  (sg) => sg.idGedung === ruangan.gedungId,
                );
                const savedR = savedG?.ruanganList.find(
                  (sr) => sr.idRuangan === ruangan.idRuangan,
                );
                const isBedModified = savedR
                  ? savedR.jumlahBed !== ruangan.jumlahBed
                  : false;

                return (
                  <RuanganCard
                    key={ruangan.idRuangan}
                    ruangan={ruangan}
                    isBedModified={isBedModified}
                    onQuickAdjustBed={onQuickAdjustBed}
                    onEditRuangan={onEditRuangan}
                    onDeleteRuangan={onDeleteRuangan}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
