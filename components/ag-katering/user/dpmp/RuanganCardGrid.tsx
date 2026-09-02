'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DoorOpen,
  Printer,
  Search,
  Utensils,
  Ban,
  AlertCircle,
  Eye,
  Building,
} from 'lucide-react';
import type { DpmpPatientItem } from '@/types/dpmptypes';

interface RuanganGroupData {
  ruanganName: string;
  patientList: DpmpPatientItem[];
  totalPasien: number;
  activeCount: number;
  npoCount: number;
  emergentCount: number;
  kelasList: string[];
  kamarList: string[];
}

interface RuanganCardGridProps {
  patients: DpmpPatientItem[];
  onOpenRuanganModal: (
    ruanganName: string,
    patientList: DpmpPatientItem[],
  ) => void;
  onQuickPrintRuangan: (
    ruanganName: string,
    patientList: DpmpPatientItem[],
  ) => void;
}

const KELAS_BADGE_STYLE: Record<string, string> = {
  VIP: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-bold',
  'KELAS 1':
    'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-semibold',
  'KELAS I':
    'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-semibold',
  'KELAS 2':
    'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 font-semibold',
  'KELAS II':
    'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 font-semibold',
  'KELAS 2 - 3':
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold',
  'KELAS 2-3':
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold',
  'KELAS 3':
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold',
  'KELAS III':
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold',
};

