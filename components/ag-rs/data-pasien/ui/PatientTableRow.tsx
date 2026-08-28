'use client';

import type { Patient } from '@/servers/patient.service';
import type { GedungWithRuangan } from '@/servers/tempat.service';
import type { EditingTarget, EditableField } from '@/types/data-pasien';
import type { PatientFormValues } from '@/validations/PatientFormSchema';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
import { StatusBadge } from './PatientBadges';
import {
  InlineTextCell,
  InlineDietCell,
  InlineSelectCell,
} from './InlineCellEditors';

interface PatientTableRowProps {
  patient: Patient;
  index: number;
  editingTarget: EditingTarget;
  isModifiedRow: boolean;
  modifiedFields: Record<string, boolean> | undefined;
  kelasOptions: string[];
  gedungOptions: string[];
  gedungList: GedungWithRuangan[];
  statusOptions: string[];
  onStartEditField: (patientId: number, field: EditableField) => void;
  onSaveField: (patient: Patient, field: keyof PatientFormValues, value: string | boolean) => void;
  onCancelEdit: () => void;
  onContextMenu: (e: React.MouseEvent, patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onOpenPindah: (patient: Patient) => void;
  onQuickPulang: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

export function PatientTableRow({
  patient,
  index,
  editingTarget,
  isModifiedRow,
  modifiedFields,
  kelasOptions,
  gedungOptions,
  gedungList,
  statusOptions,
  onStartEditField,
  onSaveField,
  onCancelEdit,
  onContextMenu,
  onEdit,
  onOpenPindah,
  onQuickPulang,
  onDelete,
}: PatientTableRowProps) {
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

  const matchedRuangan = patientGedungObj
    ? patientGedungObj.ruanganList.find((r) => r.namaRuangan === patient.ruangan)
    : gedungList
        .flatMap((g) => g.ruanganList)
        .find((r) => r.namaRuangan === patient.ruangan);

  const kamarOptions =
    matchedRuangan?.kamarList && matchedRuangan.kamarList.length > 0
      ? matchedRuangan.kamarList.map((k) => k.nomorKamar)
      : ['Kamar 1'];

  const displayKamarValue =
    (kamarOptions.find((k) => patient.bed.startsWith(k)) ||
      (patient.gedung && kamarOptions.includes(patient.gedung) ? patient.gedung : null) ||
      kamarOptions[0] ||
      'Kamar 1');

  return (
    <TableRow
      key={patient.id}
      onContextMenu={(e) => onContextMenu(e, patient)}
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
        onStartEdit={() => onStartEditField(patient.id, 'nama_pasien')}
        onSave={(val) => onSaveField(patient, 'nama_pasien', val)}
        onCancel={onCancelEdit}
        isModified={modifiedFields?.nama_pasien}
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
        onStartEdit={() => onStartEditField(patient.id, 'no_rm')}
        onSave={(val) => onSaveField(patient, 'no_rm', val)}
        onCancel={onCancelEdit}
        isModified={modifiedFields?.no_rm}
        placeholder='No. RM'
        displayClassName='font-mono text-sm'
        inputClassName='h-7 text-xs font-mono'
        title='Klik untuk mengedit No. RM'
      />

      {/* Diet (Inline Editable Manual Text) */}
      <InlineDietCell
        value={patient.diet}
        isEditing={
          editingTarget?.patientId === patient.id &&
          editingTarget.field === 'diet'
        }
        onStartEdit={() => onStartEditField(patient.id, 'diet')}
        onSave={(newDiet) => onSaveField(patient, 'diet', newDiet)}
        onCancel={onCancelEdit}
        isModified={modifiedFields?.diet}
      />

      {/* Kelas (Inline Editable Select) */}
      <InlineSelectCell
        value={patient.kelas}
        options={kelasOptions}
        isEditing={
          editingTarget?.patientId === patient.id &&
          editingTarget.field === 'kelas'
        }
        onStartEdit={() => onStartEditField(patient.id, 'kelas')}
        onSave={(val) => onSaveField(patient, 'kelas', val)}
        onCancel={onCancelEdit}
        isModified={modifiedFields?.kelas}
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
          onStartEdit={() => onStartEditField(patient.id, 'ruangan')}
          onSave={(val) => onSaveField(patient, 'ruangan', val)}
          onCancel={onCancelEdit}
          isModified={modifiedFields?.ruangan}
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
          onStartEdit={() => onStartEditField(patient.id, 'ruangan')}
          onSave={(val) => onSaveField(patient, 'ruangan', val)}
          onCancel={onCancelEdit}
          isModified={modifiedFields?.ruangan}
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
        onStartEdit={() => onStartEditField(patient.id, 'bed')}
        onSave={(val) => onSaveField(patient, 'bed', val)}
        onCancel={onCancelEdit}
        isModified={modifiedFields?.bed}
        placeholder='Bed'
        displayClassName='font-mono font-medium'
        inputClassName='h-7 text-xs font-mono w-20'
        title='Klik untuk mengedit Bed'
      />

      {/* Nomor Kamar (Inline Editable Select / Text fallback) */}
      {kamarOptions.length > 0 ? (
        <InlineSelectCell
          value={displayKamarValue}
          options={kamarOptions}
          isEditing={
            editingTarget?.patientId === patient.id &&
            editingTarget.field === 'gedung'
          }
          onStartEdit={() => onStartEditField(patient.id, 'gedung')}
          onSave={(val) => onSaveField(patient, 'gedung', val)}
          onCancel={onCancelEdit}
          isModified={modifiedFields?.gedung}
          placeholder='Pilih Kamar'
          triggerClassName='h-7 text-xs w-28'
          title='Klik untuk mengedit Nomor Kamar'
        />
      ) : (
        <InlineTextCell
          value={displayKamarValue}
          isEditing={
            editingTarget?.patientId === patient.id &&
            editingTarget.field === 'gedung'
          }
          onStartEdit={() => onStartEditField(patient.id, 'gedung')}
          onSave={(val) => onSaveField(patient, 'gedung', val)}
          onCancel={onCancelEdit}
          isModified={modifiedFields?.gedung}
          placeholder='Nomor Kamar'
          title='Klik untuk mengedit Nomor Kamar'
        />
      )}

      {/* Status Pasien (Inline Editable Select) */}
      <InlineSelectCell
        value={patient.status_pasien}
        options={statusOptions.map((st) => ({
          label: st.replace(/_/g, ' '),
          value: st,
        }))}
        isEditing={
          editingTarget?.patientId === patient.id &&
          editingTarget.field === 'status_pasien'
        }
        onStartEdit={() => onStartEditField(patient.id, 'status_pasien')}
        onSave={(val) => onSaveField(patient, 'status_pasien', val)}
        onCancel={onCancelEdit}
        isModified={modifiedFields?.status_pasien}
        placeholder='Status'
        triggerClassName='h-7 text-xs w-36'
        title='Klik untuk mengedit Status Pasien'
        renderDisplay={(st) => <StatusBadge status={st} />}
      />

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
            <DropdownMenuItem onClick={() => onOpenPindah(patient)}>
              <DoorOpen className='mr-2 h-4 w-4' />
              Pindah Ruangan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onQuickPulang(patient)}>
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
}
