'use client';

import { useState } from 'react';
import type { Patient, KelasOption } from '@/servers/patient.service';
import type { GedungWithRuangan } from '@/servers/tempat.service';
import { updatePatientField } from '@/servers/patient.service';
import type { PatientFormValues } from '@/validations/PatientFormSchema';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  DoorOpen,
  Home,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge, NpoBadge } from './ui/PatientBadges';
import {
  InlineTextCell,
  InlineDietCell,
  InlineSelectCell,
} from './ui/InlineCellEditors';
import PatientContextMenu, {
  type ContextMenuState,
} from './PatientContextMenu';
import PindahRuanganDialog from './PindahRuanganDialog';

interface PatientTableProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  gedungList?: GedungWithRuangan[];
  kelasList?: KelasOption[];
}

type EditableField =
  | 'nama_pasien'
  | 'no_rm'
  | 'diet'
  | 'kelas'
  | 'ruangan'
  | 'bed'
  | 'gedung'
  | 'status_pasien';

type EditingTarget = {
  patientId: number;
  field: EditableField;
} | null;

const STATUS_OPTIONS = [
  'AKTIF',
  'PASIEN_BARU',
  'PERUBAHAN_DIET',
  'PINDAH_RUANGAN',
  'NPO',
  'PULANG',
];

const QUICK_DIET_SUGGESTIONS = [
  'MB',
  'ML',
  'MK',
  'DM',
  'Biasa DM (Diabetes)',
  'Bubur Saring',
  'Rendah Garam',
  'TKTP',
];

const DEFAULT_KELAS_OPTIONS = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'VIP', 'VVIP'];

