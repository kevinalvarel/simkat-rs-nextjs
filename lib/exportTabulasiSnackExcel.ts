import * as XLSX from 'xlsx';
import type { TabulasiHospitalData } from '@/types/tabulasitypes';

export function exportTabulasiSupplementExcel(data: TabulasiHospitalData, kind: 'SNACK' | 'BUAH' = 'SNACK') {
  const label = kind === 'BUAH' ? 'BUAH' : 'SNACK';
  const itemLabel = kind === 'BUAH' ? 'Nama Buah' : 'Nama Snack';
  const rows: (string | number)[][] = [
    [`TABULASI KEBUTUHAN ${label} PASIEN`],
    [`Tanggal: ${data.tanggal}`, `Waktu: ${data.waktuMakan}`, `Siklus: ${data.siklusNama}`],
    [],
    ['Kategori', itemLabel, 'Kode Mapping', 'Gedung Lama', 'Gedung Baru', 'Total Porsi'],
    ...data.allItems.map((item) => [item.kategori, item.nama_menu, item.kode_diet,
      item.porsi_gedung_lama, item.porsi_gedung_baru, item.total_porsi]),
    ['TOTAL', '', '', data.totalGedungLama, data.totalGedungBaru, data.grandTotalPorsi],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 28 }, { wch: 52 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, `Tabulasi ${label === 'BUAH' ? 'Buah' : 'Snack'}`);
  XLSX.writeFile(book, `Tabulasi-${label === 'BUAH' ? 'Buah' : 'Snack'}-${data.waktuMakan}-${data.tanggal}.xlsx`);
}

export function exportTabulasiSnackExcel(data: TabulasiHospitalData) {
  exportTabulasiSupplementExcel(data, 'SNACK');
}

export function exportTabulasiBuahExcel(data: TabulasiHospitalData) {
  exportTabulasiSupplementExcel(data, 'BUAH');
}
