'use client';

import React from 'react';
import type { RuanganDetail, KamarDetail } from '@/servers/tempat.service';
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
import { DoorOpen, DoorClosed, Bed, Plus, Trash2, Wand2, Loader2 } from 'lucide-react';

interface RuanganDialogProps {
  isOpen: boolean;
  editingRuangan: RuanganDetail | null;
  ruanganNameInput: string;
  ruanganKelasInput: string;
  kamarListInput: KamarDetail[];
  kelasList: string[];
  isSubmitting: boolean;
  onNameChange: (val: string) => void;
  onKelasChange: (val: string) => void;
  onKamarListChange: (list: KamarDetail[]) => void;
  onClose: () => void;
  onSave: () => void;
}

export function RuanganDialog({
  isOpen,
  editingRuangan,
  ruanganNameInput,
  ruanganKelasInput,
  kamarListInput,
  kelasList,
  isSubmitting,
  onNameChange,
  onKelasChange,
  onKamarListChange,
  onClose,
  onSave,
}: RuanganDialogProps) {
  const totalBeds = kamarListInput.reduce((acc, k) => acc + (k.jumlahBed || 0), 0);

  function handleAddKamarRow() {
    const nextIdx = kamarListInput.length + 1;
    const newKamar: KamarDetail = {
      idKamar: `kamar-${Date.now()}-${nextIdx}`,
      nomorKamar: `Kamar ${nextIdx}`,
      jumlahBed: 2,
      kelas: ruanganKelasInput,
    };
    onKamarListChange([...kamarListInput, newKamar]);
  }

  function handleUpdateKamarField<K extends keyof KamarDetail>(
    index: number,
    field: K,
    value: KamarDetail[K],
  ) {
    const updated = [...kamarListInput];
    updated[index] = { ...updated[index], [field]: value };
    onKamarListChange(updated);
  }

  function handleDeleteKamarRow(index: number) {
    if (kamarListInput.length <= 1) return;
    const updated = kamarListInput.filter((_, i) => i !== index);
    onKamarListChange(updated);
  }

  function applyPreset(count: number, bedsPerRoom: number) {
    const generated: KamarDetail[] = Array.from({ length: count }, (_, i) => ({
      idKamar: `kamar-${Date.now()}-${i + 1}`,
      nomorKamar: `Kamar ${i + 1}`,
      jumlahBed: bedsPerRoom,
      kelas: ruanganKelasInput,
    }));
    onKamarListChange(generated);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-xl max-h-[90vh] flex flex-col'>
        <DialogHeader className='shrink-0'>
          <DialogTitle className='flex items-center gap-2'>
            <div className='p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
              <DoorOpen className='w-5 h-5' />
            </div>
            {editingRuangan ? 'Edit Ruangan & Daftar Kamar' : 'Tambah Ruangan Baru'}
          </DialogTitle>
          <DialogDescription className='text-xs'>
            Tentukan nama ruangan, kelas, dan kelola rincian nomor pintu / kamar beserta kapasitas bed masing-masing.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2 overflow-y-auto flex-1 pr-1'>
          {/* Row 1: Nama Ruangan & Kelas */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground block'>
                Nama Ruangan <span className='text-destructive'>*</span>
              </label>
              <Input
                type='text'
                placeholder='cth: Melati, Anggrek, ICU'
                value={ruanganNameInput}
                onChange={(e) => onNameChange(e.target.value)}
                className='text-sm'
                autoFocus
              />
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground block'>
                Penetapan Kelas Utama <span className='text-destructive'>*</span>
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
          </div>

          {/* Section: Daftar Kamar / Nomor Pintu */}
          <div className='border rounded-xl p-3.5 bg-muted/20 space-y-3'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div>
                <h5 className='font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5'>
                  <DoorClosed className='w-4 h-4 text-emerald-600 dark:text-emerald-400' />
                  Daftar Nomor Pintu / Kamar
                </h5>
                <p className='text-[11px] text-muted-foreground'>
                  Setiap kamar memiliki nomor pintu dan kapasitas bed tersendiri.
                </p>
              </div>

              <div className='flex items-center gap-2 text-xs font-semibold'>
                <span className='px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'>
                  {kamarListInput.length} Kamar
                </span>
                <span className='px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30'>
                  {totalBeds} Total Bed
                </span>
              </div>
            </div>

            {/* Quick Generator Presets */}
            <div className='flex flex-wrap items-center gap-1.5 pt-1'>
              <span className='text-[11px] font-medium text-muted-foreground flex items-center gap-1 mr-1'>
                <Wand2 className='w-3 h-3' /> Template Cepat:
              </span>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-6 text-[10px] px-2 bg-background'
                onClick={() => applyPreset(4, 2)}
              >
                4 Kamar @ 2 Bed
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-6 text-[10px] px-2 bg-background'
                onClick={() => applyPreset(6, 1)}
              >
                6 Kamar @ 1 Bed
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-6 text-[10px] px-2 bg-background'
                onClick={() => applyPreset(2, 4)}
              >
                2 Kamar @ 4 Bed
              </Button>
            </div>

            {/* Kamar Row Items */}
            <div className='space-y-2 pt-1'>
              {kamarListInput.map((kamar, idx) => (
                <div
                  key={kamar.idKamar || idx}
                  className='flex items-center gap-2 bg-background p-2 rounded-lg border border-border/80 text-xs shadow-2xs'
                >
                  <div className='font-mono font-bold text-muted-foreground w-6 text-center text-[11px] shrink-0'>
                    #{idx + 1}
                  </div>

                  {/* Nomor Pintu / Nama Kamar Input */}
                  <div className='flex-1 min-w-0'>
                    <Input
                      type='text'
                      placeholder={`cth: Kamar ${idx + 1} / 10${idx + 1}`}
                      value={kamar.nomorKamar}
                      onChange={(e) =>
                        handleUpdateKamarField(idx, 'nomorKamar', e.target.value)
                      }
                      className='h-8 text-xs'
                    />
                  </div>

                  {/* Bed Input */}
                  <div className='w-28 shrink-0 flex items-center gap-1'>
                    <Bed className='w-3.5 h-3.5 text-purple-600 shrink-0' />
                    <Input
                      type='number'
                      min={1}
                      max={50}
                      value={kamar.jumlahBed}
                      onChange={(e) =>
                        handleUpdateKamarField(
                          idx,
                          'jumlahBed',
                          parseInt(e.target.value) || 1,
                        )
                      }
                      className='h-8 text-xs font-mono'
                      title='Jumlah Bed di kamar ini'
                    />
                    <span className='text-[10px] text-muted-foreground font-medium'>
                      Bed
                    </span>
                  </div>

                  {/* Delete Button */}
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    disabled={kamarListInput.length <= 1}
                    className='h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0'
                    onClick={() => handleDeleteKamarRow(idx)}
                    title={
                      kamarListInput.length <= 1
                        ? 'Minimal 1 kamar harus ada'
                        : 'Hapus baris kamar ini'
                    }
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Kamar Row Button */}
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='w-full h-8 text-xs gap-1.5 border-dashed border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10'
              onClick={handleAddKamarRow}
            >
              <Plus className='w-3.5 h-3.5' /> Tambah Baris Kamar / Pintu
            </Button>
          </div>
        </div>

        <DialogFooter className='shrink-0 pt-2 border-t'>
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
