/**
 * Klasifikasi jenis perubahan revisi pasien — murni (tanpa I/O),
 * dipakai oleh patient.service (saat AG-RS mengajukan revisi) dan
 * dapat di-unit-test langsung dengan node:test.
 */

/** Jenis perubahan revisi — mencakup koreksi identitas per field. */
export type JenisRevisiPerubahan =
  | 'DIET_CHANGE'
  | 'ROOM_TRANSFER'
  | 'DISCHARGE'
  | 'NPO'
  | 'KOREKSI_NAMA'
  | 'KOREKSI_NO_RM'
  | 'KOREKSI_KELAS'
  | 'KOREKSI_KAMAR'
  | 'KOREKSI_BED';

export interface PasienFieldDiff {
  field: string;
  label: string;
  lama: string;
  baru: string;
}

const PASIEN_FIELD_LABELS: Record<string, string> = {
  nama_pasien: 'Nama',
  no_rm: 'No RM',
  diet: 'Diet',
  kelas: 'Kelas',
  gedung: 'No Kamar',
  ruangan: 'Ruangan',
  bed: 'Bed',
  status_pasien: 'Status',
  is_npo: 'NPO',
};

function normStr(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'boolean') return v ? 'Ya' : 'Tidak';
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function isFieldChanged(a: unknown, b: unknown): boolean {
  return normStr(a).toLowerCase() !== normStr(b).toLowerCase();
}

/**
 * Daftar field yang berubah antara data tersimpan dan data usulan.
 * Dipakai untuk badge yang sesuai, alasan otomatis, dan diff view.
 */
export function diffPasienFields(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
): PasienFieldDiff[] {
  const fields = [
    'nama_pasien',
    'no_rm',
    'diet',
    'kelas',
    'gedung',
    'ruangan',
    'bed',
  ];
  const diffs: PasienFieldDiff[] = [];
  for (const field of fields) {
    if (field in newData && isFieldChanged(oldData[field], newData[field])) {
      diffs.push({
        field,
        label: PASIEN_FIELD_LABELS[field] || field,
        lama: normStr(oldData[field]),
        baru: normStr(newData[field]),
      });
    }
  }
  return diffs;
}

/**
 * Tentukan jenis perubahan dari selisih data.
 * Prioritas: NPO > DISCHARGE > DIET > RUANGAN > NO_RM > NAMA > KELAS > KAMAR > BED.
 * Satu baris otorisasi memakai jenis prioritas tertinggi, sedangkan
 * seluruh field yang berubah tetap tersimpan di data_lama/data_baru
 * dan diterapkan saat approve.
 */
export function detectJenisPerubahan(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
): JenisRevisiPerubahan {
  const statusBaru = normStr(newData.status_pasien).toUpperCase();
  const baruNpo = newData.is_npo === true || statusBaru === 'NPO';
  const oldNpo =
    oldData.is_npo === true ||
    normStr(oldData.status_pasien).toUpperCase() === 'NPO';

  if (baruNpo && !oldNpo) return 'NPO';
  if (statusBaru === 'PULANG') return 'DISCHARGE';
  if ('diet' in newData && isFieldChanged(oldData.diet, newData.diet))
    return 'DIET_CHANGE';
  if ('ruangan' in newData && isFieldChanged(oldData.ruangan, newData.ruangan))
    return 'ROOM_TRANSFER';
  if ('no_rm' in newData && isFieldChanged(oldData.no_rm, newData.no_rm))
    return 'KOREKSI_NO_RM';
  if (
    'nama_pasien' in newData &&
    isFieldChanged(oldData.nama_pasien, newData.nama_pasien)
  )
    return 'KOREKSI_NAMA';
  if ('kelas' in newData && isFieldChanged(oldData.kelas, newData.kelas))
    return 'KOREKSI_KELAS';
  if ('gedung' in newData && isFieldChanged(oldData.gedung, newData.gedung))
    return 'KOREKSI_KAMAR';
  if ('bed' in newData && isFieldChanged(oldData.bed, newData.bed))
    return 'KOREKSI_BED';
  if (baruNpo) return 'NPO';
  return 'DIET_CHANGE';
}

/** Dampak dapur untuk setiap jenis perubahan (satu sumber kebenaran). */
export function dampakDapurForJenis(jenis: string): string {
  switch (jenis) {
    case 'NEW_PATIENT':
      return '+1 Porsi Makanan (Tambahan Makanan)';
    case 'DISCHARGE':
      return '-1 Porsi Dibatalkan (Pasien Pulang)';
    case 'NPO':
      return '-1 Porsi Dibatalkan (Puasa/NPO)';
    case 'ROOM_TRANSFER':
      return 'Pindah Lokasi Antar Makanan';
    case 'KOREKSI_NAMA':
      return 'Koreksi Nama — Cetak Ulang Etiket';
    case 'KOREKSI_NO_RM':
      return 'Koreksi No RM — Cetak Ulang Etiket';
    case 'KOREKSI_KELAS':
      return 'Koreksi Kelas — Cetak Ulang Etiket';
    case 'KOREKSI_KAMAR':
      return 'Koreksi No Kamar — Cetak Ulang Etiket';
    case 'KOREKSI_BED':
      return 'Koreksi Bed — Cetak Ulang Etiket';
    default:
      return 'Perubahan Etiket Diet';
  }
}

/** Susun alasan otomatis dari field yang berubah (dipakai jika alasan kosong). */
export function buildRevisiAlasan(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
): string {
  const diffs = diffPasienFields(oldData, newData);
  const statusBaru = normStr(newData.status_pasien).toUpperCase();
  if (newData.is_npo === true || statusBaru === 'NPO')
    return 'Instruksi Pasien Puasa / NPO';
  if (statusBaru === 'PULANG') return 'Pasien Pulang / Selesai Rawat';
  if (diffs.length === 0)
    return 'Perubahan data pasien pada mode revisi pasca-snapshot';
  return diffs
    .map((d) => `${d.label}: ${d.lama || '-'} → ${d.baru || '-'}`)
    .join('; ');
}
