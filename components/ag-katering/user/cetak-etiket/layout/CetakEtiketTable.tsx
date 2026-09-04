'use client';

import React from 'react';
import { Printer, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PasienStatusBadge from '../ui/PasienStatusBadge';
import { isNpoPatient } from '@/lib/npo-utils';
import type { PemorsianPatientItem } from '@/types/cetaketikettypes';

interface CetakEtiketTableProps {
  patients: PemorsianPatientItem[];
  selectedIds: Set<number>;
  printedPatientIds: Set<number>;
  waktuMakan?: string;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onPrintSingle: (patient: PemorsianPatientItem) => void;
  onPrintSelected: () => void;
}

export default function CetakEtiketTable({
  patients,
  selectedIds,
  printedPatientIds,
  waktuMakan,
  onToggleSelect,
  onToggleSelectAll,
  onPrintSingle,
  onPrintSelected,
}: CetakEtiketTableProps) {
  const feedingPatients = patients.filter(
    (p) => !isNpoPatient(p) && p.status !== 'NPO',
  );
  const isAllSelected =
    feedingPatients.length > 0 &&
    feedingPatients.every((p) => selectedIds.has(p.id));

  return (
    <div className='border rounded-2xl bg-card overflow-hidden shadow-2xs'>
      <Table>
        <TableHeader className='bg-muted/30'>
          <TableRow className='hover:bg-transparent border-b'>
            <TableHead className='w-[40px] pl-4'>
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label='Pilih semua'
              />
            </TableHead>
            <TableHead className='w-[45px] text-xs font-bold text-foreground'>
              No
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              Nama Pasien
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              No RM
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              Ruangan & Bed
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              Gedung
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              Diet
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              Waktu
            </TableHead>
            <TableHead className='text-xs font-bold text-foreground'>
              Status
            </TableHead>
            <TableHead className='text-right pr-4 text-xs font-bold text-foreground'>
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className='h-32 text-center text-xs text-muted-foreground'
              >
                Tidak ada data pasien yang cocok dengan filter.
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient, index) => {
              const isNpo = isNpoPatient(patient) || patient.status === 'NPO';
              const isSelected = selectedIds.has(patient.id) && !isNpo;
              const isPrinted = printedPatientIds.has(patient.id);

              return (
                <TableRow
                  key={patient.id}
                  data-state={isSelected ? 'selected' : undefined}
                  className={`transition-colors text-xs ${
                    isNpo
                      ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.07] border-l-4 border-l-amber-500/80 opacity-75 cursor-not-allowed hover:bg-amber-500/[0.06]'
                      : isSelected
                      ? 'bg-emerald-50/40 hover:bg-muted/40'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  {/* Checkbox */}
                  <TableCell className='pl-4'>
                    {isNpo ? (
                      <Checkbox
                        checked={false}
                        disabled
                        className='opacity-30 cursor-not-allowed'
                        aria-label='Pasien Puasa (NPO)'
                      />
                    ) : (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect(patient.id)}
                        aria-label={`Pilih ${patient.nama_pasien}`}
                      />
                    )}
                  </TableCell>

                  {/* No */}
                  <TableCell className='font-mono font-medium text-muted-foreground'>
                    {index + 1}
                  </TableCell>

                  {/* Nama Pasien & Kelas */}
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='font-bold text-foreground text-xs'>
                        {patient.nama_pasien}
                      </span>
                      <span className='text-[11px] text-muted-foreground'>
                        {patient.kelas || 'Kelas Umum'}
                      </span>
                    </div>
                  </TableCell>

                  {/* No RM */}
                  <TableCell className='font-mono font-semibold text-foreground/90'>
                    {patient.no_rm || '-'}
                  </TableCell>

                  {/* Ruangan & Bed */}
                  <TableCell className='text-foreground'>
                    {patient.ruangan || '-'}{' '}
                    {patient.bed ? `(${patient.bed})` : ''}
                  </TableCell>

                  {/* Gedung */}
                  <TableCell className='text-muted-foreground'>
                    {patient.gedung || '-'}
                  </TableCell>

                  {/* Diet */}
                  <TableCell>
                    <Badge
                      variant='secondary'
                      className='bg-muted text-foreground font-mono font-bold text-[11px] px-2 py-0.5 rounded-md'
                    >
                      {patient.diet || 'STANDAR'}
                    </Badge>
                  </TableCell>

                  {/* Waktu */}
                  <TableCell>
                    <span className='font-semibold text-emerald-600 capitalize'>
                      {patient.waktu
                        ? patient.waktu.toLowerCase()
                        : (waktuMakan || 'siang').toLowerCase()}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <div className='flex flex-col gap-1 items-start'>
                      <PasienStatusBadge status={patient.status} />
                      {isNpo ? (
                        <span className='inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/40 px-1.5 py-0.5 rounded'>
                          Puasa (NPO)
                        </span>
                      ) : isPrinted ? (
                        <span className='inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded'>
                          <CheckCircle2 className='w-2.5 h-2.5 text-emerald-600 shrink-0' />
                          Sudah Cetak
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded'>
                          <Clock className='w-2.5 h-2.5 text-amber-600 shrink-0' />
                          Belum Cetak
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Aksi Cetak */}
                  <TableCell className='text-right pr-4'>
                    {isNpo ? (
                      <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'>
                        Puasa (NPO)
                      </span>
                    ) : (
                      <Button
                        variant={isPrinted ? 'outline' : 'default'}
                        size='xs'
                        onClick={() => onPrintSingle(patient)}
                        className={`h-7 px-2.5 text-xs font-semibold gap-1.5 rounded-lg shadow-2xs ${
                          isPrinted
                            ? 'border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        <Printer className='w-3.5 h-3.5' />
                        {isPrinted ? 'Cetak Ulang' : 'Cetak'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Table Footer */}
      <div className='p-3 bg-muted/20 border-t flex items-center justify-between text-xs text-muted-foreground font-medium flex-wrap gap-2'>
        <span>
          Menampilkan {feedingPatients.length} pasien makan aktif
          {patients.length > feedingPatients.length
            ? ` (+${patients.length - feedingPatients.length} pasien puasa/NPO)`
            : ''}
        </span>

        <div className='flex items-center gap-3'>
          <span>Terpilih: {selectedIds.size}</span>
          {selectedIds.size > 0 && (
            <Button
              size='sm'
              onClick={onPrintSelected}
              className='h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs gap-1.5'
            >
              <Printer className='w-3.5 h-3.5' />
              Cetak Terpilih ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
