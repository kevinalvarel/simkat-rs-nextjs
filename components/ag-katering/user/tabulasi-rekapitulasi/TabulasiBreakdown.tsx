'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Utensils, Apple, Home, PlusCircle } from 'lucide-react';

interface TabulasiBreakdownProps {
  total: number;
  dietBreakdown: { bentuk_makanan: string; kategori_diet: string; count: number }[];
  extraBreakdown: { extra: string; count: number }[];
  buahBreakdown: { buah: string; count: number }[];
  snackBreakdown: { snack: string; count: number }[];
  ruanganBreakdown: { ruangan: string; gedung: string; count: number }[];
}

export default function TabulasiBreakdown({
  total,
  dietBreakdown,
  extraBreakdown,
  buahBreakdown,
  snackBreakdown,
  ruanganBreakdown,
}: TabulasiBreakdownProps) {

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
      
      {/* 1. Diet Type Breakdown */}
      <Card className="shadow-xs hover:shadow-md transition-all border border-border/80">
        <CardHeader className="border-b pb-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Utensils className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground">
              Rekapitulasi Bentuk & Kategori Diet
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {dietBreakdown.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-6">Tidak ada data diet</p>
          ) : (
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
              {dietBreakdown.map((item, idx) => {
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                const isUnmapped = item.bentuk_makanan === 'BELUM DIMAPPING' || item.kategori_diet === 'BELUM DIMAPPING';
                
                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center font-medium">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isUnmapped ? (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-bold uppercase tracking-wider animate-pulse">
                            Belum Mapping
                          </Badge>
                        ) : (
                          <>
                            <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded-md border border-blue-200">
                              {item.bentuk_makanan}
                            </span>
                            <span className="text-muted-foreground">—</span>
                            <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded-md border border-indigo-200">
                              {item.kategori_diet}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="font-bold text-foreground">
                        {item.count} porsi <span className="text-muted-foreground font-normal text-[10px]">({pct}%)</span>
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isUnmapped ? 'bg-rose-500' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Room/Ward Distribution */}
      <Card className="shadow-xs hover:shadow-md transition-all border border-border/80">
        <CardHeader className="border-b pb-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Home className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground">
              Rekapitulasi per Ruangan (Wards)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {ruanganBreakdown.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-6">Tidak ada data ruangan</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
              {ruanganBreakdown.map((item, idx) => {
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.ruangan}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{item.gedung}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                        {item.count} porsi
                      </span>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{pct}% dari total</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Extra, Fruit & Snack Breakdown */}
      <Card className="lg:col-span-2 shadow-xs hover:shadow-md transition-all border border-border/80">
        <CardHeader className="border-b pb-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Apple className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground">
              Rekapitulasi Extra, Buah, & Snack
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Extras */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 border-b pb-1.5">
              <PlusCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <h4 className="text-xs font-bold text-foreground">Ekstra Tambahan</h4>
            </div>
            {extraBreakdown.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">Tidak ada ekstra</p>
            ) : (
              <div className="space-y-2">
                {extraBreakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200">
                      {item.extra}
                    </span>
                    <span className="font-bold text-foreground">{item.count} item</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fruits */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 border-b pb-1.5">
              <Apple className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-foreground">Buah Segar</h4>
            </div>
            {buahBreakdown.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">Tidak ada buah</p>
            ) : (
              <div className="space-y-2">
                {buahBreakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200">
                      🍊 {item.buah}
                    </span>
                    <span className="font-bold text-foreground">{item.count} porsi</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Snacks */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 border-b pb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-bold text-foreground">Kudapan / Snack</h4>
            </div>
            {snackBreakdown.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">Tidak ada snack</p>
            ) : (
              <div className="space-y-2">
                {snackBreakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200">
                      🍪 {item.snack}
                    </span>
                    <span className="font-bold text-foreground">{item.count} porsi</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
