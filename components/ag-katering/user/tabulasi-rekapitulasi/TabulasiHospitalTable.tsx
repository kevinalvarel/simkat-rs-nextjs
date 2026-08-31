'use client';

import React, { useState, useMemo } from 'react';
import type { 
  TabulasiHospitalData, 
  TabulasiHospitalCategoryGroup, 
  TabulasiHospitalItem 
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
  Sparkles, 
  Layers, 
  Search, 
  Filter, 
  CheckCircle2, 
  Columns, 
  List,
  Eye,
  Info
} from 'lucide-react';

interface TabulasiHospitalTableProps {
  hospitalData: TabulasiHospitalData;
}

type ViewMode = 'SIDE_BY_SIDE' | 'GEDUNG_LAMA' | 'GEDUNG_BARU' | 'COMBINED_FULL';

const DIET_BADGE_COLORS: Record<string, string> = {
  B: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'DM, RG': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'RG, DM': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'B, D, DM,RG': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'B, D, DM, RG': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'DJ, RL, Rkol': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'B, Diit, DM': 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
  RG: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  RS: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  RP: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
  TKTP: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 border-yellow-500/40 font-bold',
};

export default function TabulasiHospitalTable({ hospitalData }: TabulasiHospitalTableProps) {
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

        const subtotalLama = filteredItems.reduce((sum, it) => sum + it.porsi_gedung_lama, 0);
        const subtotalBaru = filteredItems.reduce((sum, it) => sum + it.porsi_gedung_baru, 0);

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
    [filteredGroups]
  );
  const filteredTotalBaru = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.subtotalGedungBaru, 0),
    [filteredGroups]
  );
  const filteredGrandTotal = filteredTotalLama + filteredTotalBaru;

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-2xs overflow-hidden w-full space-y-0">
      
      {/* Table Controls & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-border/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 bg-muted/20">
        
        {/* Title & Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <Utensils className="w-4 h-4 text-primary" />
              Tabulasi Porsi Hidangan Per Gedung & Siklus
            </h3>
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
              {hospitalData.waktuMakan.toUpperCase()} • {hospitalData.siklusNama}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Perhitungan kebutuhan porsi masakan dapur katering berdasarkan distribusi pasien <strong className="text-foreground">Gedung Lama</strong> dan <strong className="text-foreground">Gedung Baru</strong>.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/70 rounded-xl border border-border/60 shrink-0 self-start lg:self-center overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setViewMode('SIDE_BY_SIDE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
              viewMode === 'SIDE_BY_SIDE'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-primary" />
            <span>Berdampingan (Gedung Lama & Baru)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('COMBINED_FULL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
              viewMode === 'COMBINED_FULL'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-3.5 h-3.5 text-primary" />
            <span>Tabel Gabungan</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('GEDUNG_LAMA')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
              viewMode === 'GEDUNG_LAMA'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Gedung Lama</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('GEDUNG_BARU')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
              viewMode === 'GEDUNG_BARU'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-teal-500" />
            <span>Gedung Baru</span>
          </button>
        </div>

      </div>

      {/* Search & Category Pills */}
      <div className="p-3 sm:px-5 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari hidangan, diet (misal: B, DM, RG)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-muted/40 border border-border/70 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <span className="text-[11px] font-medium text-muted-foreground shrink-0 hidden md:inline">
            Kategori:
          </span>
          {categoryList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              {cat === 'ALL' ? 'Semua Komponen' : cat}
            </button>
          ))}
        </div>

      </div>

      {/* ─── 1. MODE: SIDE BY SIDE (GEDUNG LAMA & GEDUNG BARU SEPERTI DI GAMBAR EXCEL) ─── */}
      {viewMode === 'SIDE_BY_SIDE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/80 w-full overflow-x-auto">
          
          {/* LEFT TABLE: GEDUNG LAMA */}
          <div className="w-full flex flex-col min-w-[320px]">
            {/* Top Building Green Header */}
            <div className="bg-emerald-700 dark:bg-emerald-800 text-white p-2.5 text-center font-extrabold tracking-wider text-xs sm:text-sm uppercase flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4" />
              GEDUNG LAMA
            </div>

            <Table>
              <TableHeader className="bg-emerald-100 dark:bg-emerald-950/60 border-b border-emerald-300 dark:border-emerald-800">
                <TableRow className="hover:bg-emerald-100 dark:hover:bg-emerald-950/60">
                  <TableHead className="w-[100px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5">
                    KATEGORI
                  </TableHead>
                  <TableHead className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5">
                    {hospitalData.waktuMakan.toUpperCase()} (MENU HIDANGAN)
                  </TableHead>
                  <TableHead className="w-[85px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5 text-center">
                    DIET
                  </TableHead>
                  <TableHead className="w-[100px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5 text-center bg-emerald-200/60 dark:bg-emerald-900/60">
                    JUMLAH PORSI
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                      Tidak ada data hidangan yang sesuai dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => {
                    const isTktp = group.isTktp || group.kategori.includes('TKTP');
                    return (
                      <React.Fragment key={`gl-${group.kategori}`}>
                        {group.items.map((item, itemIdx) => {
                          const isFirst = itemIdx === 0;
                          const dietStyle =
                            DIET_BADGE_COLORS[item.kode_diet] ||
                            'bg-secondary text-secondary-foreground border-border';

                          return (
                            <TableRow
                              key={`gl-item-${item.id}`}
                              className={`transition-colors ${
                                isTktp
                                  ? 'bg-yellow-200/60 dark:bg-yellow-950/40 hover:bg-yellow-200 dark:hover:bg-yellow-950/60 text-yellow-950 dark:text-yellow-100 font-semibold'
                                  : 'hover:bg-muted/40'
                              }`}
                            >
                              {/* Category (RowSpan like appearance) */}
                              <TableCell className="py-2.5 px-3 align-top font-bold text-[11px] text-foreground border-r border-border/60">
                                {isFirst ? (
                                  <span className={`inline-block leading-tight ${isTktp ? 'text-yellow-900 dark:text-yellow-200' : ''}`}>
                                    {group.kategori}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/30 text-[10px]">—</span>
                                )}
                              </TableCell>

                              {/* Menu Name */}
                              <TableCell className="py-2.5 px-3 text-xs font-medium text-foreground">
                                {item.nama_menu}
                              </TableCell>

                              {/* Diet Code */}
                              <TableCell className="py-2.5 px-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${dietStyle}`}>
                                  {item.kode_diet || '—'}
                                </span>
                              </TableCell>

                              {/* Portions Gedung Lama */}
                              <TableCell className={`py-2.5 px-3 text-center font-mono font-extrabold text-xs text-foreground ${isTktp ? 'bg-yellow-300/40 dark:bg-yellow-900/40' : 'bg-muted/20'}`}>
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
                <TableRow className="bg-emerald-100/70 dark:bg-emerald-950/80 font-bold border-t-2 border-emerald-600/50">
                  <TableCell colSpan={3} className="py-3 px-3 text-xs font-extrabold uppercase tracking-wider text-emerald-950 dark:text-emerald-100">
                    TOTAL PORSI GEDUNG LAMA
                  </TableCell>
                  <TableCell className="text-center py-3 px-3 font-mono font-extrabold text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/80">
                    {filteredTotalLama}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* RIGHT TABLE: GEDUNG BARU */}
          <div className="w-full flex flex-col min-w-[320px]">
            {/* Top Building Green Header */}
            <div className="bg-emerald-700 dark:bg-emerald-800 text-white p-2.5 text-center font-extrabold tracking-wider text-xs sm:text-sm uppercase flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4" />
              GEDUNG BARU
            </div>

            <Table>
              <TableHeader className="bg-emerald-100 dark:bg-emerald-950/60 border-b border-emerald-300 dark:border-emerald-800">
                <TableRow className="hover:bg-emerald-100 dark:hover:bg-emerald-950/60">
                  <TableHead className="w-[100px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5">
                    KATEGORI
                  </TableHead>
                  <TableHead className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5">
                    {hospitalData.waktuMakan.toUpperCase()} (MENU HIDANGAN)
                  </TableHead>
                  <TableHead className="w-[85px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5 text-center">
                    DIET
                  </TableHead>
                  <TableHead className="w-[100px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5 text-center bg-emerald-200/60 dark:bg-emerald-900/60">
                    JUMLAH PORSI
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                      Tidak ada data hidangan yang sesuai dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => {
                    const isTktp = group.isTktp || group.kategori.includes('TKTP');
                    return (
                      <React.Fragment key={`gb-${group.kategori}`}>
                        {group.items.map((item, itemIdx) => {
                          const isFirst = itemIdx === 0;
                          const dietStyle =
                            DIET_BADGE_COLORS[item.kode_diet] ||
                            'bg-secondary text-secondary-foreground border-border';

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
                              <TableCell className="py-2.5 px-3 align-top font-bold text-[11px] text-foreground border-r border-border/60">
                                {isFirst ? (
                                  <span className={`inline-block leading-tight ${isTktp ? 'text-yellow-900 dark:text-yellow-200' : ''}`}>
                                    {group.kategori}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/30 text-[10px]">—</span>
                                )}
                              </TableCell>

                              {/* Menu Name */}
                              <TableCell className="py-2.5 px-3 text-xs font-medium text-foreground">
                                {item.nama_menu}
                              </TableCell>

                              {/* Diet Code */}
                              <TableCell className="py-2.5 px-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${dietStyle}`}>
                                  {item.kode_diet || '—'}
                                </span>
                              </TableCell>

                              {/* Portions Gedung Baru */}
                              <TableCell className={`py-2.5 px-3 text-center font-mono font-extrabold text-xs text-foreground ${isTktp ? 'bg-yellow-300/40 dark:bg-yellow-900/40' : 'bg-muted/20'}`}>
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
                <TableRow className="bg-emerald-100/70 dark:bg-emerald-950/80 font-bold border-t-2 border-emerald-600/50">
                  <TableCell colSpan={3} className="py-3 px-3 text-xs font-extrabold uppercase tracking-wider text-emerald-950 dark:text-emerald-100">
                    TOTAL PORSI GEDUNG BARU
                  </TableCell>
                  <TableCell className="text-center py-3 px-3 font-mono font-extrabold text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/80">
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
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="w-[50px] text-center text-xs font-semibold">No</TableHead>
                <TableHead className="w-[140px] text-xs font-semibold">Kategori Menu</TableHead>
                <TableHead className="min-w-[200px] text-xs font-semibold">
                  Nama Hidangan & Olahan ({hospitalData.waktuMakan})
                </TableHead>
                <TableHead className="w-[110px] text-center text-xs font-semibold">Kode Diet</TableHead>
                <TableHead className="w-[130px] text-center text-xs font-semibold">
                  <span className="flex items-center justify-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" /> Gedung Lama
                  </span>
                </TableHead>
                <TableHead className="w-[130px] text-center text-xs font-semibold">
                  <span className="flex items-center justify-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-teal-500" /> Gedung Baru
                  </span>
                </TableHead>
                <TableHead className="w-[140px] text-center text-xs font-bold text-foreground bg-primary/5">
                  Total Porsi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    Tidak ada data hidangan yang sesuai dengan kriteria filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group, gIdx) => {
                  const isTktp = group.isTktp || group.kategori.includes('TKTP');
                  return (
                    <React.Fragment key={`full-group-${group.kategori}`}>
                      {group.items.map((item, itemIdx) => {
                        const dietStyle =
                          DIET_BADGE_COLORS[item.kode_diet] ||
                          'bg-secondary text-secondary-foreground border-border';

                        return (
                          <TableRow
                            key={`full-item-${item.id}`}
                            className={`transition-colors ${
                              isTktp
                                ? 'bg-yellow-100/80 dark:bg-yellow-950/40 hover:bg-yellow-200 dark:hover:bg-yellow-950/60 font-semibold'
                                : 'hover:bg-muted/40'
                            }`}
                          >
                            <TableCell className="text-center text-xs text-muted-foreground py-2.5">
                              {gIdx * 10 + itemIdx + 1}
                            </TableCell>

                            <TableCell className="py-2.5 font-bold text-xs text-foreground">
                              {item.kategori}
                            </TableCell>

                            <TableCell className="py-2.5 text-xs font-medium text-foreground">
                              {item.nama_menu}
                            </TableCell>

                            <TableCell className="py-2.5 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold border ${dietStyle}`}>
                                {item.kode_diet || '—'}
                              </span>
                            </TableCell>

                            <TableCell className="text-center py-2.5 font-mono text-xs font-bold text-foreground">
                              {item.porsi_gedung_lama}
                            </TableCell>

                            <TableCell className="text-center py-2.5 font-mono text-xs font-bold text-foreground">
                              {item.porsi_gedung_baru}
                            </TableCell>

                            <TableCell className="text-center py-2.5 bg-primary/5">
                              <span className="inline-flex items-center gap-1 font-mono font-extrabold text-xs text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                                {item.total_porsi}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}

              {/* Grand Total Row */}
              <TableRow className="bg-muted/80 font-bold border-t-2 border-primary/30">
                <TableCell colSpan={4} className="py-3.5 text-xs font-extrabold uppercase tracking-wider text-foreground text-left pl-4">
                  TOTAL KESELURUHAN PORSI TERJADWAL
                </TableCell>
                <TableCell className="text-center py-3.5 font-mono font-extrabold text-sm text-foreground">
                  {filteredTotalLama}
                </TableCell>
                <TableCell className="text-center py-3.5 font-mono font-extrabold text-sm text-foreground">
                  {filteredTotalBaru}
                </TableCell>
                <TableCell className="text-center py-3.5 bg-primary/10">
                  <span className="font-mono font-extrabold text-base text-primary">
                    {filteredGrandTotal}
                  </span>
                  <span className="text-[11px] text-primary/80 font-medium ml-1">porsi</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── 3. MODE: SINGLE GEDUNG (LAMA ATAU BARU) ─── */}
      {(viewMode === 'GEDUNG_LAMA' || viewMode === 'GEDUNG_BARU') && (
        <div className="overflow-x-auto w-full">
          <div className="bg-emerald-700 dark:bg-emerald-800 text-white p-2.5 text-center font-extrabold tracking-wider text-sm uppercase flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4" />
            {viewMode === 'GEDUNG_LAMA' ? 'GEDUNG LAMA' : 'GEDUNG BARU'}
          </div>

          <Table>
            <TableHeader className="bg-emerald-100 dark:bg-emerald-950/60 border-b border-emerald-300 dark:border-emerald-800">
              <TableRow>
                <TableHead className="w-[140px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5">
                  KATEGORI
                </TableHead>
                <TableHead className="min-w-[220px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5">
                  {hospitalData.waktuMakan.toUpperCase()} (NAMA MENU HIDANGAN)
                </TableHead>
                <TableHead className="w-[100px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5 text-center">
                  DIET
                </TableHead>
                <TableHead className="w-[130px] text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider py-2.5 text-center bg-emerald-200/60 dark:bg-emerald-900/60">
                  JUMLAH PORSI
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => {
                const isTktp = group.isTktp || group.kategori.includes('TKTP');
                return (
                  <React.Fragment key={`single-${group.kategori}`}>
                    {group.items.map((item, idx) => {
                      const isFirst = idx === 0;
                      const dietStyle =
                        DIET_BADGE_COLORS[item.kode_diet] ||
                        'bg-secondary text-secondary-foreground border-border';
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
                          <TableCell className="py-2.5 px-3 font-bold text-xs text-foreground border-r border-border/60">
                            {isFirst ? group.kategori : <span className="text-muted-foreground/30">—</span>}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-xs font-medium text-foreground">
                            {item.nama_menu}
                          </TableCell>
                          <TableCell className="py-2.5 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${dietStyle}`}>
                              {item.kode_diet || '—'}
                            </span>
                          </TableCell>
                          <TableCell className={`py-2.5 px-3 text-center font-mono font-extrabold text-sm text-foreground ${isTktp ? 'bg-yellow-300/40 dark:bg-yellow-900/40' : 'bg-muted/20'}`}>
                            {portion}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              <TableRow className="bg-emerald-100/80 dark:bg-emerald-950/80 font-bold border-t-2 border-emerald-600/50">
                <TableCell colSpan={3} className="py-3 px-3 text-xs font-extrabold uppercase tracking-wider text-emerald-950 dark:text-emerald-100">
                  TOTAL PORSI {viewMode === 'GEDUNG_LAMA' ? 'GEDUNG LAMA' : 'GEDUNG BARU'}
                </TableCell>
                <TableCell className="text-center py-3 px-3 font-mono font-extrabold text-base text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/80">
                  {viewMode === 'GEDUNG_LAMA' ? filteredTotalLama : filteredTotalBaru}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Grand Total Bar Across Both Buildings */}
      <div className="p-3.5 sm:p-4 bg-muted/40 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>
            Porsi dihitung berdasarkan siklus menu <strong className="text-foreground">{hospitalData.siklusNama}</strong> dan mapping diet pasien snapshot terkunci.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Grand Total (Lama + Baru):
          </span>
          <span className="font-mono font-extrabold text-base text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl shadow-2xs">
            {filteredGrandTotal} Porsi
          </span>
        </div>
      </div>

    </div>
  );
}
