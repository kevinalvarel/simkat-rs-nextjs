'use client';

import { useState, Fragment, useMemo } from 'react';
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
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { DoorClosed, BedDouble } from 'lucide-react';
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

const DEFAULT_KELAS_OPTIONS = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'VIP'];

export default function PatientTable({
  patients,
  onEdit,
  onDelete,
  onSaveField,
  onInlineAdd,
  onQuickPulang,
  onOpenPindah,
  onPindahOptimistic,
  gedungList = [],
  kelasList = [],
  totalBedCapacity = 6,
  ruangan = '',
  gedung = '',
  kamar = '',
  kamarId = '',
  searchQuery = '',
  revisionContext,
  allPatients,
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

  const currentRuanganObj = gedungList
    .flatMap((g) => g.ruanganList)
    .find((r) => r.namaRuangan.toLowerCase() === ruangan.toLowerCase());
  const roomKamarOptions =
    currentRuanganObj?.kamarList && currentRuanganObj.kamarList.length > 0
      ? currentRuanganObj.kamarList.map((k) => k.nomorKamar)
      : ['Kamar 1'];

  const currentKamarObj = currentRuanganObj?.kamarList?.find(
    (k) =>
      (kamar && k.nomorKamar.toLowerCase() === kamar.toLowerCase()) ||
      (kamarId && k.idKamar === kamarId),
  );

  // Default value Kelas merujuk pada kelas yang sudah ditetapkan pada KonfigurasiRuangan
  const defaultRoomKelas =
    currentRuanganObj?.kelas ||
    currentKamarObj?.kelas ||
    kelasList[0]?.namaKelas ||
    kelasOptions[0] ||
    'Kelas 1';

  const isSemuaKamar =
    !kamar ||
    kamar.trim() === '' ||
    kamar.toLowerCase().startsWith('semua kamar') ||
    kamar.toLowerCase().startsWith('semua') ||
    kamar === 'ALL';

  const normalizeKamar = (s: string | null | undefined) =>
    (s || '').trim().toLowerCase();

  function makeInlineKey(kamarName: string, bedLabel: string) {
    return `${kamarName}|||${bedLabel}`;
  }

  function resolveKamarGroupForBed(kamarGroup?: string) {
    if (kamarGroup && kamarGroup.trim() !== '') return kamarGroup;
    if (!isSemuaKamar && kamar && kamar.trim() !== '') return kamar;
    return roomKamarOptions[0] || 'Kamar 1';
  }

  function startInlineAdd(bedLabel: string, kamarGroup?: string) {
    const activeKamarValue = resolveKamarGroupForBed(kamarGroup);
    setInlineAddBedKey(makeInlineKey(activeKamarValue, bedLabel));
    setInlineAddDraft({
      nama_pasien: '',
      no_rm: '',
      diet: '',
      kelas: defaultRoomKelas,
      gedung: activeKamarValue,
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

  async function handleSaveInlineAdd(bedKey: string, kamarGroup?: string) {
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

    const activeKamarValue =
      inlineAddDraft.gedung || resolveKamarGroupForBed(kamarGroup);
    const payload: PatientFormValues = {
      nama_pasien: inlineAddDraft.nama_pasien.trim(),
      no_rm: inlineAddDraft.no_rm.trim(),
      diet: inlineAddDraft.diet.trim(),
      kelas: inlineAddDraft.kelas || defaultRoomKelas,
      gedung: activeKamarValue,
      ruangan: inlineAddDraft.ruangan || ruangan,
      bed: inlineAddDraft.bed || bedKey,
      status_pasien: inlineAddDraft.status_pasien || 'AKTIF',
      is_npo: Boolean(inlineAddDraft.is_npo),
    };

    if (onInlineAdd) {
      onInlineAdd(payload, bedKey);
      setInlineAddBedKey(null);
      setInlineAddDraft(null);
      return;
    }

    setIsSavingInline(true);
    try {
      const res = await createPatient(payload, revisionContext);

      if (res.success) {
        toast.success(
          revisionContext?.isRevisiMode
            ? `Revisi Pasien ${payload.nama_pasien} diajukan ke Otorisasi Supervisor!`
            : `Pasien ${payload.nama_pasien} berhasil ditambahkan ke ${payload.bed || bedKey}!`,
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
    kamarGroup?: string,
  ) {
    const currentTarget = e.currentTarget;
    if (!currentTarget.contains(e.relatedTarget as Node)) {
      // Focus moved OUTSIDE this row! Auto-save if draft has content.
      // Hanya satu draft inline aktif dalam satu waktu, jadi cukup cocokkan bedKey
      // (abaikan prefix kamar agar ganti select kamar tidak menggagalkan auto-save).
      const isSameBed =
        inlineAddBedKey === makeInlineKey(resolveKamarGroupForBed(kamarGroup), bedKey) ||
        (inlineAddBedKey?.endsWith(`|||${bedKey}`) ?? false);
      if (
        inlineAddDraft &&
        isSameBed &&
        (inlineAddDraft.nama_pasien.trim() || inlineAddDraft.no_rm.trim())
      ) {
        handleSaveInlineAdd(bedKey, kamarGroup);
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

    markAsModified(patient.id, field);
    setEditingTarget(null);

    if (onSaveField) {
      onSaveField(patient, field, value);
      return;
    }

    try {
      const res = await updatePatientField(
        patient.id,
        { [field]: value },
        revisionContext,
      );
      if (res.success) {
        toast.success(
          revisionContext?.isRevisiMode
            ? `Revisi ${field.toUpperCase().replace('_', ' ')} ${patient.nama_pasien} diajukan ke Otorisasi Supervisor`
            : `${field.toUpperCase().replace('_', ' ')} ${patient.nama_pasien} diperbarui`,
        );
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal memperbarui data pasien.');
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
    markAsModified(patient.id, 'status_pasien');

    if (onQuickPulang) {
      onQuickPulang(patient);
      return;
    }

    try {
      const res = await updatePatientField(
        patient.id,
        {
          status_pasien: 'PULANG',
        },
        revisionContext,
      );
      if (res.success) {
        toast.success(
          revisionContext?.isRevisiMode
            ? `Revisi kepulangan ${patient.nama_pasien} diajukan ke Otorisasi Supervisor.`
            : `${patient.nama_pasien} diproses PULANG.`,
        );
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

  const activePatients = patients.filter((p) => p.status_pasien !== 'PULANG');
  const isSearching = searchQuery.trim() !== '';

  type KamarGroup = {
    nomorKamar: string;
    jumlahBed: number;
    isFallback?: boolean;
  };

  const kamarGroups: KamarGroup[] = useMemo(() => {
    const list = currentRuanganObj?.kamarList;
    if (list && list.length > 0) {
      if (!isSemuaKamar) {
        // Single-kamar mode: only the selected kamar
        const selected =
          currentKamarObj ||
          list.find(
            (k) => normalizeKamar(k.nomorKamar) === normalizeKamar(kamar),
          ) ||
          list[0];
        return [
          {
            nomorKamar: selected.nomorKamar,
            jumlahBed:
              selected.jumlahBed > 0
                ? selected.jumlahBed
                : totalBedCapacity > 0
                  ? totalBedCapacity
                  : 6,
          },
        ];
      }
      // Semua-kamar mode: one group per kamar, bed numbers restart per group
      return list.map((k) => ({
        nomorKamar: k.nomorKamar,
        jumlahBed: k.jumlahBed > 0 ? k.jumlahBed : 1,
      }));
    }
    // Legacy fallback: no kamarList configured
    const fallbackName =
      !isSemuaKamar && kamar && kamar.trim() !== ''
        ? kamar
        : roomKamarOptions[0] || 'Kamar 1';
    return [
      {
        nomorKamar: fallbackName,
        jumlahBed: totalBedCapacity > 0 ? totalBedCapacity : 6,
      },
    ];
  }, [
    currentRuanganObj?.kamarList,
    currentKamarObj,
    isSemuaKamar,
    kamar,
    roomKamarOptions,
    totalBedCapacity,
  ]);

  function buildBedSlotsForKamar(
    capacity: number,
    patientsInKamar: Patient[],
  ): (Patient | null)[] {
    const target = Math.max(
      patientsInKamar.length,
      capacity > 0 ? capacity : 1,
    );
    const slots: (Patient | null)[] = Array(target).fill(null);
    const overflow: Patient[] = [];
    patientsInKamar.forEach((p) => {
      const slotIdx = getBedSlotIndex(p.bed);
      if (slotIdx !== null && slotIdx <= target && !slots[slotIdx - 1]) {
        slots[slotIdx - 1] = p;
      } else {
        overflow.push(p);
      }
    });
    overflow.forEach((p) => {
      const emptyIndex = slots.findIndex((slot) => slot === null);
      if (emptyIndex !== -1) {
        slots[emptyIndex] = p;
      } else {
        slots.push(p);
      }
    });
    return slots;
  }

  type GroupedSlots = {
    group: KamarGroup;
    slots: (Patient | null)[];
  };

  const groupedSlots: GroupedSlots[] = useMemo(() => {
    const matchedNames = new Set(
      kamarGroups.map((g) => normalizeKamar(g.nomorKamar)),
    );
    const unassigned = activePatients.filter(
      (p) => !matchedNames.has(normalizeKamar(p.gedung)),
    );

    const result: GroupedSlots[] = kamarGroups.map((group) => {
      const inGroup = activePatients.filter(
        (p) => normalizeKamar(p.gedung) === normalizeKamar(group.nomorKamar),
      );
      return { group, slots: buildBedSlotsForKamar(group.jumlahBed, inGroup) };
    });

    if (unassigned.length > 0) {
      result.push({
        group: {
          nomorKamar: 'Lainnya / Tanpa Kamar',
          jumlahBed: unassigned.length,
          isFallback: true,
        },
        slots: buildBedSlotsForKamar(unassigned.length, unassigned),
      });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePatients, kamarGroups]);

  const totalGroupedCapacity = groupedSlots.reduce(
    (acc, g) => acc + g.slots.length,
    0,
  );

  // Global running number across groups for the "No" column
  let globalRowCounter = 0;

  return (
    <div className='space-y-3'>
      {/* Helper Banner */}
      <div className='flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 px-4 rounded-lg border border-border/50'>
        <span className='text-amber-500 text-sm'>💡</span>
        <span>
          <strong>Tips Cepat:</strong> Klik sel bed kosong untuk{' '}
          <strong>Tambah Pasien Inline</strong> (otomatis tersimpan saat
          berpindah baris) · Klik sel pasien terdaftar untuk edit langsung ·
          Klik kanan untuk aksi cepat.
        </span>
      </div>

      {searchQuery.trim() !== '' && patients.length === 0 && (
        <div className='flex items-center gap-2 text-xs text-muted-foreground bg-amber-500/10 text-amber-900 dark:text-amber-300 p-2.5 px-4 rounded-lg border border-amber-500/20'>
          <span>🔍</span>
          <span>
            Tidak ada pasien terdaftar yang sesuai dengan pencarian &quot;
            {searchQuery}&quot;. Menampilkan tabel formulir bed kosong (
            {totalGroupedCapacity} Bed).
          </span>
        </div>
      )}

      <div className='rounded-lg border overflow-hidden relative'>
        <div className='overflow-x-auto'>
          <Table>
            <PatientTableHeader />
            <TableBody>
              {groupedSlots.map(({ group, slots }) => {
                const filledCount = slots.filter((s) => s !== null).length;
                return (
                  <Fragment key={`kamar-group-${group.nomorKamar}`}>
                    {isSemuaKamar && groupedSlots.length > 1 && (
                      <TableRow
                        key={`header-${group.nomorKamar}`}
                        className='bg-muted/60 hover:bg-muted/60 border-y-2 border-border'
                      >
                        <TableCell colSpan={10} className='py-2.5 px-4'>
                          <div className='flex items-center gap-2 text-xs sm:text-sm font-semibold'>
                            <span className='flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary'>
                              <DoorClosed className='w-4 h-4' />
                            </span>
                            <span>{group.nomorKamar}</span>
                            <span className='inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium text-muted-foreground bg-background'>
                              <BedDouble className='w-3 h-3 text-primary' />
                              {group.jumlahBed} Bed
                            </span>
                            <span className='text-[11px] font-normal text-muted-foreground'>
                              ({filledCount} terisi / {slots.length} slot)
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {slots.map((patient, slotIndex) => {
                      globalRowCounter += 1;
                      const globalNo = globalRowCounter;
                      const perKamarBedNumber = slotIndex + 1;
                      const defaultBedLabel = `Bed ${perKamarBedNumber}`;
                      const inlineKey = makeInlineKey(
                        group.nomorKamar,
                        defaultBedLabel,
                      );

                      if (!patient) {
                        // Saat searching, sembunyikan bed kosong agar hasil jelas
                        if (isSearching) return null;
                        if (
                          inlineAddBedKey === inlineKey &&
                          inlineAddDraft
                        ) {
                          return (
                            <InlineAddRow
                              key={`inline-add-${group.nomorKamar}-${perKamarBedNumber}`}
                              bedNumber={globalNo}
                              defaultBedLabel={defaultBedLabel}
                              inlineAddDraft={inlineAddDraft}
                              ruangan={ruangan}
                              gedung={gedung}
                              kamar={kamar}
                              kamarGroup={group.nomorKamar}
                              kamarOptions={roomKamarOptions}
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
                            key={`empty-${group.nomorKamar}-${perKamarBedNumber}`}
                            bedNumber={globalNo}
                            defaultBedLabel={defaultBedLabel}
                            ruangan={ruangan}
                            gedung={gedung}
                            kamar={kamar}
                            kamarGroup={group.nomorKamar}
                            onStartInlineAdd={startInlineAdd}
                          />
                        );
                      }

                      return (
                        <PatientTableRow
                          key={patient.id}
                          patient={patient}
                          index={globalNo - 1}
                          editingTarget={editingTarget}
                          isModifiedRow={Boolean(modifiedFields[patient.id])}
                          modifiedFields={modifiedFields[patient.id]}
                          kelasOptions={kelasOptions}
                          gedungOptions={gedungOptions}
                          gedungList={gedungList}
                          statusOptions={STATUS_OPTIONS}
                          kamar={kamar}
                          kamarGroup={group.nomorKamar}
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
                  </Fragment>
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
        onOpenPindah={(patient) => {
          if (onOpenPindah) {
            onOpenPindah(patient);
          } else {
            setPindahPatient(patient);
          }
        }}
        onQuickPulang={handleQuickPulang}
      />

      {/* Extracted Pindah Ruangan Dialog (remount per pasien agar state terinisialisasi ulang) */}
      <PindahRuanganDialog
        key={pindahPatient ? `pindah-${pindahPatient.id}` : 'pindah-closed'}
        patient={pindahPatient}
        gedungList={gedungList}
        patients={allPatients || patients}
        onClose={() => setPindahPatient(null)}
        revisionContext={revisionContext}
        onPindahOptimistic={onPindahOptimistic}
        onSuccess={(id) => {
          markAsModified(id, 'ruangan');
          markAsModified(id, 'gedung');
          markAsModified(id, 'bed');
          markAsModified(id, 'kelas');
          markAsModified(id, 'status_pasien');
        }}
      />
    </div>
  );
}
