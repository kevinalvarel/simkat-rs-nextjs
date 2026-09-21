'use server';

import { getInvoiceDailyData } from '@/servers/invoice.service';
import type {
  SalesInvoiceSummary,
  SalesInvoiceLineItem,
  SalesInvoicePriceConfig,
  InvoiceDailySummary,
} from '@/types/invoicetypes';
import {
  DEFAULT_PRICE_CONFIG,
  angkaTerbilang,
} from '@/lib/sales-invoice-utils';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS (not exported — avoids 'use server' restriction)
// ═══════════════════════════════════════════════════════════════════════════════

/** Normalisasi kanonis untuk lookup harga: '1' | '2' | '3' (legacy VIP -> '1') */
function normalizeKelasForPrice(kelas: string): '1' | '2' | '3' {
  const u = (kelas || '').trim().toUpperCase();
  if (u.includes('2') && u.includes('3')) return '2';
  if (u.includes('1') || u === 'I' || u.includes('VIP')) return '1';
  if (u.includes('2') || u === 'II') return '2';
  return '3';
}

/** Get harga satuan for a specific kelas and barang type */
function getHargaSatuan(
  namaBarang: 'TKTP' | 'Makan Pasien',
  kelas: string,
  config: SalesInvoicePriceConfig,
): number {
  const kelasKey = normalizeKelasForPrice(kelas);
  if (namaBarang === 'TKTP') {
    if (kelasKey === '1') return config.tktpKelas1;
    if (kelasKey === '2') return config.tktpKelas2;
    return config.tktpKelas3;
  }
  // Makan Pasien
  if (kelasKey === '1') return config.makanPasienKelas1;
  if (kelasKey === '2') return config.makanPasienKelas2;
  return config.makanPasienKelas3;
}

/** Map ke label faktur kanonis KELAS I/II/III */
function formatKelasType(kelas: string): string {
  const u = (kelas || '').trim().toUpperCase();
  if (u.includes('2') && u.includes('3')) return 'KELAS II';
  if (u.includes('1') || u === 'I' || u.includes('VIP')) return 'KELAS I';
  if (u.includes('2') || u === 'II') return 'KELAS II';
  return 'KELAS III';
}

/**
 * Transform InvoiceDailySummary into SalesInvoiceLineItems with pricing.
 *
 * Creates rows matching the reference image format:
 *  - 1 row for TKTP per class (if TKTP count > 0)
 *  - 1 row for Makan Pasien per class (non-TKTP portions)
 */
function buildLineItems(
  summary: InvoiceDailySummary,
  config: SalesInvoicePriceConfig,
): SalesInvoiceLineItem[] {
  const items: SalesInvoiceLineItem[] = [];
  let no = 1;

  // Urutan mengikuti kelas sistem (summary.classes sudah terurut dari invoice.service)
  const sortedClasses = [...summary.classes].sort((a, b) =>
    a.kelas.localeCompare(b.kelas),
  );

  for (const cls of sortedClasses) {
    let tktpCount = 0;
    for (const d of cls.dietBreakdown || []) {
      if (
        d.kategori?.toUpperCase().includes('TKTP') ||
        d.bentuk?.toUpperCase().includes('TKTP')
      ) {
        tktpCount += d.count;
      }
    }

    const type = formatKelasType(cls.kelas);

    if (tktpCount > 0) {
      const harga = getHargaSatuan('TKTP', cls.kelas, config);
      items.push({
        no: no++,
        namaBarang: 'TKTP',
        type,
        banyaknya: tktpCount,
        satuan: 'Porsi',
        hargaSatuan: harga,
        jumlahHarga: tktpCount * harga,
      });
    }

    const makanPasienCount = cls.totalPorsi - tktpCount;
    if (makanPasienCount > 0) {
      const harga = getHargaSatuan('Makan Pasien', cls.kelas, config);
      items.push({
        no: no++,
        namaBarang: 'Makan Pasien',
        type,
        banyaknya: makanPasienCount,
        satuan: 'Porsi',
        hargaSatuan: harga,
        jumlahHarga: makanPasienCount * harga,
      });
    }
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTED SERVER ACTIONS (must all be async functions)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get sales invoice data for a specific date or date range.
 * Reuses getInvoiceDailyData() and enriches with pricing information.
 */
export async function getSalesInvoiceData(
  targetDateStr?: string,
  endDateStr?: string,
  waktuMakan?: string,
  batchId?: number,
  priceConfig?: SalesInvoicePriceConfig,
): Promise<SalesInvoiceSummary> {
  const config = priceConfig || DEFAULT_PRICE_CONFIG;

  const baseData = await getInvoiceDailyData(
    targetDateStr,
    endDateStr,
    waktuMakan,
    batchId,
  );

  const lineItems = buildLineItems(baseData, config);
  const totalBanyaknya = lineItems.reduce((sum, item) => sum + item.banyaknya, 0);
  const totalHarga = lineItems.reduce((sum, item) => sum + item.jumlahHarga, 0);
  const terbilang = angkaTerbilang(totalHarga);

  let dailySalesInvoices: SalesInvoiceSummary[] | undefined;
  if (baseData.dailySummaries && baseData.dailySummaries.length > 0) {
    dailySalesInvoices = baseData.dailySummaries.map((ds) => {
      const dsItems = buildLineItems(ds, config);
      const dsTotalBanyaknya = dsItems.reduce((sum, item) => sum + item.banyaknya, 0);
      const dsTotalHarga = dsItems.reduce((sum, item) => sum + item.jumlahHarga, 0);
      return {
        ...ds,
        lineItems: dsItems,
        totalBanyaknya: dsTotalBanyaknya,
        totalHarga: dsTotalHarga,
        terbilang: angkaTerbilang(dsTotalHarga),
        priceConfig: config,
      };
    });
  }

  return {
    ...baseData,
    lineItems,
    totalBanyaknya,
    totalHarga,
    terbilang,
    priceConfig: config,
    dailySalesInvoices,
  };
}

/**
 * Get monthly sales invoice data.
 * Fetches the entire month's data as a date range and marks it as monthly.
 */
export async function getMonthlySalesInvoiceData(
  month: number,
  year: number,
  priceConfig?: SalesInvoicePriceConfig,
): Promise<SalesInvoiceSummary> {
  const config = priceConfig || DEFAULT_PRICE_CONFIG;

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const result = await getSalesInvoiceData(startDate, endDate, 'ALL', undefined, config);

  return {
    ...result,
    isMonthly: true,
    bulan: month,
    tahun: year,
    monthLabel: `${monthNames[month - 1]} ${year}`,
  };
}
