'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Cookie, Sparkles, Building2, Apple, CheckCircle2 } from 'lucide-react';
import type { TabulasiSnackSummary } from '@/types/tabulasitypes';

interface TabulasiSnackSectionProps {
  snackSummary: TabulasiSnackSummary;
}

export default function TabulasiSnackSection({
  snackSummary,
}: TabulasiSnackSectionProps) {
  const lamaPct =
    snackSummary.totalPortions > 0
      ? Math.round(
          (snackSummary.gedungLamaCount / snackSummary.totalPortions) * 100
        )
      : 0;

  const baruPct =
    snackSummary.totalPortions > 0
      ? Math.round(
          (snackSummary.gedungBaruCount / snackSummary.totalPortions) * 100
        )
      : 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            Tabulasi Snack & Kudapan Pasien
          </h2>
          <p className="text-xs text-muted-foreground">
            Rekap porsi snack pagi / sore berdasarkan kategori diet dan perbandingan lokasi pengantaran.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
          Total {snackSummary.totalPortions} Porsi Snack
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        
        {/* 1. Snack Categories Cards (Left - 2 Cols span on large) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {snackSummary.categories.map((cat, idx) => (
              <Card
                key={idx}
                className="border border-border/80 shadow-2xs hover:shadow-xs transition-all bg-card rounded-2xl overflow-hidden"
              >
                <CardContent className="p-3.5 flex flex-col justify-between h-full gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-lg">
                      {cat.category}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {cat.percentage}%
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-foreground font-sans">
                        {cat.portions}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        porsi
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {cat.diets.join(', ')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Snack Items Detail Grid */}
          <Card className="border border-border/80 shadow-2xs bg-card rounded-2xl">
            <CardHeader className="py-3 px-4 border-b border-border/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Cookie className="w-3.5 h-3.5 text-purple-600" />
                Varian Menu Snack & Buah Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {snackSummary.items.map((item, iIdx) => (
                <div
                  key={iIdx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{item.icon || '🍪'}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {item.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {item.diet}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 shrink-0">
                    {item.count}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 2. Location Comparison Card (Right) */}
        <Card className="border border-border/80 shadow-2xs bg-card rounded-2xl flex flex-col justify-between">
          <CardHeader className="py-3.5 px-4 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Perbandingan Alokasi Lokasi
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-center">
            
            {/* Gedung Lama vs Gedung Baru Big Numbers */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                  Gedung Lama
                </span>
                <span className="text-2xl font-black text-foreground font-sans mt-0.5 block">
                  {snackSummary.gedungLamaCount}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {lamaPct}% porsi
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block">
                  Gedung Baru
                </span>
                <span className="text-2xl font-black text-foreground font-sans mt-0.5 block">
                  {snackSummary.gedungBaruCount}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {baruPct}% porsi
                </span>
              </div>
            </div>

            {/* Split Comparison Visual Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                <span>Gedung Lama ({lamaPct}%)</span>
                <span>Gedung Baru ({baruPct}%)</span>
              </div>

              <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${lamaPct}%` }}
                />
                <div
                  className="h-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${baruPct}%` }}
                />
              </div>
            </div>

            {/* Total Portions Banner */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Total Seluruh Snack:</span>
              <span className="font-extrabold text-foreground text-sm">
                {snackSummary.totalPortions} Porsi
              </span>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
