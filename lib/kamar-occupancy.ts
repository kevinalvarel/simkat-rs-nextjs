/**
 * Helper murni untuk menghitung hunian kamar/bed pada dialog Pindah Ruangan.
 * Kolom `gedung` pada pasien berisi NOMOR KAMAR (bukan nama gedung),
 * kolom `ruangan` berisi nama ruangan, dan `bed` berformat `Bed N`.
 */

export interface OccupancyPatient {
  id: number;
  ruangan: string;
  /** Nomor kamar (kolom pasien `gedung`). */
  gedung: string;
  /** Label bed, cth. `Bed 1`. */
  bed: string;
  status_pasien: string;
  nama_pasien?: string;
}

export function normLoc(v: unknown): string {
  if (typeof v === 'string') return v.trim().toLowerCase();
  if (v === null || v === undefined) return '';
  return String(v).trim().toLowerCase();
}

/** Kapasitas efektif sebuah kamar (fallback 6 untuk data legacy). */
export function effectiveKamarCapacity(jumlahBed?: number | null): number {
  return typeof jumlahBed === 'number' && jumlahBed > 0 ? jumlahBed : 6;
}

/** Label slot bed `Bed 1..N` sesuai kapasitas kamar. */
export function buildBedOptions(jumlahBed?: number | null): string[] {
  const n = effectiveKamarCapacity(jumlahBed);
  return Array.from({ length: n }, (_, i) => `Bed ${i + 1}`);
}

/**
 * Penghuni aktif sebuah (ruangan, kamar), mengecualikan pasien yang sedang
 * dipindahkan dan pasien PULANG.
 */
export function getKamarOccupants(
  patients: OccupancyPatient[],
  ruangan: string,
  nomorKamar: string,
  excludePatientId?: number | null,
): OccupancyPatient[] {
  const targetRuangan = normLoc(ruangan);
  const targetKamar = normLoc(nomorKamar);
  if (!targetRuangan || !targetKamar) return [];
  return patients.filter(
    (p) =>
      (excludePatientId === null ||
        excludePatientId === undefined ||
        p.id !== excludePatientId) &&
      normLoc(p.status_pasien) !== 'pulang' &&
      normLoc(p.ruangan) === targetRuangan &&
      normLoc(p.gedung) === targetKamar,
  );
}

export function countKamarOccupancy(
  patients: OccupancyPatient[],
  ruangan: string,
  nomorKamar: string,
  excludePatientId?: number | null,
): number {
  return getKamarOccupants(patients, ruangan, nomorKamar, excludePatientId)
    .length;
}

export function isKamarFull(
  patients: OccupancyPatient[],
  ruangan: string,
  nomorKamar: string,
  jumlahBed: number | null | undefined,
  excludePatientId?: number | null,
): boolean {
  return (
    countKamarOccupancy(patients, ruangan, nomorKamar, excludePatientId) >=
    effectiveKamarCapacity(jumlahBed)
  );
}

/** Label bed yang sudah terisi (normalisasi, cth. `bed 1`). */
export function getOccupiedBedLabels(
  patients: OccupancyPatient[],
  ruangan: string,
  nomorKamar: string,
  excludePatientId?: number | null,
): Set<string> {
  return new Set(
    getKamarOccupants(patients, ruangan, nomorKamar, excludePatientId).map(
      (p) => normLoc(p.bed),
    ),
  );
}

/** Nama penghuni pada label bed tertentu (untuk keterangan option). */
export function getBedOccupantName(
  patients: OccupancyPatient[],
  ruangan: string,
  nomorKamar: string,
  bedLabel: string,
  excludePatientId?: number | null,
): string | null {
  const target = normLoc(bedLabel);
  const found = getKamarOccupants(
    patients,
    ruangan,
    nomorKamar,
    excludePatientId,
  ).find((p) => normLoc(p.bed) === target);
  const name = (found?.nama_pasien || '').trim();
  return name === '' ? null : name;
}
