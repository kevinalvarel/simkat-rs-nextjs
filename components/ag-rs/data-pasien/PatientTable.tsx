'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Patient } from '@/servers/patient.service';
import { createPatient, updatePatientField } from '@/servers/patient.service';
import type { PatientFormValues } from '@/validations/PatientFormSchema';
import type {
  PatientTableProps,
  EditableField,
  EditingTarget,
  ContextMenuState,
} from '@/types/data-pasien';
import { Table, TableBody } from '@/components/ui/table';
import { toast } from 'sonner';

import { PatientTableHeader } from './ui/PatientTableHeader';
import { InlineAddRow } from './ui/InlineAddRow';
import { EmptyBedRow } from './ui/EmptyBedRow';
import { PatientTableRow } from './ui/PatientTableRow';
import PatientContextMenu from './ui/PatientContextMenu';
import PindahRuanganDialog from './ui/PindahRuanganDialog';

const STATUS_OPTIONS = [
  'AKTIF',
  'PASIEN_BARU',
  'PERUBAHAN_DIET',
  'PINDAH_RUANGAN',
  'NPO',
  'PULANG',
];

const DEFAULT_KELAS_OPTIONS = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'VIP', 'VVIP'];

export default function PatientTable({
  patients,
  onEdit,
  onDelete,
  gedungList = [],
  kelasList = [],
  totalBedCapacity = 6,
  ruangan = '',
  gedung = '',
  searchQuery = '',
}: PatientTableProps) {
  const router = useRouter();

  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null);

  // Track modified fields for visual glow/badge
  const [modifiedFields, setModifiedFields] = useState<
    Record<number, Record<string, boolean>>
  >({});

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  // Quick "Pindah Ruangan" dialog state
  const [pindahPatient, setPindahPatient] = useState<Patient | null>(null);

  // Inline Add Patient State
  const [inlineAddBedKey, setInlineAddBedKey] = useState<string | null>(null);
  const [inlineAddDraft, setInlineAddDraft] =
    useState<PatientFormValues | null>(null);
  const [isSavingInline, setIsSavingInline] = useState(false);

  const kelasOptions = [
    ...new Set([
      ...kelasList.map((k) => k.namaKelas),
      ...DEFAULT_KELAS_OPTIONS,
    ]),
  ];

  const gedungOptions = gedungList.map((g) => g.namaGedung);

  function startInlineAdd(bedLabel: string) {
    setInlineAddBedKey(bedLabel);
    setInlineAddDraft({
      nama_pasien: '',
      no_rm: '',
      diet: '',
      kelas: kelasOptions[0] || 'Kelas 1',
      gedung: gedung,
      ruangan: ruangan,
      bed: bedLabel,
      status_pasien: 'AKTIF',
      is_npo: false,
    });
  }

  function cancelInlineAdd() {
    setInlineAddBedKey(null);
    setInlineAddDraft(null);
  }

  function updateDraft<K extends keyof PatientFormValues>(
    field: K,
    value: PatientFormValues[K],
  ) {
    setInlineAddDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSaveInlineAdd(bedKey: string) {
    if (!inlineAddDraft || isSavingInline) return;

    if (!inlineAddDraft.nama_pasien?.trim()) {
      toast.error('Nama pasien wajib diisi.');
      return;
    }
    if (!inlineAddDraft.no_rm?.trim()) {
      toast.error('No. RM wajib diisi.');
      return;
    }
    if (!inlineAddDraft.diet?.trim()) {
      toast.error('Diet wajib diisi.');
      return;
    }

    setIsSavingInline(true);
    try {
      const res = await createPatient({
        nama_pasien: inlineAddDraft.nama_pasien.trim(),
        no_rm: inlineAddDraft.no_rm.trim(),
        diet: inlineAddDraft.diet.trim(),
        kelas: inlineAddDraft.kelas || kelasOptions[0] || 'Kelas 1',
        gedung: inlineAddDraft.gedung || gedung,
        ruangan: inlineAddDraft.ruangan || ruangan,
        bed: inlineAddDraft.bed || bedKey,
        status_pasien: inlineAddDraft.status_pasien || 'AKTIF',
        is_npo: Boolean(inlineAddDraft.is_npo),
      });

      if (res.success) {
        toast.success(
          `Pasien ${inlineAddDraft.nama_pasien.trim()} berhasil ditambahkan ke ${inlineAddDraft.bed || bedKey}!`,
        );
        setInlineAddBedKey(null);
        setInlineAddDraft(null);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menyimpan data pasien baru.');
    } finally {
      setIsSavingInline(false);
    }
  }

  function handleRowBlur(
    e: React.FocusEvent<HTMLTableRowElement>,
    bedKey: string,
  ) {
    const currentTarget = e.currentTarget;
    if (!currentTarget.contains(e.relatedTarget as Node)) {
      // Focus moved OUTSIDE this row! Auto-save if draft has content
      if (
        inlineAddDraft &&
        inlineAddBedKey === bedKey &&
        (inlineAddDraft.nama_pasien.trim() || inlineAddDraft.no_rm.trim())
      ) {
        handleSaveInlineAdd(bedKey);
      }
    }
  }

  function markAsModified(patientId: number, fieldName: string) {
    setModifiedFields((prev) => ({
      ...prev,
      [patientId]: {
        ...(prev[patientId] || {}),
        [fieldName]: true,
      },
    }));
  }

  async function handleSaveField(
    patient: Patient,
    field: keyof PatientFormValues,
    value: string | boolean,
  ) {
    if (patient[field] === value) {
      setEditingTarget(null);
      return;
    }

    try {
      const res = await updatePatientField(patient.id, { [field]: value });
      if (res.success) {
        markAsModified(patient.id, field);
        toast.success(
          `${field.toUpperCase().replace('_', ' ')} ${patient.nama_pasien} diperbarui`,
        );
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal memperbarui data pasien.');
    } finally {
      setEditingTarget(null);
    }
  }

  function handleContextMenu(e: React.MouseEvent, patient: Patient) {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      patient,
    });
  }

  async function handleQuickPulang(patient: Patient) {
    setContextMenu(null);
    try {
      const res = await updatePatientField(patient.id, {
        status_pasien: 'PULANG',
      });
      if (res.success) {
        markAsModified(patient.id, 'status_pasien');
        toast.success(`${patient.nama_pasien} diproses PULANG.`);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal memperbarui status pasien.');
    }
  }

  // Extract bed slot number if present (e.g. "Bed 3" -> 3)
  function getBedSlotIndex(bedStr: string | null | undefined): number | null {
    if (!bedStr) return null;
    const match = bedStr.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      return num >= 1 ? num : null;
    }
    return null;
  }

  const targetCapacity = Math.max(
    patients.length,
    totalBedCapacity > 0 ? totalBedCapacity : 6,
  );
  const bedSlots: (Patient | null)[] = Array(targetCapacity).fill(null);
  const unassignedPatients: Patient[] = [];

  patients.forEach((p) => {
    const slotIdx = getBedSlotIndex(p.bed);
    if (
      slotIdx !== null &&
      slotIdx <= targetCapacity &&
      !bedSlots[slotIdx - 1]
    ) {
      bedSlots[slotIdx - 1] = p;
    } else {
      unassignedPatients.push(p);
    }
  });

  unassignedPatients.forEach((p) => {
    const emptyIndex = bedSlots.findIndex((slot) => slot === null);
    if (emptyIndex !== -1) {
      bedSlots[emptyIndex] = p;
    } else {
      bedSlots.push(p);
    }
  });

  return (
    <div className='space-y-3'>
      {/* Helper Banner */}
      <div className='flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 px-4 rounded-lg border border-border/50'>
        <span className='text-amber-500 text-sm'>💡</span>
        <span>
          <strong>Tips Cepat:</strong> Klik sel bed kosong untuk <strong>Tambah Pasien Inline</strong> (otomatis tersimpan saat berpindah baris) · Klik sel pasien terdaftar untuk edit langsung · Klik kanan untuk aksi cepat.
        </span>
      </div>

      {searchQuery.trim() !== '' && patients.length === 0 && (
        <div className='flex items-center gap-2 text-xs text-muted-foreground bg-amber-500/10 text-amber-900 dark:text-amber-300 p-2.5 px-4 rounded-lg border border-amber-500/20'>
          <span>🔍</span>
          <span>
            Tidak ada pasien terdaftar yang sesuai dengan pencarian &quot;
            {searchQuery}&quot;. Menampilkan tabel formulir bed kosong (
            {targetCapacity} Bed).
          </span>
        </div>
      )}

      <div className='rounded-lg border overflow-hidden relative'>
        <div className='overflow-x-auto'>
          <Table>
            <PatientTableHeader />
            <TableBody>
              {bedSlots.map((patient, index) => {
                const bedNumber = index + 1;
                const defaultBedLabel = `Bed ${bedNumber}`;

                if (!patient) {
                  if (inlineAddBedKey === defaultBedLabel && inlineAddDraft) {
                    return (
                      <InlineAddRow
                        key={`inline-add-${bedNumber}`}
                        bedNumber={bedNumber}
                        defaultBedLabel={defaultBedLabel}
                        inlineAddDraft={inlineAddDraft}
                        ruangan={ruangan}
                        gedung={gedung}
                        kelasOptions={kelasOptions}
                        statusOptions={STATUS_OPTIONS}
                        isSavingInline={isSavingInline}
                        onUpdateDraft={updateDraft}
                        onSave={handleSaveInlineAdd}
                        onCancel={cancelInlineAdd}
                        onRowBlur={handleRowBlur}
                      />
                    );
                  }

                  return (
                    <EmptyBedRow
                      key={`empty-bed-${bedNumber}`}
                      bedNumber={bedNumber}
                      defaultBedLabel={defaultBedLabel}
                      ruangan={ruangan}
                      gedung={gedung}
                      onStartInlineAdd={startInlineAdd}
                    />
                  );
                }

                return (
                  <PatientTableRow
                    key={patient.id}
                    patient={patient}
                    index={index}
                    editingTarget={editingTarget}
                    isModifiedRow={Boolean(modifiedFields[patient.id])}
                    modifiedFields={modifiedFields[patient.id]}
                    kelasOptions={kelasOptions}
                    gedungOptions={gedungOptions}
                    gedungList={gedungList}
                    statusOptions={STATUS_OPTIONS}
                    onStartEditField={(patientId, field: EditableField) =>
                      setEditingTarget({ patientId, field })
                    }
                    onSaveField={handleSaveField}
                    onCancelEdit={() => setEditingTarget(null)}
                    onContextMenu={handleContextMenu}
                    onEdit={onEdit}
                    onOpenPindah={(pt) => setPindahPatient(pt)}
                    onQuickPulang={handleQuickPulang}
                    onDelete={onDelete}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Extracted Context Menu */}
      <PatientContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        onEdit={onEdit}
        onOpenPindah={(patient) => setPindahPatient(patient)}
        onQuickPulang={handleQuickPulang}
      />

      {/* Extracted Pindah Ruangan Dialog */}
      <PindahRuanganDialog
        patient={pindahPatient}
        gedungList={gedungList}
        onClose={() => setPindahPatient(null)}
        onSuccess={(id) => {
          markAsModified(id, 'ruangan');
          markAsModified(id, 'gedung');
          markAsModified(id, 'status_pasien');
        }}
      />
    </div>
  );
}
