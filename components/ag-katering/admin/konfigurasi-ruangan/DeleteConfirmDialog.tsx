'use client';

import React from 'react';
import type { GedungHierarkis, RuanganDetail } from '@/servers/tempat.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteGedungDialogProps {
  gedung: GedungHierarkis | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteGedungDialog({
  gedung,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteGedungDialogProps) {
  if (!gedung) return null;

  return (
    <Dialog open={Boolean(gedung)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-destructive'>
            <Trash2 className='w-5 h-5' />
            Hapus Gedung?
          </DialogTitle>
          <DialogDescription className='text-xs pt-1'>
            Apakah Anda yakin ingin menghapus{' '}
            <strong className='text-foreground'>{gedung.namaGedung}</strong>?
            Seluruh ruangan ({gedung.ruanganList.length} ruangan) di dalamnya juga akan terhapus.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isDeleting}>
            Batal
          </Button>
          <Button
            variant='destructive'
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Menghapus...
              </>
            ) : (
              'Hapus Gedung'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteRuanganDialogProps {
  ruangan: RuanganDetail | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteRuanganDialog({
  ruangan,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteRuanganDialogProps) {
  if (!ruangan) return null;

  return (
    <Dialog open={Boolean(ruangan)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-destructive'>
            <Trash2 className='w-5 h-5' />
            Hapus Ruangan?
          </DialogTitle>
          <DialogDescription className='text-xs pt-1'>
            Apakah Anda yakin ingin menghapus ruangan{' '}
            <strong className='text-foreground'>{ruangan.namaRuangan}</strong>?
            Seluruh kamar ({ruangan.kamarList?.length || 0} kamar) dan bed di dalamnya juga akan terhapus.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isDeleting}>
            Batal
          </Button>
          <Button
            variant='destructive'
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Menghapus...
              </>
            ) : (
              'Hapus Ruangan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteKamarDialogProps {
  kamarTarget: {
    ruangan: RuanganDetail;
    kamar: { idKamar: string; nomorKamar: string; jumlahBed: number };
  } | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteKamarDialog({
  kamarTarget,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteKamarDialogProps) {
  if (!kamarTarget) return null;

  return (
    <Dialog
      open={Boolean(kamarTarget)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-destructive'>
            <Trash2 className='w-5 h-5' />
            Hapus Kamar / Nomor Pintu?
          </DialogTitle>
          <DialogDescription className='text-xs pt-1'>
            Apakah Anda yakin ingin menghapus{' '}
            <strong className='text-foreground'>
              {kamarTarget.kamar.nomorKamar}
            </strong>{' '}
            ({kamarTarget.kamar.jumlahBed} bed) dari ruangan{' '}
            <strong className='text-foreground'>
              {kamarTarget.ruangan.namaRuangan}
            </strong>
            ?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isDeleting}>
            Batal
          </Button>
          <Button
            variant='destructive'
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Menghapus...
              </>
            ) : (
              'Hapus Kamar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

