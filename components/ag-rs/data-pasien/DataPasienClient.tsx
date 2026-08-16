'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, DoorOpen, Edit3 } from 'lucide-react';

import type { Patient } from '@/servers/patient.service';
import type { DataPasienClientProps } from '@/types/data-pasien';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import PatientToolbar from './ui/PatientToolbar';
import PatientTable from './PatientTable';
import PatientFormDialog from './ui/PatientFormDialog';
import DeletePatientDialog from './ui/DeletePatientDialog';

export default function DataPasienClient({
  patients,
  ruangan,
  gedung,
  kelasList = [],
  gedungList = [],
}: DataPasienClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isRevisiMode = searchParams.get('isRevisi') === 'true';
  const revisiMeal = searchParams.get('revisiMeal') || 'Batch Sebelumnya';
  const waktuMakanParam = searchParams.get('waktuMakan');
  const waktuMakan: 'PAGI' | 'SIANG' | 'MALAM' =
    (waktuMakanParam as 'PAGI' | 'SIANG' | 'MALAM') ||
    (revisiMeal.toUpperCase().includes('SIANG')
      ? 'SIANG'
      : revisiMeal.toUpperCase().includes('MALAM')
        ? 'MALAM'
        : 'PAGI');
  const batchIdParam = searchParams.get('batchId');
  const batchId = batchIdParam ? parseInt(batchIdParam, 10) : null;

  const revisionContext = useMemo(
    () => ({
      isRevisiMode,
      waktuMakan,
      batchId,
      requestedBy: 'Ahli Gizi RS',
    }),
    [isRevisiMode, waktuMakan, batchId],
  );

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [initialBed, setInitialBed] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Find room details (e.g. jumlahBed count) from database gedungList
  const targetRuangan = useMemo(() => {
    if (!gedungList || gedungList.length === 0) return null;
    const foundGedung = gedungList.find(
      (g) => g.namaGedung.toLowerCase() === gedung.toLowerCase(),
    );
    if (foundGedung) {
      const foundRoom = foundGedung.ruanganList.find(
        (r) => r.namaRuangan.toLowerCase() === ruangan.toLowerCase(),
      );
      if (foundRoom) return foundRoom;
    }
    for (const g of gedungList) {
      const foundRoom = g.ruanganList.find(
        (r) => r.namaRuangan.toLowerCase() === ruangan.toLowerCase(),
      );
      if (foundRoom) return foundRoom;
    }
    return null;
  }, [gedungList, gedung, ruangan]);

  const totalBedCapacity = targetRuangan?.jumlahBed ?? 6;

  // Filter patients based on search query (excluding PULANG patients)
  const filteredPatients = useMemo(() => {
    const active = patients.filter((p) => p.status_pasien !== 'PULANG');
    if (!searchQuery.trim()) return active;
    const query = searchQuery.toLowerCase().trim();
    return active.filter(
      (p) =>
        p.nama_pasien.toLowerCase().includes(query) ||
        p.no_rm.toLowerCase().includes(query),
    );
  }, [patients, searchQuery]);

  // Handlers
  function handleAddPatient(defaultBed?: string) {
    setSelectedPatient(null);
    setInitialBed(typeof defaultBed === 'string' ? defaultBed : '');
    setIsFormOpen(true);
  }

  function handleEditPatient(patient: Patient) {
    setSelectedPatient(patient);
    setInitialBed('');
    setIsFormOpen(true);
  }

  function handleDeletePatient(patient: Patient) {
    setPatientToDelete(patient);
    setIsDeleteOpen(true);
  }

  function handleBack() {
    router.push('/dashboard/ag-rs');
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold tracking-tight'>Data Pasien</h1>
            {isRevisiMode && (
              <Badge
                variant='outline'
                className='bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 text-xs font-semibold gap-1'
              >
                <Edit3 className='w-3 h-3 text-amber-600' /> Mode Revisi ({revisiMeal})
              </Badge>
            )}
          </div>
          <p className='text-sm text-muted-foreground flex items-center gap-1.5'>
            <DoorOpen className='h-4 w-4' />
            {gedung} · {ruangan} ({totalBedCapacity} Bed)
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleBack} className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Kembali
          </Button>
          <Button onClick={() => handleAddPatient()} className='gap-2'>
            <Plus className='h-4 w-4' />
            Tambah Pasien
          </Button>
        </div>
      </div>

      {/* Mode Revisi Post-Snapshot Banner */}
      {isRevisiMode && (
        <div className='flex items-start gap-3 bg-amber-500/10 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm animate-in fade-in duration-300'>
          <Edit3 className='w-5 h-5 text-amber-600 shrink-0 mt-0.5' />
          <div>
            <strong className='font-semibold block'>
              Mode Revisi Post-Snapshot ({revisiMeal}):
            </strong>
            <span>
              Anda sedang memilih batch sebelumnya ({revisiMeal}). Setiap perubahan diet pasien di ruangan ini akan dicatat sebagai <strong>Revisi Post-Snapshot</strong> untuk proses otorisasi dapur katering.
            </span>
          </div>
        </div>
      )}

      {/* Search Toolbar */}
      <PatientToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={patients.length}
        filteredCount={filteredPatients.length}
      />

      {/* Table / Formulir Cetak View */}
      <PatientTable
        patients={filteredPatients}
        onEdit={handleEditPatient}
        onDelete={handleDeletePatient}
        gedungList={gedungList}
        kelasList={kelasList}
        totalBedCapacity={totalBedCapacity}
        ruangan={ruangan}
        gedung={gedung}
        searchQuery={searchQuery}
        onAddPatientForBed={(bedName) => handleAddPatient(bedName)}
        revisionContext={revisionContext}
      />

      {/* Form Dialog */}
      <PatientFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        patient={selectedPatient}
        defaultRuangan={ruangan}
        defaultGedung={gedung}
        initialBed={initialBed}
        kelasList={kelasList}
        gedungList={gedungList}
        revisionContext={revisionContext}
      />

      {/* Delete Confirmation Dialog */}
      <DeletePatientDialog
        patient={patientToDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        revisionContext={revisionContext}
      />
    </div>
  );
}
