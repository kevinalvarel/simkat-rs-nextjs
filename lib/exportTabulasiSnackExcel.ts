import * as XLSX from 'xlsx';
import type { TabulasiHospitalData } from '@/types/tabulasitypes';

export function exportTabulasiSnackExcel(data: TabulasiHospitalData) {
  const rows: (string | number)[][] = [
    ['TABULASI KEBUTUHAN SNACK PASIEN'],
    [`Tanggal: ${data.tanggal}`, `Waktu: ${data.waktuMakan}`, `Siklus: ${data.siklusNama}`],
    [],
    ['Kategori', 'Nama Snack', 'Kode Mapping', 'Gedung Lama', 'Gedung Baru', 'Total Porsi'],
    ...data.allItems.map((item) => [item.kategori, item.nama_menu, item.kode_diet,
      item.porsi_gedung_lama, item.porsi_gedung_baru, item.total_porsi]),
    ['TOTAL', '', '', data.totalGedungLama, data.totalGedungBaru, data.grandTotalPorsi],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 28 }, { wch: 52 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Tabulasi Snack');
  XLSX.writeFile(book, `Tabulasi-Snack-${data.waktuMakan}-${data.tanggal}.xlsx`);
}
