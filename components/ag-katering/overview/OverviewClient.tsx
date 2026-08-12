'use client';

import React, { useState, useEffect } from 'react';
import type { MonitoringSummary } from '@/servers/overview.service';
import { getLiveMonitoringData } from '@/servers/overview.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  RefreshCw,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';

interface OverviewClientProps {
  initialData: MonitoringSummary;
}

export default function OverviewClient({ initialData }: OverviewClientProps) {
  const [data, setData] = useState<MonitoringSummary>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(5); // 5-second polling interval

  // Auto-refresh every 5 seconds (dynamic polling)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger refresh
          handleRefresh();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary animate-pulse" />
            Dashboard Pemantauan Live
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Layar monitoring real-time perubahan jumlah porsi diet pasca snapshot terkunci.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2.5 bg-background border rounded-xl px-4 py-2 self-start sm:self-auto shrink-0 shadow-2xs">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Pembaharuan otomatis dalam <strong className="text-primary">{countdown}s</strong>
          </span>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            title="Refresh manual"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Current Batch Overview */}
      <Card className="border border-border/80 shadow-xs bg-muted/20">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Batch Snapshot Saat Ini
              </span>
              <h3 className="font-mono text-base sm:text-lg font-bold text-foreground mt-0.5">
                {data.batchCode}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 text-xs font-semibold">
            <div className="bg-background border rounded-lg px-3 py-1.5 flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase">Tanggal</span>
              <span className="text-foreground">
                {data.tanggalProduksi ? new Date(data.tanggalProduksi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </span>
            </div>

            <div className="bg-background border rounded-lg px-3 py-1.5 flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase">Siklus Makan</span>
              <Badge variant="secondary" className="text-[10px] font-bold w-fit uppercase bg-primary/10 text-primary">
                {data.waktuMakan}
              </Badge>
            </div>

            <div className="bg-background border rounded-lg px-3 py-1.5 flex flex-col gap-0.5 col-span-2">
              <span className="text-[10px] text-muted-foreground uppercase">Status Batch</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {data.statusBatch || 'LOCKED'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Monitoring Cards Layout (Matching User Image exactly) */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 px-1">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Distribusi Porsi Makanan & Perubahan Post-Snapshot
          </h4>
        </div>
        
        {/* Horizontal grid layout matching the reference layout */}
        <div className="grid grid-cols-2 min-[480px]:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 w-full">
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
                <div className="border-b border-border/60 py-2 px-3 text-center bg-muted/40">
                  <span className="font-bold text-xs text-foreground tracking-wide block uppercase" title={card.name}>
                    {card.code}
                  </span>
                </div>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                  {/* Active Count */}
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
                    {card.active}
                  </h2>

                  {/* Indicator Arrow & value */}
                  <div className={`flex items-center gap-0.5 text-xs font-bold ${styles.text}`}>
                    <DeltaIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{Math.abs(card.change)}</span>
                  </div>

                  {/* Delta text underneath like (0), (+1), (-1) */}
                  <div className="text-[10px] font-bold text-muted-foreground font-mono">
                    {styles.delta}
                  </div>
                  
                  {/* Baseline indicator */}
                  <div className="text-[9px] text-muted-foreground font-medium pt-1 border-t border-dashed border-border/80 w-full">
                    Base: {card.baseline}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4. Help Section */}
      <div className="bg-muted/40 border border-border/80 rounded-xl p-4 flex gap-3 text-xs text-muted-foreground">
        <LayoutGrid className="w-5 h-5 text-primary shrink-0" />
        <div className="space-y-1">
          <strong className="text-foreground">Legenda Keterangan Pemantauan:</strong>
          <p>
            Tiap kotak merepresentasikan bentuk makanan atau kategori diet utama. 
            Jumlah angka tebal di atas merupakan **porsi final aktif** saat ini. 
            Indikator segitiga merah (**▼**) atau hijau (**▲**) menunjukkan penambahan/pengurangan dari snapshot terkunci asli 
            yang disebabkan oleh otorisasi revisi (seperti pasien pulang, pasien baru, puasa/NPO, dll) yang disetujui.
          </p>
          <p className="text-[10px] text-muted-foreground/80 mt-1">
            Terakhir diperbarui: {data.lastUpdated} WIB
          </p>
        </div>
      </div>

    </div>
  );
}
