'use client';

import { useState, useEffect } from 'react';
import type { Patient } from '@/servers/patient.service';
import type { GedungWithRuangan } from '@/servers/tempat.service';
import { updatePatientField } from '@/servers/patient.service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DoorOpen } from 'lucide-react';
import { toast } from 'sonner';

interface PindahRuanganDialogProps {
  patient: Patient | null;
  gedungList: GedungWithRuangan[];
  onClose: () => void;
  onSuccess: (patientId: number) => void;
}

export default function PindahRuanganDialog({
  patient,
  gedungList,
  onClose,
  onSuccess,
}: PindahRuanganDialogProps) {
  const [targetGedung, setTargetGedung] = useState<string>('');
  const [targetRuangan, setTargetRuangan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (patient) {
      setTargetGedung(patient.gedung);
      setTargetRuangan(patient.ruangan);
    }
  }, [patient]);

  if (!patient) return null;

  const currentPindahRuanganList =
    gedungList.find((g) => g.namaGedung === targetGedung)?.ruanganList.map(
      (r) => r.namaRuangan,
    ) || [];

  async function handleSavePindah() {
    if (!patient || !targetGedung || !targetRuangan) return;
    setIsSubmitting(true);
    try {
      const res = await updatePatientField(patient.id, {
        gedung: targetGedung,
        ruangan: targetRuangan,
        status_pasien: 'PINDAH_RUANGAN',
      });
      if (res.success) {
        onSuccess(patient.id);
        toast.success(
          `${patient.nama_pasien} dipindahkan ke ${targetGedung} - ${targetRuangan}`,
        );
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal memindahkan pasien.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={Boolean(patient)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <DoorOpen className='w-5 h-5 text-primary' />
            Pindah Ruangan Pasien
          </DialogTitle>
          <DialogDescription>
            Pindahkan{' '}
            <strong className='text-foreground'>{patient.nama_pasien}</strong> (RM:{' '}
            {patient.no_rm}) ke gedung dan ruangan baru.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Gedung Select */}
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Pilih Gedung</label>
            <Select
              value={targetGedung}
              onValueChange={(val) => {
                if (val !== null) {
                  setTargetGedung(val);
                  const gObj = gedungList.find((g) => g.namaGedung === val);
                  if (gObj && gObj.ruanganList.length > 0) {
                    setTargetRuangan(gObj.ruanganList[0].namaRuangan);
                  }
                }
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Pilih Gedung' />
              </SelectTrigger>
              <SelectContent>
                {gedungList.map((g) => (
                  <SelectItem key={g.idGedung} value={g.namaGedung}>
                    {g.namaGedung}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ruangan Select */}
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Pilih Ruangan</label>
            <Select
              value={targetRuangan}
              onValueChange={(val) => {
                if (val !== null) setTargetRuangan(val);
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Pilih Ruangan' />
              </SelectTrigger>
              <SelectContent>
                {currentPindahRuanganList.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button onClick={handleSavePindah} disabled={isSubmitting}>
            {isSubmitting ? 'Memindahkan...' : 'Pindahkan Pasien'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
