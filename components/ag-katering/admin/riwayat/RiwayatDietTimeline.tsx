'use client';

import React from 'react';
import type { RiwayatDietItem } from '@/servers/riwayat-diet.service';
import { revisionTypeLabel } from '@/lib/revisi-etiket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  UserCheck,
  Building,
  Bed,
  ArrowRight,
  Eye,
  FileText,
  Utensils,
  AlertTriangle,
  PlusCircle,
  LogOut,
  Repeat,
  CheckCircle2,
} from 'lucide-react';

interface RiwayatDietTimelineProps {
  items: RiwayatDietItem[];
  onSelectDetail: (item: RiwayatDietItem) => void;
}

export function RiwayatDietTimeline({
  items,
  onSelectDetail,
}: RiwayatDietTimelineProps) {
  if (items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center p-12 bg-card/60 rounded-2xl border border-dashed border-border text-center space-y-3'>
        <div className='p-4 rounded-full bg-muted text-muted-foreground'>
          <FileText className='w-8 h-8' />
        </div>
        <div className='space-y-1'>
          <h3 className='font-semibold text-base text-foreground'>
            Tidak ada riwayat aktivitas ditemukan
          </h3>
          <p className='text-xs text-muted-foreground max-w-md'>
            Sesuaikan kata kunci pencarian atau filter untuk melihat timeline perubahan diet.
          </p>
        </div>
      </div>
    );
  }

  // Group items by date string
  const groupedByDate = items.reduce<Record<string, RiwayatDietItem[]>>(
    (acc, item) => {
      const dateKey = new Date(item.requested_at).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    },
    {},
  );

  return (
    <div className='space-y-8 max-w-4xl mx-auto'>
      {Object.entries(groupedByDate).map(([dateLabel, dateItems]) => (
        <div key={dateLabel} className='space-y-4'>
          {/* Sticky / Section Date Header */}
          <div className='flex items-center gap-3'>
            <div className='h-px flex-1 bg-border/80' />
            <span className='px-3.5 py-1 rounded-full text-xs font-bold bg-muted/80 text-foreground border border-border shadow-2xs'>
              📅 {dateLabel}
            </span>
            <div className='h-px flex-1 bg-border/80' />
          </div>

          {/* Timeline items for this day */}
          <div className='relative pl-6 sm:pl-8 border-l-2 border-primary/25 dark:border-primary/20 space-y-5 ml-3 sm:ml-4'>
            {dateItems.map((item) => {
              const formattedTime =
                new Date(item.requested_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                }) + ' WIB';

              // Icons & colors per change type
              let changeIcon = <Utensils className='w-4 h-4 text-primary' />;
              let badgeColor = 'bg-primary/10 text-primary border-primary/20';
              let typeLabel = 'Perubahan Diet';

              if (item.jenis_perubahan === 'NEW_PATIENT') {
                changeIcon = <PlusCircle className='w-4 h-4 text-emerald-500' />;
                badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                typeLabel = 'Pasien Baru (+1 Emergent)';
              } else if (item.jenis_perubahan === 'NPO') {
                changeIcon = <AlertTriangle className='w-4 h-4 text-amber-500' />;
                badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                typeLabel = 'Puasa / NPO (-1 Porsi)';
              } else if (item.jenis_perubahan === 'ROOM_TRANSFER') {
                changeIcon = <Repeat className='w-4 h-4 text-blue-500' />;
                badgeColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
                typeLabel = 'Pindah Ruangan';
              } else if (item.jenis_perubahan === 'DISCHARGE') {
                changeIcon = <LogOut className='w-4 h-4 text-rose-500' />;
                badgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                typeLabel = 'Pasien Pulang';
              } else if (item.jenis_perubahan.startsWith('KOREKSI_')) {
                badgeColor = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
                typeLabel = revisionTypeLabel(item.jenis_perubahan);
              }

              return (
                <div key={item.id} className='relative group'>
                  {/* Timeline dot */}
                  <div className='absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-xs'>
                    <div className='w-2 h-2 rounded-full bg-primary' />
                  </div>

                  {/* Card Container */}
                  <div className='bg-card/85 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3.5'>
                    {/* Top Row: Staff & Time & Action Badge */}
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-3'>
                      <div className='flex items-center gap-2.5 min-w-0'>
                        <div className='w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/30'>
                          {item.gizi_rs_name.charAt(0)}
                        </div>
                        <div className='min-w-0'>
                          <div className='flex items-center gap-1.5 flex-wrap'>
                            <span className='font-bold text-xs sm:text-sm text-foreground flex items-center gap-1'>
                              <UserCheck className='w-3.5 h-3.5 text-primary' />
                              {item.gizi_rs_name}
                            </span>
                            <span className='text-[11px] text-muted-foreground font-mono truncate'>
                              ({item.gizi_rs_email})
                            </span>
                          </div>
                          <p className='text-[10px] text-muted-foreground'>
                            Staf Ahli Gizi RS
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap'>
                        <Badge variant='outline' className={`text-[10px] font-semibold ${badgeColor}`}>
                          {changeIcon}
                          <span className='ml-1'>{typeLabel}</span>
                        </Badge>

                        <span className='text-xs text-muted-foreground font-mono flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md'>
                          <Clock className='w-3 h-3 text-muted-foreground' />
                          {formattedTime}
                        </span>
                      </div>
                    </div>

                    {/* Patient and Diet Change Details */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start'>
                      {/* Left: Patient Info */}
                      <div className='space-y-1 bg-muted/25 p-3 rounded-xl border border-border/40'>
                        <div className='flex items-baseline justify-between gap-1'>
                          <h4 className='font-bold text-sm text-foreground'>
                            {item.nama_pasien}
                          </h4>
                          <span className='text-xs font-mono text-muted-foreground font-semibold'>
                            {item.no_rm}
                          </span>
                        </div>
                        <div className='text-xs text-muted-foreground flex items-center gap-2 flex-wrap pt-1'>
                          <span className='inline-flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border/60 text-[11px] font-medium'>
                            <Building className='w-3 h-3 text-muted-foreground' />
                            {item.ruangan || 'Rawat Inap'}
                          </span>
                          <span className='inline-flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border/60 text-[11px] font-medium'>
                            <Bed className='w-3 h-3 text-muted-foreground' />
                            {item.bed}
                          </span>
                          <span className='text-[11px] text-muted-foreground font-medium'>
                            Kelas: {item.kelas}
                          </span>
                        </div>
                      </div>

                      {/* Right: Diet Diff (Before -> After) */}
                      <div className='space-y-1.5 bg-muted/25 p-3 rounded-xl border border-border/40'>
                        <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider'>
                          Instruksi Diet (Sesi: {item.waktu_makan})
                        </p>
                        <div className='flex items-center gap-2 flex-wrap text-xs'>
                          {item.data_lama?.diet ? (
                            <span className='text-muted-foreground line-through text-xs bg-background/80 px-2 py-0.5 rounded border border-border/60'>
                              {item.data_lama.diet}
                            </span>
                          ) : (
                            <span className='text-muted-foreground text-xs font-mono bg-background/80 px-2 py-0.5 rounded border border-border/60'>
                              [Awal: -]
                            </span>
                          )}

                          <ArrowRight className='w-3.5 h-3.5 text-primary shrink-0' />

                          {item.data_baru?.diet ? (
                            <span className='font-bold text-primary text-xs bg-primary/10 px-2 py-0.5 rounded border border-primary/20'>
                              {item.data_baru.diet}
                            </span>
                          ) : (
                            <span className='font-medium text-foreground text-xs'>-</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Clinical Note & Status Footer */}
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-border/40'>
                      <div className='text-xs text-muted-foreground italic flex items-center gap-1.5 min-w-0'>
                        <span className='font-semibold text-foreground not-italic'>
                          Alasan:
                        </span>
                        <span className='truncate'>&ldquo;{item.alasan}&rdquo;</span>
                      </div>

                      <div className='flex items-center gap-2 self-end sm:self-auto shrink-0'>
                        <span className='inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold'>
                          <CheckCircle2 className='w-3.5 h-3.5' /> {item.status}
                        </span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onSelectDetail(item)}
                          className='h-7 px-2.5 text-xs text-primary hover:bg-primary/10 gap-1'
                        >
                          <Eye className='w-3.5 h-3.5' />
                          Detail Audit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
