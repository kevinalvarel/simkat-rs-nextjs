'use client';

import React from 'react';
import type { UserRecord, UserRole } from '@/servers/user.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, CheckCircle2, Loader2 } from 'lucide-react';

interface EditRoleModalProps {
  user: UserRecord | null;
  newRole: UserRole;
  isUpdating: boolean;
  onRoleChange: (role: UserRole) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function EditRoleModal({
  user,
  newRole,
  isUpdating,
  onRoleChange,
  onClose,
  onConfirm,
}: EditRoleModalProps) {
  if (!user) return null;

  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Pencil className='w-5 h-5 text-primary' />
            Ubah Role Akun Pengguna
          </DialogTitle>
          <DialogDescription>
            Ubah role akses untuk <strong className='text-foreground'>{user.name}</strong> ({user.email}).
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-2'>
          <label className='text-xs font-semibold text-foreground block'>Pilih Role Baru</label>
          <div className='grid grid-cols-1 gap-2'>
            {(['gizi-katering', 'gizi-rs', 'supervisor'] as UserRole[]).map((r) => (
              <button
                key={r}
                type='button'
                onClick={() => onRoleChange(r)}
                className={`flex items-center justify-between p-3 rounded-lg border text-xs font-semibold transition-all ${
                  newRole === r
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted/50 text-foreground'
                }`}
              >
                <span className='capitalize'>{r.replace('-', ' ')}</span>
                {newRole === r && <CheckCircle2 className='w-4 h-4 text-primary' />}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isUpdating}>
            Batal
          </Button>
          <Button onClick={onConfirm} disabled={isUpdating}>
            {isUpdating ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Simpan Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
