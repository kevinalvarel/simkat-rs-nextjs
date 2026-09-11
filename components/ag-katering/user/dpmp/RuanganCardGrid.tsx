'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DoorOpen, Printer, Search, Eye, Building, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNpoPatient } from '@/lib/npo-utils';
import type { DpmpPatientItem } from '@/types/dpmptypes';

interface RuanganGroupData {
  ruanganId: string;
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
  selectedRoomIds: string[];
  onToggleRoomSelect: (roomId: string) => void;
  onSelectAllRooms: (roomIds: string[]) => void;
  onClearRoomSelection: () => void;
  onPrintSelectedRooms: () => void;
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
  selectedRoomIds,
  onToggleRoomSelect,
  onSelectAllRooms,
  onClearRoomSelection,
  onPrintSelectedRooms,
  onOpenRuanganModal,
  onQuickPrintRuangan,
}: RuanganCardGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('ALL');

  // Group all patients into clean Ruangan summary objects with room ID
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
        // Resolve ruanganId from patient items if available, or fallback to ruanganName
        const firstWithId = list.find((p) => p.ruangan_id);
        const ruanganId = firstWithId?.ruangan_id
          ? String(firstWithId.ruangan_id)
          : ruanganName;

        const feedingList = list.filter(
          (p) => !isNpoPatient(p) && p.status !== 'NPO',
        );
        const activeCount = feedingList.length;
        const npoCount = list.length - activeCount;
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
          ruanganId,
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

  // Count of feeding patients in selected rooms
  const selectedPatientsCount = useMemo(() => {
    const selectedRoomsSet = new Set(selectedRoomIds);
    return patients.filter((p) => {
      const pRoomId = p.ruangan_id ? String(p.ruangan_id) : p.ruangan;
      return (
        selectedRoomsSet.has(pRoomId) && !isNpoPatient(p) && p.status !== 'NPO'
      );
    }).length;
  }, [patients, selectedRoomIds]);

  // Check if all filtered rooms are currently selected
  const isAllFilteredSelected =
    filteredRuanganGroups.length > 0 &&
    filteredRuanganGroups.every((g) => selectedRoomIds.includes(g.ruanganId));

  function handleToggleAllFiltered() {
    if (isAllFilteredSelected) {
      // Unselect only the currently visible filtered rooms
      const filteredIdsSet = new Set(
        filteredRuanganGroups.map((g) => g.ruanganId),
      );
      onSelectAllRooms(selectedRoomIds.filter((id) => !filteredIdsSet.has(id)));
    } else {
      // Select all currently visible filtered rooms without duplicates
      const allIds = Array.from(
        new Set([
          ...selectedRoomIds,
          ...filteredRuanganGroups.map((g) => g.ruanganId),
        ]),
      );
      onSelectAllRooms(allIds);
    }
  }

  return (
    <div className='space-y-4'>
      {/* 1. Header Toolbar: Search, Filter Pills & Selection Action Bar */}
      <div className='flex flex-col gap-3.5 bg-card border rounded-2xl p-4 shadow-2xs'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
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

        {/* Selection Toolbar Bar */}
        {filteredRuanganGroups.length > 0 && (
          <div className='pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div className='flex items-center gap-3 flex-wrap'>
              <button
                type='button'
                onClick={handleToggleAllFiltered}
                className='inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-foreground hover:text-primary transition-colors bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60'
              >
                <Checkbox
                  checked={isAllFilteredSelected}
                  aria-label='Pilih semua ruangan'
                  className='pointer-events-none h-4 w-4 rounded-md'
                />
                <span>
                  {isAllFilteredSelected
                    ? 'Batalkan Semua Pilihan'
                    : `Pilih Semua Ruangan (${filteredRuanganGroups.length})`}
                </span>
              </button>

              {selectedRoomIds.length > 0 && (
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='secondary'
                    className='text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary border border-primary/20'
                  >
                    {selectedRoomIds.length} Ruangan Terpilih (
                    {selectedPatientsCount} Pasien)
                  </Badge>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onClearRoomSelection}
                    className='text-xs text-muted-foreground hover:text-foreground h-7 px-2 cursor-pointer'
                  >
                    Reset Pilihan
                  </Button>
                </div>
              )}
            </div>

            {/* Tombol Cetak DPMP Terpilih (N) */}
            <Button
              onClick={onPrintSelectedRooms}
              disabled={selectedRoomIds.length === 0}
              className='gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-xs cursor-pointer h-9 px-4 self-start sm:self-auto disabled:opacity-50'
            >
              <Printer className='w-4 h-4' />
              {selectedRoomIds.length > 0
                ? `Cetak DPMP Terpilih (${selectedRoomIds.length})`
                : 'Cetak DPMP Terpilih'}
            </Button>
          </div>
        )}
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
              Belum ada snapshot batch atau data pasien pada tanggal dan waktu
              makan yang dipilih. Silakan pilih tanggal atau jadwal makan lain.
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

            const isSelected = selectedRoomIds.includes(group.ruanganId);

            return (
              <Card
                key={group.ruanganId}
                role='checkbox'
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => onToggleRoomSelect(group.ruanganId)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onToggleRoomSelect(group.ruanganId);
                  }
                }}
                className={cn(
                  'group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between select-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-primary ring-2 ring-primary bg-primary/[0.04] dark:bg-primary/[0.08] shadow-md'
                    : 'border-border bg-card shadow-2xs hover:shadow-md hover:border-primary/40',
                )}
              >
                <CardContent className='p-5 space-y-4'>
                  {/* Card Top: Checkbox, Icon, Ruangan Name & Kelas Badge */}
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-center gap-3'>
                      {/* Checkbox with stopPropagation so clicking doesn't double toggle */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className='flex items-center'
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            onToggleRoomSelect(group.ruanganId)
                          }
                          aria-label={`Pilih Ruangan ${group.ruanganName}`}
                          className='hidden'
                        />
                      </div>

                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary scale-105 shadow-xs'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 group-hover:scale-105',
                        )}
                      >
                        {isSelected ? (
                          <Check className='w-5 h-5 stroke-[2.5]' />
                        ) : (
                          <DoorOpen className='w-5 h-5' />
                        )}
                      </div>

                      <div>
                        <h3
                          className={cn(
                            'font-bold text-sm sm:text-base leading-tight line-clamp-1 transition-colors',
                            isSelected
                              ? 'text-primary'
                              : 'text-foreground group-hover:text-primary',
                          )}
                        >
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
                <div
                  className={cn(
                    'px-5 py-3 border-t flex items-center justify-between gap-2 transition-colors',
                    isSelected
                      ? 'border-primary/20 bg-primary/[0.06] dark:bg-primary/[0.12]'
                      : 'border-border/80 bg-muted/20',
                  )}
                >
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
                    Lihat Detail
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickPrintRuangan(
                        group.ruanganName,
                        group.patientList.filter(
                          (p) => !isNpoPatient(p) && p.status !== 'NPO',
                        ),
                      );
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

      {/* Floating Bottom Action Bar for Selected Print */}
      {selectedRoomIds.length > 0 && (
        <div className='sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 px-5 bg-background/95 backdrop-blur-md border border-primary/40 rounded-2xl shadow-xl transition-all animate-in fade-in slide-in-from-bottom-3'>
          <div className='flex items-center gap-3'>
            <span className='flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse' />
            <span className='text-xs font-bold text-foreground'>
              {selectedRoomIds.length} Ruangan Terpilih
            </span>
            <span className='text-xs text-muted-foreground'>
              ({selectedPatientsCount} Pasien Siap Cetak)
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClearRoomSelection}
              className='text-xs h-8 px-3 cursor-pointer text-muted-foreground hover:text-foreground'
            >
              Batal
            </Button>
            <Button
              size='sm'
              onClick={onPrintSelectedRooms}
              className='text-xs h-8 px-4 gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer rounded-xl'
            >
              <Printer className='w-3.5 h-3.5' />
              Cetak DPMP Terpilih ({selectedRoomIds.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
