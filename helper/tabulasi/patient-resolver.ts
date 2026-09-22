import { eq, and, ne } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { ruanganTable } from '@/db/schemas/master/ruangan';
import { gedungTable } from '@/db/schemas/master/gedung';
import { isNpoPatient } from '@/lib/npo-utils';
import type { TabulasiBatchOption } from '@/types/tabulasitypes';
import type {
  TabulasiPatientRecord,
  ParsedPatientRevisionPayload,
} from '@/types/tabulasitypes';

/**
 * Build a lookup map from room name (uppercase) to building type (Gedung Lama / Gedung Baru).
 */
export async function buildRoomBuildingMap(): Promise<
  Map<string, 'GEDUNG LAMA' | 'GEDUNG BARU'>
> {
  const allRooms = await db.select().from(ruanganTable);
  const allGedungs = await db.select().from(gedungTable);

  const gedungMap = new Map<number, string>();
  for (const g of allGedungs) {
    gedungMap.set(g.id, (g.nama_gedung || '').toUpperCase());
  }

  const roomGedungMap = new Map<string, 'GEDUNG LAMA' | 'GEDUNG BARU'>();
  for (const r of allRooms) {
    const gName = r.gedung_id ? gedungMap.get(r.gedung_id) || '' : '';
    const isBaru =
      gName.includes('BARU') || r.nama_ruangan.toUpperCase().includes('BARU');
    roomGedungMap.set(
      r.nama_ruangan.toUpperCase(),
      isBaru ? 'GEDUNG BARU' : 'GEDUNG LAMA',
    );
  }

  return roomGedungMap;
}

/**
 * Resolve building type of a patient record using the room-building map.
 */
export function resolvePatientBuilding(
  p: TabulasiPatientRecord,
  roomGedungMap: Map<string, 'GEDUNG LAMA' | 'GEDUNG BARU'>,
): 'GEDUNG LAMA' | 'GEDUNG BARU' {
  const pGedung = (p.gedung || '').toUpperCase();
  if (pGedung.includes('BARU')) return 'GEDUNG BARU';
  if (pGedung.includes('LAMA')) return 'GEDUNG LAMA';

  const pRuangan = (p.ruangan || '').toUpperCase();
  if (roomGedungMap.has(pRuangan)) {
    return roomGedungMap.get(pRuangan)!;
  }
  if (pRuangan.includes('BARU')) return 'GEDUNG BARU';
  return 'GEDUNG LAMA';
}

/**
 * Fetch and normalize patient records from either an official snapshot batch
 * or live active patients (pre-cutoff fallback).
 */
export async function resolveTabulasiPatients(
  selectedBatch: TabulasiBatchOption | null,
  targetDate: string,
  currentMeal: string,
): Promise<{
  patientRecords: TabulasiPatientRecord[];
  isOfficialLocked: boolean;
  resolvedBatchCode: string;
}> {
  if (selectedBatch && selectedBatch.id > 0) {
    const isOfficialLocked = selectedBatch.status_batch === 'LOCKED';
    const resolvedBatchCode = selectedBatch.batch_code;

    const details = await db
      .select()
      .from(snapshotDetailTable)
      .where(eq(snapshotDetailTable.batch_id, selectedBatch.id));

    const patientRecords: TabulasiPatientRecord[] = details.map((d) => {
      const isNpo = isNpoPatient({
        ...d,
        is_npo: d.status_saat_snapshot === 'NPO',
        status_pasien: d.status_saat_snapshot,
      });
      return {
        id: d.id,
        no_rm: d.no_rm,
        nama_pasien: d.nama_pasien,
        gedung: d.gedung,
        ruangan: d.ruangan,
        kelas: d.kelas,
        diet_rs_raw: d.diet_rs_raw,
        bentuk_makanan: d.bentuk_makanan,
        kategori_diet: d.kategori_diet,
        status_saat_snapshot: isNpo ? 'NPO' : d.status_saat_snapshot,
        is_npo: isNpo,
      };
    });

    // Accumulate approved post-snapshot revisions (NEW_PATIENT)
    const revisions = await db
      .select()
      .from(otorisasiPerubahanDietTable)
      .where(
        and(
          eq(otorisasiPerubahanDietTable.batch_id, selectedBatch.id),
          eq(otorisasiPerubahanDietTable.status, 'APPROVED'),
          eq(otorisasiPerubahanDietTable.jenis_perubahan, 'NEW_PATIENT'),
        ),
      );

    for (const rev of revisions) {
      let dataBaruObj: ParsedPatientRevisionPayload = {};
      try {
        if (rev.data_baru) {
          dataBaruObj = JSON.parse(
            rev.data_baru,
          ) as ParsedPatientRevisionPayload;
        }
      } catch {
        dataBaruObj = {};
      }

      const isRevNpo = isNpoPatient({
        nama_pasien: dataBaruObj.nama_pasien,
        diet: dataBaruObj.diet,
        diet_rs_raw: dataBaruObj.diet,
        bentuk_makanan: dataBaruObj.bentuk_makanan,
        kategori_diet: dataBaruObj.kategori_diet,
      });

      patientRecords.push({
        id: `rev-${rev.id}`,
        no_rm: dataBaruObj.no_rm || '-',
        nama_pasien: dataBaruObj.nama_pasien || 'Pasien Susulan',
        gedung: dataBaruObj.gedung || 'Gedung Lama',
        ruangan: dataBaruObj.ruangan || '-',
        kelas: dataBaruObj.kelas || 'KELAS III',
        diet_rs_raw: dataBaruObj.diet || 'Standar',
        bentuk_makanan: dataBaruObj.bentuk_makanan || null,
        kategori_diet: dataBaruObj.kategori_diet || null,
        status_saat_snapshot: isRevNpo ? 'NPO' : 'AKTIF',
        is_npo: isRevNpo,
      });
    }

    return { patientRecords, isOfficialLocked, resolvedBatchCode };
  }

  // Fallback: Live active patients before cut-off
  const isOfficialLocked = false;
  const resolvedBatchCode = `LIVE-${targetDate.replace(/-/g, '')}-${currentMeal}`;

  const activePatients = await db
    .select()
    .from(pasienTable)
    .where(
      and(
        ne(pasienTable.status_pasien, 'PULANG'),
        ne(pasienTable.status_pasien, 'PENDING_REVISI'),
      ),
    );

  const patientRecords: TabulasiPatientRecord[] = activePatients.map((p) => {
    const isNpo = isNpoPatient(p);
    return {
      id: p.id,
      no_rm: p.no_rm || '-',
      nama_pasien: p.nama_pasien,
      gedung: p.gedung || 'Gedung Lama',
      ruangan: p.ruangan || '-',
      kelas: p.kelas || 'KELAS III',
      diet_rs_raw: p.diet || 'Standar',
      bentuk_makanan: null,
      kategori_diet: null,
      status_pasien: isNpo ? 'NPO' : p.status_pasien,
      is_npo: isNpo,
    };
  });

  return { patientRecords, isOfficialLocked, resolvedBatchCode };
}
