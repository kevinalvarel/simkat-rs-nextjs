'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { LiveKateringSummary } from '@/servers/overview.service';
import { getLiveKateringData } from '@/servers/overview.service';
import { listenProductionUpdate } from '@/lib/realtime-sync';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Users,
  Utensils,
  ExternalLink,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
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

  // Sync state if server component passes new initialData
  useEffect(() => {
    setData(initialData);
    if (initialData.lastUpdated) {
      setLastSyncedAt(initialData.lastUpdated);
    }
  }, [initialData]);

  // Real-time data fetcher function
  const fetchLiveData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const fresh = await getLiveKateringData();
      if (fresh) {
        setData(fresh);
        setLastSyncedAt(fresh.lastUpdated || new Date().toLocaleTimeString('id-ID'));
      }
    } catch (err) {
      console.error('Failed to fetch live katering data:', err);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  }, []);

  // 1. Listen to BroadcastChannel events (0ms cross-tab auto-sync)
  useEffect(() => {
    const unsubscribe = listenProductionUpdate((msg) => {
      console.debug('Live Katering auto-sync triggered from broadcast:', msg);
      fetchLiveData(false);
    });

    return () => {
      unsubscribe();
    };
  }, [fetchLiveData]);

  // 2. Periodic background auto-sync polling every 5s when document is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchLiveData(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // 3. Tab visibility & window focus handler (instant sync upon returning to tab)
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

  // Manual refresh handler
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

  const kateringMappedCount = useMemo(() => {
    return (data.patients || []).filter(
      (p) => p.status_mapping === 'KATERING',
    ).length;
  }, [data.patients]);

  const rawFallbackCount = (data.patients?.length ?? 0) - kateringMappedCount;

  return (
    <div className='flex flex-1 flex-col gap-5 sm:gap-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* ── 1. Header Banner ─────────────────────────────────────────────── */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent p-4 sm:p-5 rounded-2xl border border-blue-500/20 shadow-xs min-w-0'>
        <div className='space-y-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
              Live Katering — Monitoring Diet Khusus
            </h1>
            <Badge
              variant='outline'
              className='text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 gap-1'
            >
              <Send className='w-3.5 h-3.5' /> Dialihkan ke AG Katering
            </Badge>

            {/* Real-time sync indicator badge */}
            <Badge
              variant='outline'
              className='text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 gap-1.5'
            >
              <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
              </span>
              Auto-Sync Aktif
            </Badge>
          </div>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Daftar diet pasien yang tidak masuk ke lini produksi dapur umum
            (misal: Bubur Saring, Sonde, dsb.) dan dilayani khusus oleh AG Katering.
          </p>
        </div>

        <div className='flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap'>
          <Link href='/dashboard/ag-katering/mapping-diet'>
            <Button
              variant='outline'
              size='sm'
              className='gap-1.5 shadow-xs text-xs'
            >
              <Utensils className='w-3.5 h-3.5 text-primary' />
              Master Mapping Diet
              <ExternalLink className='w-3 h-3 text-muted-foreground' />
            </Button>
          </Link>

          <Button
            variant='outline'
            size='sm'
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className='gap-2 shadow-xs text-xs'
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Information Banner ─────────────────────────────────────────── */}
      <div className='flex items-start gap-3 bg-blue-500/5 p-3.5 px-4 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 min-w-0'>
        <Info className='w-4 h-4 text-blue-500 shrink-0 mt-0.5' />
        <div className='min-w-0'>
          <strong className='text-foreground font-semibold'>
            Ketentuan Alur AG Katering:
          </strong>
          <span className='ml-1'>
            Diet berstatus <strong>Alihkan ke AG Katering</strong> sengaja dikeluarkan
            dari perhitungan live porsi dapur masak reguler. Data di bawah
            menampilkan <em>Raw Text</em> asli pasien dari rumah sakit dan diperbarui
            secara <strong>otomatis (real-time)</strong> setiap kali ada perubahan data pasien atau mapping.
          </span>
        </div>
      </div>

      {/* ── 3. Stats Summary Cards ────────────────────────────────────────── */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0'>
        <Card className='border-l-4 border-l-blue-500 shadow-xs bg-blue-500/5 dark:bg-blue-950/20'>
          <CardContent className='p-3 sm:p-4 flex items-center justify-between gap-2'>
            <div>
              <p className='text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300'>
                Total Pasien Katering
              </p>
              <h3 className='text-lg sm:text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 mt-0.5'>
                {data.totalPasien}
              </h3>
              <p className='text-[10px] sm:text-[11px] text-muted-foreground mt-0.5'>
                Pasien aktif terlayani
              </p>
            </div>
            <div className='w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center border'>
              <Users className='w-4 h-4 sm:w-5 sm:h-5' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-indigo-500 shadow-xs bg-indigo-500/5 dark:bg-indigo-950/20'>
          <CardContent className='p-3 sm:p-4 flex items-center justify-between gap-2'>
            <div>
              <p className='text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300'>
                Jenis Diet Khusus
              </p>
              <h3 className='text-lg sm:text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 mt-0.5'>
                {data.dietRawList.length}
              </h3>
              <p className='text-[10px] sm:text-[11px] text-muted-foreground mt-0.5'>
                Variasi diet raw unik
              </p>
            </div>
            <div className='w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border'>
              <Send className='w-4 h-4 sm:w-5 sm:h-5' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-emerald-500 shadow-xs bg-emerald-500/5 dark:bg-emerald-950/20'>
          <CardContent className='p-3 sm:p-4 flex items-center justify-between gap-2'>
            <div>
              <p className='text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300'>
                Terpetakan AG Katering
              </p>
              <h3 className='text-lg sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5'>
                {kateringMappedCount}
              </h3>
              <p className='text-[10px] sm:text-[11px] text-muted-foreground mt-0.5'>
                Status mapping KATERING
              </p>
            </div>
            <div className='w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border'>
              <CheckCircle2 className='w-4 h-4 sm:w-5 sm:h-5' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-amber-500 shadow-xs bg-amber-500/5 dark:bg-amber-950/20'>
          <CardContent className='p-3 sm:p-4 flex items-center justify-between gap-2'>
            <div>
              <p className='text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300'>
                Deteksi Otomatis Raw
              </p>
              <h3 className='text-lg sm:text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-0.5'>
                {rawFallbackCount}
              </h3>
              <p className='text-[10px] sm:text-[11px] text-muted-foreground mt-0.5'>
                Saring / sonde terdeteksi
              </p>
            </div>
            <div className='w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center border'>
              <AlertCircle className='w-4 h-4 sm:w-5 sm:h-5' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Search & Filter Bar ───────────────────────────────────────── */}
      <div className='flex items-center gap-3 bg-card p-3 rounded-xl border shadow-xs'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Cari nama pasien, no RM, ruangan, atau diet raw RS...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9 text-xs sm:text-sm bg-background'
          />
        </div>
        {searchQuery && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setSearchQuery('')}
            className='text-xs h-9 text-muted-foreground'
          >
            Reset
          </Button>
        )}
      </div>

      {/* ── 5. Patients Table (Using Shadcn Table Components) ─────────────── */}
      <Card className='shadow-xs overflow-hidden gap-0 py-0'>
        <div className='px-4 py-3 border-b flex items-center justify-between gap-2 bg-muted/30'>
          <div className='flex items-center gap-2'>
            <span className='font-bold text-xs text-foreground'>
              Daftar Pasien Diet Khusus Katering
            </span>
            <Badge variant='secondary' className='text-[10px]'>
              {filteredPatients.length} Pasien
            </Badge>
          </div>
          <div className='text-[11px] text-muted-foreground flex items-center gap-1.5'>
            <Clock className='w-3 h-3' />
            <span>Sinkron: {lastSyncedAt}</span>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className='p-12 text-center'>
            <div className='w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto mb-3'>
              <Send className='w-6 h-6' />
            </div>
            <h4 className='font-semibold text-sm text-foreground'>
              Tidak ada pasien katering saat ini
            </h4>
            <p className='text-xs text-muted-foreground max-w-sm mx-auto mt-1'>
              Tidak ada pasien aktif dengan diet Bubur Saring / Sonde atau yang dialihkan ke AG Katering.
            </p>
          </div>
        ) : (
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
                  Diet Raw RS (Teks Asli)
                </TableHead>
                <TableHead className='min-w-[140px] font-bold uppercase tracking-wider text-[11px]'>
                  Status Mapping
                </TableHead>
                <TableHead className='min-w-[120px] font-bold uppercase tracking-wider text-[11px]'>
                  Catatan
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
                      {p.gedung ? `${p.gedung} - ` : ''}Bed {p.bed || '-'} ({p.kelas})
                    </div>
                  </TableCell>
                  <TableCell className='py-3'>
                    <div className='font-mono font-bold text-foreground text-xs bg-blue-50/70 dark:bg-blue-950/40 px-2 py-1 rounded border border-blue-200 dark:border-blue-900 inline-block'>
                      {p.diet_raw}
                    </div>
                  </TableCell>
                  <TableCell className='py-3'>
                    {p.status_mapping === 'KATERING' ? (
                      <Badge
                        variant='outline'
                        className='text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 gap-1'
                      >
                        <Send className='w-3 h-3' /> AG Katering
                      </Badge>
                    ) : (
                      <Badge
                        variant='outline'
                        className='text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 gap-1'
                      >
                        <AlertCircle className='w-3 h-3' /> Raw RS Saring/Cair
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className='py-3'>
                    <Badge variant='secondary' className='text-[10px] font-medium'>
                      Khusus Katering
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
