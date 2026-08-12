'use client';

import React, { useState, useMemo } from 'react';
import type { SnapshotDetail } from '@/servers/tabulasi.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Building, Clock, Info } from 'lucide-react';

interface TabulasiDetailsTableProps {
  details: Omit<SnapshotDetail, 'nama_pasien'>[];
}

export default function TabulasiDetailsTable({ details }: TabulasiDetailsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [ruanganFilter, setRuanganFilter] = useState('ALL');
  const [isEmergentOnly, setIsEmergentOnly] = useState(false);

  // Get list of unique rooms for filter select
  const uniqueRooms = useMemo(() => {
    const rooms = new Set<string>();
    for (const d of details) {
      if (d.ruangan) rooms.add(d.ruangan.trim());
    }
    return Array.from(rooms).sort();
  }, [details]);

  // Filter items
  const filteredDetails = useMemo(() => {
    return details.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchRm = item.no_rm.toLowerCase().includes(q);
        const matchDiet = item.diet_rs_raw.toLowerCase().includes(q);
        const matchBed = item.no_bed.toLowerCase().includes(q);
        if (!matchRm && !matchDiet && !matchBed) {
          return false;
        }
      }

      // 2. Room Filter
      if (ruanganFilter !== 'ALL' && item.ruangan !== ruanganFilter) {
        return false;
      }

      // 3. Emergent Only
      if (isEmergentOnly && !item.is_emergent) {
        return false;
      }

      return true;
    });
  }, [details, searchQuery, ruanganFilter, isEmergentOnly]);

  return (
    <div className="space-y-4 w-full min-w-0">
      
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border">
        {/* Search */}
        <div className="relative flex-1 w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari RM, No Bed, atau Diet RS Raw..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm rounded-lg bg-background w-full"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap sm:w-auto">
          {/* Room Filter */}
          <select
            value={ruanganFilter}
            onChange={(e) => setRuanganFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20 flex-1 sm:flex-none sm:w-44 font-semibold"
          >
            <option value="ALL">Semua Ruangan</option>
            {uniqueRooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>

          {/* Emergent Toggle */}
          <button
            onClick={() => setIsEmergentOnly(!isEmergentOnly)}
            className={`h-9 px-3 text-xs font-semibold rounded-lg border transition-all duration-200 ${
              isEmergentOnly 
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300' 
                : 'bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            🚨 Emergent Only
          </button>
        </div>
      </div>

      {/* Info Badge */}
      <div className="flex items-center gap-2 text-xs bg-muted/40 p-3 rounded-xl border text-muted-foreground">
        <Info className="w-4 h-4 text-muted-foreground shrink-0" />
        <span>
          Menampilkan <strong className="text-foreground">{filteredDetails.length}</strong> porsi diet terdaftar. 
          Sesuai dengan regulasi privasi pasien, nama pasien tidak dicantumkan dalam lembar tabulasi dapur.
        </span>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden w-full min-w-0">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[100px] text-xs font-bold">No RM</TableHead>
                <TableHead className="w-[180px] text-xs font-bold">Lokasi Bed & Kelas</TableHead>
                <TableHead className="min-w-[200px] text-xs font-bold">Diet RS Raw (Free Text)</TableHead>
                <TableHead className="w-[130px] text-xs font-bold">Bentuk Makanan</TableHead>
                <TableHead className="w-[130px] text-xs font-bold">Kategori Diet</TableHead>
                <TableHead className="w-[100px] text-xs font-bold">Extra</TableHead>
                <TableHead className="w-[100px] text-xs font-bold">Buah</TableHead>
                <TableHead className="w-[100px] text-xs font-bold">Snack</TableHead>
                <TableHead className="w-[110px] text-xs font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDetails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-xs text-muted-foreground">
                    Tidak ditemukan data yang sesuai dengan pencarian Anda.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDetails.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className={`hover:bg-muted/30 transition-colors ${
                      item.is_emergent ? 'bg-amber-500/5 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    {/* RM */}
                    <TableCell className="align-middle font-mono font-bold text-xs py-3.5">
                      {item.no_rm}
                    </TableCell>

                    {/* Location */}
                    <TableCell className="align-middle py-3.5 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-foreground">
                          {item.ruangan} — {item.no_bed}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>{item.gedung}</span>
                          <span>•</span>
                          <span>{item.kelas}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Diet RS Raw */}
                    <TableCell className="align-middle py-3.5 text-xs font-medium">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="truncate max-w-[260px]" title={item.diet_rs_raw}>
                          {item.diet_rs_raw}
                        </span>
                        {item.is_emergent && (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 font-bold text-[9px] py-0 px-1 hover:bg-amber-100">
                            Emergent
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Bentuk Makanan */}
                    <TableCell className="align-middle py-3.5 text-xs">
                      {item.bentuk_makanan ? (
                        <span className="font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200">
                          {item.bentuk_makanan}
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-200">UNMAPPED</span>
                      )}
                    </TableCell>

                    {/* Kategori Diet */}
                    <TableCell className="align-middle py-3.5 text-xs">
                      {item.kategori_diet ? (
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200">
                          {item.kategori_diet}
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-200">UNMAPPED</span>
                      )}
                    </TableCell>

                    {/* Extra */}
                    <TableCell className="align-middle py-3.5 text-xs">
                      {item.extra ? (
                        <span className="font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded-md border border-teal-200">
                          {item.extra}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    {/* Buah */}
                    <TableCell className="align-middle py-3.5 text-xs">
                      {item.buah ? (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200">
                          {item.buah}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    {/* Snack */}
                    <TableCell className="align-middle py-3.5 text-xs">
                      {item.snack ? (
                        <span className="font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-md border border-purple-200">
                          {item.snack}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="align-middle py-3.5 text-xs">
                      <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border text-[11px] ${
                        item.status_saat_snapshot === 'AKTIF' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.status_saat_snapshot || 'AKTIF'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
