'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle2, PlayCircle, CircleDashed } from 'lucide-react';
import type { TabulasiScheduleItem } from '@/types/tabulasitypes';

interface TabulasiScheduleTimelineProps {
  schedule: TabulasiScheduleItem[];
}

export default function TabulasiScheduleTimeline({
  schedule,
}: TabulasiScheduleTimelineProps) {
  return (
    <Card className="border border-border/80 shadow-2xs bg-card rounded-2xl overflow-hidden">
      <CardHeader className="py-3.5 px-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Jadwal Operasional & Distribusi Hari Ini
          </CardTitle>
          <span className="text-[11px] font-semibold text-muted-foreground">
            WIB (Waktu Indonesia Barat)
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
          {schedule.map((item, idx) => {
            const isCompleted = item.status === 'COMPLETED';
            const isInProgress = item.status === 'IN_PROGRESS';

            return (
              <div key={idx} className="relative group">
                
                {/* Node Icon on Timeline */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-background transition-all ${
                    isCompleted
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950'
                      : isInProgress
                      ? 'border-primary text-primary bg-primary/10 animate-pulse'
                      : 'border-muted-foreground/30 text-muted-foreground/40'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isInProgress ? (
                    <PlayCircle className="w-3.5 h-3.5" />
                  ) : (
                    <CircleDashed className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold font-mono text-foreground px-2 py-0.5 rounded-md bg-muted/60">
                      {item.time}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">
                      {item.title}
                    </h4>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                      isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : isInProgress
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted && '✓ '}
                    {isInProgress && '● '}
                    {item.statusLabel}
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
