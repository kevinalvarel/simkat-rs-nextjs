'use client';

import { useState } from 'react';
import type { Patient } from '@/servers/patient.service';
import { deletePatient } from '@/servers/patient.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DeletePatientDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeletePatientDialog({
  patient,
  open,
  onOpenChange,
}: DeletePatientDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!patient) return;

    setIsDeleting(true);
    try {
      const result = await deletePatient(patient.id);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus pasien.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus pasien?</AlertDialogTitle>
          <AlertDialogDescription>
            Data pasien{' '}
            <strong className='text-foreground'>{patient?.nama_pasien}</strong>{' '}
            akan dihapus. Apakah Anda yakin?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Menghapus...
              </>
            ) : (
              'Hapus'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
