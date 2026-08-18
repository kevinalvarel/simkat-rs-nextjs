'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Utensils, 
  Building2, 
  Info, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  Eye
} from 'lucide-react';
import type { TabulasiMenuItem, ProductionStatus } from '@/types/tabulasitypes';

interface TabulasiMenuCardsProps {
  menuItems: TabulasiMenuItem[];
  onSelectMenu: (menu: TabulasiMenuItem) => void;
  totalFilteredPortions: number;
}

export default function TabulasiMenuCards({
  menuItems,
  onSelectMenu,
  totalFilteredPortions,
}: TabulasiMenuCardsProps) {
  function getStatusBadge(status: ProductionStatus) {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            Ready
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
            Pending
          </span>
        );
      case 'CHECK':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 animate-ping" />
            Perlu Diperiksa
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            Tabulasi Menu Makanan
          </h2>
          <p className="text-xs text-muted-foreground">
            Daftar hidangan produksi, jumlah porsi, dan rincian diet pasien untuk siklus makan saat ini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-card border border-border text-foreground shadow-2xs">
            {menuItems.length} Variasi Menu • {totalFilteredPortions} Total Porsi
          </span>
        </div>
      </div>

      {/* Menu Cards Grid */}
      {menuItems.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-2xl bg-card">
          <Utensils className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-foreground">Tidak ada menu yang sesuai dengan filter.</p>
          <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan filter gedung, lantai, atau jenis diet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Card
              key={item.id}
              className="border border-border/80 shadow-2xs hover:shadow-md hover:border-primary/50 transition-all duration-200 bg-card rounded-2xl flex flex-col justify-between overflow-hidden group"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-4">
                
                {/* Header of Menu Card: Icon, Name, Category & Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1.5 rounded-xl bg-muted/60 border border-border/50 shrink-0">
                        {item.icon || '🍽️'}
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Total Portions Big Metric */}
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Total Porsi
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-foreground tracking-tight font-sans">
                          {item.totalPortions}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          porsi
                        </span>
                      </div>
                    </div>

                    {item.prepTime && (
                      <div className="text-right">
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3 text-muted-foreground" /> Waktu Masak
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {item.prepTime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Diet Breakdown Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Rincian per Diet:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.dietBreakdown.map((d, dIdx) => (
                      <div
                        key={dIdx}
                        className="flex items-center gap-1 bg-background border border-border/80 px-2 py-0.5 rounded-lg text-xs"
                      >
                        <span className="font-extrabold text-primary">{d.diet}</span>
                        <span className="text-muted-foreground font-normal">|</span>
                        <span className="font-bold text-foreground">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Summary Breakdown */}
                {item.locationBreakdown && item.locationBreakdown.length > 0 && (
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-muted-foreground" />
                      Distribusi Lokasi:
                    </span>
                    <div className="flex items-center gap-2 font-medium">
                      {item.locationBreakdown.map((loc, lIdx) => (
                        <span key={lIdx} className="text-foreground">
                          {loc.gedung.replace('Gedung ', 'Gd. ')}: <strong>{loc.count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detail Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectMenu(item)}
                  className="w-full gap-1.5 h-8 rounded-xl text-xs font-bold bg-background hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-all cursor-pointer mt-1"
                >
                  <Eye className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                  Lihat Rincian Distribusi
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                </Button>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
