'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Utensils, 
  Building2, 
  Clock, 
  AlertTriangle, 
  Printer, 
  CheckCircle2, 
  ShieldAlert,
  Layers,
  X
} from 'lucide-react';
import type { TabulasiMenuItem } from '@/types/tabulasitypes';
import { toast } from 'sonner';

interface TabulasiMenuDetailModalProps {
  menu: TabulasiMenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (menuId: string, newStatus: 'READY' | 'PENDING' | 'CHECK') => void;
}

export default function TabulasiMenuDetailModal({
  menu,
  isOpen,
  onClose,
  onStatusChange,
}: TabulasiMenuDetailModalProps) {
  if (!menu) return null;

  function handlePrintTicket() {
    toast.success(`Tiket produksi "${menu?.name}" siap dicetak.`);
    window.print();
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col justify-between overflow-y-auto">
        
        {/* Header */}
        <SheetHeader className="p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-card border border-border shrink-0 shadow-2xs">
              {menu.icon || '🍳'}
            </span>
            <div className="space-y-0.5 min-w-0">
              <SheetTitle className="text-lg font-bold text-foreground truncate">
                {menu.name}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Kategori: <strong className="text-foreground">{menu.category}</strong>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content Body */}
        <div className="p-5 space-y-5 flex-1">
          
          {/* Total Portions Highlight */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                Total Kebutuhan Porsi
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-foreground font-sans">
                  {menu.totalPortions}
                </span>
                <span className="text-sm font-semibold text-muted-foreground">
                  porsi matang
                </span>
              </div>
            </div>

            <Badge
              variant={
                menu.status === 'READY'
                  ? 'default'
                  : menu.status === 'PENDING'
                  ? 'secondary'
                  : 'destructive'
              }
              className="text-xs font-bold py-1 px-3"
            >
              ● {menu.status === 'READY' ? 'Ready Masak' : menu.status === 'PENDING' ? 'Pending' : 'Perlu Diperiksa'}
            </Badge>
          </div>

          {/* Breakdown per Diet */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-primary" />
              Breakdown Porsi per Jenis Diet
            </h4>

            <div className="grid grid-cols-2 gap-2">
              {menu.dietBreakdown.map((d, idx) => {
                const pct = Math.round((d.count / menu.totalPortions) * 100);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border bg-card flex flex-col justify-between gap-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-primary px-1.5 py-0.5 rounded-md bg-primary/10">
                        {d.diet}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {pct}%
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xs text-muted-foreground font-medium truncate">
                        {d.label || `Diet ${d.diet}`}
                      </span>
                      <span className="text-sm font-extrabold text-foreground">
                        {d.count} <span className="text-[10px] font-normal text-muted-foreground">porsi</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown per Location (Building & Floors) */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Distribusi Gedung & Lantai
            </h4>

            <div className="space-y-3">
              {menu.locationBreakdown.map((loc, lIdx) => (
                <div key={lIdx} className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="text-foreground">{loc.gedung}</span>
                    <span className="text-primary">{loc.count} Porsi ({loc.percentage}%)</span>
                  </div>

                  {/* Floors under building */}
                  {loc.floors && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-dashed border-border/70 text-xs">
                      {loc.floors.map((fl, fIdx) => (
                        <div key={fIdx} className="flex justify-between items-center bg-muted/40 px-2 py-1 rounded-lg">
                          <span className="text-muted-foreground text-[11px]">{fl.floor}</span>
                          <span className="font-bold text-foreground text-[11px]">{fl.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Production Notes & Allergens */}
          {menu.notes && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Catatan Dapur & Standar Diet:
              </div>
              <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed text-[11px]">
                {menu.notes}
              </p>
            </div>
          )}

          {menu.allergens && menu.allergens.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="text-muted-foreground text-[11px]">Alergen:</span>
              <div className="flex flex-wrap gap-1">
                {menu.allergens.map((alg, aIdx) => (
                  <span key={aIdx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    {alg}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <SheetFooter className="p-4 border-t border-border bg-card flex flex-row items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintTicket}
            className="gap-1.5 text-xs font-semibold rounded-xl"
          >
            <Printer className="w-4 h-4 text-muted-foreground" />
            Cetak Tiket Menu
          </Button>

          <Button
            size="sm"
            onClick={onClose}
            className="text-xs font-bold rounded-xl bg-primary text-primary-foreground"
          >
            Selesai
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}
