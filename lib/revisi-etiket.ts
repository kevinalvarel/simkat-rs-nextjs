import type { PemorsianPatientItem, PemorsianRevisiItem } from '../types/pemorsiantypes';

export function effectivePrintedPatientIds(
  patients: PemorsianPatientItem[],
  revisions: PemorsianRevisiItem[],
): Set<number> {
  const revisionByRm = new Map(revisions.map((revision) => [revision.no_rm.trim(), revision]));
  return new Set(patients.filter((patient) => {
    const revision = revisionByRm.get(patient.no_rm.trim());
    return revision
      ? revision.revision_print_status === 'SUDAH_DICETAK'
      : patient.print_status === 'SUDAH_DICETAK';
  }).map((patient) => patient.id));
}

export function canPrintRevision(jenis: string): boolean {
  return jenis !== 'NPO' && jenis !== 'DISCHARGE';
}

export function revisionTypeLabel(jenis: string): string {
  const labels: Record<string, string> = {
    DIET_CHANGE: 'Perubahan Diet',
    ROOM_TRANSFER: 'Pindah Ruangan',
    NEW_PATIENT: 'Pasien Baru',
    DISCHARGE: 'Pasien Pulang',
    NPO: 'Puasa',
  };
  return labels[jenis] || jenis;
}

export function revisionSignature(parts: {
  jenis: string;
  diet: string;
  ruangan: string;
  bed: string;
  kelas: string;
  updatedAt?: Date | null;
  authorizationAt?: Date | null;
}): string {
  return JSON.stringify([
    parts.jenis,
    parts.diet,
    parts.ruangan,
    parts.bed,
    parts.kelas,
    parts.updatedAt?.toISOString() || '',
    parts.authorizationAt?.toISOString() || '',
  ]);
}
