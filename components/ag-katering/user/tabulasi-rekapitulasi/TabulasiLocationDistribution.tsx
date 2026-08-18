'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, MapPin, Users } from 'lucide-react';
import type { TabulasiLocationGroup } from '@/types/tabulasitypes';

interface TabulasiLocationDistributionProps {
  locations: TabulasiLocationGroup[];
  totalAllPatients: number;
}

export default function TabulasiLocationDistribution({
  locations,
  totalAllPatients,
}: TabulasiLocationDistributionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Distribusi Pasien per Lokasi
        </h2>
        <span className="text-[11px] text-muted-foreground">
          Total {totalAllPatients} pasien terdistribusi
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc, idx) => {
          const locPercentage =
            totalAllPatients > 0
              ? Math.round((loc.totalPatients / totalAllPatients) * 100)
              : 0;

          const isLama = loc.gedung.toUpperCase().includes('LAMA');

          return (
            <Card
              key={idx}
              className="border border-border/80 shadow-2xs hover:shadow-xs transition-all duration-200 bg-card overflow-hidden"
            >
              {/* Card Header */}
              <CardHeader className="bg-muted/30 border-b border-border/60 py-3 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl ${
                      isLama
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {loc.gedung}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      {loc.floors.length} zona lantai
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-lg font-extrabold text-foreground">
                      {loc.totalPatients}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      pasien
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                    {locPercentage}% dari total
                  </span>
                </div>
              </CardHeader>

              {/* Floor Bars Breakdown */}
              <CardContent className="p-4 space-y-3.5">
                {loc.floors.map((floor, fIdx) => {
                  const barPct =
                    loc.totalPatients > 0
                      ? Math.round((floor.patientCount / loc.totalPatients) * 100)
                      : 0;

                  return (
                    <div key={fIdx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLama ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                          />
                          {floor.floorName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            {floor.patientCount}{' '}
                            <span className="text-muted-foreground font-normal text-[11px]">
                              pasien
                            </span>
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground w-8 text-right">
                            {barPct}%
                          </span>
                        </div>
                      </div>

                      {/* Custom Modern Progress Bar */}
                      <div className="h-2 w-full bg-secondary/80 dark:bg-muted/80 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isLama
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                              : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                          }`}
                          style={{ width: `${Math.max(barPct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Subtotal Bar */}
                <div className="pt-2 border-t border-dashed border-border/70 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Total {loc.gedung}</span>
                  <span className="font-bold text-foreground">
                    {loc.totalPatients} Pasien
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
