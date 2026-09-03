'use client';

import React, { useState, useMemo } from 'react';
import type {
  TabulasiHospitalData,
  TabulasiHospitalCategoryGroup,
} from '@/types/tabulasitypes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Utensils,
  Search,
  Filter,
  Info,
} from 'lucide-react';
import TabulasiDietBadge from '../ui/TabulasiDietBadge';
import TabulasiViewModeToggle, { type ViewMode } from '../ui/TabulasiViewModeToggle';

interface TabulasiHospitalTableProps {
  hospitalData: TabulasiHospitalData;
}

export default function TabulasiHospitalTable({
  hospitalData,
}: TabulasiHospitalTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('SIDE_BY_SIDE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Distinct category list
  const categoryList = useMemo(() => {
    const cats = hospitalData.categoryGroups.map((g) => g.kategori);
    return ['ALL', ...Array.from(new Set(cats))];
  }, [hospitalData.categoryGroups]);

  // Filtered groups & items
  const filteredGroups = useMemo(() => {
    return hospitalData.categoryGroups
      .map((group) => {
        if (selectedCategory !== 'ALL' && group.kategori !== selectedCategory) {
          return null;
        }

        const filteredItems = group.items.filter((item) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            item.nama_menu.toLowerCase().includes(q) ||
            item.kategori.toLowerCase().includes(q) ||
            item.kode_diet.toLowerCase().includes(q)
          );
        });

        if (filteredItems.length === 0) return null;

        const subtotalLama = filteredItems.reduce(
          (sum, it) => sum + it.porsi_gedung_lama,
          0,
        );
        const subtotalBaru = filteredItems.reduce(
          (sum, it) => sum + it.porsi_gedung_baru,
          0,
        );

        return {
          ...group,
          items: filteredItems,
          subtotalGedungLama: subtotalLama,
          subtotalGedungBaru: subtotalBaru,
          subtotalSemua: subtotalLama + subtotalBaru,
        };
      })
      .filter(Boolean) as TabulasiHospitalCategoryGroup[];
  }, [hospitalData.categoryGroups, selectedCategory, searchQuery]);

  // Totals for filtered data
  const filteredTotalLama = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.subtotalGedungLama, 0),
    [filteredGroups],
  );
  const filteredTotalBaru = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.subtotalGedungBaru, 0),
    [filteredGroups],
  );
  const filteredGrandTotal = filteredTotalLama + filteredTotalBaru;

  return (
    <div className='bg-card border border-border/80 rounded-2xl shadow-2xs overflow-hidden w-full space-y-0'>
      {/* Table Controls & Filter Bar */}
      <div className='p-4 sm:p-5 border-b border-border/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 bg-muted/20'>
        {/* Title & Info */}
        <div className='space-y-1'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h3 className='text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2'>
              <Utensils className='w-4 h-4 text-primary' />
              Tabulasi Porsi Hidangan Per Gedung & Siklus
            </h3>
            <Badge
              variant='outline'
              className='text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/30'
            >
              {hospitalData.waktuMakan.toUpperCase()} • {hospitalData.siklusNama}
            </Badge>
          </div>
          <p className='text-xs text-muted-foreground'>
            Perhitungan kebutuhan porsi masakan dapur katering berdasarkan
            distribusi pasien{' '}
            <strong className='text-foreground'>Gedung Lama</strong> dan{' '}
            <strong className='text-foreground'>Gedung Baru</strong>.
          </p>
        </div>

        {/* View Switcher Tabs (Component Kecil) */}
        <TabulasiViewModeToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Search & Category Filter Sub-bar */}
      <div className='p-3 sm:px-5 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs'>
        {/* Search Input */}
        <div className='relative w-full sm:w-72'>
          <Search className='w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <input
            type='text'
            placeholder='Cari menu, kategori, atau diet...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-8 pr-3 py-1.5 bg-background text-xs text-foreground placeholder:text-muted-foreground border border-border/70 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs'
          />
        </div>

        {/* Category Pills Filter */}
        <div className='flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar'>
          <Filter className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
          {categoryList.map((cat) => (
            <button
              key={cat}
              type='button'
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer select-none shrink-0 ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 1. MODE: SIDE BY SIDE (GEDUNG LAMA & GEDUNG BARU) ─── */}
      {viewMode === 'SIDE_BY_SIDE' && (
        <div className='grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/80 overflow-x-auto'>
          {/* LEFT TABLE: GEDUNG LAMA */}
          <div className='w-full flex flex-col min-w-[320px]'>
            {/* Top Building Header */}
            <div className='bg-primary text-primary-foreground p-2.5 text-center font-extrabold tracking-wider text-xs sm:text-sm uppercase flex items-center justify-center gap-2'>
              <Building2 className='w-4 h-4' />
              GEDUNG LAMA
            </div>

            <Table>
              <TableHeader className='bg-primary/5 border-b border-border/80'>
                <TableRow className='hover:bg-primary/5'>
                  <TableHead className='w-[100px] text-xs font-extrabold text-foreground uppercase tracking-wider py-2.5'>
                    KATEGORI
                  </TableHead>
                  <TableHead className='text-xs font-extrabold text-foreground uppercase tracking-wider py-2.5'>
                    {hospitalData.waktuMakan.toUpperCase()} (MENU HIDANGAN)
                  </TableHead>
                  <TableHead className='w-[85px] text-xs font-extrabold text-foreground uppercase tracking-wider py-2.5 text-center'>
                    DIET
                  </TableHead>
                  <TableHead className='w-[100px] text-xs font-extrabold text-foreground uppercase tracking-wider py-2.5 text-center bg-primary/10'>
                    JUMLAH PORSI
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className='text-center py-8 text-xs text-muted-foreground'
                    >
                      Tidak ada data hidangan yang sesuai dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => {
                    const isTktp =
                      group.isTktp || group.kategori.includes('TKTP');
                    return (
                      <React.Fragment key={`gl-${group.kategori}`}>
                        {group.items.map((item, itemIdx) => {
                          const isFirst = itemIdx === 0;

                          return (
                            <TableRow
                              key={`gl-item-${item.id}`}
                              className={`transition-colors ${
                                isTktp
                                  ? 'bg-yellow-200/60 dark:bg-yellow-950/40 hover:bg-yellow-200 dark:hover:bg-yellow-950/60 text-yellow-950 dark:text-yellow-100 font-semibold'
                                  : 'hover:bg-muted/40'
                              }`}
                            >
                              {/* Category */}
                              <TableCell className='py-2.5 px-3 align-top font-bold text-[11px] text-foreground border-r border-border/60'>
                                {isFirst ? (
                                  <span
                                    className={`inline-block leading-tight ${isTktp ? 'text-yellow-900 dark:text-yellow-200' : ''}`}
                                  >
                                    {group.kategori}
                                  </span>
                                ) : (
                                  <span className='text-muted-foreground/30 text-[10px]'>
                                    —
                                  </span>
                                )}
                              </TableCell>

                              {/* Menu Name */}
                              <TableCell className='py-2.5 px-3 text-xs font-medium text-foreground'>
                                {item.nama_menu}
                              </TableCell>

                              {/* Diet Code (Component Kecil) */}
                              <TableCell className='py-2.5 px-2 text-center'>
                                <TabulasiDietBadge
                                  code={item.kode_diet}
                                  isTktp={item.is_tktp}
                                />
                              </TableCell>

                              {/* Portions Gedung Lama */}
                              <TableCell
                                className={`py-2.5 px-3 text-center font-mono font-extrabold text-xs text-foreground ${isTktp ? 'bg-yellow-300/40 dark:bg-yellow-900/40' : 'bg-muted/20'}`}
                              >
                                {item.porsi_gedung_lama}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}

                {/* Subtotal Row for Gedung Lama */}
                <TableRow className='bg-primary/15 font-bold border-t-2 border-primary/40'>
                  <TableCell
                    colSpan={3}
                    className='py-3 px-3 text-xs font-extrabold uppercase tracking-wider text-foreground'
                  >
                    TOTAL PORSI GEDUNG LAMA
                  </TableCell>
                  <TableCell className='text-center py-3 px-3 font-mono font-extrabold text-sm text-primary bg-primary/20'>
                    {filteredTotalLama}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* RIGHT TABLE: GEDUNG BARU */}
          <div className='w-full flex flex-col min-w-[320px]'>
            {/* Top Building Green Header */}
            <div className='bg-emerald-700 dark:bg-emerald-800 text-white p-2.5 text-center font-extrabold tracking-wider text-xs sm:text-sm uppercase flex items-center justify-center gap-2'>
              <Building2 className='w-4 h-4' />
              GEDUNG BARU
            </div>

            <Table>
              <TableHeader className='bg-emerald-100 dark:bg-emerald-950/60 border-b border-emerald-300 dark:border-emerald-800'>
                <TableRow className='hover:bg-emerald-100 dark:hover:bg-emerald-950/60'>
                  <TableHead className='w-[100px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5'>
                    KATEGORI
                  </TableHead>
                  <TableHead className='text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5'>
                    {hospitalData.waktuMakan.toUpperCase()} (MENU HIDANGAN)
                  </TableHead>
                  <TableHead className='w-[85px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5 text-center'>
                    DIET
                  </TableHead>
                  <TableHead className='w-[100px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5 text-center bg-emerald-200/60 dark:bg-emerald-900/60'>
                    JUMLAH PORSI
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className='text-center py-8 text-xs text-muted-foreground'
                    >
                      Tidak ada data hidangan yang sesuai dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => {
                    const isTktp =
                      group.isTktp || group.kategori.includes('TKTP');
                    return (
                      <React.Fragment key={`gb-${group.kategori}`}>
                        {group.items.map((item, itemIdx) => {
                          const isFirst = itemIdx === 0;

                          return (
                            <TableRow
                              key={`gb-item-${item.id}`}
                              className={`transition-colors ${
                                isTktp
                                  ? 'bg-yellow-200/60 dark:bg-yellow-950/40 hover:bg-yellow-200 dark:hover:bg-yellow-950/60 text-yellow-950 dark:text-yellow-100 font-semibold'
                                  : 'hover:bg-muted/40'
                              }`}
                            >
                              {/* Category */}
                              <TableCell className='py-2.5 px-3 align-top font-bold text-[11px] text-foreground border-r border-border/60'>
                                {isFirst ? (
                                  <span
                                    className={`inline-block leading-tight ${isTktp ? 'text-yellow-900 dark:text-yellow-200' : ''}`}
                                  >
                                    {group.kategori}
                                  </span>
                                ) : (
                                  <span className='text-muted-foreground/30 text-[10px]'>
                                    —
                                  </span>
                                )}
                              </TableCell>

                              {/* Menu Name */}
                              <TableCell className='py-2.5 px-3 text-xs font-medium text-foreground'>
                                {item.nama_menu}
                              </TableCell>

                              {/* Diet Code (Component Kecil) */}
                              <TableCell className='py-2.5 px-2 text-center'>
                                <TabulasiDietBadge
                                  code={item.kode_diet}
                                  isTktp={item.is_tktp}
                                />
                              </TableCell>

                              {/* Portions Gedung Baru */}
                              <TableCell
                                className={`py-2.5 px-3 text-center font-mono font-extrabold text-xs text-foreground ${isTktp ? 'bg-yellow-300/40 dark:bg-yellow-900/40' : 'bg-muted/20'}`}
                              >
                                {item.porsi_gedung_baru}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}

                {/* Subtotal Row for Gedung Baru */}
                <TableRow className='bg-emerald-100/70 dark:bg-emerald-950/80 font-bold border-t-2 border-emerald-600/50'>
                  <TableCell
                    colSpan={3}
                    className='py-3 px-3 text-xs font-extrabold uppercase tracking-wider text-emerald-950 dark:text-emerald-100'
                  >
                    TOTAL PORSI GEDUNG BARU
                  </TableCell>
                  <TableCell className='text-center py-3 px-3 font-mono font-extrabold text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/80'>
                    {filteredTotalBaru}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ─── 2. MODE: TABEL GABUNGAN / FULL CONSOLIDATED TABLE ─── */}
      {viewMode === 'COMBINED_FULL' && (
        <div className='overflow-x-auto w-full'>
          <Table>
            <TableHeader className='bg-muted/60'>
              <TableRow>
                <TableHead className='w-[50px] text-center text-xs font-semibold'>
                  No
                </TableHead>
                <TableHead className='w-[140px] text-xs font-semibold'>
                  Kategori Menu
                </TableHead>
                <TableHead className='min-w-[200px] text-xs font-semibold'>
                  Nama Hidangan & Olahan ({hospitalData.waktuMakan})
                </TableHead>
                <TableHead className='w-[110px] text-center text-xs font-semibold'>
                  Kode Diet
                </TableHead>
                <TableHead className='w-[130px] text-center text-xs font-semibold'>
                  <span className='flex items-center justify-center gap-1'>
                    <Building2 className='w-3.5 h-3.5 text-blue-500' /> Gedung
                    Lama
                  </span>
                </TableHead>
                <TableHead className='w-[130px] text-center text-xs font-semibold'>
                  <span className='flex items-center justify-center gap-1'>
                    <Building2 className='w-3.5 h-3.5 text-teal-500' /> Gedung
                    Baru
                  </span>
                </TableHead>
                <TableHead className='w-[140px] text-center text-xs font-bold text-foreground bg-primary/5'>
                  Total Porsi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center py-8 text-xs text-muted-foreground'
                  >
                    Tidak ada data hidangan yang sesuai dengan kriteria filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group, gIdx) => {
                  const isTktp =
                    group.isTktp || group.kategori.includes('TKTP');
                  return (
                    <React.Fragment key={`full-group-${group.kategori}`}>
                      {group.items.map((item, itemIdx) => (
                        <TableRow
                          key={`full-item-${item.id}`}
                          className={`transition-colors ${
                            isTktp
                              ? 'bg-yellow-100/80 dark:bg-yellow-950/40 hover:bg-yellow-200 dark:hover:bg-yellow-950/60 font-semibold'
                              : 'hover:bg-muted/40'
                          }`}
                        >
                          <TableCell className='text-center text-xs text-muted-foreground py-2.5'>
                            {gIdx * 10 + itemIdx + 1}
                          </TableCell>

                          <TableCell className='py-2.5 font-bold text-xs text-foreground'>
                            {item.kategori}
                          </TableCell>

                          <TableCell className='py-2.5 text-xs font-medium text-foreground'>
                            {item.nama_menu}
                          </TableCell>

                          <TableCell className='py-2.5 text-center'>
                            <TabulasiDietBadge
                              code={item.kode_diet}
                              isTktp={item.is_tktp}
                            />
                          </TableCell>

                          <TableCell className='text-center py-2.5 font-mono text-xs font-bold text-foreground'>
                            {item.porsi_gedung_lama}
                          </TableCell>

                          <TableCell className='text-center py-2.5 font-mono text-xs font-bold text-foreground'>
                            {item.porsi_gedung_baru}
                          </TableCell>

                          <TableCell className='text-center py-2.5 bg-primary/5'>
                            <span className='inline-flex items-center gap-1 font-mono font-extrabold text-xs text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20'>
                              {item.total_porsi}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                })
              )}

              {/* Grand Total Row */}
              <TableRow className='bg-muted/80 font-bold border-t-2 border-primary/30'>
                <TableCell
                  colSpan={4}
                  className='py-3.5 text-xs font-extrabold uppercase tracking-wider text-foreground text-left pl-4'
                >
                  TOTAL KESELURUHAN PORSI TERJADWAL
                </TableCell>
                <TableCell className='text-center py-3.5 font-mono font-extrabold text-sm text-foreground'>
                  {filteredTotalLama}
                </TableCell>
                <TableCell className='text-center py-3.5 font-mono font-extrabold text-sm text-foreground'>
                  {filteredTotalBaru}
                </TableCell>
                <TableCell className='text-center py-3.5 bg-primary/10'>
                  <span className='font-mono font-extrabold text-base text-primary'>
                    {filteredGrandTotal}
                  </span>
                  <span className='text-[11px] text-primary/80 font-medium ml-1'>
                    porsi
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── 3. MODE: SINGLE GEDUNG (LAMA ATAU BARU) ─── */}
      {(viewMode === 'GEDUNG_LAMA' || viewMode === 'GEDUNG_BARU') && (
        <div className='overflow-x-auto w-full'>
          <div className='bg-emerald-700 dark:bg-emerald-800 text-white p-2.5 text-center font-extrabold tracking-wider text-sm uppercase flex items-center justify-center gap-2'>
            <Building2 className='w-4 h-4' />
            {viewMode === 'GEDUNG_LAMA' ? 'GEDUNG LAMA' : 'GEDUNG BARU'}
          </div>

          <Table>
            <TableHeader className='bg-emerald-100 dark:bg-emerald-950/60 border-b border-emerald-300 dark:border-emerald-800'>
              <TableRow>
                <TableHead className='w-[140px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5'>
                  KATEGORI
                </TableHead>
                <TableHead className='min-w-[220px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5'>
                  {hospitalData.waktuMakan.toUpperCase()} (NAMA MENU HIDANGAN)
                </TableHead>
                <TableHead className='w-[100px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5 text-center'>
                  DIET
                </TableHead>
                <TableHead className='w-[130px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5 text-center bg-emerald-200/60 dark:bg-emerald-900/60'>
                  JUMLAH PORSI
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => {
                const isTktp =
                  group.isTktp || group.kategori.includes('TKTP');
                return (
                  <React.Fragment key={`single-${group.kategori}`}>
                    {group.items.map((item, idx) => {
                      const isFirst = idx === 0;
                      const portion =
                        viewMode === 'GEDUNG_LAMA'
                          ? item.porsi_gedung_lama
                          : item.porsi_gedung_baru;

                      return (
                        <TableRow
                          key={`single-item-${item.id}`}
                          className={`transition-colors ${
                            isTktp
                              ? 'bg-yellow-200/60 dark:bg-yellow-950/40 hover:bg-yellow-200 text-yellow-950 dark:text-yellow-100 font-semibold'
                              : 'hover:bg-muted/40'
                          }`}
                        >
                          <TableCell className='py-2.5 px-3 font-bold text-xs text-foreground border-r border-border/60'>
                            {isFirst ? (
                              group.kategori
                            ) : (
                              <span className='text-muted-foreground/30'>—</span>
                            )}
                          </TableCell>
                          <TableCell className='py-2.5 px-3 text-xs font-medium text-foreground'>
                            {item.nama_menu}
                          </TableCell>
                          <TableCell className='py-2.5 px-2 text-center'>
                            <TabulasiDietBadge
                              code={item.kode_diet}
                              isTktp={item.is_tktp}
                            />
                          </TableCell>
                          <TableCell
                            className={`py-2.5 px-3 text-center font-mono font-extrabold text-sm text-foreground ${isTktp ? 'bg-yellow-300/40 dark:bg-yellow-900/40' : 'bg-muted/20'}`}
                          >
                            {portion}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              <TableRow className='bg-emerald-100/80 dark:bg-emerald-950/80 font-bold border-t-2 border-emerald-600/50'>
                <TableCell
                  colSpan={3}
                  className='py-3 px-3 text-xs font-extrabold uppercase tracking-wider text-emerald-950 dark:text-emerald-100'
                >
                  TOTAL PORSI{' '}
                  {viewMode === 'GEDUNG_LAMA' ? 'GEDUNG LAMA' : 'GEDUNG BARU'}
                </TableCell>
                <TableCell className='text-center py-3 px-3 font-mono font-extrabold text-base text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/80'>
                  {viewMode === 'GEDUNG_LAMA'
                    ? filteredTotalLama
                    : filteredTotalBaru}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Grand Total Bar Across Both Buildings */}
      <div className='p-3.5 sm:p-4 bg-muted/40 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3'>
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Info className='w-4 h-4 text-primary shrink-0' />
          <span>
            Porsi dihitung berdasarkan siklus menu{' '}
            <strong className='text-foreground'>
              {hospitalData.siklusNama}
            </strong>{' '}
            dan mapping diet pasien snapshot terkunci.
          </span>
        </div>

        <div className='flex items-center gap-3 shrink-0'>
          <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
            Grand Total (Lama + Baru):
          </span>
          <span className='font-mono font-extrabold text-base text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl shadow-2xs'>
            {filteredGrandTotal} Porsi
          </span>
        </div>
      </div>
    </div>
  );
}
