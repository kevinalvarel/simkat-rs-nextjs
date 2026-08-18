import type { Patient, KelasOption, RevisionContext } from '@/servers/patient.service';
import type { GedungWithRuangan } from '@/servers/tempat.service';
import { PatientFormValues } from '@/validations/PatientFormSchema';

export type { RevisionContext };

export type EditableField =
  | 'nama_pasien'
  | 'no_rm'
  | 'diet'
  | 'kelas'
  | 'ruangan'
  | 'bed'
  | 'gedung'
  | 'status_pasien';

export type EditingTarget = {
  patientId: number;
  field: EditableField;
} | null;

export type ContextMenuState = {
  x: number;
  y: number;
  patient: Patient;
} | null;

export interface PatientTableProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onSaveField?: (
    patient: Patient,
    field: keyof PatientFormValues,
    value: string | boolean,
  ) => void;
  onInlineAdd?: (draft: PatientFormValues, defaultBedLabel: string) => void;
  onQuickPulang?: (patient: Patient) => void;
  onOpenPindah?: (patient: Patient) => void;
  onPindahOptimistic?: (
    patientId: number,
    targetGedung: string,
    targetRuangan: string,
  ) => void;
  gedungList?: GedungWithRuangan[];
  kelasList?: KelasOption[];
  totalBedCapacity?: number;
  ruangan?: string;
  gedung?: string;
  searchQuery?: string;
  onAddPatientForBed?: (bedName: string) => void;
  revisionContext?: RevisionContext;
}

export interface DataPasienClientProps {
  patients: Patient[];
  ruangan: string;
  gedung: string;
  kelasList?: KelasOption[];
  gedungList?: GedungWithRuangan[];
}

export interface PatientFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  defaultRuangan?: string;
  defaultGedung?: string;
  defaultBed?: string;
  initialBed?: string;
  kelasList?: KelasOption[];
  gedungList?: GedungWithRuangan[];
  revisionContext?: RevisionContext;
  onSubmitOptimistic?: (
    data: PatientFormValues,
    isEdit: boolean,
    patientId?: number,
  ) => void;
}

export interface PindahRuanganDialogProps {
  patient: Patient | null;
  gedungList: GedungWithRuangan[];
  onClose: () => void;
  onSuccess?: (patientId: number) => void;
  onPindahOptimistic?: (
    patientId: number,
    targetGedung: string,
    targetRuangan: string,
  ) => void;
  revisionContext?: RevisionContext;
}

export interface DeletePatientDialogProps {
  isOpen?: boolean;
  open?: boolean;
  patient: Patient | null;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  onDeleteOptimistic?: (patientId: number) => void;
  revisionContext?: RevisionContext;
}

export interface PatientToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddPatient: () => void;
  totalPatients?: number;
  totalCount?: number;
  filteredCount?: number;
}

export interface InlineAddRowProps {
  bedNumber: number;
  defaultBedLabel: string;
  inlineAddDraft: PatientFormValues;
  ruangan: string;
  gedung: string;
  kelasOptions: string[];
  statusOptions: string[];
  isSavingInline: boolean;
  onUpdateDraft: <K extends keyof PatientFormValues>(
    field: K,
    value: PatientFormValues[K],
  ) => void;
  onSave: (bedKey: string) => void;
  onCancel: () => void;
  onRowBlur: (e: React.FocusEvent<HTMLTableRowElement>, bedKey: string) => void;
}

