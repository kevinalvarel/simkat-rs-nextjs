'use client';

import React, { useState, useMemo } from 'react';
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
import {
  DoorOpen,
  DoorClosed,
  Bed,
  Plus,
  Minus,
  Trash2,
  Wand2,
  Loader2,
  Search,
  Building,
  Info,
} from 'lucide-react';
import { renderKelasBadge } from './RuanganCard';

interface RuanganDialogProps {
  isOpen: boolean;
  editingRuangan: RuanganDetail | null;
  gedungNama?: string;
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
  gedungNama,
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
  const [searchKamarQuery, setSearchKamarQuery] = useState('');

  const totalBeds = useMemo(
    () => kamarListInput.reduce((acc, k) => acc + (k.jumlahBed || 0), 0),
    [kamarListInput],
  );

  const filteredKamarList = useMemo(() => {
    if (!searchKamarQuery.trim()) return kamarListInput;
    const q = searchKamarQuery.toLowerCase().trim();
    return kamarListInput.filter(
      (k) =>
        k.nomorKamar.toLowerCase().includes(q) ||
        (k.kelas && k.kelas.toLowerCase().includes(q)),
    );
  }, [kamarListInput, searchKamarQuery]);

  function handleAddKamar() {
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
    idKamar: string,
    field: K,
    value: KamarDetail[K],
  ) {
    const updated = kamarListInput.map((k) =>
      k.idKamar === idKamar ? { ...k, [field]: value } : k,
    );
    onKamarListChange(updated);
  }

  function handleAdjustBed(idKamar: string, delta: number) {
    const updated = kamarListInput.map((k) => {
      if (k.idKamar === idKamar) {
        const nextBed = Math.max(1, (k.jumlahBed || 1) + delta);
        return { ...k, jumlahBed: nextBed };
      }
      return k;
    });
    onKamarListChange(updated);
  }

  function handleDeleteKamar(idKamar: string) {
    if (kamarListInput.length <= 1) return;
    const updated = kamarListInput.filter((k) => k.idKamar !== idKamar);
    onKamarListChange(updated);
  }

  function applyPreset(count: number, bedsPerRoom: number, presetKelas?: string) {
    const targetKelas = presetKelas || ruanganKelasInput;
    const generated: KamarDetail[] = Array.from({ length: count }, (_, i) => ({
      idKamar: `kamar-${Date.now()}-${i + 1}`,
      nomorKamar: `Kamar ${i + 1}`,
      jumlahBed: bedsPerRoom,
      kelas: targetKelas,
    }));
    onKamarListChange(generated);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-3xl md:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl'>
        {/* Header with Gradient Accent */}
        <div className='bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent p-5 border-b border-border/80'>
          <DialogHeader className='space-y-2 text-left'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0'>
                  <DoorOpen className='w-6 h-6' />
                </div>
                <div>
                  <DialogTitle className='text-lg sm:text-xl font-bold text-foreground flex items-center gap-2 flex-wrap'>
                    {editingRuangan
                      ? `Kelola Ruangan: ${editingRuangan.namaRuangan}`
                      : 'Tambah Ruangan & Konfigurasi Kamar'}
                    {editingRuangan && renderKelasBadge(ruanganKelasInput)}
                  </DialogTitle>
                  <DialogDescription className='text-xs text-muted-foreground flex items-center gap-2 pt-0.5'>
                    {gedungNama && (
                      <span className='flex items-center gap-1 font-medium text-foreground'>
                        <Building className='w-3.5 h-3.5 text-blue-600' />
                        {gedungNama}
                      </span>
                    )}
                    {gedungNama && <span>·</span>}
                    <span>Kelola nomor pintu, kamar, dan kapasitas bed pasien.</span>
                  </DialogDescription>
                </div>
              </div>

              {/* Top Stats Summary Badges */}
              <div className='flex items-center gap-2 self-start sm:self-center shrink-0'>
                <div className='flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs'>
                  <DoorClosed className='w-3.5 h-3.5 text-emerald-600' />
                  {kamarListInput.length} Kamar
                </div>
                <div className='flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold text-xs'>
                  <Bed className='w-3.5 h-3.5 text-purple-600' />
                  {totalBeds} Total Bed
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Main Content */}
        <div className='flex-1 overflow-y-auto p-5 space-y-5'>
          {/* Section 1: Informasi Ruangan Settings */}
          <div className='rounded-xl border bg-muted/20 p-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                <Info className='w-3.5 h-3.5 text-primary' /> Informasi Ruangan
              </h4>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground block'>
                  Nama Ruangan <span className='text-destructive'>*</span>
                </label>
                <Input
                  type='text'
                  placeholder='cth: Melati, Anggrek, ICU Dewasa'
                  value={ruanganNameInput}
                  onChange={(e) => onNameChange(e.target.value)}
                  className='text-sm bg-background font-medium'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground block'>
                  Penetapan Kelas Utama <span className='text-destructive'>*</span>
                </label>
                <Select
                  value={ruanganKelasInput}
                  onValueChange={(val) => {
                    const nextKelas = val || kelasList[0] || 'KELAS I';
                    onKelasChange(nextKelas);
                    onKamarListChange(
                      kamarListInput.map((k) => ({
                        ...k,
                        kelas: nextKelas,
                      })),
                    );
                  }}
                >
                  <SelectTrigger className='w-full text-xs bg-background'>
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
          </div>

