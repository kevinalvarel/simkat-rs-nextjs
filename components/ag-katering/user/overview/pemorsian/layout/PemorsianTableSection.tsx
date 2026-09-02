'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, CheckSquare, Square, UtensilsCrossed } from 'lucide-react';
import type { PemorsianPatientItem } from '@/types/pemorsiantypes';
import PemorsianStatusBadge from '@/components/ag-katering/user/overview/pemorsian/ui/PemorsianStatusBadge';

interface PemorsianTableSectionProps {
  patients: PemorsianPatientItem[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onPrintSingle: (patient: PemorsianPatientItem) => void;
  onPrintBatch: () => void;
  isAllSelected: boolean;
}

export default function PemorsianTableSection({
  patients,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onPrintSingle,
  onPrintBatch,
  isAllSelected,
}: PemorsianTableSectionProps) {
  const selectedCount = selectedIds.size;
  const isAllFilteredSelected =
    patients.length > 0 && selectedCount === patients.length;

  return (
    <div className='space-y-3'>
      {/* Batch Action Toolbar when items are selected */}
      {selectedCount > 0 && (
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200'>
          <div className='flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium'>
            <span>
              <strong>{selectedCount}</strong> dari {patients.length} pasien
              terpilih
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              onClick={onPrintBatch}
              className='gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold'
            >
              <Printer className='w-3.5 h-3.5' />
              {isAllFilteredSelected
                ? 'Cetak Semua Etiket'
                : `Cetak ${selectedCount} Etiket Terpilih`}
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className='rounded-xl border border-border bg-card shadow-2xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow className='hover:bg-transparent'>
                {/* Select All Checkbox */}
                <TableHead className='w-[44px] text-center px-2'>
                  <button
                    onClick={onToggleSelectAll}
                    className='p-1 rounded hover:bg-muted text-foreground transition-colors'
                    title={
                      isAllSelected
                        ? 'Batalkan semua pilihan'
                        : 'Pilih semua baris'
                    }
                  >
                    {isAllSelected ? (
                      <CheckSquare className='w-4 h-4 text-primary' />
                    ) : (
                      <Square className='w-4 h-4 text-muted-foreground' />
                    )}
                  </button>
                </TableHead>

                <TableHead className='w-[50px] text-xs font-bold text-foreground'>
                  No
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[160px]'>
                  Nama Pasien
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[110px]'>
                  No RM
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[120px]'>
                  Ruangan & Bed
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[100px]'>
                  Gedung
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[150px]'>
                  Diet
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[90px]'>
                  Waktu
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[100px]'>
                  Status
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground text-center min-w-[100px]'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className='h-48 text-center text-muted-foreground'
                  >
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <UtensilsCrossed className='w-8 h-8 text-muted-foreground/40' />
                      <p className='text-sm font-medium'>
                        Tidak ada data pasien yang sesuai kriteria filter.
                      </p>
                      <p className='text-xs text-muted-foreground/70'>
                        Coba ubah kata kunci pencarian atau reset filter.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient, index) => {
                  const isSelected = selectedIds.has(patient.id);

                  return (
                    <TableRow
                      key={patient.id}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary/5 hover:bg-primary/10'
                          : 'hover:bg-muted/40'
                      }`}
                      onClick={() => onToggleSelect(patient.id)}
                    >
                      {/* Checkbox */}
                      <TableCell
                        className='text-center px-2'
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect(patient.id);
                        }}
                      >
                        <button
                          className='p-1 rounded text-foreground'
                          title={isSelected ? 'Batal pilih' : 'Pilih baris ini'}
                        >
                          {isSelected ? (
                            <CheckSquare className='w-4 h-4 text-primary' />
                          ) : (
                            <Square className='w-4 h-4 text-muted-foreground' />
                          )}
                        </button>
                      </TableCell>

                      {/* No */}
                      <TableCell className='text-xs font-medium text-muted-foreground'>
                        {index + 1}
                      </TableCell>

                      {/* Nama Pasien */}
                      <TableCell className='font-medium text-xs sm:text-sm text-foreground'>
                        <div className='flex flex-col'>
                          <span className='font-semibold'>
                            {patient.nama_pasien}
                          </span>
                          <span className='text-[10px] text-muted-foreground'>
                            {patient.kelas}
                          </span>
                        </div>
                      </TableCell>

                      {/* No RM */}
                      <TableCell className='font-mono text-xs font-semibold text-foreground/90'>
                        {patient.no_rm}
                      </TableCell>

                      {/* Ruangan & Bed */}
                      <TableCell className='text-xs text-foreground'>
                        <div className='font-medium'>
                          {patient.ruangan}
                          {patient.bed && (
                            <span className='ml-1 text-muted-foreground font-mono text-[11px]'>
                              (Bed {patient.bed})
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Gedung */}
                      <TableCell className='text-xs text-muted-foreground'>
                        {patient.gedung}
                      </TableCell>

                      {/* Diet */}
                      <TableCell className='text-xs font-medium text-foreground'>
                        <span className='inline-block px-2 py-0.5 rounded bg-muted text-foreground font-medium'>
                          {patient.diet}
                        </span>
                      </TableCell>

                      {/* Waktu */}
                      <TableCell className='text-xs font-semibold text-primary'>
                        {patient.waktu}
                      </TableCell>

                      {/* Status */}
                      <TableCell className='text-xs'>
                        <PemorsianStatusBadge
                          status={patient.status}
                          isEmergent={patient.is_emergent}
                        />
                      </TableCell>

                      {/* Aksi: Button Cetak */}
                      <TableCell
                        className='text-center'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => onPrintSingle(patient)}
                          className='h-8 px-2.5 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-2xs'
                          title='Cetak Etiket Pasien'
                        >
                          <Printer className='w-3.5 h-3.5' />
                          <span>Cetak</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer Count */}
        <div className='px-4 py-2.5 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2'>
          <span>
            Menampilkan <strong>{patients.length}</strong> pasien
          </span>
          <div className='flex items-center gap-3'>
            <span>
              Terpilih:{' '}
              <strong className='text-foreground'>{selectedCount}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
