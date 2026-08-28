'use client';

import React from 'react';
import type { KamarDetail, RuanganDetail } from '@/servers/tempat.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DoorClosed, Bed, Loader2 } from 'lucide-react';

interface KamarDialogProps {
  isOpen: boolean;
  parentRuangan: RuanganDetail | null;
  editingKamar: KamarDetail | null;
  nomorKamarInput: string;
  kamarBedInput: number;
  kamarKelasInput: string;
  kelasList: string[];
  isSubmitting: boolean;
  onNomorKamarChange: (val: string) => void;
  onBedChange: (val: number) => void;
  onKelasChange: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function KamarDialog({
  isOpen,
  parentRuangan,
  editingKamar,
  nomorKamarInput,
  kamarBedInput,
  kamarKelasInput,
  kelasList,
  isSubmitting,
  onNomorKamarChange,
  onBedChange,
  onKelasChange,
  onClose,
  onSave,
}: KamarDialogProps) {
  if (!parentRuangan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-foreground'>
            <div className='p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
              <DoorClosed className='w-5 h-5' />
            </div>
            {editingKamar
              ? 'Edit Kamar / Nomor Pintu'
              : 'Tambah Kamar / Nomor Pintu'}
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Konfigurasikan nomor pintu/kamar dan kapasitas bed di ruangan{' '}
            <strong className='text-foreground font-semibold'>
              {parentRuangan.namaRuangan}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Nomor Pintu / Nama Kamar */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground block'>
              Nomor Pintu / Nama Kamar <span className='text-destructive'>*</span>
            </label>
            <Input
              type='text'
              placeholder='cth: Kamar 101, Pintu 01, Kamar 1A'
              value={nomorKamarInput}
              onChange={(e) => onNomorKamarChange(e.target.value)}
              className='text-sm'
              autoFocus
            />
            <p className='text-[11px] text-muted-foreground'>
              Dapat berupa nomor kamar (misal: 101) atau nama unit pintu (misal: Pintu A).
            </p>
          </div>

          {/* Kapasitas Bed */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground flex items-center justify-between'>
              <span>
                Kapasitas Jumlah Bed <span className='text-destructive'>*</span>
              </span>
              <span className='text-[11px] font-normal text-muted-foreground flex items-center gap-1'>
                <Bed className='w-3 h-3 text-purple-600' />
                Min: 1 Bed
              </span>
            </label>
            <Input
              type='number'
              min={1}
              max={100}
              value={kamarBedInput}
              onChange={(e) => onBedChange(parseInt(e.target.value) || 1)}
              className='font-mono text-sm'
            />
          </div>

          {/* Penetapan Kelas (Optional / Inherit) */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground block'>
              Kelas Kamar
            </label>
            <Select
              value={kamarKelasInput || parentRuangan.kelas}
              onValueChange={(val) => onKelasChange(val || parentRuangan.kelas)}
            >
              <SelectTrigger className='w-full text-xs'>
                <SelectValue placeholder='Pilih Kelas Kamar' />
              </SelectTrigger>
              <SelectContent>
                {kelasList.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k} {k === parentRuangan.kelas && '(Default Ruangan)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={onSave}
            disabled={isSubmitting}
            className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Menyimpan...
              </>
            ) : editingKamar ? (
              'Simpan Perubahan'
            ) : (
              'Tambah Kamar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
