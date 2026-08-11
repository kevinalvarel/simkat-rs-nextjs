'use client';

import { useState } from 'react';
import type { Patient, KelasOption } from '@/servers/patient.service';
import type { GedungWithRuangan } from '@/servers/tempat.service';
import { updatePatientField } from '@/servers/patient.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  DoorOpen,
  Home,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge, NpoBadge } from './ui/PatientBadges';
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

type EditingTarget = {
  patientId: number;
  field: 'diet' | 'kelas' | 'bed' | 'status_pasien';
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
  const [tempValue, setTempValue] = useState<string>('');

  // Track modified fields for visual indicator
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
    field: 'diet' | 'kelas' | 'bed' | 'status_pasien' | 'is_npo',
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

  return (
    <div className='space-y-3'>
      {/* Helper Banner */}
      <div className='flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 px-4 rounded-lg border border-border/50'>
        <span className='text-amber-500 text-sm'>💡</span>
        <span>
          <strong>Tips Cepat:</strong> Klik sel (Diet, Kelas, Bed, Status, NPO)
          untuk edit langsung · Klik kanan atau tap lama pada baris untuk menu
          aksi cepat.
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
                <TableHead className='font-semibold'>
                  Diet{' '}
                  <span className='text-xs font-normal text-muted-foreground'>
                    (Klik untuk edit)
                  </span>
                </TableHead>
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
                const isEditingDiet =
                  editingTarget?.patientId === patient.id &&
                  editingTarget.field === 'diet';
                const isEditingKelas =
                  editingTarget?.patientId === patient.id &&
                  editingTarget.field === 'kelas';
                const isEditingBed =
                  editingTarget?.patientId === patient.id &&
                  editingTarget.field === 'bed';
                const isEditingStatus =
                  editingTarget?.patientId === patient.id &&
                  editingTarget.field === 'status_pasien';

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

                    {/* Nama Pasien */}
                    <TableCell className='font-medium relative'>
                      <div className='flex items-center gap-1.5'>
                        <span>{patient.nama_pasien}</span>
                        {isModifiedRow && (
                          <span
                            className='inline-flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium border border-amber-200 dark:border-amber-800 animate-in fade-in duration-300'
                            title='Data pasien ini baru saja diubah'
                          >
                            <Sparkles className='w-2.5 h-2.5 text-amber-500' />
                            Diubah
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* No. RM */}
                    <TableCell className='font-mono text-sm'>
                      {patient.no_rm}
                    </TableCell>

                    {/* DIET CELL (INLINE EDITABLE) */}
                    <TableCell
                      className={`relative transition-all cursor-pointer ${
                        modifiedFields[patient.id]?.diet
                          ? 'ring-1 ring-amber-500/50 bg-amber-500/10 rounded'
                          : 'hover:bg-primary/5'
                      }`}
                      onClick={() => {
                        if (!isEditingDiet) {
                          setEditingTarget({
                            patientId: patient.id,
                            field: 'diet',
                          });
                          setTempValue(patient.diet);
                        }
                      }}
                      title='Klik untuk mengedit Diet'
                    >
                      {isEditingDiet ? (
                        <div
                          className='flex flex-col gap-1.5 p-1 bg-popover rounded-md shadow-md border z-20 min-w-48 animate-in fade-in zoom-in-95'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className='flex items-center gap-1'>
                            <Input
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              autoFocus
                              placeholder='Input Diet...'
                              className='h-7 text-xs font-semibold'
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveField(patient, 'diet', tempValue);
                                } else if (e.key === 'Escape') {
                                  setEditingTarget(null);
                                }
                              }}
                            />
                            <Button
                              size='icon'
                              className='h-7 w-7 shrink-0'
                              onClick={() =>
                                handleSaveField(patient, 'diet', tempValue)
                              }
                            >
                              <Check className='h-3.5 w-3.5' />
                            </Button>
                            <Button
                              size='icon'
                              variant='ghost'
                              className='h-7 w-7 shrink-0'
                              onClick={() => setEditingTarget(null)}
                            >
                              <X className='h-3.5 w-3.5' />
                            </Button>
                          </div>
                          {/* Quick Chips */}
                          <div className='flex flex-wrap gap-1 pt-1 border-t'>
                            {QUICK_DIET_SUGGESTIONS.map((tag) => (
                              <button
                                key={tag}
                                type='button'
                                onClick={() => {
                                  setTempValue(tag);
                                  handleSaveField(patient, 'diet', tag);
                                }}
                                className='text-[10px] px-1.5 py-0.5 bg-secondary hover:bg-primary hover:text-primary-foreground rounded transition-colors font-medium'
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className='flex items-center justify-between group/cell'>
                          <span className='font-semibold text-primary'>
                            {patient.diet}
                          </span>
                          <Pencil className='h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity' />
                        </div>
                      )}
                    </TableCell>

                    {/* KELAS CELL (INLINE EDITABLE) */}
                    <TableCell
                      className={`relative transition-all cursor-pointer ${
                        modifiedFields[patient.id]?.kelas
                          ? 'ring-1 ring-amber-500/50 bg-amber-500/10 rounded'
                          : 'hover:bg-primary/5'
                      }`}
                      onClick={() => {
                        if (!isEditingKelas) {
                          setEditingTarget({
                            patientId: patient.id,
                            field: 'kelas',
                          });
                        }
                      }}
                      title='Klik untuk mengedit Kelas'
                    >
                      {isEditingKelas ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={patient.kelas}
                            onValueChange={(val) => {
                              if (val !== null) {
                                handleSaveField(patient, 'kelas', val);
                              }
                            }}
                          >
                            <SelectTrigger className='h-7 text-xs w-28'>
                              <SelectValue placeholder='Pilih Kelas' />
                            </SelectTrigger>
                            <SelectContent>
                              {kelasOptions.map((k) => (
                                <SelectItem key={k} value={k}>
                                  {k}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className='flex items-center justify-between group/cell'>
                          <span>{patient.kelas}</span>
                          <Pencil className='h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity' />
                        </div>
                      )}
                    </TableCell>

                    {/* RUANGAN */}
                    <TableCell>{patient.ruangan}</TableCell>

                    {/* BED CELL (INLINE EDITABLE) */}
                    <TableCell
                      className={`relative transition-all cursor-pointer ${
                        modifiedFields[patient.id]?.bed
                          ? 'ring-1 ring-amber-500/50 bg-amber-500/10 rounded'
                          : 'hover:bg-primary/5'
                      }`}
                      onClick={() => {
                        if (!isEditingBed) {
                          setEditingTarget({
                            patientId: patient.id,
                            field: 'bed',
                          });
                          setTempValue(patient.bed);
                        }
                      }}
                      title='Klik untuk mengedit Nomor Bed'
                    >
                      {isEditingBed ? (
                        <div
                          className='flex items-center gap-1 p-0.5 bg-popover rounded border z-20 min-w-24'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            autoFocus
                            placeholder='Bed'
                            className='h-7 text-xs w-16'
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveField(patient, 'bed', tempValue);
                              } else if (e.key === 'Escape') {
                                setEditingTarget(null);
                              }
                            }}
                          />
                          <Button
                            size='icon'
                            className='h-7 w-7'
                            onClick={() =>
                              handleSaveField(patient, 'bed', tempValue)
                            }
                          >
                            <Check className='h-3 w-3' />
                          </Button>
                        </div>
                      ) : (
                        <div className='flex items-center justify-between group/cell'>
                          <span className='font-mono font-medium'>
                            {patient.bed}
                          </span>
                          <Pencil className='h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity' />
                        </div>
                      )}
                    </TableCell>

                    {/* GEDUNG */}
                    <TableCell className='text-muted-foreground text-sm'>
                      {patient.gedung}
                    </TableCell>

                    {/* STATUS PASIEN CELL (INLINE EDITABLE) */}
                    <TableCell
                      className={`relative transition-all cursor-pointer ${
                        modifiedFields[patient.id]?.status_pasien
                          ? 'ring-1 ring-amber-500/50 bg-amber-500/10 rounded'
                          : ''
                      }`}
                      onClick={() => {
                        if (!isEditingStatus) {
                          setEditingTarget({
                            patientId: patient.id,
                            field: 'status_pasien',
                          });
                        }
                      }}
                      title='Klik untuk mengedit Status Pasien'
                    >
                      {isEditingStatus ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={patient.status_pasien}
                            onValueChange={(val) => {
                              if (val !== null) {
                                handleSaveField(patient, 'status_pasien', val);
                              }
                            }}
                          >
                            <SelectTrigger className='h-7 text-xs w-36'>
                              <SelectValue placeholder='Status' />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((st) => (
                                <SelectItem key={st} value={st}>
                                  {st.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <StatusBadge status={patient.status_pasien} />
                      )}
                    </TableCell>

                    {/* NPO CELL (TOGGLE ON CLICK) */}
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

                    {/* ACTION DROPDOWN */}
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
