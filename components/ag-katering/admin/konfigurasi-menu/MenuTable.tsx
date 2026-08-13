'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Utensils,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { KategoriMenuItem } from '@/servers/konfigurasi-menu.service';
import {
  toggleKategoriMenuItemStatus,
  deleteKategoriMenuItem,
} from '@/servers/konfigurasi-menu.service';
import { toast } from 'sonner';

interface MenuTableProps {
  items: KategoriMenuItem[];
  onEdit: (item: KategoriMenuItem) => void;
  onRefresh: () => void;
}

const CATEGORY_BADGE_STYLE: Record<string, string> = {
  KARBO:
    'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
  HEWANI:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300',
  NABATI:
    'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300',
  SAYUR:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300',
  BUAH:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
  SNACK:
    'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
  DIIT:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
  BENTUK_MAKANAN:
    'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300',
  EXTRA:
    'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
};

export default function MenuTable({
  items,
  onEdit,
  onRefresh,
}: MenuTableProps) {
  const [itemToDelete, setItemToDelete] = useState<KategoriMenuItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleToggleStatus(item: KategoriMenuItem) {
    try {
      const res = await toggleKategoriMenuItemStatus(
        item.id,
        item.is_active,
      );
      if (res.success) {
        toast.success(res.message);
        onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui status item.');
    }
  }

  async function handleDeleteConfirm() {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteKategoriMenuItem(itemToDelete.id);
      if (res.success) {
        toast.success(res.message);
        onRefresh();
        setItemToDelete(null);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus item.');
    } finally {
      setIsDeleting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className='p-12 text-center border rounded-xl bg-card text-muted-foreground space-y-3'>
        <Utensils className='w-10 h-10 text-muted-foreground/50 mx-auto' />
        <h4 className='font-semibold text-foreground text-sm'>
          Tidak ada item menu ditemukan
        </h4>
        <p className='text-xs text-muted-foreground max-w-sm mx-auto'>
          Coba ubah kata kunci pencarian atau ganti filter kategori di bagian atas.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='border rounded-xl bg-card overflow-hidden shadow-xs'>
        <Table>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              <TableHead className='w-12 text-center text-xs font-semibold'>
                No.
              </TableHead>
              <TableHead className='text-xs font-semibold'>Kategori</TableHead>
              <TableHead className='text-xs font-semibold'>Kode Item</TableHead>
              <TableHead className='text-xs font-semibold'>
                Nama / Label Item
              </TableHead>
              <TableHead className='text-center text-xs font-semibold'>
                Urutan
              </TableHead>
              <TableHead className='text-center text-xs font-semibold'>
                Status
              </TableHead>
              <TableHead className='text-right text-xs font-semibold pr-6'>
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const badgeStyle =
                CATEGORY_BADGE_STYLE[item.nama_kategori] ||
                'bg-gray-100 text-gray-800 border-gray-300';

              return (
                <TableRow key={item.id} className='hover:bg-muted/30'>
                  <TableCell className='text-center text-xs text-muted-foreground font-mono'>
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={`text-[11px] font-bold px-2.5 py-0.5 ${badgeStyle}`}
                    >
                      {item.nama_kategori}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className='font-mono text-xs font-bold text-foreground bg-muted/60 px-2 py-1 rounded-md border border-border'>
                      {item.kode_item}
                    </span>
                  </TableCell>
                  <TableCell className='text-xs font-semibold text-foreground'>
                    {item.label_item}
                  </TableCell>
                  <TableCell className='text-center text-xs font-mono text-muted-foreground'>
                    {item.urutan}
                  </TableCell>
                  <TableCell className='text-center'>
                    <button
                      type='button'
                      onClick={() => handleToggleStatus(item)}
                      className='inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-all hover:opacity-80'
                    >
                      {item.is_active ? (
                        <span className='inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full'>
                          <CheckCircle2 className='w-3 h-3 text-emerald-600' />{' '}
                          Aktif
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full'>
                          <XCircle className='w-3 h-3 text-rose-600' /> Non-Aktif
                        </span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className='text-right pr-4'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        onClick={() => onEdit(item)}
                        className='h-8 w-8 text-muted-foreground hover:text-foreground'
                        title='Edit Item Menu'
                      >
                        <Edit2 className='w-3.5 h-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        onClick={() => setItemToDelete(item)}
                        className='h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10'
                        title='Hapus Item Menu'
                      >
                        <Trash2 className='w-3.5 h-3.5' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <DialogContent className='sm:max-w-md p-6'>
          <DialogHeader className='gap-2'>
            <div className='p-3 rounded-full bg-rose-500/10 text-rose-600 w-fit'>
              <AlertTriangle className='w-6 h-6' />
            </div>
            <DialogTitle className='text-base font-bold'>
              Hapus Item Menu?
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Apakah Anda yakin ingin menghapus item menu{' '}
              <strong className='text-foreground'>
                &quot;{itemToDelete?.label_item}&quot; ({itemToDelete?.kode_item})
              </strong>
              ? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 pt-2 border-t'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setItemToDelete(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
