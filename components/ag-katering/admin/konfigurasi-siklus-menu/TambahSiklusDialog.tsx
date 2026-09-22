'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { getWibHari, getWibTodayKey } from '@/lib/wib';
import {
  PlusCircle,
  Loader2,
  Sparkles,
  Copy,
  FilePlus,
  Calendar as CalendarIcon,
  ChevronDown,
} from 'lucide-react';
import type { MasterSiklusItem } from '@/servers/siklus-menu.service';
import { createMasterSiklus } from '@/servers/siklus-menu.service';
import { toast } from 'sonner';

interface TambahSiklusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCycles: MasterSiklusItem[];
  onSuccess: (newCycleNumber: number) => void;
}

export default function TambahSiklusDialog({
  open,
  onOpenChange,
  existingCycles,
  onSuccess,
}: TambahSiklusDialogProps) {
  const [nomorSiklus, setNomorSiklus] = useState<number>(1);
  const [namaSiklus, setNamaSiklus] = useState<string>('');
  const [tanggal, setTanggal] = useState<Date | undefined>(new Date());
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [initMode, setInitMode] = useState<'EMPTY' | 'COPY'>('EMPTY');
  const [copyFromSiklus, setCopyFromSiklus] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate smart default cycle number and date when dialog opens
  useEffect(() => {
    if (open) {
      const existingNums = existingCycles.map((c) => c.nomor_siklus);
      let nextNum = 1;
      while (existingNums.includes(nextNum)) {
        nextNum++;
      }

      // Calculate next smart date
      let nextDate = new Date();
      if (existingCycles.length > 0) {
        const sorted = [...existingCycles].sort(
          (a, b) => a.nomor_siklus - b.nomor_siklus,
        );
        const lastCycle = sorted[sorted.length - 1];
        if (lastCycle.tanggal) {
          const parsed = parseISO(lastCycle.tanggal);
          if (isValid(parsed)) {
            nextDate = addDays(parsed, 1);
          }
        }
      }

      const timer = setTimeout(() => {
        setNomorSiklus(nextNum);
        setNamaSiklus(`Siklus ${nextNum}`);
        setTanggal(nextDate);
        setDeskripsi(
          `Rotasi menu makanan siklus tanggal ${format(nextDate, 'd MMMM yyyy', {
            locale: id,
          })}`,
        );
        setInitMode('EMPTY');
        setCopyFromSiklus(existingCycles[0]?.nomor_siklus || 1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, existingCycles]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!nomorSiklus || nomorSiklus < 1) {
      toast.error('Nomor siklus harus berupa angka positif (minimal 1).');
      return;
    }

    if (!namaSiklus.trim()) {
      toast.error('Nama siklus tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isoDate = tanggal ? getWibTodayKey(tanggal) : null;
      const assignedDay = isoDate ? getWibHari(isoDate) : null;

      const res = await createMasterSiklus({
        nomor_siklus: nomorSiklus,
        nama_siklus: namaSiklus.trim(),
        tanggal: isoDate,
        hari: assignedDay,
        deskripsi: deskripsi.trim() || null,
        copyFromSiklus: initMode === 'COPY' ? copyFromSiklus : null,
      });

      if (res.success) {
        toast.success(res.message);
        onSuccess(res.createdSiklus || nomorSiklus);
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error('Error creating cycle:', err);
      toast.error('Gagal menambahkan siklus baru.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-6'>
        <DialogHeader className='gap-1 border-b pb-4'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='bg-primary/10 text-primary border-primary/30 text-[11px]'
            >
              Master Siklus
            </Badge>
          </div>
          <DialogTitle className='text-lg font-bold tracking-tight flex items-center gap-2'>
            <PlusCircle className='w-5 h-5 text-primary' />
            Tambah Siklus Menu Baru
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Daftarkan nomor rotasi siklus menu baru ke dalam sistem secara
            dinamis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className='space-y-4 py-3'>
          <div className='grid grid-cols-3 gap-3'>
            {/* Nomor Siklus */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>
                No. Siklus <span className='text-rose-500'>*</span>
              </Label>
              <Input
                type='number'
                min={1}
                max={99}
                value={nomorSiklus}
                onChange={(e) => {
                  const val = Number(e.target.value) || 1;
                  setNomorSiklus(val);
                  setNamaSiklus(`Siklus ${val}`);
                }}
                className='h-9 text-xs font-mono font-bold text-center'
                required
              />
            </div>

            {/* Nama Siklus */}
            <div className='col-span-2 space-y-1.5'>
              <Label className='text-xs font-semibold'>
                Label / Nama Siklus <span className='text-rose-500'>*</span>
              </Label>
              <Input
                value={namaSiklus}
                onChange={(e) => setNamaSiklus(e.target.value)}
                placeholder='mis. Siklus 11, Siklus Tgl 31'
                className='h-9 text-xs'
                required
              />
            </div>
          </div>

          <div className='grid grid-cols-3 gap-3'>
            {/* Tanggal Penugasan */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>Tanggal Rotasi</Label>
              <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                <PopoverTrigger
                  type='button'
                  className='flex items-center justify-between w-full h-9 px-3 text-xs bg-background font-medium border rounded-md shadow-2xs cursor-pointer hover:bg-muted/80 select-none'
                >
                  <span className='flex items-center gap-1.5 truncate'>
                    <CalendarIcon className='w-3.5 h-3.5 text-primary shrink-0' />
                    {tanggal
                      ? format(tanggal, 'd MMM yyyy', { locale: id })
                      : 'Pilih tanggal...'}
                  </span>
                  <ChevronDown className='w-3 h-3 text-muted-foreground opacity-70 shrink-0' />
                </PopoverTrigger>
                <PopoverContent
                  align='start'
                  side='bottom'
                  sideOffset={4}
                  className='w-auto p-0 rounded-2xl shadow-xl border border-border bg-popover text-popover-foreground overflow-hidden z-50'
                >
                  <Calendar
                    mode='single'
                    selected={tanggal}
                    onSelect={(d) => {
                      if (d) {
                        setTanggal(d);
                        setIsDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>


            {/* Deskripsi Siklus */}
            <div className='col-span-2 space-y-1.5'>
              <Label className='text-xs font-semibold'>Deskripsi / Catatan</Label>
              <Input
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder='contoh: Menu khusus tanggal rotasi'
                className='h-9 text-xs'
              />
            </div>
          </div>


          {/* Mode Inisialisasi Hidangan */}
          <div className='space-y-2.5 bg-muted/40 p-3.5 rounded-xl border'>
            <Label className='text-xs font-semibold flex items-center gap-1.5'>
              <Sparkles className='w-3.5 h-3.5 text-primary' />
              Inisialisasi Hidangan Menu
            </Label>

            <div className='grid grid-cols-2 gap-2'>
              <button
                type='button'
                onClick={() => setInitMode('EMPTY')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  initMode === 'EMPTY'
                    ? 'bg-background border-primary shadow-2xs text-foreground ring-1 ring-primary/40'
                    : 'bg-background/50 border-border text-muted-foreground hover:bg-background hover:text-foreground'
                }`}
              >
                <FilePlus className='w-4 h-4 text-primary shrink-0' />
                <div className='min-w-0'>
                  <p className='text-xs font-bold'>Siklus Kosong</p>
                  <p className='text-[10px] text-muted-foreground truncate'>
                    Mulai dari slot menu kosong
                  </p>
                </div>
              </button>

              <button
                type='button'
                onClick={() => setInitMode('COPY')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  initMode === 'COPY'
                    ? 'bg-background border-primary shadow-2xs text-foreground ring-1 ring-primary/40'
                    : 'bg-background/50 border-border text-muted-foreground hover:bg-background hover:text-foreground'
                }`}
              >
                <Copy className='w-4 h-4 text-primary shrink-0' />
                <div className='min-w-0'>
                  <p className='text-xs font-bold'>Salin Menu</p>
                  <p className='text-[10px] text-muted-foreground truncate'>
                    Duplikasi dari siklus lain
                  </p>
                </div>
              </button>
            </div>

            {initMode === 'COPY' && (
              <div className='pt-2 space-y-1.5'>
                <Label className='text-[11px] font-semibold text-muted-foreground'>
                  Salin seluruh hidangan dari:
                </Label>
                <Select
                  value={String(copyFromSiklus)}
                  onValueChange={(val) => setCopyFromSiklus(Number(val) || 1)}
                >
                  <SelectTrigger className='w-full h-8 text-xs bg-background'>
                    <SelectValue placeholder='Pilih siklus sumber...' />
                  </SelectTrigger>
                  <SelectContent>
                    {existingCycles.map((c) => (
                      <SelectItem
                        key={c.nomor_siklus}
                        value={String(c.nomor_siklus)}
                      >
                        {c.nama_siklus} (#{c.nomor_siklus})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className='gap-2 pt-2 border-t'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type='submit'
              size='sm'
              disabled={isSubmitting}
              className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Menyimpan...
                </>
              ) : (
                <>
                  <PlusCircle className='w-4 h-4' />
                  Buat Siklus Sekarang
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
