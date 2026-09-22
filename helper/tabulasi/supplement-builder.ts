import { isNpoPatient } from '@/lib/npo-utils';
import { dietMappingTable } from '@/db/schemas/master/mapping-diet';
import type {
  TabulasiDashboardData,
  TabulasiHospitalItem,
  TabulasiHospitalCategoryGroup,
} from '@/types/tabulasitypes';
import { resolvePatientBuilding } from './patient-resolver';
import { normalizeKelas } from './normalize';
import type { TabulasiPatientRecord, MasterMenuItemRow } from '@/types/tabulasitypes';

/** Supplement kind for snack/buah tabulation (portions sourced from mapping field, not dish totals). */
export type TabulasiSupplementKind = 'SNACK' | 'BUAH';

/**
 * Aggregates supplement (snack / buah) portions for all eligible patients.
 *
 * Matching priority (per patient per code):
 * 1. Exact tag match on cycleItems[].kategori_menu
 * 2. Diet token intersection
 * 3. Generic "B" or untagged item for standard patients
 */
export function buildSupplementResult(
  base: TabulasiDashboardData,
  patientRecords: TabulasiPatientRecord[],
  mappings: Array<typeof dietMappingTable.$inferSelect>,
  cycleItems: Array<MasterMenuItemRow>,
  roomBuildingMap: Map<string, 'GEDUNG LAMA' | 'GEDUNG BARU'>,
  snapshotById: Map<number, string | null>,
  kind: TabulasiSupplementKind,
  slot: 'PAGI' | 'SIANG',
): TabulasiDashboardData {
  const mappingByDiet = new Map(
    mappings
      .filter((m) => m.status_mapping === 'MAPPED')
      .map((m) => [m.diet_rs_raw.trim().toLowerCase(), m]),
  );

  const supplementMenu = cycleItems.filter(
    (item) =>
      item.jenis_makanan.toUpperCase() === kind &&
      item.waktu_makan.toUpperCase() === slot,
  );

  const rows = new Map<string, TabulasiHospitalItem>();
  const servedPatients = new Set<string>();
  let specialDietCount = 0;
  const kindLabel = kind === 'SNACK' ? 'snack' : 'buah';

  for (const patient of patientRecords) {
    const mapping = mappingByDiet.get(patient.diet_rs_raw.trim().toLowerCase());
    if (
      isNpoPatient({
        ...patient,
        bentuk_makanan:
          patient.bentuk_makanan || mapping?.bentuk_makanan,
        kategori_diet: patient.kategori_diet || mapping?.kategori_diet,
      })
    )
      continue;

    const rawSupplement =
      typeof patient.id === 'number' && snapshotById.has(patient.id)
        ? snapshotById.get(patient.id)
        : kind === 'SNACK'
          ? mapping?.snack
          : mapping?.buah;

    const codes = (rawSupplement || '')
      .split(/[,;/]+/)
      .map((code) => code.trim().toUpperCase())
      .filter(
        (code) =>
          code && !['-', 'NON', 'TIDAK', 'NPO', 'PUASA'].includes(code),
      )
      .filter((code) => {
        if (kind !== 'SNACK') return true;
        if (code === 'SNACK_PAGI') return slot === 'PAGI';
        if (code === 'SNACK_SIANG' || code === 'SNACK_SORE')
          return slot === 'SIANG';
        return true;
      });

    if (codes.length === 0) continue;

    const patientClass = normalizeKelas(patient.kelas);
    const dietTokens = new Set(
      (
        `${patient.diet_rs_raw},${mapping?.kategori_diet || patient.kategori_diet || ''}`
      )
        .toUpperCase()
        .split(/[,;/\s+]+/)
        .filter(Boolean),
    );

    const candidates = supplementMenu
      .filter((item) => {
        const itemClass = (item.kelas || '').toUpperCase();
        if (itemClass.includes('SEMUA') || itemClass === 'ALL' || !itemClass)
          return true;
        if (itemClass.includes('2') && itemClass.includes('3')) return true;
        if (patientClass === 'KELAS_1')
          return (
            itemClass === 'I' ||
            itemClass === 'KELAS I' ||
            itemClass.includes('VIP')
          );
        if (patientClass === 'KELAS_2')
          return itemClass === 'II' || itemClass === 'KELAS II';
        return itemClass === 'III' || itemClass === 'KELAS III';
      })
      .sort((a, b) => {
        const score = (item: MasterMenuItemRow) => {
          const itemClass = item.kelas.toUpperCase();
          if (itemClass.includes('SEMUA') || itemClass === 'ALL') return 2;
          return 0;
        };
        return score(a) - score(b);
      });

    for (const code of new Set(codes)) {
      const tagged = candidates.find((item) =>
        (item.kategori_menu || '')
          .toUpperCase()
          .split(/[,;/]+/)
          .map((tag) => tag.trim())
          .includes(code),
      );
      const dietMatched = candidates.find((item) =>
        (item.kategori_menu || '')
          .toUpperCase()
          .split(/[,;/\s+]+/)
          .some((tag) => tag !== 'B' && dietTokens.has(tag)),
      );
      const generic = candidates.find(
        (item) =>
          !item.kategori_menu?.trim() ||
          (!/DM|RG|RP|RS|DJ|RL|TKTP/.test(
            patient.diet_rs_raw.toUpperCase(),
          ) &&
            item.kategori_menu.trim().toUpperCase() === 'B'),
      );

      const item = tagged || dietMatched || generic;
      const rowId = item
        ? `${kindLabel}-${item.id}-${code}`
        : `missing-${kindLabel}-${slot}-${code}`;
      const category = item
        ? `${kind} ${slot}`
        : `${kind} ${slot} - BELUM DIATUR`;

      const existing: TabulasiHospitalItem = rows.get(rowId) || {
        id: rowId,
        kategori: category,
        nama_menu:
          item?.nama_makanan?.trim() ||
          (cycleItems.length === 0
            ? `Siklus menu belum diatur; nama hidangan ${kindLabel} belum tersedia`
            : `Hidangan ${kindLabel} belum diatur pada ${base.hospitalData.siklusNama} (${slot.toLowerCase()})`),
        kode_diet: code,
        porsi_gedung_lama: 0,
        porsi_gedung_baru: 0,
        total_porsi: 0,
        catatan: item?.catatan || undefined,
      };

      if (resolvePatientBuilding(patient, roomBuildingMap) === 'GEDUNG BARU') {
        existing.porsi_gedung_baru++;
      } else {
        existing.porsi_gedung_lama++;
      }
      existing.total_porsi++;
      rows.set(rowId, existing);
    }

    servedPatients.add(String(patient.id));
    if (patient.diet_rs_raw.toUpperCase().match(/DM|RG|RP|RS|DJ|RL|TKTP/)) {
      specialDietCount++;
    }
  }

  // Build category groups
  const groupsMap = new Map<string, TabulasiHospitalItem[]>();
  for (const row of rows.values()) {
    const group = groupsMap.get(row.kategori) || [];
    group.push(row);
    groupsMap.set(row.kategori, group);
  }

  const categoryGroups: TabulasiHospitalCategoryGroup[] = [
    ...groupsMap,
  ].map(([kategori, items]) => ({
    kategori,
    items,
    subtotalGedungLama: items.reduce(
      (sum, item) => sum + item.porsi_gedung_lama,
      0,
    ),
    subtotalGedungBaru: items.reduce(
      (sum, item) => sum + item.porsi_gedung_baru,
      0,
    ),
    subtotalSemua: items.reduce((sum, item) => sum + item.total_porsi, 0),
  }));

  const allItems = categoryGroups.flatMap((group) => group.items);
  const totalGedungLama = allItems.reduce(
    (sum, item) => sum + item.porsi_gedung_lama,
    0,
  );
  const totalGedungBaru = allItems.reduce(
    (sum, item) => sum + item.porsi_gedung_baru,
    0,
  );
  const totalPortions = totalGedungLama + totalGedungBaru;

  return {
    ...base,
    summary: {
      ...base.summary,
      patientsEating: servedPatients.size,
      specialDiet: specialDietCount,
      totalPortions,
    },
    snackSummary: {
      categories: categoryGroups.map((group) => ({
        category: group.kategori,
        portions: group.subtotalSemua,
        percentage: totalPortions
          ? Math.round((group.subtotalSemua / totalPortions) * 100)
          : 0,
        diets: [...new Set(group.items.map((item) => item.kode_diet))],
      })),
      items: allItems.map((item) => ({
        name: item.nama_menu,
        diet: item.kode_diet,
        count: item.total_porsi,
      })),
      gedungLamaCount: totalGedungLama,
      gedungBaruCount: totalGedungBaru,
      totalPortions,
    },
    hospitalData: {
      ...base.hospitalData,
      waktuMakan: slot,
      grandTotalPorsi: totalPortions,
      totalGedungLama,
      totalGedungBaru,
      totalPasienMakan: servedPatients.size,
      totalDietKhusus: specialDietCount,
      categoryGroups,
      allItems,
    },
  };
}
