'use client';

import React from 'react';
import type { UserRecord } from '@/servers/user.service';
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

interface DeleteUserModalProps {
  user: UserRecord | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteUserModal({
  user,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  if (!user) return null;

  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-destructive'>
            <Trash2 className='w-5 h-5' />
            Hapus Akun Pengguna?
          </DialogTitle>
          <DialogDescription className='text-xs pt-1'>
            Apakah Anda yakin ingin menghapus akun <strong className='text-foreground'>{user.name}</strong> ({user.email})? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isDeleting}>
            Batal
          </Button>
          <Button variant='destructive' onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Hapus Permanen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
