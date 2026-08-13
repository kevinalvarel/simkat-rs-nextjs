'use client';

import React from 'react';
import type { RuanganDetail } from '@/servers/tempat.service';
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
import { DoorOpen, Loader2 } from 'lucide-react';

interface RuanganDialogProps {
  isOpen: boolean;
  editingRuangan: RuanganDetail | null;
  ruanganNameInput: string;
  ruanganKelasInput: string;
  ruanganBedInput: number;
  kelasList: string[];
  isSubmitting: boolean;
  onNameChange: (val: string) => void;
  onKelasChange: (val: string) => void;
  onBedChange: (val: number) => void;
  onClose: () => void;
  onSave: () => void;
}

export function RuanganDialog({
  isOpen,
  editingRuangan,
  ruanganNameInput,
  ruanganKelasInput,
  ruanganBedInput,
  kelasList,
  isSubmitting,
  onNameChange,
  onKelasChange,
  onBedChange,
  onClose,
  onSave,
}: RuanganDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <DoorOpen className='w-5 h-5 text-emerald-600' />
            {editingRuangan ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}
          </DialogTitle>
          <DialogDescription className='text-xs'>
            Konfigurasikan nama ruangan, penetapan kelas, dan kapasitas
            jumlah bed.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Nama Ruangan */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground block'>
              Nama Ruangan <span className='text-destructive'>*</span>
            </label>
            <Input
              type='text'
              placeholder='cth: Melati 1, Anggrek VIP'
              value={ruanganNameInput}
              onChange={(e) => onNameChange(e.target.value)}
              className='text-sm'
              autoFocus
            />
          </div>

          {/* Pilih Kelas */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground block'>
              Penetapan Kelas <span className='text-destructive'>*</span>
            </label>
            <Select
              value={ruanganKelasInput}
              onValueChange={(val) => onKelasChange(val || 'Kelas 1')}
            >
              <SelectTrigger className='w-full text-xs'>
                <SelectValue placeholder='Pilih Kelas' />
              </SelectTrigger>
              <SelectContent>
                {kelasList.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Jumlah Bed */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-foreground block'>
              Kapasitas Jumlah Bed <span className='text-destructive'>*</span>
            </label>
            <Input
              type='number'
              min={1}
              max={100}
              value={ruanganBedInput}
              onChange={(e) => onBedChange(parseInt(e.target.value) || 1)}
              className='font-mono text-sm'
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={onSave}
            disabled={isSubmitting}
            className='bg-emerald-600 hover:bg-emerald-700 text-white'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Menyimpan...
              </>
            ) : editingRuangan ? (
              'Simpan Ruangan'
            ) : (
              'Tambah Ruangan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
