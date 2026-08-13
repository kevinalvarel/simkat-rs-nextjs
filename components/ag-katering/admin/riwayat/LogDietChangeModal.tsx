'use client';

import React, { useState } from 'react';
import type { GiziRsUser } from '@/servers/riwayat-diet.service';
import { createRiwayatDietLog } from '@/servers/riwayat-diet.service';
import type { WaktuMakanType, JenisPerubahanType } from '@/servers/revisi-snapshot.service';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PlusCircle, UserCheck, ShieldCheck, Mail } from 'lucide-react';

interface LogDietChangeModalProps {
  isOpen: boolean;
  giziRsUsers: GiziRsUser[];
  onClose: () => void;
  onSuccess: () => void;
}

export function LogDietChangeModal({
  isOpen,
  giziRsUsers,
  onClose,
  onSuccess,
}: LogDietChangeModalProps) {
  // Form State
  const [selectedStaffEmail, setSelectedStaffEmail] = useState<string>(
    giziRsUsers[0]?.email || 'rizky.gizi@rs-sehat.id'
  );
  const [namaPasien, setNamaPasien] = useState('');
  const [noRm, setNoRm] = useState('');
  const [ruangan, setRuangan] = useState('Melati 1');
  const [bed, setBed] = useState('Bed 01');
  const [kelas, setKelas] = useState('Kelas 1');
  const [waktuMakan, setWaktuMakan] = useState<WaktuMakanType>('PAGI');
  const [jenisPerubahan, setJenisPerubahan] = useState<JenisPerubahanType>('DIET_CHANGE');
  const [dietLama, setDietLama] = useState('Diet Biasa');
  const [dietBaru, setDietBaru] = useState('');
  const [alasan, setAlasan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeStaff = giziRsUsers.find((u) => u.email === selectedStaffEmail) || giziRsUsers[0] || {
    name: 'Ahmad Rizky, S.Gz',
    email: 'rizky.gizi@rs-sehat.id',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!namaPasien.trim() || !dietBaru.trim() || !alasan.trim()) {
      toast.error('Mohon lengkapi Nama Pasien, Diet Baru, dan Alasan Klinis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createRiwayatDietLog({
        pasien_id: Math.floor(Math.random() * 100) + 1,
        waktu_makan: waktuMakan,
        jenis_perubahan: jenisPerubahan,
        data_lama: { diet: dietLama, ruangan, bed, kelas },
        data_baru: { diet: dietBaru, ruangan, bed, kelas },
        alasan: alasan.trim(),
        gizi_rs_name: activeStaff.name,
        gizi_rs_email: activeStaff.email,
      });

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
        // Reset form
        setNamaPasien('');
        setNoRm('');
        setDietBaru('');
        setAlasan('');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal mencatat riwayat perubahan diet.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border-border/80'>
        <form onSubmit={handleSubmit}>
          <DialogHeader className='space-y-1.5 border-b border-border/60 pb-4'>
            <div className='flex items-center gap-2 text-primary font-semibold text-xs'>
              <ShieldCheck className='w-4 h-4' /> Input Riwayat Gizi-RS
            </div>
            <DialogTitle className='text-lg font-bold text-foreground flex items-center gap-2'>
              <PlusCircle className='w-5 h-5 text-primary' />
              Catat Perubahan Diet Pasien Baru
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Formulir pencatatan instruksi perubahan diet oleh Staf Ahli Gizi RS terdaftar.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4 text-xs sm:text-sm'>
            {/* 1. Staf Gizi-RS Selection (With Registered Name & Email) */}
            <div className='space-y-2 bg-primary/5 p-3.5 rounded-xl border border-primary/20'>
              <Label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                <UserCheck className='w-3.5 h-3.5 text-primary' /> Staf Gizi-RS Pencatat (Nama & Email Terdaftar)
              </Label>
              <Select
                value={selectedStaffEmail}
                onValueChange={(val) => setSelectedStaffEmail(val || giziRsUsers[0]?.email || 'rizky.gizi@rs-sehat.id')}
              >
                <SelectTrigger className='h-11 bg-background text-xs font-medium border-border/80'>
                  <SelectValue placeholder='Pilih Staf Gizi-RS' />
                </SelectTrigger>
                <SelectContent className='max-h-56'>
                  {giziRsUsers.map((usr) => (
                    <SelectItem key={usr.id} value={usr.email} className='text-xs py-2'>
                      <div className='flex flex-col'>
                        <span className='font-bold text-foreground'>{usr.name}</span>
                        <span className='text-[11px] text-muted-foreground font-mono'>{usr.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className='flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-1'>
                <span className='flex items-center gap-1'>
                  <Mail className='w-3 h-3 text-primary' /> {activeStaff.email}
                </span>
                <span className='font-semibold text-primary'>Role: gizi-rs</span>
              </div>
            </div>

            {/* 2. Patient Info */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Nama Pasien *</Label>
                <Input
                  placeholder='Contoh: Budi Santoso'
                  value={namaPasien}
                  onChange={(e) => setNamaPasien(e.target.value)}
                  className='h-9 text-xs'
                  required
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>No. Rekam Medis (RM)</Label>
                <Input
                  placeholder='Contoh: RM-2026-099'
                  value={noRm}
                  onChange={(e) => setNoRm(e.target.value)}
                  className='h-9 text-xs font-mono'
                />
              </div>
            </div>

            {/* 3. Location info */}
            <div className='grid grid-cols-3 gap-2.5'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Ruangan</Label>
                <Input
                  value={ruangan}
                  onChange={(e) => setRuangan(e.target.value)}
                  className='h-9 text-xs'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Bed</Label>
                <Input
                  value={bed}
                  onChange={(e) => setBed(e.target.value)}
                  className='h-9 text-xs'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Kelas</Label>
                <Input
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className='h-9 text-xs'
                />
              </div>
            </div>

            {/* 4. Meal time & Change type */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Waktu Makan *</Label>
                <Select
                  value={waktuMakan}
                  onValueChange={(val) => setWaktuMakan((val as WaktuMakanType) || 'PAGI')}
                >
                  <SelectTrigger className='h-9 text-xs'>
                    <SelectValue placeholder='Pilih Waktu Makan' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PAGI' className='text-xs'>Makan Pagi (06:00 - 08:00 WIB)</SelectItem>
                    <SelectItem value='SIANG' className='text-xs'>Makan Siang (11:30 - 13:30 WIB)</SelectItem>
                    <SelectItem value='MALAM' className='text-xs'>Makan Malam (17:00 - 19:00 WIB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Jenis Perubahan *</Label>
                <Select
                  value={jenisPerubahan}
                  onValueChange={(val) => setJenisPerubahan((val as JenisPerubahanType) || 'DIET_CHANGE')}
                >
                  <SelectTrigger className='h-9 text-xs'>
                    <SelectValue placeholder='Jenis Perubahan' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='DIET_CHANGE' className='text-xs'>Perubahan Diet (Modifikasi Komposisi)</SelectItem>
                    <SelectItem value='NEW_PATIENT' className='text-xs'>Pasien Baru (+1 Porsi Emergent)</SelectItem>
                    <SelectItem value='NPO' className='text-xs'>Puasa / NPO (-1 Porsi Tahan Pengiriman)</SelectItem>
                    <SelectItem value='ROOM_TRANSFER' className='text-xs'>Pindah Ruangan / Bed</SelectItem>
                    <SelectItem value='DISCHARGE' className='text-xs'>Pasien Pulang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 5. Diet Before & Diet After */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Diet Sebelum (Lama)</Label>
                <Input
                  placeholder='Contoh: Diet Biasa Nasi Tim'
                  value={dietLama}
                  onChange={(e) => setDietLama(e.target.value)}
                  className='h-9 text-xs'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Diet Baru (Instruksi) *</Label>
                <Input
                  placeholder='Contoh: Diet DM 1700 kcal'
                  value={dietBaru}
                  onChange={(e) => setDietBaru(e.target.value)}
                  className='h-9 text-xs font-semibold text-primary'
                  required
                />
              </div>
            </div>

            {/* 6. Clinical Reason */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Alasan Klinis / Keterangan Dokter DPJP *</Label>
              <textarea
                placeholder='Masukkan alasan medis perubahan diet atau instruksi dokter...'
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={2}
                className='flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                required
              />
            </div>
          </div>

          <DialogFooter className='border-t border-border/60 pt-3 gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              className='text-xs'
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type='submit'
              className='text-xs font-semibold bg-primary text-primary-foreground'
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Riwayat Diet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