export default function PatientTable({
  patients,
  onEdit,
  onDelete,
  gedungList = [],
  kelasList = [],
}: PatientTableProps) {
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null);

  // Track modified fields for visual glow/badge
  const [modifiedFields, setModifiedFields] = useState<
    Record<number, Record<string, boolean>>
  >({});

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  // Quick "Pindah Ruangan" dialog state
  const [pindahPatient, setPindahPatient] = useState<Patient | null>(null);

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

  const kelasOptions = [
    ...new Set([
      ...kelasList.map((k) => k.namaKelas),
      ...DEFAULT_KELAS_OPTIONS,
    ]),
  ];

  const gedungOptions = gedungList.map((g) => g.namaGedung);

  return (
    <div className='space-y-3'>
      {/* Helper Banner */}
      <div className='flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 px-4 rounded-lg border border-border/50'>
        <span className='text-amber-500 text-sm'>💡</span>
        <span>
          <strong>Tips Cepat:</strong> Klik pada sel mana saja (Nama, RM, Diet, Kelas, Ruangan, Bed, Gedung, Status, NPO) untuk edit langsung · Klik kanan pada baris untuk aksi cepat.
        </span>
      </div>

      <div className='rounded-lg border overflow-hidden relative'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/50'>
                <TableHead className='font-semibold w-12 text-center'>
                  No
                </TableHead>
                <TableHead className='font-semibold'>Nama Pasien</TableHead>
                <TableHead className='font-semibold'>No. RM</TableHead>
                <TableHead className='font-semibold'>Diet</TableHead>
                <TableHead className='font-semibold'>Kelas</TableHead>
                <TableHead className='font-semibold'>Ruangan</TableHead>
                <TableHead className='font-semibold'>Bed</TableHead>
                <TableHead className='font-semibold'>Gedung</TableHead>
                <TableHead className='font-semibold'>Status</TableHead>
                <TableHead className='font-semibold'>NPO</TableHead>
                <TableHead className='font-semibold text-right'>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient, index) => {
                const isModifiedRow = Boolean(modifiedFields[patient.id]);

                // Determine ruangan options based on current patient's gedung
                const patientGedungObj = gedungList.find(
                  (g) => g.namaGedung === patient.gedung,
                );
                const ruanganOptions = patientGedungObj
                  ? patientGedungObj.ruanganList.map((r) => r.namaRuangan)
                  : [
                      ...new Set(
                        gedungList.flatMap((g) =>
                          g.ruanganList.map((r) => r.namaRuangan),
                        ),
                      ),
                    ];

                return (
                  <TableRow
                    key={patient.id}
                    onContextMenu={(e) => handleContextMenu(e, patient)}
                    className={`group transition-colors ${
                      isModifiedRow
                        ? 'bg-amber-500/5 hover:bg-amber-500/10'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    {/* Index */}
                    <TableCell className='text-center text-xs text-muted-foreground font-mono'>
                      {index + 1}
                    </TableCell>

                    {/* Nama Pasien (Inline Editable) */}
                    <InlineTextCell
                      value={patient.nama_pasien}
                      isEditing={
                        editingTarget?.patientId === patient.id &&
                        editingTarget.field === 'nama_pasien'
                      }
                      onStartEdit={() =>
                        setEditingTarget({
                          patientId: patient.id,
                          field: 'nama_pasien',
                        })
                      }
                      onSave={(val) =>
                        handleSaveField(patient, 'nama_pasien', val)
                      }
                      onCancel={() => setEditingTarget(null)}
                      isModified={modifiedFields[patient.id]?.nama_pasien}
                      placeholder='Nama Pasien'
                      title='Klik untuk mengedit Nama Pasien'
                      extraDisplayContent={
                        isModifiedRow ? (
                          <span
                            className='inline-flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium border border-amber-200 dark:border-amber-800 animate-in fade-in duration-300 ml-1 shrink-0'
                            title='Data pasien ini baru saja diubah'
                          >
                            <Sparkles className='w-2.5 h-2.5 text-amber-500' />
                            Diubah
                          </span>
                        ) : null
                      }
                    />

                    {/* No. RM (Inline Editable) */}
                    <InlineTextCell
                      value={patient.no_rm}
                      isEditing={
                        editingTarget?.patientId === patient.id &&
                        editingTarget.field === 'no_rm'
                      }
                      onStartEdit={() =>
                        setEditingTarget({
                          patientId: patient.id,
                          field: 'no_rm',
                        })
                      }
                      onSave={(val) => handleSaveField(patient, 'no_rm', val)}
                      onCancel={() => setEditingTarget(null)}
                      isModified={modifiedFields[patient.id]?.no_rm}
                      placeholder='No. RM'
                      displayClassName='font-mono text-sm'
                      inputClassName='h-7 text-xs font-mono'
                      title='Klik untuk mengedit No. RM'
                    />

                    {/* Diet (Inline Editable) */}
                    <InlineDietCell
                      value={patient.diet}
                      isEditing={
                        editingTarget?.patientId === patient.id &&
                        editingTarget.field === 'diet'
                      }
                      onStartEdit={() =>
                        setEditingTarget({
                          patientId: patient.id,
                          field: 'diet',
                        })
                      }
                      onSave={(val) => handleSaveField(patient, 'diet', val)}
                      onCancel={() => setEditingTarget(null)}
                      isModified={modifiedFields[patient.id]?.diet}
                      suggestions={QUICK_DIET_SUGGESTIONS}
                    />

                    {/* Kelas (Inline Editable Select) */}
                    <InlineSelectCell
                      value={patient.kelas}
                      options={kelasOptions}
                      isEditing={
                        editingTarget?.patientId === patient.id &&
                        editingTarget.field === 'kelas'
                      }
                      onStartEdit={() =>
                        setEditingTarget({
                          patientId: patient.id,
                          field: 'kelas',
                        })
                      }
                      onSave={(val) => handleSaveField(patient, 'kelas', val)}
                      onCancel={() => setEditingTarget(null)}
                      isModified={modifiedFields[patient.id]?.kelas}
                      placeholder='Pilih Kelas'
                      triggerClassName='h-7 text-xs w-28'
                      title='Klik untuk mengedit Kelas'
                    />

                    {/* Ruangan (Inline Editable Select / Text fallback) */}
                    {ruanganOptions.length > 0 ? (
                      <InlineSelectCell
                        value={patient.ruangan}
                        options={ruanganOptions}
                        isEditing={
                          editingTarget?.patientId === patient.id &&
                          editingTarget.field === 'ruangan'
                        }
                        onStartEdit={() =>
                          setEditingTarget({
                            patientId: patient.id,
                            field: 'ruangan',
                          })
                        }
                        onSave={(val) =>
                          handleSaveField(patient, 'ruangan', val)
                        }
                        onCancel={() => setEditingTarget(null)}
                        isModified={modifiedFields[patient.id]?.ruangan}
                        placeholder='Pilih Ruangan'
                        triggerClassName='h-7 text-xs w-32'
                        title='Klik untuk mengedit Ruangan'
                      />
                    ) : (
                      <InlineTextCell
                        value={patient.ruangan}
                        isEditing={
                          editingTarget?.patientId === patient.id &&
                          editingTarget.field === 'ruangan'
                        }
                        onStartEdit={() =>
                          setEditingTarget({
                            patientId: patient.id,
                            field: 'ruangan',
                          })
                        }
                        onSave={(val) =>
                          handleSaveField(patient, 'ruangan', val)
                        }
                        onCancel={() => setEditingTarget(null)}
                        isModified={modifiedFields[patient.id]?.ruangan}
                        placeholder='Ruangan'
                        title='Klik untuk mengedit Ruangan'
                      />
                    )}

                    {/* Bed (Inline Editable Text) */}
                    <InlineTextCell
                      value={patient.bed}
                      isEditing={
                        editingTarget?.patientId === patient.id &&
                        editingTarget.field === 'bed'
                      }
                      onStartEdit={() =>
                        setEditingTarget({
                          patientId: patient.id,
                          field: 'bed',
                        })
                      }
                      onSave={(val) => handleSaveField(patient, 'bed', val)}
                      onCancel={() => setEditingTarget(null)}
                      isModified={modifiedFields[patient.id]?.bed}
                      placeholder='Bed'
                      displayClassName='font-mono font-medium'
                      inputClassName='h-7 text-xs font-mono w-20'
                      title='Klik untuk mengedit Bed'
                    />

                    {/* Gedung (Inline Editable Select / Text fallback) */}
                    {gedungOptions.length > 0 ? (
                      <InlineSelectCell
                        value={patient.gedung}
                        options={gedungOptions}
                        isEditing={
                          editingTarget?.patientId === patient.id &&
                          editingTarget.field === 'gedung'
                        }
                        onStartEdit={() =>
                          setEditingTarget({
                            patientId: patient.id,
                            field: 'gedung',
                          })
                        }
                        onSave={(val) => handleSaveField(patient, 'gedung', val)}
                        onCancel={() => setEditingTarget(null)}
                        isModified={modifiedFields[patient.id]?.gedung}
                        placeholder='Pilih Gedung'
                        triggerClassName='h-7 text-xs w-32'
                        title='Klik untuk mengedit Gedung'
                      />
                    ) : (
                      <InlineTextCell
                        value={patient.gedung}
                        isEditing={
                          editingTarget?.patientId === patient.id &&
                          editingTarget.field === 'gedung'
                        }
                        onStartEdit={() =>
                          setEditingTarget({
                            patientId: patient.id,
                            field: 'gedung',
                          })
                        }
                        onSave={(val) => handleSaveField(patient, 'gedung', val)}
                        onCancel={() => setEditingTarget(null)}
                        isModified={modifiedFields[patient.id]?.gedung}
                        placeholder='Gedung'
                        title='Klik untuk mengedit Gedung'
                      />
                    )}

                    {/* Status Pasien (Inline Editable Select) */}
                    <InlineSelectCell
                      value={patient.status_pasien}
                      options={STATUS_OPTIONS.map((st) => ({
                        label: st.replace(/_/g, ' '),
                        value: st,
                      }))}
                      isEditing={
                        editingTarget?.patientId === patient.id &&
                        editingTarget.field === 'status_pasien'
                      }
                      onStartEdit={() =>
                        setEditingTarget({
                          patientId: patient.id,
                          field: 'status_pasien',
                        })
                      }
                      onSave={(val) =>
                        handleSaveField(patient, 'status_pasien', val)
                      }
                      onCancel={() => setEditingTarget(null)}
                      isModified={modifiedFields[patient.id]?.status_pasien}
                      placeholder='Status'
                      triggerClassName='h-7 text-xs w-36'
                      title='Klik untuk mengedit Status Pasien'
                      renderDisplay={(st) => <StatusBadge status={st} />}
                    />

                    {/* NPO Cell (Toggle Badge on Click) */}
                    <TableCell
                      onClick={() =>
                        handleSaveField(patient, 'is_npo', !patient.is_npo)
                      }
                      title='Klik untuk toggle NPO'
                      className={`cursor-pointer transition-all ${
                        modifiedFields[patient.id]?.is_npo
                          ? 'ring-1 ring-amber-500/50 bg-amber-500/10 rounded'
                          : 'hover:bg-rose-500/5'
                      }`}
                    >
                      <NpoBadge isNpo={patient.is_npo} />
                    </TableCell>

                    {/* Action Menu */}
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity'
                            />
                          }
                        >
                          <MoreHorizontal className='h-4 w-4' />
                          <span className='sr-only'>Aksi</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => onEdit(patient)}>
                            <Pencil className='mr-2 h-4 w-4' />
                            Edit Full
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPindahPatient(patient)}
                          >
                            <DoorOpen className='mr-2 h-4 w-4' />
                            Pindah Ruangan
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleQuickPulang(patient)}
                          >
                            <Home className='mr-2 h-4 w-4' />
                            Pasien Pulang
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(patient)}
                            className='text-destructive focus:text-destructive'
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
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
