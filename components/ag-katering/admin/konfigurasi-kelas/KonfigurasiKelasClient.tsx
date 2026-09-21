'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BedDouble, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { KelasItem } from '@/servers/kelas.service';
import {
  createKelas,
  deleteKelas,
  getKelasList,
  updateKelas,
} from '@/servers/kelas.service';
import { getKelasBadgeStyle } from '@/lib/kelas-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  initialKelasList: KelasItem[];
}

export default function KonfigurasiKelasClient({ initialKelasList }: Props) {
  const router = useRouter();
  const [kelasList, setKelasList] = useState<KelasItem[]>(initialKelasList);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<KelasItem | null>(null);
  const [namaInput, setNamaInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<KelasItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const orderedNames = useMemo(() => kelasList.map((k) => k.namaKelas), [kelasList]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return kelasList;
    return kelasList.filter((k) => k.namaKelas.toUpperCase().includes(q));
  }, [kelasList, search]);

  function openAdd() {
    setEditing(null);
    setNamaInput('');
    setIsDialogOpen(true);
  }

  function openEdit(item: KelasItem) {
    setEditing(item);
    setNamaInput(item.namaKelas);
    setIsDialogOpen(true);
  }

  /** Ambil ulang daftar dari server agar id & urutan selalu sinkron dengan DB */
  async function refreshList() {
    try {
      const fresh = await getKelasList();
      setKelasList(fresh);
    } catch {
      // Biarkan state lama bila refetch gagal; toast sukses/gagal sudah tampil
    }
    router.refresh();
  }

  async function handleSave() {
    const nama = namaInput.trim();
    if (!nama) {
      toast.error('Nama kelas wajib diisi. Contoh: KELAS I');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = editing
        ? await updateKelas(editing.id, nama)
        : await createKelas(nama);
      if (res.success) {
        toast.success(res.message);
        setIsDialogOpen(false);
        setEditing(null);
        await refreshList();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menyimpan kelas.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      const res = await deleteKelas(deleting.id);
      if (res.success) {
        toast.success(res.message);
        setDeleting(null);
        await refreshList();
      } else if (res.code === 'KELAS_IN_USE') {
        toast.error(res.message, {
          description: 'Kelas masih digunakan oleh sistem',
        });
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menghapus kelas.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full min-w-0'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 rounded-2xl border bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent'>
        <div className='space-y-1'>
          <h1 className='text-lg sm:text-xl font-bold flex items-center gap-2'>
            <BedDouble className='w-5 h-5 text-primary' />
            Konfigurasi Kelas Perawatan
            <Badge variant='outline' className='text-[10px] font-mono'>
              {kelasList.length} Kelas
            </Badge>
          </h1>
          <p className='text-xs text-muted-foreground max-w-xl'>
            Standar kanonis: <strong>KELAS I, KELAS II, KELAS III</strong>. Semua
            dropdown ruangan, kamar, pasien, dan siklus-menu mengambil dari daftar
            ini. 
          </p>
        </div>
        <Button onClick={openAdd} className='gap-2 cursor-pointer shrink-0'>
          <Plus className='w-4 h-4' /> Tambah Kelas
        </Button>
      </div>

      <div className='relative max-w-md'>
        <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Cari kelas... (cth: KELAS I)'
          className='pl-9 h-9 text-xs'
        />
      </div>

      {filtered.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center space-y-3'>
            <div className='p-4 bg-muted rounded-full'>
              <BedDouble className='w-8 h-8 text-muted-foreground' />
            </div>
            <div className='space-y-1'>
              <h3 className='font-bold text-base'>Belum Ada Kelas</h3>
              <p className='text-xs text-muted-foreground max-w-xs'>
                {search
                  ? `Tidak ada kelas yang cocok dengan "${search}".`
                  : 'Tambahkan KELAS I, KELAS II, dan KELAS III sebagai standar.'}
              </p>
            </div>
            <Button onClick={openAdd} className='gap-2 mt-2 cursor-pointer'>
              <Plus className='w-4 h-4' /> Tambah Kelas Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='rounded-xl border bg-card/60 divide-y'>
          {filtered.map((k, idx) => (
            <div
              key={k.id}
              className='flex items-center justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors'
            >
              <div className='flex items-center gap-3 min-w-0'>
                <span className='text-[11px] font-mono text-muted-foreground w-7'>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getKelasBadgeStyle(k.namaKelas, orderedNames)}`}
                >
                  {k.namaKelas}
                </span>
              </div>
              <div className='flex items-center gap-1.5 shrink-0'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => openEdit(k)}
                  className='h-8 px-2.5 text-xs cursor-pointer'
                >
                  <Pencil className='w-3.5 h-3.5 mr-1' /> Ubah
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setDeleting(k)}
                  className='h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer'
                >
                  <Trash2 className='w-3.5 h-3.5 mr-1' /> Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className='text-[11px] text-muted-foreground'>
        * Mengubah nama akan dipropagasi ke ruangan, kamar, pasien, dan siklus-menu
        yang memakai nama tersebut. Menghapus kelas yang masih dipakai akan ditolak
        sistem.
      </p>

      <Dialog open={isDialogOpen} onOpenChange={(o) => !o && setIsDialogOpen(false)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Ubah Kelas' : 'Tambah Kelas'}</DialogTitle>
            <DialogDescription className='text-xs'>
              Gunakan format kanonis uppercase, contoh: KELAS I, KELAS II, KELAS III.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-1.5 py-2'>
            <label className='text-xs font-semibold'>Nama Kelas</label>
            <Input
              value={namaInput}
              onChange={(e) => setNamaInput(e.target.value.toUpperCase())}
              placeholder='cth: KELAS I'
              className='text-sm font-semibold'
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
              className='cursor-pointer'
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting} className='cursor-pointer min-w-[120px]'>
              {isSubmitting ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Hapus Kelas?</DialogTitle>
            <DialogDescription className='text-xs'>
              Kelas <strong>{deleting?.namaKelas}</strong> akan dihapus permanen jika
              tidak dipakai di ruangan, kamar, pasien, atau siklus-menu.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeleting(null)}
              disabled={isDeleting}
              className='cursor-pointer'
            >
              Batal
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={isDeleting}
              className='cursor-pointer min-w-[120px]'
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
