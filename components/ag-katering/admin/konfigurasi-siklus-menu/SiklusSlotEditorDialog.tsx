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
  Plus,
  Trash2,
  Save,
  Loader2,
  ArrowUp,
  ArrowDown,
  Layers,
  X,
} from 'lucide-react';
import {
  getMenuTagOptions,
  normalizeMenuTags,
  parseMenuTags,
  type MenuTagOption,
} from '@/lib/siklus-menu-tags';
import type {
  SiklusMenuItem,
  SlotItemInput,
} from '@/servers/siklus-menu.service';
import { saveSlotMenuItems } from '@/servers/siklus-menu.service';
import { toast } from 'sonner';

interface SiklusSlotEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotContext: {
    siklus_ke: number;
    kelas: string;
    jenis_makanan: string;
    waktu_makan: string;
    existingItems: SiklusMenuItem[];
  } | null;
  dietOptions: MenuTagOption[];
  onSuccess: () => void;
}

const WAKTU_MAKAN_LABELS: Record<string, string> = {
  PAGI: 'Makan Pagi',
  SIANG: 'Makan Siang',
  SORE: 'Makan Sore',
  SARING: 'Saring',
};

export default function SiklusSlotEditorDialog({
  open,
  onOpenChange,
  slotContext,
  dietOptions,
  onSuccess,
}: SiklusSlotEditorDialogProps) {
  const [items, setItems] = useState<SlotItemInput[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const availableTags = getMenuTagOptions(dietOptions, slotContext?.jenis_makanan);

  useEffect(() => {
    if (open && slotContext) {
      const timer = setTimeout(() => {
        if (slotContext.existingItems.length > 0) {
          setItems(
            slotContext.existingItems.map((item, idx) => ({
              id: item.id,
              nama_makanan: item.nama_makanan,
              kategori_menu: item.kategori_menu || '',
              catatan: item.catatan || '',
              urutan: item.urutan || idx + 1,
            })),
          );
        } else {
          setItems([
            {
              nama_makanan: '',
              kategori_menu: '',
              catatan: '',
              urutan: 1,
            },
          ]);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, slotContext]);

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      {
        nama_makanan: '',
        kategori_menu: '',
        catatan: '',
        urutan: prev.length + 1,
      },
    ]);
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFieldChange(
    index: number,
    field: keyof SlotItemInput,
    val: string | number,
  ) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  }

  function handleMoveDown(index: number) {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  }

  function handleQuickTag(index: number, tag: string) {
    const current = parseMenuTags(items[index]?.kategori_menu);

    let next: string[];
    if (current.some((currentTag) => currentTag.toUpperCase() === tag.toUpperCase())) {
      next = current.filter((currentTag) => currentTag.toUpperCase() !== tag.toUpperCase());
    } else {
      next = [...current, tag];
    }
    handleFieldChange(index, 'kategori_menu', next.join(', '));
  }

  async function handleSave() {
    if (!slotContext) return;

    // Filter out items with completely empty dish name
    const validItems = items.filter((i) => i.nama_makanan.trim());
    if (validItems.some((item) => normalizeMenuTags(item.kategori_menu, availableTags).invalid.length > 0)) {
      toast.error('Hapus tag yang tidak tersedia untuk kategori slot ini sebelum menyimpan.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveSlotMenuItems(
        slotContext.siklus_ke,
        slotContext.kelas,
        slotContext.jenis_makanan,
        slotContext.waktu_makan,
        validItems,
      );

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan slot hidangan.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!slotContext) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl p-6 max-h-[90vh] flex flex-col'>
        <DialogHeader className='gap-1 border-b pb-4 shrink-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Badge
              variant='outline'
              className='bg-primary/10 text-primary font-mono text-xs'
            >
              Siklus #{slotContext.siklus_ke}
            </Badge>
            <Badge variant='secondary' className='text-xs font-semibold'>
              Kelas {slotContext.kelas}
            </Badge>
            <Badge variant='outline' className='text-xs font-semibold'>
              {slotContext.jenis_makanan}
            </Badge>
            <Badge className='bg-foreground text-background text-xs font-bold'>
              {WAKTU_MAKAN_LABELS[slotContext.waktu_makan] ||
                slotContext.waktu_makan}
            </Badge>
          </div>
          <DialogTitle className='text-lg font-bold tracking-tight pt-1 flex items-center gap-2'>
            <Layers className='w-5 h-5 text-primary' />
            Kelola Daftar Hidangan dalam Slot Ini
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Anda dapat menambah beberapa variasi hidangan untuk diet yang
            berbeda (contoh: Biasa, Rendah Garam, DM, Jantung).
          </DialogDescription>
        </DialogHeader>

        {/* Dish List Container */}
        <div className='flex-1 overflow-y-auto py-3 space-y-3 pr-1'>
          {items.map((item, idx) => {
            const currentItemTags = parseMenuTags(item.kategori_menu);
            const { invalid: invalidTags } = normalizeMenuTags(item.kategori_menu, availableTags);

            return (
              <div
                key={idx}
                className='p-3.5 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-all space-y-2.5 relative group'
              >
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <span className='w-6 h-6 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center'>
                      {idx + 1}
                    </span>
                    <span className='text-xs font-bold text-foreground'>
                      Hidangan #{idx + 1}
                    </span>
                  </div>

                  <div className='flex items-center gap-1'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-xs'
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className='h-7 w-7'
                      title='Pindah ke Atas'
                    >
                      <ArrowUp className='w-3.5 h-3.5' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-xs'
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === items.length - 1}
                      className='h-7 w-7'
                      title='Pindah ke Bawah'
                    >
                      <ArrowDown className='w-3.5 h-3.5' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-xs'
                      onClick={() => handleRemoveItem(idx)}
                      className='h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10'
                      title='Hapus Baris'
                    >
                      <Trash2 className='w-3.5 h-3.5' />
                    </Button>
                  </div>
                </div>

                {/* Input Fields */}
                <div className='grid grid-cols-1 sm:grid-cols-12 gap-2'>
                  <div className='sm:col-span-8 space-y-1'>
                    <Label className='text-[11px] font-semibold'>
                      Nama Hidangan
                    </Label>
                    <Input
                      value={item.nama_makanan}
                      onChange={(e) =>
                        handleFieldChange(idx, 'nama_makanan', e.target.value)
                      }
                      placeholder='mis. Telur Puyuh BB Kecap'
                      className='h-8 text-xs bg-background'
                    />
                  </div>

                  <div className='sm:col-span-4 space-y-1'>
                    <Label className='text-[11px] font-semibold'>
                      Catatan / Potongan
                    </Label>
                    <Input
                      value={item.catatan || ''}
                      onChange={(e) =>
                        handleFieldChange(idx, 'catatan', e.target.value)
                      }
                      placeholder='mis. *ptg dadu'
                      className='h-8 text-xs bg-background'
                    />
                  </div>
                </div>

                {/* Tags from the selected slot's master category */}
                <div className='flex items-center gap-1 flex-wrap pt-0.5'>
                  <span className='text-[10px] text-muted-foreground mr-1'>
                    Tag {slotContext.jenis_makanan}:
                  </span>
                  {availableTags.map((option) => {
                    const isSelected = currentItemTags.some((tag) => tag.toUpperCase() === option.kode.toUpperCase());
                    return (
                      <button
                        key={option.kode}
                        type='button'
                        onClick={() => handleQuickTag(idx, option.kode)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                        }`}
                      >
                        {option.kode} - {option.label}
                      </button>
                    );
                  })}
                </div>
                {availableTags.length === 0 && (
                  <p className='text-[11px] text-muted-foreground'>
                    Belum ada tag aktif untuk kategori {slotContext.jenis_makanan}. Tambahkan di Konfigurasi Master Menu.
                  </p>
                )}
                {invalidTags.length > 0 && (
                  <div className='space-y-1'>
                    <p className='text-[11px] text-destructive'>Tag lama tidak tersedia untuk kategori ini. Hapus sebelum menyimpan.</p>
                    <div className='flex flex-wrap gap-1'>
                      {invalidTags.map((tag) => (
                        <Badge key={tag} variant='destructive' className='gap-1'>
                          {tag}
                          <button type='button' onClick={() => handleQuickTag(idx, tag)} aria-label={`Hapus tag ${tag}`}>
                            <X className='w-3 h-3' />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleAddItem}
            className='w-full border-dashed gap-1.5 text-xs text-muted-foreground hover:text-foreground h-9'
          >
            <Plus className='w-4 h-4' /> Tambah Baris Hidangan
          </Button>
        </div>

        <DialogFooter className='gap-2 pt-3 border-t shrink-0'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button
            type='button'
            size='sm'
            onClick={handleSave}
            disabled={isSaving}
            className='gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground'
          >
            {isSaving ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Menyimpan Slot...
              </>
            ) : (
              <>
                <Save className='w-4 h-4' />
                Simpan Seluruh Slot
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
