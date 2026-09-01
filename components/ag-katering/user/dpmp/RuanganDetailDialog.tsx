'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Printer,
  DoorOpen,
  Search,
  CheckSquare,
  Square,
  Users,
  Utensils,
  Ban,
  AlertCircle,
} from 'lucide-react';
import type { DpmpPatientItem, DpmpSummaryData } from '@/types/dpmptypes';

interface RuanganDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruanganName: string | null;
  patients: DpmpPatientItem[];
  summaryData: DpmpSummaryData;
  onPrintPatients: (
    patientsToPrint: DpmpPatientItem[],
    ruanganTitle: string,
  ) => void;
}

const KELAS_BADGE_STYLE: Record<string, string> = {
  VIP: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-bold',
  'KELAS 1':
    'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-semibold',
  'KELAS I':
    'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-semibold',
  'KELAS 2':
    'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 font-semibold',
  'KELAS II':
    'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 font-semibold',
  'KELAS 2 - 3':
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold',
  'KELAS 2-3':
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold',
  'KELAS 3':
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold',
  'KELAS III':
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold',
};

function PatientStatusBadge({ status }: { status: string }) {
  const upper = status.toUpperCase();
  if (upper === 'NPO') {
    return (
      <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'>
        NPO (Puasa)
      </span>
    );
  }
  if (upper === 'EMERGENT') {
    return (
      <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 animate-pulse'>
        Emergent / Cito
      </span>
    );
  }
  return (
    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'>
      Aktif
    </span>
  );
}