export default function RuanganCardGrid({
  patients,
  onOpenRuanganModal,
  onQuickPrintRuangan,
}: RuanganCardGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('ALL');

  // Group all patients into clean Ruangan summary objects
  const ruanganGroups: RuanganGroupData[] = useMemo(() => {
    const map = new Map<string, DpmpPatientItem[]>();

    patients.forEach((p) => {
      const r = p.ruangan || 'Tanpa Ruangan';
      if (!map.has(r)) {
        map.set(r, []);
      }
      map.get(r)!.push(p);
    });

    return Array.from(map.entries())
      .map(([ruanganName, list]) => {
        const activeCount = list.filter((p) => p.status === 'AKTIF').length;
        const npoCount = list.filter((p) => p.status === 'NPO').length;
        const emergentCount = list.filter(
          (p) => p.is_emergent || p.status === 'EMERGENT',
        ).length;

        const kelasList = Array.from(
          new Set(list.map((p) => p.kelas).filter(Boolean)),
        );
        const kamarList = Array.from(
          new Set(list.map((p) => p.kamar).filter(Boolean) as string[]),
        );

        return {
          ruanganName,
          patientList: list,
          totalPasien: list.length,
          activeCount,
          npoCount,
          emergentCount,
          kelasList,
          kamarList,
        };
      })
      .sort((a, b) => a.ruanganName.localeCompare(b.ruanganName));
  }, [patients]);

  // Distinct Kelas available across all rooms
  const allDistinctKelas = useMemo(() => {
    const set = new Set<string>();
    ruanganGroups.forEach((g) => g.kelasList.forEach((k) => set.add(k)));
    return Array.from(set).sort();
  }, [ruanganGroups]);

  // Filtered Ruangan cards
  const filteredRuanganGroups = useMemo(() => {
    return ruanganGroups.filter((g) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRoom = g.ruanganName.toLowerCase().includes(q);
        const matchPatient = g.patientList.some(
          (p) =>
            p.nama_pasien.toLowerCase().includes(q) ||
            p.no_rm.toLowerCase().includes(q) ||
            p.kamar?.toLowerCase().includes(q),
        );
        if (!matchRoom && !matchPatient) return false;
      }

      if (selectedKelasFilter !== 'ALL') {
        const matchKelas = g.kelasList.some((k) =>
          k.toLowerCase().includes(selectedKelasFilter.toLowerCase()),
        );
        if (!matchKelas) return false;
      }

      return true;
    });
  }, [ruanganGroups, searchQuery, selectedKelasFilter]);

  return (
    <div className='space-y-4'>
      {/* 1. Header Toolbar: Search and Filter Pills */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-2xl p-4 shadow-2xs'>
        {/* Search */}
        <div className='relative flex-1 max-w-md'>
          <Search className='w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Cari nama ruangan, pasien, atau kamar...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-8.5 h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20'
          />
        </div>

        {/* Filter Pills */}
        <div className='flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none'>
          <button
            type='button'
            onClick={() => setSelectedKelasFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedKelasFilter === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Semua Kelas
          </button>
          {allDistinctKelas.map((k) => (
            <button
              key={k}
              type='button'
              onClick={() => setSelectedKelasFilter(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedKelasFilter === k
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Ruangan Cards Grid */}
      {patients.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center text-muted-foreground shadow-2xs'>
          <div className='flex flex-col items-center justify-center space-y-2'>
            <Building className='w-10 h-10 text-muted-foreground/40' />
            <p className='font-bold text-sm text-foreground'>
              Tidak Ada Data Pasien untuk Jadwal Ini
            </p>
            <p className='text-xs text-muted-foreground max-w-sm'>
              Belum ada snapshot batch atau data pasien pada tanggal dan waktu makan yang dipilih. Silakan pilih tanggal atau jadwal makan lain.
            </p>
          </div>
        </div>
      ) : filteredRuanganGroups.length > 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {filteredRuanganGroups.map((group) => {
            const primaryKelas = group.kelasList[0] || 'Umum';
            const badgeStyle =
              KELAS_BADGE_STYLE[primaryKelas.toUpperCase()] ||
              'bg-muted text-muted-foreground border-border';

            return (
              <Card
                key={group.ruanganName}
                onClick={() =>
                  onOpenRuanganModal(group.ruanganName, group.patientList)
                }
                className='group relative rounded-2xl border border-border bg-card shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between'
              >
                <CardContent className='p-5 space-y-4'>
                  {/* Card Top: Icon, Ruangan Name & Kelas Badge */}
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform'>
                        <DoorOpen className='w-5 h-5' />
                      </div>
                      <div>
                        <h3 className='font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1'>
                          {group.ruanganName}
                        </h3>
                        <p className='text-[11px] text-muted-foreground pt-0.5'>
                          {group.kamarList.length > 0
                            ? `${group.kamarList.length} Kamar`
                            : 'Rawat Inap'}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant='outline'
                      className={`text-[10px] px-2 py-0.5 shrink-0 ${badgeStyle}`}
                    >
                      {primaryKelas}
                    </Badge>
                  </div>

                  {/* Patient Count & Status Badges */}
                  <div className='grid grid-cols-3 gap-2 text-center pt-1'>
                    <div className='bg-muted/40 rounded-xl p-2 border border-border/50'>
                      <p className='text-[10px] text-muted-foreground uppercase font-bold tracking-wider'>
                        Total
                      </p>
                      <p className='text-sm sm:text-base font-extrabold text-foreground'>
                        {group.totalPasien}
                      </p>
                    </div>

                    <div className='bg-emerald-500/10 dark:bg-emerald-950/30 rounded-xl p-2 border border-emerald-500/20'>
                      <p className='text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold tracking-wider'>
                        Makan
                      </p>
                      <p className='text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400'>
                        {group.activeCount}
                      </p>
                    </div>

                    <div className='bg-amber-500/10 dark:bg-amber-950/30 rounded-xl p-2 border border-amber-500/20'>
                      <p className='text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold tracking-wider'>
                        Puasa
                      </p>
                      <p className='text-sm sm:text-base font-extrabold text-amber-700 dark:text-amber-400'>
                        {group.npoCount}
                      </p>
                    </div>
                  </div>

                  {/* Kamar tags Preview */}
                  {group.kamarList.length > 0 && (
                    <div className='flex flex-wrap gap-1 pt-1'>
                      {group.kamarList.slice(0, 3).map((k) => (
                        <span
                          key={k}
                          className='text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium'
                        >
                          {k}
                        </span>
                      ))}
                      {group.kamarList.length > 3 && (
                        <span className='text-[10px] bg-muted/60 px-1.5 py-0.5 rounded-md text-muted-foreground font-semibold'>
                          +{group.kamarList.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>

                {/* Card Footer Actions */}
                <div className='px-5 py-3 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRuanganModal(group.ruanganName, group.patientList);
                    }}
                    className='text-xs h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground font-semibold cursor-pointer'
                  >
                    <Eye className='w-3.5 h-3.5' />
                    Lihat Pasien
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickPrintRuangan(group.ruanganName, group.patientList);
                    }}
                    className='text-xs h-8 px-2.5 gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-bold cursor-pointer rounded-xl shrink-0'
                    title={`Cetak Lembar DPMP ${group.ruanganName}`}
                  >
                    <Printer className='w-3.5 h-3.5' />
                    Cetak
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className='rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground shadow-2xs'>
          <div className='flex flex-col items-center justify-center space-y-2'>
            <Building className='w-8 h-8 text-muted-foreground/50' />
            <p className='font-semibold text-xs text-foreground'>
              Tidak ada ruangan yang sesuai dengan pencarian
            </p>
            <p className='text-[11px] text-muted-foreground'>
              Coba hapus filter atau cari dengan kata kunci lain.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
