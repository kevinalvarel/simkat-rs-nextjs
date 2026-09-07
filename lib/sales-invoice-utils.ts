/**
 * Pure utility functions and constants for Sales Invoice (Faktur Penjualan).
 * NOT a server action file — can be imported freely from both client and server.
 */

import type { SalesInvoicePriceConfig } from '@/types/invoicetypes';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT PRICE CONFIGURATION (Rp per Porsi)
// Based on the reference document from PT. Tradco Energy Indonesia
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_PRICE_CONFIG: SalesInvoicePriceConfig = {
  tktpKelas1: 21800,
  tktpKelas2: 19800,
  tktpKelas3: 18800,
  makanPasienKelas1: 21900,
  makanPasienKelas2: 19800,
  makanPasienKelas3: 18800,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TERBILANG (Number to Indonesian text)
// ═══════════════════════════════════════════════════════════════════════════════

const SATUAN = [
  '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
  'Enam', 'Tujuh', 'Delapan', 'Sembilan',
];
const BELASAN = [
  'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas',
  'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas',
];

function terbilangHelper(n: number): string {
  if (n < 0) return 'Minus ' + terbilangHelper(-n);
  if (n === 0) return '';
  if (n < 10) return SATUAN[n];
  if (n < 20) return BELASAN[n - 10];
  if (n < 100) {
    const puluhan = Math.floor(n / 10);
    const sisa = n % 10;
    return SATUAN[puluhan] + ' Puluh' + (sisa ? ' ' + SATUAN[sisa] : '');
  }
  if (n < 200) return 'Seratus' + (n - 100 > 0 ? ' ' + terbilangHelper(n - 100) : '');
  if (n < 1000) {
    const ratusan = Math.floor(n / 100);
    const sisa = n % 100;
    return SATUAN[ratusan] + ' Ratus' + (sisa ? ' ' + terbilangHelper(sisa) : '');
  }
  if (n < 2000) return 'Seribu' + (n - 1000 > 0 ? ' ' + terbilangHelper(n - 1000) : '');
  if (n < 1_000_000) {
    const ribuan = Math.floor(n / 1000);
    const sisa = n % 1000;
    return terbilangHelper(ribuan) + ' Ribu' + (sisa ? ' ' + terbilangHelper(sisa) : '');
  }
  if (n < 1_000_000_000) {
    const jutaan = Math.floor(n / 1_000_000);
    const sisa = n % 1_000_000;
    return terbilangHelper(jutaan) + ' Juta' + (sisa ? ' ' + terbilangHelper(sisa) : '');
  }
  if (n < 1_000_000_000_000) {
    const miliaran = Math.floor(n / 1_000_000_000);
    const sisa = n % 1_000_000_000;
    return terbilangHelper(miliaran) + ' Miliar' + (sisa ? ' ' + terbilangHelper(sisa) : '');
  }
  const triliunan = Math.floor(n / 1_000_000_000_000);
  const sisa = n % 1_000_000_000_000;
  return terbilangHelper(triliunan) + ' Triliun' + (sisa ? ' ' + terbilangHelper(sisa) : '');
}

/** Convert number to Indonesian terbilang text + "Rupiah" */
export function angkaTerbilang(n: number): string {
  if (n === 0) return 'Nol Rupiah';
  return terbilangHelper(Math.round(n)).trim() + ' Rupiah';
}
