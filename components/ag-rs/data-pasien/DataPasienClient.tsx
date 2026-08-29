'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, DoorOpen, Edit3 } from 'lucide-react';

import type { Patient } from '@/servers/patient.service';
import {
  createPatient,
  updatePatient,
  updatePatientField,
  deletePatient,
} from '@/servers/patient.service';
import type { PatientFormValues } from '@/validations/PatientFormSchema';
import type { DataPasienClientProps } from '@/types/data-pasien';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { broadcastProductionUpdate } from '@/lib/realtime-sync';
import PatientToolbar from './ui/PatientToolbar';
import PatientTable from './PatientTable';
import PatientFormDialog from './ui/PatientFormDialog';
import DeletePatientDialog from './ui/DeletePatientDialog';

export default function DataPasienClient({
  patients,
  ruangan,
  gedung,
  kamar,
  kamarId,
  kelasList = [],
  gedungList = [],
}: DataPasienClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeKamar = kamar || searchParams.get('kamar') || undefined;
  const activeKamarId = kamarId || searchParams.get('kamarId') || undefined;

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

  // Local optimistic state for immediate UI updates
  const [patientList, setPatientList] = useState<Patient[]>(() => patients);

  // Synchronize when server data is revalidated or room changes
  useEffect(() => {
    setPatientList(patients);
  }, [patients]);

  // UI modal / search states
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

  const targetKamar = useMemo(() => {
    if (!activeKamar || !targetRuangan?.kamarList) return null;
    if (activeKamar.toLowerCase().startsWith('semua kamar')) return null;
    return (
      targetRuangan.kamarList.find(
        (k) =>
          k.nomorKamar.toLowerCase() === activeKamar.toLowerCase() ||
          (activeKamarId && String(k.idKamar) === String(activeKamarId)),
      ) || null
    );
  }, [activeKamar, activeKamarId, targetRuangan]);

  const totalBedCapacity = targetKamar
    ? targetKamar.jumlahBed
    : (targetRuangan?.jumlahBed ?? 6);

  // Filter patients based on search query (excluding PULANG patients)
  const filteredPatients = useMemo(() => {
    const active = patientList.filter((p) => p.status_pasien !== 'PULANG');
    if (!searchQuery.trim()) return active;
    const query = searchQuery.toLowerCase().trim();
    return active.filter(
      (p) =>
        p.nama_pasien.toLowerCase().includes(query) ||
        p.no_rm.toLowerCase().includes(query),
    );
  }, [patientList, searchQuery]);

  // =========================================================================
  // OPTIMISTIC ACTIONS (Instant Frontend UI + Background Server Mutations)
  // =========================================================================

  // 1. Optimistic Add Patient
  const handleOptimisticAdd = async (
    draftData: PatientFormValues,
    defaultBed?: string,
  ) => {
    const tempId = -Date.now();
    const optimisticPatient: Patient = {
      id: tempId,
      nama_pasien: draftData.nama_pasien,
      no_rm: draftData.no_rm,
      diet: draftData.diet,
      kelas: draftData.kelas,
      gedung: draftData.gedung || gedung,
      ruangan: draftData.ruangan || ruangan,
      bed: draftData.bed || defaultBed || 'Bed 1',
      status_pasien: isRevisiMode
        ? 'PENDING_REVISI'
        : (draftData.status_pasien || 'AKTIF'),
      is_npo: Boolean(draftData.is_npo),
      created_at: new Date(),
      updated_at: new Date(),
      updated_by: null,
    };

    // 1. Instantly update frontend UI
    setPatientList((prev) => [...prev, optimisticPatient]);
    broadcastProductionUpdate('PATIENT_UPDATED');

    toast.success(
      isRevisiMode
        ? `Revisi Pasien ${draftData.nama_pasien} diajukan ke Otorisasi Supervisor!`
        : `Pasien ${draftData.nama_pasien} berhasil ditambahkan!`,
    );

    // 2. Send request to database in background
    try {
      const res = await createPatient(draftData, revisionContext);
      if (!res.success) {
        // Rollback on failure
        setPatientList((prev) => prev.filter((p) => p.id !== tempId));
        broadcastProductionUpdate('PATIENT_UPDATED');
        toast.error(res.message || 'Gagal menyimpan pasien.');
      } else {
        router.refresh();
        broadcastProductionUpdate('PATIENT_UPDATED');
      }
    } catch {
      setPatientList((prev) => prev.filter((p) => p.id !== tempId));
      broadcastProductionUpdate('PATIENT_UPDATED');
      toast.error('Gagal menyimpan pasien ke database.');
    }
  };

  // 2. Optimistic Update Field (Inline cell editing / quick status)
  const handleOptimisticSaveField = async (
    patient: Patient,
    field: keyof PatientFormValues,
    value: string | boolean,
  ) => {
    const previousValue = patient[field];
    if (previousValue === value) return;

    // 1. Instantly update frontend UI
    setPatientList((prev) =>
      prev.map((p) => (p.id === patient.id ? { ...p, [field]: value } : p)),
    );
    broadcastProductionUpdate('PATIENT_UPDATED');

    toast.success(
      isRevisiMode
        ? `Revisi ${field.toUpperCase().replace('_', ' ')} ${patient.nama_pasien} diajukan ke Otorisasi Supervisor`
        : `${field.toUpperCase().replace('_', ' ')} ${patient.nama_pasien} diperbarui`,
    );

    // 2. Send update to database in background
    try {
      const res = await updatePatientField(
        patient.id,
        { [field]: value },
        revisionContext,
      );
      if (!res.success) {
        // Rollback on failure
        setPatientList((prev) =>
          prev.map((p) =>
            p.id === patient.id ? { ...p, [field]: previousValue } : p,
          ),
        );
        broadcastProductionUpdate('PATIENT_UPDATED');
        toast.error(res.message || 'Gagal memperbarui data.');
      } else {
        router.refresh();
        broadcastProductionUpdate('PATIENT_UPDATED');
      }
    } catch {
      setPatientList((prev) =>
        prev.map((p) =>
          p.id === patient.id ? { ...p, [field]: previousValue } : p,
        ),
      );
      broadcastProductionUpdate('PATIENT_UPDATED');
      toast.error('Gagal memperbarui data di database.');
    }
  };

  // 3. Optimistic Form Submit (Dialog Add / Dialog Edit)
  const handleOptimisticFormSubmit = async (
    data: PatientFormValues,
    isEdit: boolean,
    patientId?: number,
  ) => {
    if (isEdit && patientId) {
      const previousPatient = patientList.find((p) => p.id === patientId);
      if (!previousPatient) return;

      // 1. Instantly update frontend UI
      setPatientList((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, ...data } : p)),
      );
      broadcastProductionUpdate('PATIENT_UPDATED');

      toast.success(
        isRevisiMode
          ? `Revisi data ${data.nama_pasien} diajukan ke Otorisasi Supervisor.`
          : `Data ${data.nama_pasien} berhasil diperbarui.`,
      );

      // 2. Background DB sync
      try {
        const res = await updatePatient(patientId, data, revisionContext);
        if (!res.success) {
          setPatientList((prev) =>
            prev.map((p) => (p.id === patientId ? previousPatient : p)),
          );
          broadcastProductionUpdate('PATIENT_UPDATED');
          toast.error(res.message || 'Gagal memperbarui data.');
        } else {
          router.refresh();
          broadcastProductionUpdate('PATIENT_UPDATED');
        }
      } catch {
        setPatientList((prev) =>
          prev.map((p) => (p.id === patientId ? previousPatient : p)),
        );
        broadcastProductionUpdate('PATIENT_UPDATED');
        toast.error('Gagal memperbarui data di database.');
      }
    } else {
      await handleOptimisticAdd(data);
    }
  };

  // 4. Optimistic Delete Patient
  const handleOptimisticDelete = async (patientId: number) => {
    const previousPatient = patientList.find((p) => p.id === patientId);
    if (!previousPatient) return;

    // 1. Instantly remove from frontend UI
    setPatientList((prev) => prev.filter((p) => p.id !== patientId));
    broadcastProductionUpdate('PATIENT_UPDATED');
    toast.success(`Pasien ${previousPatient.nama_pasien} berhasil dihapus.`);

    // 2. Background DB sync
    try {
      const res = await deletePatient(patientId, revisionContext);
      if (!res.success) {
        // Rollback
        setPatientList((prev) => [...prev, previousPatient]);
        broadcastProductionUpdate('PATIENT_UPDATED');
        toast.error(res.message || 'Gagal menghapus pasien.');
      } else {
        router.refresh();
        broadcastProductionUpdate('PATIENT_UPDATED');
      }
    } catch {
      setPatientList((prev) => [...prev, previousPatient]);
      broadcastProductionUpdate('PATIENT_UPDATED');
      toast.error('Gagal menghapus pasien di database.');
    }
  };

  // 5. Optimistic Room Transfer
  const handleOptimisticPindahRuangan = async (
    patientId: number,
    targetGedung: string,
    targetRuangan: string,
  ) => {
    const previousPatient = patientList.find((p) => p.id === patientId);
    if (!previousPatient) return;

    // If moved to a different room, immediately remove from current view
    if (targetRuangan.toLowerCase() !== ruangan.toLowerCase()) {
      setPatientList((prev) => prev.filter((p) => p.id !== patientId));
    } else {
      setPatientList((prev) =>
        prev.map((p) =>
          p.id === patientId
            ? {
                ...p,
                gedung: targetGedung,
                ruangan: targetRuangan,
                status_pasien: 'PINDAH_RUANGAN',
              }
            : p,
        ),
      );
    }
    broadcastProductionUpdate('PATIENT_UPDATED');

    toast.success(
      isRevisiMode
        ? `Revisi perpindahan ruangan ${previousPatient.nama_pasien} diajukan ke Otorisasi Supervisor.`
        : `${previousPatient.nama_pasien} dipindahkan ke ${targetGedung} - ${targetRuangan}`,
    );

    // Background DB sync
    try {
      const res = await updatePatientField(
        patientId,
        {
          gedung: targetGedung,
          ruangan: targetRuangan,
          status_pasien: 'PINDAH_RUANGAN',
        },
        revisionContext,
      );
      if (!res.success) {
        setPatientList((prev) => {
          if (!prev.some((p) => p.id === patientId)) {
            return [...prev, previousPatient];
          }
          return prev.map((p) => (p.id === patientId ? previousPatient : p));
        });
        broadcastProductionUpdate('PATIENT_UPDATED');
        toast.error(res.message || 'Gagal memindahkan pasien.');
      } else {
        router.refresh();
        broadcastProductionUpdate('PATIENT_UPDATED');
      }
    } catch {
      setPatientList((prev) => {
        if (!prev.some((p) => p.id === patientId)) {
          return [...prev, previousPatient];
        }
        return prev.map((p) => (p.id === patientId ? previousPatient : p));
      });
      broadcastProductionUpdate('PATIENT_UPDATED');
      toast.error('Gagal memindahkan pasien di database.');
    }
  };

  // Handlers for Opening Dialogs
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
            {gedung} · {ruangan}
            {activeKamar ? ` · ${activeKamar}` : ''} ({totalBedCapacity} Bed)
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
        totalCount={patientList.length}
        filteredCount={filteredPatients.length}
      />

      {/* Table / Formulir Cetak View with Optimistic Actions */}
      <PatientTable
        patients={filteredPatients}
        onEdit={handleEditPatient}
        onDelete={handleDeletePatient}
        onSaveField={handleOptimisticSaveField}
        onInlineAdd={handleOptimisticAdd}
        onQuickPulang={(p) => handleOptimisticSaveField(p, 'status_pasien', 'PULANG')}
        onPindahOptimistic={handleOptimisticPindahRuangan}
        gedungList={gedungList}
        kelasList={kelasList}
        totalBedCapacity={totalBedCapacity}
        ruangan={ruangan}
        gedung={gedung}
        kamar={activeKamar}
        kamarId={activeKamarId}
        searchQuery={searchQuery}
        onAddPatientForBed={(bedName) => handleAddPatient(bedName)}
        revisionContext={revisionContext}
      />

      {/* Form Dialog with Optimistic Submit */}
      <PatientFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        patient={selectedPatient}
        defaultRuangan={ruangan}
        defaultGedung={gedung}
        defaultKamar={activeKamar}
        initialBed={initialBed}
        kelasList={kelasList}
        gedungList={gedungList}
        revisionContext={revisionContext}
        onSubmitOptimistic={handleOptimisticFormSubmit}
      />

      {/* Delete Confirmation Dialog with Optimistic Delete */}
      <DeletePatientDialog
        patient={patientToDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        revisionContext={revisionContext}
        onDeleteOptimistic={handleOptimisticDelete}
      />
    </div>
  );
}