export default function RuanganDetailDialog({
  open,
  onOpenChange,
  ruanganName,
  patients,
  summaryData,
  onPrintPatients,
}: RuanganDetailDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(patients.map((p) => p.id)),
  );

  // Sync selectedIds when patients list changes or modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedIds(new Set(patients.map((p) => p.id)));
      setSearchQuery('');
    }
  }, [open, patients]);

  // Derived Room Stats
  const roomStats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter((p) => p.status === 'AKTIF').length;
    const npo = patients.filter((p) => p.status === 'NPO').length;
    const cito = patients.filter(
      (p) => p.is_emergent || p.status === 'EMERGENT',
    ).length;
    const distinctKelas =
      Array.from(new Set(patients.map((p) => p.kelas).filter(Boolean))).join(
        ', ',
      ) || '-';

    return { total, active, npo, cito, distinctKelas };
  }, [patients]);

  // Filtered patients by local search
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.nama_pasien.toLowerCase().includes(q) ||
        p.no_rm.toLowerCase().includes(q) ||
        p.kamar?.toLowerCase().includes(q) ||
        p.bed?.toLowerCase().includes(q) ||
        p.diet?.toLowerCase().includes(q),
    );
  }, [patients, searchQuery]);

  const isAllSelected =
    filteredPatients.length > 0 &&
    filteredPatients.every((p) => selectedIds.has(p.id));

  function handleToggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleToggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredPatients.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredPatients.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }

  function handlePrintAction() {
    const selectedPatients = patients.filter((p) => selectedIds.has(p.id));
    if (selectedPatients.length === 0) return;
    onPrintPatients(selectedPatients, ruanganName || 'Ruangan');
  }

  const selectedCount = patients.filter((p) => selectedIds.has(p.id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl w-[92vw] min-w-[70vw] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl'>
        {/* Modal Header */}
        <DialogHeader className='p-5 border-b bg-muted/30'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div className='w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-500/20'>
                <DoorOpen className='w-6 h-6' />
              </div>
              <div className='space-y-1 text-left'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <DialogTitle className='text-lg sm:text-xl font-extrabold text-foreground tracking-tight'>
                    {ruanganName || 'Ruangan'}
                  </DialogTitle>
                  <Badge
                    variant='outline'
                    className='text-xs px-2.5 py-0.5 font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
                  >
                    {roomStats.total} Pasien
                  </Badge>
                  <span className='text-xs text-muted-foreground font-medium'>
                    Kelas: <strong>{roomStats.distinctKelas}</strong>
                  </span>
                </div>
                <DialogDescription className='text-xs text-muted-foreground'>
                  {summaryData.tanggalFormatted} · Makan{' '}
                  {summaryData.waktuMakanFormatted} (
                  {summaryData.batch?.batch_code || 'Batch Snapshot'})
                </DialogDescription>
              </div>
            </div>

            {/* Quick Status Chips */}
            <div className='flex items-center gap-2 flex-wrap text-xs'>
              <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20'>
                <Utensils className='w-3.5 h-3.5' /> {roomStats.active} Makan
              </span>
              {roomStats.npo > 0 && (
                <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20'>
                  <Ban className='w-3.5 h-3.5' /> {roomStats.npo} Puasa
                </span>
              )}
              {roomStats.cito > 0 && (
                <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/20 animate-pulse'>
                  <AlertCircle className='w-3.5 h-3.5' /> {roomStats.cito} Cito
                </span>
              )}
            </div>
          </div>

          {/* Search Bar inside Modal */}
          <div className='pt-3 flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search className='w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
              <Input
                type='text'
                placeholder='Cari nama pasien, No RM, nomor bed...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8.5 h-8.5 text-xs rounded-xl bg-background border-muted-foreground/20'
              />
            </div>
          </div>
        </DialogHeader>

        {/* Patients Table Area */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-5'>
          <div className='rounded-xl border border-border bg-card shadow-2xs overflow-hidden'>
            <Table>
              <TableHeader className='bg-muted/40'>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='w-[44px] text-center px-2'>
                    <button
                      type='button'
                      onClick={handleToggleSelectAll}
                      className='p-1 rounded hover:bg-muted text-foreground transition-colors cursor-pointer'
                      title={
                        isAllSelected ? 'Batalkan semua pilihan' : 'Pilih semua'
                      }
                    >
                      {isAllSelected ? (
                        <CheckSquare className='w-4 h-4 text-primary' />
                      ) : (
                        <Square className='w-4 h-4 text-muted-foreground' />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className='w-[45px] text-center text-xs font-semibold'>
                    No
                  </TableHead>
                  <TableHead className='text-xs font-semibold min-w-[150px]'>
                    Nama Pasien
                  </TableHead>
                  <TableHead className='text-xs font-semibold min-w-[90px] text-center'>
                    No RM
                  </TableHead>
                  <TableHead className='text-xs font-semibold min-w-[80px] text-center'>
                    Kamar
                  </TableHead>
                  <TableHead className='text-xs font-semibold min-w-[80px] text-center'>
                    Nomor Bed
                  </TableHead>
                  <TableHead className='text-xs font-semibold min-w-[140px]'>
                    Diet
                  </TableHead>
                  <TableHead className='text-xs font-semibold min-w-[85px] text-center'>
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p, idx) => {
                    const isSelected = selectedIds.has(p.id);

                    return (
                      <TableRow
                        key={p.id}
                        onClick={() => handleToggleSelect(p.id)}
                        className={`transition-colors cursor-pointer hover:bg-muted/40 ${
                          isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <TableCell className='text-center px-2 py-3'>
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(p.id);
                            }}
                            className='p-1 rounded hover:bg-muted text-foreground transition-colors cursor-pointer'
                          >
                            {isSelected ? (
                              <CheckSquare className='w-4 h-4 text-primary' />
                            ) : (
                              <Square className='w-4 h-4 text-muted-foreground' />
                            )}
                          </button>
                        </TableCell>

                        {/* No */}
                        <TableCell className='text-center text-xs text-muted-foreground font-mono'>
                          {idx + 1}
                        </TableCell>

                        {/* Nama Pasien */}
                        <TableCell className='font-semibold text-xs text-foreground'>
                          <div className='flex items-center gap-1.5'>
                            <span>{p.nama_pasien}</span>
                            {p.is_emergent && (
                              <span className='inline-flex items-center text-[9px] font-bold px-1 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20'>
                                CITO
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* No RM */}
                        <TableCell className='font-mono text-xs text-center text-muted-foreground'>
                          {p.no_rm}
                        </TableCell>

                        {/* Kamar */}
                        <TableCell className='text-xs text-center font-medium'>
                          {p.kamar || '—'}
                        </TableCell>

                        {/* Nomor Bed */}
                        <TableCell className='text-xs text-center font-mono font-medium'>
                          <span className='px-1.5 py-0.5 rounded bg-muted/60'>
                            {p.bed}
                          </span>
                        </TableCell>

                        {/* Diet */}
                        <TableCell className='text-xs text-foreground'>
                          <div className='font-medium'>{p.diet}</div>
                          {(p.extra || p.buah || p.snack) && (
                            <div className='flex flex-wrap gap-1 pt-0.5'>
                              {p.extra && (
                                <span className='text-[9px] px-1 py-0.2 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 font-mono'>
                                  +{p.extra}
                                </span>
                              )}
                              {p.buah && (
                                <span className='text-[9px] px-1 py-0.2 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-mono'>
                                  🍊 {p.buah}
                                </span>
                              )}
                              {p.snack && (
                                <span className='text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono'>
                                  🍪 {p.snack}
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className='text-center'>
                          <PatientStatusBadge status={p.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className='text-center py-8 text-muted-foreground text-xs'
                    >
                      Tidak ada pasien yang cocok dengan pencarian di ruangan
                      ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className='pb-8 pr-8 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <div className='text-xs text-muted-foreground'>
            Terpilih:{' '}
            <strong className='text-foreground'>{selectedCount}</strong> dari{' '}
            <strong>{patients.length}</strong> pasien
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='cursor-pointer text-xs rounded-xl'
            >
              Tutup
            </Button>
            <Button
              onClick={handlePrintAction}
              disabled={selectedCount === 0}
              className='gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer text-xs shadow-xs font-bold rounded-xl'
            >
              <Printer className='w-4 h-4' />
              Cetak DPMP {ruanganName} ({selectedCount} Pasien)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
