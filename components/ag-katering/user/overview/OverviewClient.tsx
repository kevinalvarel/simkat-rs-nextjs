'use client';

import React, { useState, useEffect } from 'react';
import type { MonitoringSummary } from '@/servers/overview.service';
import { getLiveMonitoringData } from '@/servers/overview.service';
import { Card, CardContent } from '@/components/ui/card';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  LayoutGrid,
  Soup,
} from 'lucide-react';

interface OverviewClientProps {
  initialData: MonitoringSummary;
}

export default function OverviewClient({ initialData }: OverviewClientProps) {
  const [data, setData] = useState<MonitoringSummary>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}:${ss}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keep local state in sync with server-revalidated initialData prop
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const live = await getLiveMonitoringData();
      setData(live);
    } catch (err) {
      console.error('Error polling monitoring data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }

  // Map card style based on delta changes
  function getCardStyles(change: number) {
    if (change > 0) {
      return {
        bg: 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        bgAccent: 'bg-emerald-100 dark:bg-emerald-950/80',
        icon: ArrowUpRight,
        label: `▲ ${change}`,
        delta: `(+${change})`,
      };
    }
    if (change < 0) {
      return {
        bg: 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30',
        text: 'text-rose-600 dark:text-rose-400',
        bgAccent: 'bg-rose-100 dark:bg-rose-950/80',
        icon: ArrowDownRight,
        label: `▼ ${Math.abs(change)}`,
        delta: `(${change})`,
      };
    }
    return {
      bg: 'bg-card border-border',
      text: 'text-muted-foreground',
      bgAccent: 'bg-secondary',
      icon: Minus,
      label: '—',
      delta: '(0)',
    };
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header & Live Indicator */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-xs'>
        <div className='space-y-1'>
          <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2'>
            <Activity className='w-6 h-6 text-primary animate-pulse' />
            Dashboard Pemantauan Live - Produksi
          </h1>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Layar monitoring real-time akumulasi porsi menu & diet aktif pasien
            berdasarkan hasil mapping.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className='flex items-center gap-2.5 bg-background border rounded-xl px-4 py-2 self-start sm:self-auto shrink-0 shadow-2xs'>
          <div className='relative flex h-2 w-2'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
            <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
          </div>
          <span className='text-xs text-muted-foreground font-medium'>
            Live Monitoring
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className='p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors ml-1'
            title='Refresh manual'
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* 2. Unified Live Production Dashboard Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch w-full'>
        {/* Left Side: Live Production Info (1 Column) */}
        <Card className='lg:col-span-1 border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs rounded-2xl flex flex-col justify-between p-5 text-center'>
          <div className='space-y-4'>
            <h3 className='text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-tight'>
              Tabulasi Produksi Makan {data.waktuMakan}
            </h3>

            <div className='flex justify-center py-2 text-emerald-600 dark:text-emerald-400'>
              <Soup
                className='w-12 h-12 stroke-[1.5] animate-bounce'
                style={{ animationDuration: '3s' }}
              />
            </div>

            {/* Jam Saat Ini */}
            <div className='space-y-1 bg-background/60 border rounded-xl p-2.5 shadow-2xs'>
              <span className='text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold'>
                Jam Saat Ini
              </span>
              <div className='font-mono text-base sm:text-lg font-extrabold text-foreground'>
                {currentTime || '00:00:00'} WIB
              </div>
              <div className='text-[10px] text-muted-foreground font-medium'>
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>

            {/* Snapshot Selanjutnya */}
            <div className='space-y-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5'>
              <span className='text-[10px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block font-semibold'>
                Snapshot Selanjutnya
              </span>
              <div className='font-mono text-base font-extrabold text-emerald-700 dark:text-emerald-400'>
                {data.cutoffTime} WIB
              </div>
              <div className='text-[10px] text-emerald-600 dark:text-emerald-400 font-medium'>
                Siklus {data.waktuMakan} (
                {data.tanggalProduksi
                  ? new Date(data.tanggalProduksi).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                    })
                  : '-'}
                )
              </div>
            </div>
          </div>

          <div className='mt-4 pt-4 border-t border-dashed border-emerald-500/20 space-y-3'>
            <div className='inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 w-fit mx-auto'>
              <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse'></span>
              LIVE
            </div>

            <p className='text-[10px] text-muted-foreground leading-relaxed max-w-[200px] mx-auto'>
              Data berubah otomatis mengikuti input AG RS
            </p>
          </div>
        </Card>

        {/* Right Side: Mapped Diet Distribution Cards (3 Columns) */}
        <div className='lg:col-span-3 flex flex-col justify-between space-y-3'>
          {/* Dynamic Grid for Cards */}
          <div className='grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3 w-full'>
            {data.cards.map((card) => {
              const styles = getCardStyles(card.change);
              const DeltaIcon = styles.icon;

              return (
                <Card
                  key={card.code}
                  className={`transition-all duration-300 border hover:shadow-md ${styles.bg} ${
                    card.change !== 0 ? 'ring-1 ring-primary/10' : ''
                  }`}
                >
                  <div className='border-b border-border/60 py-2 px-2.5 text-center bg-muted/40'>
                    <span
                      className='font-bold text-xs text-foreground tracking-wide block uppercase truncate'
                      title={card.name}
                    >
                      {card.code}
                    </span>
                    {card.name && card.name !== card.code && (
                      <span
                        className='text-[10px] text-muted-foreground truncate block leading-tight'
                        title={card.name}
                      >
                        {card.name}
                      </span>
                    )}
                  </div>
                  <CardContent className='p-4 flex flex-col items-center justify-center text-center space-y-2'>
                    {/* Active Count */}
                    <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans'>
                      {card.active}
                    </h2>

                    {/* Indicator Arrow & value */}
                    {card.change !== 0 ? (
                      <div
                        className={`flex items-center gap-0.5 text-xs font-bold ${styles.text}`}
                      >
                        <DeltaIcon className='w-3.5 h-3.5 shrink-0' />
                        <span>{Math.abs(card.change)}</span>
                      </div>
                    ) : (
                      <div className='text-xs text-muted-foreground font-medium'>
                        —
                      </div>
                    )}

                    {/* Delta text underneath like (0), (+1), (-1) */}
                    <div className='text-[10px] font-bold text-muted-foreground font-mono'>
                      {styles.delta}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className='text-xs text-muted-foreground text-center lg:text-left font-medium pt-2 border-t border-dashed border-border/80'>
            * Angka di atas merupakan akumulasi porsi per komponen menu hasil
            mapping diet. Target Kunci Batch:{' '}
            <strong className='text-primary font-bold'>
              {data.cutoffTime} WIB
            </strong>
          </div>
        </div>
      </div>

      {/* 4. Help Section */}
      <div className='bg-muted/40 border border-border/80 rounded-xl p-4 flex gap-3 text-xs text-muted-foreground'>
        <LayoutGrid className='w-5 h-5 text-primary shrink-0' />
        <div className='space-y-1'>
          <strong className='text-foreground'>
            Legenda Keterangan Pemantauan:
          </strong>
          <p>
            Tiap kotak merepresentasikan item komponen menu hasil mapping diet
            (misal: <strong>BN</strong> = Biasa Nasi, <strong>TKTP</strong> =
            Tinggi Kalori Tinggi Protein, <strong>PUTEL</strong> = Putih Telur).
            Jumlah angka tebal di atas merupakan **jumlah porsi aktif saat
            ini** secara real-time. Indikator segitiga merah (**▼**) atau hijau
            (**▲**) menunjukkan perubahan dibandingkan dengan data snapshot
            produksi yang terakhir dikunci.
          </p>
          <p className='text-[10px] text-muted-foreground/80 mt-1'>
            Terakhir diperbarui: {data.lastUpdated} WIB
          </p>
        </div>
      </div>
    </div>
  );
}
