'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Check } from 'lucide-react';
import type { TabulasiDietItem } from '@/types/tabulasitypes';

interface TabulasiDietDistributionProps {
  diets: TabulasiDietItem[];
  selectedDiet: string;
  onSelectDiet: (dietCode: string) => void;
}

export default function TabulasiDietDistribution({
  diets,
  selectedDiet,
  onSelectDiet,
}: TabulasiDietDistributionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Distribusi Jenis Diet Pasien
          </h2>
          <p className="text-xs text-muted-foreground">
            Klik kartu diet untuk memfilter rekap menu makanan secara otomatis.
          </p>
        </div>

        {selectedDiet !== 'Semua' && (
          <button
            type="button"
            onClick={() => onSelectDiet('Semua')}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            Tampilkan Semua Diet
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {diets.map((item) => {
          const isSelected = selectedDiet === item.code;

          return (
            <Card
              key={item.code}
              onClick={() => onSelectDiet(isSelected ? 'Semua' : item.code)}
              className={`cursor-pointer transition-all duration-200 select-none group border ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-xs scale-[1.02]'
                  : 'border-border/80 hover:border-primary/50 hover:bg-muted/30 shadow-2xs'
              }`}
            >
              <CardContent className="p-3 flex flex-col justify-between h-full gap-2">
                {/* Code & Selection Badge */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-sm font-black px-2 py-0.5 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    }`}
                  >
                    {item.code}
                  </span>

                  {isSelected ? (
                    <span className="p-0.5 rounded-full bg-primary text-primary-foreground">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {item.percentage}%
                    </span>
                  )}
                </div>

                {/* Patient Count & Diet Name */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-foreground font-sans">
                      {item.count}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      porsi
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5 line-clamp-1 group-hover:text-foreground">
                    {item.name}
                  </p>
                </div>

                {/* Visual indicator bar */}
                <div className="h-1 w-full bg-secondary/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isSelected ? 'bg-primary' : 'bg-primary/40 group-hover:bg-primary'
                    }`}
                    style={{ width: `${Math.min(item.percentage * 2, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
