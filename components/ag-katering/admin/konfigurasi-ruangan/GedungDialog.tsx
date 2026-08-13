'use client';

import React from 'react';
import type { GedungHierarkis } from '@/servers/tempat.service';
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
import { Building, Loader2 } from 'lucide-react';

interface GedungDialogProps {
  isOpen: boolean;
  editingGedung: GedungHierarkis | null;
  gedungNameInput: string;
  isSubmitting: boolean;
  onNameChange: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function GedungDialog({
  isOpen,
  editingGedung,
  gedungNameInput,
  isSubmitting,
  onNameChange,
  onClose,
  onSave,
}: GedungDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Building className='w-5 h-5 text-blue-600' />
            {editingGedung ? 'Edit Nama Gedung' : 'Tambah Gedung Baru'}
          </DialogTitle>
          <DialogDescription className='text-xs'>
            {editingGedung
              ? `Ubah nama gedung "${editingGedung.namaGedung}".`
              : 'Tentukan nama gedung baru untuk pengelompokan ruangan rawat inap.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-2'>
          <label className='text-xs font-semibold text-foreground block'>
            Nama Gedung <span className='text-destructive'>*</span>
          </label>
          <Input
            type='text'
            placeholder='cth: Gedung A (Rawat Inap Utama)'
            value={gedungNameInput}
            onChange={(e) => onNameChange(e.target.value)}
            className='text-sm'
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={onSave}
            disabled={isSubmitting}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Menyimpan...
              </>
            ) : editingGedung ? (
              'Simpan Perubahan'
            ) : (
              'Tambah Gedung'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
