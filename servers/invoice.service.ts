'use server';

import { eq, desc, and, ne, asc } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { dietMappingTable } from '@/db/schemas/master/mapping-diet';
import { kelasTable } from '@/db/schemas/master/kelas';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import type {
  InvoiceDailySummary,
  InvoiceClassConsumption,
  DietBreakdownItem,
} from '@/types/invoicetypes';

// Standard class ordering priority
const KELAS_ORDER: Record<string, number> = {
  VIP: 1,
  VVIP: 1,
  'KELAS 1': 2,
  'KELAS I': 2,
  'KELAS 2': 3,
  'KELAS II': 3,
  'KELAS 3': 4,
  'KELAS III': 4,
  'KELAS 2 - 3': 3.5,
  'KELAS 2-3': 3.5,
  ICU: 5,
  HCU: 5,
  NICU: 5,
  PICU: 5,
};

function normalizeKelasName(rawKelas: string | null | undefined): string {
  if (!rawKelas || !rawKelas.trim()) return 'Kelas 3';
  const k = rawKelas.trim();
  const upper = k.toUpperCase();
  if (upper === '1' || upper === 'I') return 'Kelas 1';
  if (upper === '2' || upper === 'II') return 'Kelas 2';
  if (upper === '3' || upper === 'III') return 'Kelas 3';
  if (upper.includes('VIP')) return 'VIP';
  if (upper.includes('1') || upper.includes('I')) return 'Kelas 1';
  if (upper.includes('2') && upper.includes('3')) return 'Kelas 2 - 3';
  if (upper.includes('2')) return 'Kelas 2';
  if (upper.includes('3')) return 'Kelas 3';
  return k;
}

/**
 * Fetch list of all dates that have recorded batches
 */
export async function getAvailableInvoiceDates(): Promise<string[]> {
  try {
    const batches = await db
      .select({
        tanggal_produksi: snapshotBatchTable.tanggal_produksi,
      })
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.tanggal_produksi));

    const todayStr = new Date().toISOString().slice(0, 10);
    const dateSet = new Set<string>([todayStr]);

    for (const b of batches) {
      if (b.tanggal_produksi) {
        dateSet.add(b.tanggal_produksi);
      }
    }

    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  } catch (error) {
    console.error('Error fetching available invoice dates:', error);
    return [new Date().toISOString().slice(0, 10)];
  }
}

/**
 * Fetch daily food consumption breakdown per class for a given date
 */
