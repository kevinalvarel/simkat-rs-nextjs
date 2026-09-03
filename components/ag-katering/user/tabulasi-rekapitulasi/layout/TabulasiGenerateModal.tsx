'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Calendar, Clock, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateTabulasiAction } from '@/servers/tabulasi.service';
import { toast } from 'sonner';

interface TabulasiGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string;
  defaultMeal: string;
  onSuccess: (batchCode: string) => void;
}

export default function TabulasiGenerateModal({
  isOpen,
  onClose,
  defaultDate,
  defaultMeal,
  onSuccess,
}: TabulasiGenerateModalProps) {
  const [date, setDate] = useState(defaultDate);
  const [mealTime, setMealTime] = useState(defaultMeal);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await generateTabulasiAction(date, mealTime);
      if (res.success) {
        toast.success(res.message);
        onSuccess(res.batchCode || 'BATCH-PROCESSED');
        onClose();
      } else {
        toast.error(res.message || 'Gagal generate tabulasi.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat generate data tabulasi.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isGenerating && onClose()}>
      <DialogContent className="sm:max-w-md">
        
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Generate Tabulasi Porsi Makanan
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Sistem akan menghitung dan merekap kebutuhan porsi pasien dari master snapshot aktif untuk siklus terpilih.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          
          {/* Tanggal Produksi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Tanggal Produksi:
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Waktu Makan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Siklus Waktu Makan:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Pagi', 'Siang', 'Malam', 'Snack'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMealTime(m)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    mealTime === m
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-card border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              Perhitungan tabulasi mencakup mapping diet standar RS, ekstra protein (putih telur, puyuh), buah, dan snack per lantai bangsal.
            </span>
          </div>

        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isGenerating}
            className="text-xs rounded-xl"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="text-xs font-bold rounded-xl bg-primary text-primary-foreground gap-1.5"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Memproses Rekapitulasi...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                Proses & Tampilkan Tabulasi
              </>
            )}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
