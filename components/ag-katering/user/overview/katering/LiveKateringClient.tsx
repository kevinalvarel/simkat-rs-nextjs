'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { LiveKateringSummary } from '@/servers/overview.service';
import { getLiveKateringData } from '@/servers/overview.service';
import { listenProductionUpdate } from '@/lib/realtime-sync';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Send,
  RefreshCw,
  Search,
  Utensils,
  ExternalLink,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface LiveKateringClientProps {
  initialData: LiveKateringSummary;
}

export default function LiveKateringClient({
  initialData,
}: LiveKateringClientProps) {
  const [data, setData] = useState<LiveKateringSummary>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(
    initialData.lastUpdated || new Date().toLocaleTimeString('id-ID'),
  );

  useEffect(() => {
    setData(initialData);
    if (initialData.lastUpdated) {
      setLastSyncedAt(initialData.lastUpdated);
    }
  }, [initialData]);

  const fetchLiveData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const fresh = await getLiveKateringData();
      if (fresh) {
        setData(fresh);
        setLastSyncedAt(
          fresh.lastUpdated || new Date().toLocaleTimeString('id-ID'),
        );
      }
    } catch (err) {
      console.error('Failed to fetch live katering data:', err);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = listenProductionUpdate((msg) => {
      console.debug('Live Katering auto-sync triggered from broadcast:', msg);
      fetchLiveData(false);
    });
    return () => {
      unsubscribe();
    };
  }, [fetchLiveData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchLiveData(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveData(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchLiveData]);

  function handleManualRefresh() {
    fetchLiveData(true);
  }

  const filteredPatients = useMemo(() => {
    if (!data.patients) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return data.patients;
    return data.patients.filter((p) => {
      const matchName = p.nama_pasien?.toLowerCase().includes(q);
      const matchNorm = p.no_rm?.toLowerCase().includes(q);
      const matchDiet = p.diet_raw?.toLowerCase().includes(q);
      const matchRuang = p.ruangan?.toLowerCase().includes(q);
      return matchName || matchNorm || matchDiet || matchRuang;
    });
  }, [data.patients, searchQuery]);

  return (
    <div className='flex flex-1 flex-col gap-4 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* ── Header ringkas ─────────────────────────────────────────── */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0'>
        <div className='space-y-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h1 className='text-xl sm:text-2xl font-bold tracking-tight'>
              Daftar Pasien Diet Khusus Katering
            </h1>
            <Badge variant='secondary' className='text-[11px]'>
              {data.totalPasien} Pasien
            </Badge>
          </div>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Bubur Saring, Sonde, dan diet khusus lain yang dialihkan dari dapur
            umum ke AG Katering.
          </p>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <Link href='/dashboard/ag-katering/mapping-diet'>
            <Button variant='outline' size='sm' className='gap-1.5 text-xs'>
              <Utensils className='w-3.5 h-3.5 text-primary' />
              Master Mapping
              <ExternalLink className='w-3 h-3 text-muted-foreground' />
            </Button>
          </Link>
          <Button
            variant='outline'
            size='sm'
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className='gap-2 text-xs'
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Tabel utama ────────────────────────────────────────────── */}
      <Card className='shadow-xs overflow-hidden gap-0 py-0'>
        {/* Toolbar: search + sync info dalam satu bar */}
        <div className='px-3 sm:px-4 py-3 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center gap-2.5'>
          <div className='relative flex-1 min-w-0'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              type='text'
              placeholder='Cari nama, No RM, ruangan, atau diet...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 text-xs sm:text-sm bg-background'
            />
          </div>
          <div className='flex items-center justify-between sm:justify-end gap-2 shrink-0'>
            {searchQuery && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSearchQuery('')}
                className='text-xs h-8 text-muted-foreground px-2'
              >
                Reset
              </Button>
            )}
            <span className='text-[11px] text-muted-foreground flex items-center gap-1.5 whitespace-nowrap'>
              <Clock className='w-3 h-3' />
              Sinkron: {lastSyncedAt}
            </span>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className='p-12 text-center'>
            <div className='w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto mb-3'>
              <Send className='w-6 h-6' />
            </div>
            <h4 className='font-semibold text-sm'>
              Tidak ada pasien katering saat ini
            </h4>
            <p className='text-xs text-muted-foreground max-w-sm mx-auto mt-1'>
              {searchQuery
                ? `Tidak ditemukan hasil untuk "${searchQuery}".`
                : 'Tidak ada pasien aktif dengan diet Bubur Saring / Sonde atau yang dialihkan ke AG Katering.'}
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/40 hover:bg-muted/40'>
                  <TableHead className='w-[50px] text-center font-bold uppercase tracking-wider text-[11px]'>
                    No
                  </TableHead>
                  <TableHead className='min-w-[180px] font-bold uppercase tracking-wider text-[11px]'>
                    Pasien & No RM
                  </TableHead>
                  <TableHead className='min-w-[150px] font-bold uppercase tracking-wider text-[11px]'>
                    Ruangan / Kelas
                  </TableHead>
                  <TableHead className='min-w-[220px] font-bold uppercase tracking-wider text-[11px]'>
                    Diet Raw RS
                  </TableHead>
                  <TableHead className='min-w-[140px] font-bold uppercase tracking-wider text-[11px]'>
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((p, idx) => (
                  <TableRow
                    key={p.id}
                    className='hover:bg-muted/40 transition-colors'
                  >
                    <TableCell className='text-center text-muted-foreground font-mono text-xs py-3'>
                      {idx + 1}
                    </TableCell>
                    <TableCell className='py-3'>
                      <div className='font-bold text-foreground text-xs'>
                        {p.nama_pasien}
                      </div>
                      <div className='text-[10px] text-muted-foreground font-mono'>
                        {p.no_rm || '-'}
                      </div>
                    </TableCell>
                    <TableCell className='py-3'>
                      <div className='font-medium text-foreground text-xs'>
                        {p.ruangan || '-'}
                      </div>
                      <div className='text-[10px] text-muted-foreground'>
                        {p.gedung ? `${p.gedung} - ` : ''}Bed {p.bed || '-'} (
                        {p.kelas})
                      </div>
                    </TableCell>
                    <TableCell className='py-3'>
                      <div className='font-mono font-bold text-foreground text-xs bg-blue-50/70 dark:bg-blue-950/40 px-2 py-1 rounded border border-blue-200 dark:border-blue-900 inline-block'>
                        {p.diet_raw}
                      </div>
                    </TableCell>
                    <TableCell className='py-3'>
                      {p.is_tugas_ag_katering ? (
                        <Badge
                          variant='outline'
                          className='text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 gap-1'
                        >
                          <Send className='w-3 h-3' /> Tugas AG Katering
                        </Badge>
                      ) : (
                        <Badge
                          variant='outline'
                          className='text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 gap-1'
                        >
                          <AlertCircle className='w-3 h-3' /> AG Katering (Legacy)
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