export async function getInvoiceDailyData(
  targetDateStr?: string,
): Promise<InvoiceDailySummary> {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const selectedDate = targetDateStr || todayStr;
    const availableDates = await getAvailableInvoiceDates();

    const dateObj = new Date(selectedDate);
    const tanggalFormatted = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : selectedDate;

    const dateCode = selectedDate.replace(/-/g, '');
    const invoiceNumber = `REKAP/GZ-RS/${dateCode}/001`;

    // 1. Check if locked batches exist for this date
    const dateBatches = await db
      .select()
      .from(snapshotBatchTable)
      .where(eq(snapshotBatchTable.tanggal_produksi, selectedDate));

    // Data structures for aggregation
    const classMap = new Map<
      string,
      {
        pagi: number;
        siang: number;
        malam: number;
        extra: number;
        pasienSet: Set<string>;
        dietMap: Map<string, number>;
      }
    >();

    function getOrCreateClassEntry(kelasName: string) {
      const norm = normalizeKelasName(kelasName);
      if (!classMap.has(norm)) {
        classMap.set(norm, {
          pagi: 0,
          siang: 0,
          malam: 0,
          extra: 0,
          pasienSet: new Set<string>(),
          dietMap: new Map<string, number>(),
        });
      }
      return classMap.get(norm)!;
    }

    let isOfficialLocked = false;

    if (dateBatches && dateBatches.length > 0) {
      // ─── Case A: Locked snapshot batches exist for this date ───────────
      isOfficialLocked = true;

      for (const batch of dateBatches) {
        const waktu = (batch.waktu_makan || 'PAGI').toUpperCase();
        const details = await db
          .select()
          .from(snapshotDetailTable)
          .where(eq(snapshotDetailTable.batch_id, batch.id));

        for (const d of details) {
          const isNpo =
            d.status_saat_snapshot === 'NPO' ||
            (d.diet_rs_raw || '').toLowerCase() === 'npo' ||
            (d.diet_rs_raw || '').toLowerCase() === 'puasa';

          const entry = getOrCreateClassEntry(d.kelas);
          entry.pasienSet.add(d.no_rm || d.nama_pasien);

          if (!isNpo) {
            if (waktu === 'PAGI') entry.pagi++;
            else if (waktu === 'SIANG') entry.siang++;
            else if (waktu === 'MALAM' || waktu === 'SORE') entry.malam++;

            // Count extras if present
            if (d.extra?.trim() || d.buah?.trim() || d.snack?.trim()) {
              entry.extra++;
            }

            // Diet breakdown tag
            const bentuk = d.bentuk_makanan || 'Biasa';
            const kategori = d.kategori_diet || 'Standar';
            const dietKey = `${bentuk} - ${kategori}`;
            entry.dietMap.set(dietKey, (entry.dietMap.get(dietKey) || 0) + 1);
          }
        }
      }
    } else {
      // ─── Case B: Live preview from active patients for today ──────────
      isOfficialLocked = false;

      // Pending revisions
      const pendingRevisions = await db
        .select({
          pasien_id: otorisasiPerubahanDietTable.pasien_id,
          jenis_perubahan: otorisasiPerubahanDietTable.jenis_perubahan,
        })
        .from(otorisasiPerubahanDietTable)
        .where(eq(otorisasiPerubahanDietTable.status, 'PENDING'));

      const pendingNewPatientIds = new Set(
        pendingRevisions
          .filter((r) => r.jenis_perubahan === 'NEW_PATIENT')
          .map((r) => r.pasien_id),
      );

      const allPatients = await db
        .select({
          id: pasienTable.id,
          nama_pasien: pasienTable.nama_pasien,
          no_rm: pasienTable.no_rm,
          diet: pasienTable.diet,
          kelas: pasienTable.kelas,
          is_npo: pasienTable.is_npo,
          status_pasien: pasienTable.status_pasien,
        })
        .from(pasienTable)
        .where(
          and(
            ne(pasienTable.status_pasien, 'PULANG'),
            ne(pasienTable.status_pasien, 'PENDING_REVISI'),
          ),
        );

      const activePatients = allPatients.filter(
        (p) => !pendingNewPatientIds.has(p.id),
      );

      // Fetch master diet mappings
      const masterMappings = await db
        .select()
        .from(dietMappingTable)
        .where(eq(dietMappingTable.is_active, true));

      const mappingByRaw = new Map<string, typeof dietMappingTable.$inferSelect>();
      for (const m of masterMappings) {
        mappingByRaw.set(m.diet_rs_raw.trim().toLowerCase(), m);
      }

      for (const p of activePatients) {
        const rawDiet = (p.diet || '').trim();
        const isNpo =
          p.is_npo ||
          p.status_pasien === 'NPO' ||
          rawDiet.toLowerCase() === 'npo' ||
          rawDiet.toLowerCase() === 'puasa';

        const entry = getOrCreateClassEntry(p.kelas);
        entry.pasienSet.add(p.no_rm || p.nama_pasien);

        if (!isNpo) {
          // Standard full day consumption: 3 meals (Pagi, Siang, Malam)
          entry.pagi++;
          entry.siang++;
          entry.malam++;

          const mapped = mappingByRaw.get(rawDiet.toLowerCase());
          if (mapped?.extra?.trim() || mapped?.buah?.trim() || mapped?.snack?.trim()) {
            entry.extra += 1;
          }

          const bentuk = mapped?.bentuk_makanan || 'Biasa';
          const kategori = mapped?.kategori_diet || 'Standar';
          const dietKey = `${bentuk} - ${kategori}`;
          entry.dietMap.set(dietKey, (entry.dietMap.get(dietKey) || 0) + 1);
        }
      }
    }

    // Also ensure standard default classes exist in table even if 0
    const defaultClasses = ['VIP', 'Kelas 1', 'Kelas 2', 'Kelas 3'];
    for (const dc of defaultClasses) {
      if (!classMap.has(dc)) {
        classMap.set(dc, {
          pagi: 0,
          siang: 0,
          malam: 0,
          extra: 0,
          pasienSet: new Set<string>(),
          dietMap: new Map<string, number>(),
        });
      }
    }

    // Convert map to array of classes
    const classes: InvoiceClassConsumption[] = Array.from(classMap.entries()).map(
      ([kelasName, data]) => {
        const totalPorsi = data.pagi + data.siang + data.malam + data.extra;
        const totalPasien = data.pasienSet.size;

        const dietBreakdown: DietBreakdownItem[] = Array.from(
          data.dietMap.entries(),
        ).map(([key, count]) => {
          const [bentuk, kategori] = key.split(' - ');
          return {
            bentuk: bentuk || 'Biasa',
            kategori: kategori || 'Standar',
            count,
          };
        });

        return {
          kelas: kelasName,
          pagiCount: data.pagi,
          siangCount: data.siang,
          malamCount: data.malam,
          extraCount: data.extra,
          totalPorsi,
          totalPasien,
          dietBreakdown,
        };
      },
    );

    // Sort classes by standard hierarchy
    classes.sort((a, b) => {
      const orderA = KELAS_ORDER[a.kelas.toUpperCase()] || 99;
      const orderB = KELAS_ORDER[b.kelas.toUpperCase()] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.kelas.localeCompare(b.kelas);
    });

    // Compute Grand Totals
    let grandTotalPagi = 0;
    let grandTotalSiang = 0;
    let grandTotalMalam = 0;
    let grandTotalExtra = 0;
    let grandTotalPorsi = 0;
    let grandTotalPasien = 0;

    for (const c of classes) {
      grandTotalPagi += c.pagiCount;
      grandTotalSiang += c.siangCount;
      grandTotalMalam += c.malamCount;
      grandTotalExtra += c.extraCount;
      grandTotalPorsi += c.totalPorsi;
      grandTotalPasien += c.totalPasien;
    }

    return {
      tanggal: selectedDate,
      tanggalFormatted,
      invoiceNumber,
      hospitalName: 'RUMAH SAKIT UMUM DAERAH',
      cateringVendor: 'INSTALASI GIZI & LAYANAN KATERING RS',
      statusBatch: isOfficialLocked ? 'OFFICIAL_LOCKED' : 'LIVE_PREVIEW',
      availableDates,

      grandTotalPagi,
      grandTotalSiang,
      grandTotalMalam,
      grandTotalExtra,
      grandTotalPorsi,
      grandTotalPasien,

      classes,
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  } catch (error) {
    console.error('Error fetching invoice daily data:', error);
    const today = new Date().toISOString().slice(0, 10);
    return {
      tanggal: today,
      tanggalFormatted: 'Hari Ini',
      invoiceNumber: `REKAP/GZ-RS/${today.replace(/-/g, '')}/001`,
      hospitalName: 'RUMAH SAKIT UMUM DAERAH',
      cateringVendor: 'INSTALASI GIZI & LAYANAN KATERING RS',
      statusBatch: 'LIVE_PREVIEW',
      availableDates: [today],

      grandTotalPagi: 0,
      grandTotalSiang: 0,
      grandTotalMalam: 0,
      grandTotalExtra: 0,
      grandTotalPorsi: 0,
      grandTotalPasien: 0,

      classes: [
        {
          kelas: 'VIP',
          pagiCount: 0,
          siangCount: 0,
          malamCount: 0,
          extraCount: 0,
          totalPorsi: 0,
          totalPasien: 0,
          dietBreakdown: [],
        },
        {
          kelas: 'Kelas 1',
          pagiCount: 0,
          siangCount: 0,
          malamCount: 0,
          extraCount: 0,
          totalPorsi: 0,
          totalPasien: 0,
          dietBreakdown: [],
        },
        {
          kelas: 'Kelas 2',
          pagiCount: 0,
          siangCount: 0,
          malamCount: 0,
          extraCount: 0,
          totalPorsi: 0,
          totalPasien: 0,
          dietBreakdown: [],
        },
        {
          kelas: 'Kelas 3',
          pagiCount: 0,
          siangCount: 0,
          malamCount: 0,
          extraCount: 0,
          totalPorsi: 0,
          totalPasien: 0,
          dietBreakdown: [],
        },
      ],
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  }
}