          {/* Section 2: Kamar Management Grid & Toolbar */}
          <div className='space-y-3.5'>
            {/* Toolbar */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <div>
                <h4 className='font-bold text-sm text-foreground flex items-center gap-2'>
                  <DoorClosed className='w-4 h-4 text-emerald-600' />
                  Daftar Kamar & Kapasitas Bed ({kamarListInput.length})
                </h4>
                <p className='text-xs text-muted-foreground'>
                  Atur nomor pintu, nama kamar, dan jumlah tempat tidur di tiap unit.
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  size='sm'
                  onClick={handleAddKamar}
                  className='h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shrink-0'
                >
                  <Plus className='w-3.5 h-3.5' /> Tambah Kamar Baru
                </Button>
              </div>
            </div>

            {/* Quick Generator Presets & Search */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-muted/40 p-2.5 rounded-xl border'>
              <div className='flex items-center gap-1.5 flex-wrap'>
                <span className='text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1'>
                  <Wand2 className='w-3 h-3 text-emerald-600' /> Preset Cepat:
                </span>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-6 text-[10px] px-2.5 bg-background hover:bg-emerald-500/10 hover:text-emerald-700 cursor-pointer'
                  onClick={() => applyPreset(4, 2)}
                >
                  4 Kamar @ 2 Bed
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-6 text-[10px] px-2.5 bg-background hover:bg-emerald-500/10 hover:text-emerald-700 cursor-pointer'
                  onClick={() => applyPreset(6, 1)}
                >
                  6 Kamar @ 1 Bed
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-6 text-[10px] px-2.5 bg-background hover:bg-purple-500/10 hover:text-purple-700 cursor-pointer'
                  onClick={() => applyPreset(2, 4)}
                >
                  2 Kamar @ 4 Bed
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-6 text-[10px] px-2.5 bg-background hover:bg-purple-500/10 hover:text-purple-700 cursor-pointer'
                  onClick={() => applyPreset(1, 1)}
                >
                  1 Kamar @ 1 Bed
                </Button>
              </div>

              {kamarListInput.length > 4 && (
                <div className='relative w-full sm:w-48'>
                  <Search className='w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    type='text'
                    placeholder='Cari kamar...'
                    value={searchKamarQuery}
                    onChange={(e) => setSearchKamarQuery(e.target.value)}
                    className='h-7 pl-8 text-xs bg-background'
                  />
                </div>
              )}
            </div>

            {/* Kamar Cards Grid */}
            {filteredKamarList.length === 0 ? (
              <div className='text-center py-8 border border-dashed rounded-xl space-y-2 bg-muted/10'>
                <DoorClosed className='w-7 h-7 text-muted-foreground mx-auto' />
                <p className='text-xs text-muted-foreground'>
                  {searchKamarQuery
                    ? `Tidak ada kamar yang cocok dengan "${searchKamarQuery}".`
                    : 'Belum ada kamar yang terdaftar di ruangan ini.'}
                </p>
                <Button
                  size='sm'
                  variant='outline'
                  className='h-7 text-xs gap-1 cursor-pointer'
                  onClick={handleAddKamar}
                >
                  <Plus className='w-3 h-3' /> Tambah Kamar Sekarang
                </Button>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                {filteredKamarList.map((kamar, index) => {
                  const bedTokens = Array.from(
                    { length: Math.min(kamar.jumlahBed, 6) },
                    (_, i) => i + 1,
                  );
                  const remainingBeds = kamar.jumlahBed - bedTokens.length;

                  return (
                    <div
                      key={kamar.idKamar || index}
                      className='rounded-xl border border-border/80 bg-card p-3 shadow-2xs hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3'
                    >
                      {/* Top Header: Index & Delete */}
                      <div className='flex items-center justify-between gap-2'>
                        <span className='inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono font-bold text-muted-foreground'>
                          #{index + 1}
                        </span>

                        <div className='flex items-center gap-1'>
                          {/* Kelas per kamar selector */}
                          <Select
                            value={kamar.kelas || ruanganKelasInput}
                            onValueChange={(val) =>
                              handleUpdateKamarField(
                                kamar.idKamar,
                                'kelas',
                                val || ruanganKelasInput,
                              )
                            }
                          >
                            <SelectTrigger className='h-6 text-[10px] px-1.5 py-0 min-w-[70px] border-none bg-muted/60 hover:bg-muted font-semibold'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {kelasList.map((k) => (
                                <SelectItem key={k} value={k} className='text-xs'>
                                  {k}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            disabled={kamarListInput.length <= 1}
                            className='h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0'
                            onClick={() => handleDeleteKamar(kamar.idKamar)}
                            title={
                              kamarListInput.length <= 1
                                ? 'Ruangan harus memiliki minimal 1 kamar'
                                : 'Hapus kamar ini'
                            }
                          >
                            <Trash2 className='w-3 h-3' />
                          </Button>
                        </div>
                      </div>

                      {/* Nomor Kamar Input */}
                      <div className='space-y-1'>
                        <label className='text-[11px] font-medium text-muted-foreground flex items-center gap-1'>
                          <DoorClosed className='w-3 h-3 text-emerald-600' /> Nomor Pintu / Nama Kamar
                        </label>
                        <Input
                          type='text'
                          value={kamar.nomorKamar}
                          onChange={(e) =>
                            handleUpdateKamarField(
                              kamar.idKamar,
                              'nomorKamar',
                              e.target.value,
                            )
                          }
                          placeholder='cth: Kamar 101'
                          className='h-8 text-xs font-semibold bg-background'
                        />
                      </div>

                      {/* Visual Bed Tokens */}
                      <div className='flex flex-wrap items-center gap-1 min-h-[20px]'>
                        {bedTokens.map((num) => (
                          <span
                            key={num}
                            className='inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                          >
                            <Bed className='w-2.5 h-2.5' />
                            B{num}
                          </span>
                        ))}
                        {remainingBeds > 0 && (
                          <span className='inline-flex items-center text-[9px] font-mono px-1 py-0.5 rounded-md bg-muted text-muted-foreground border'>
                            +{remainingBeds}
                          </span>
                        )}
                      </div>

                      {/* Capacity Bed Stepper */}
                      <div className='flex items-center justify-between pt-2 border-t border-dashed bg-muted/30 px-2 py-1.5 rounded-lg'>
                        <span className='text-[11px] font-semibold text-muted-foreground flex items-center gap-1'>
                          <Bed className='w-3 h-3 text-purple-600' /> Kapasitas:
                        </span>

                        <div className='flex items-center gap-1.5'>
                          <button
                            type='button'
                            onClick={() => handleAdjustBed(kamar.idKamar, -1)}
                            disabled={kamar.jumlahBed <= 1}
                            className='h-6 w-6 rounded bg-background border hover:bg-destructive hover:text-white flex items-center justify-center transition-colors font-bold text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
                            title='Kurangi 1 Bed'
                          >
                            <Minus className='w-3 h-3' />
                          </button>
                          <span className='font-mono font-bold text-xs px-1 min-w-[20px] text-center text-foreground'>
                            {kamar.jumlahBed}
                          </span>
                          <button
                            type='button'
                            onClick={() => handleAdjustBed(kamar.idKamar, 1)}
                            className='h-6 w-6 rounded bg-background border hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors font-bold text-xs cursor-pointer'
                            title='Tambah 1 Bed'
                          >
                            <Plus className='w-3 h-3' />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className='p-4 border-t bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <div className='text-xs text-muted-foreground font-medium hidden sm:block'>
            Total: <strong>{kamarListInput.length} kamar</strong> · <strong>{totalBeds} bed</strong>
          </div>

          <div className='flex items-center gap-2 justify-end w-full sm:w-auto'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isSubmitting}
              className='cursor-pointer'
            >
              Batal
            </Button>
            <Button
              type='button'
              onClick={onSave}
              disabled={isSubmitting}
              className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer min-w-[140px]'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Menyimpan...
                </>
              ) : editingRuangan ? (
                'Simpan Perubahan'
              ) : (
                'Tambah Ruangan'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
