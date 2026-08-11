'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Users, DoorOpen } from 'lucide-react';

import type { Patient, KelasOption } from '@/servers/patient.service';
import type { GedungWithRuangan } from '@/servers/tempat.service';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import PatientToolbar from './PatientToolbar';
import PatientTable from './PatientTable';
import PatientFormDialog from './PatientFormDialog';
import DeletePatientDialog from './ui/DeletePatientDialog';

interface DataPasienClientProps {
  patients: Patient[];
  ruangan: string;
  gedung: string;
  kelasList?: KelasOption[];
  gedungList?: GedungWithRuangan[];
}

export default function DataPasienClient({
  patients,
  ruangan,
  gedung,
  kelasList = [],
  gedungList = [],
}: DataPasienClientProps) {
  const router = useRouter();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Filter patients based on search query
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const query = searchQuery.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.nama_pasien.toLowerCase().includes(query) ||
        p.no_rm.toLowerCase().includes(query),
    );
  }, [patients, searchQuery]);

  // Handlers
  function handleAddPatient() {
    setSelectedPatient(null);
    setIsFormOpen(true);
  }

  function handleEditPatient(patient: Patient) {
    setSelectedPatient(patient);
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
          <h1 className='text-2xl font-bold tracking-tight'>Data Pasien</h1>
          <p className='text-sm text-muted-foreground flex items-center gap-1.5'>
            <DoorOpen className='h-4 w-4' />
            {gedung} · {ruangan}
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleBack} className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Kembali
          </Button>
          <Button onClick={handleAddPatient} className='gap-2'>
            <Plus className='h-4 w-4' />
            Tambah Pasien
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <PatientToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={patients.length}
        filteredCount={filteredPatients.length}
      />

      {/* Table / Empty State */}
      {patients.length === 0 ? (
        // Empty state — no patients at all
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='rounded-full bg-muted p-4 mb-4'>
              <Users className='h-10 w-10 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold mb-1'>Belum Ada Pasien</h3>
            <p className='text-sm text-muted-foreground mb-6 max-w-xs'>
              Belum terdapat pasien yang terdaftar pada ruangan ini.
            </p>
            <Button onClick={handleAddPatient} className='gap-2'>
              <Plus className='h-4 w-4' />
              Tambah Pasien
            </Button>
          </CardContent>
        </Card>
      ) : filteredPatients.length === 0 ? (
        // Search returned no results
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='rounded-full bg-muted p-4 mb-4'>
              <Users className='h-8 w-8 text-muted-foreground' />
            </div>
            <h3 className='text-base font-semibold mb-1'>
              Pasien Tidak Ditemukan
            </h3>
            <p className='text-sm text-muted-foreground max-w-xs'>
              Tidak ada pasien yang sesuai dengan pencarian &quot;{searchQuery}
              &quot;.
            </p>
          </CardContent>
        </Card>
      ) : (
        <PatientTable
          patients={filteredPatients}
          onEdit={handleEditPatient}
          onDelete={handleDeletePatient}
          gedungList={gedungList}
          kelasList={kelasList}
        />
      )}

      {/* Form Dialog */}
      <PatientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        patient={selectedPatient}
        defaultRuangan={ruangan}
        defaultGedung={gedung}
        kelasList={kelasList}
        gedungList={gedungList}
      />

      {/* Delete Confirmation Dialog */}
      <DeletePatientDialog
        patient={patientToDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </div>
  );
}
