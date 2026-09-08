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
  Utensils,
} from 'lucide-react';
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
  onSuccess: () => void;
}

const WAKTU_MAKAN_LABELS: Record<string, string> = {
  PAGI: 'Makan Pagi',
  SIANG: 'Makan Siang',
  SORE: 'Makan Sore',
  SARING: 'Saring',
};

const COMMON_QUICK_TAGS = [
  'B',
  'Diit',
  'DM',
  'RG',
  'DJ',
  'DH',
  'RP',
  'RS',
  'RL',
  'RKol',
  'TKTP',
];

export default function SiklusSlotEditorDialog({
  open,
  onOpenChange,
  slotContext,
  onSuccess,
}: SiklusSlotEditorDialogProps) {
  const [items, setItems] = useState<SlotItemInput[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
              kategori_menu: 'B',
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
        kategori_menu: 'B',
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
    const current = (items[index]?.kategori_menu || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let next: string[];
    if (current.includes(tag)) {
      next = current.filter((t) => t !== tag);
    } else {
      next = [...current, tag];
    }
    handleFieldChange(index, 'kategori_menu', next.join(', '));
  }

  async function handleSave() {
    if (!slotContext) return;

    // Filter out items with completely empty dish name
    const validItems = items.filter((i) => i.nama_makanan.trim());

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
            const currentItemTags = (item.kategori_menu || '')
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean);

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
                  <div className='sm:col-span-6 space-y-1'>
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

                  <div className='sm:col-span-3 space-y-1'>
                    <Label className='text-[11px] font-semibold'>
                      Kategori / Tag Diet
                    </Label>
                    <Input
                      value={item.kategori_menu || ''}
                      onChange={(e) =>
                        handleFieldChange(idx, 'kategori_menu', e.target.value)
                      }
                      placeholder='mis. B, Diit, DM'
                      className='h-8 text-xs font-mono font-bold bg-background'
                    />
                  </div>

                  <div className='sm:col-span-3 space-y-1'>
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

                {/* Quick Diet Tag Chips */}
                <div className='flex items-center gap-1 flex-wrap pt-0.5'>
                  <span className='text-[10px] text-muted-foreground mr-1'>
                    Pilih Tag Cepat:
                  </span>
                  {COMMON_QUICK_TAGS.map((tag) => {
                    const isSelected = currentItemTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type='button'
                        onClick={() => handleQuickTag(idx, tag)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
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
