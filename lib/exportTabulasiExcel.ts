import * as XLSX from 'xlsx';
import type { TabulasiDashboardData } from '@/types/tabulasitypes';

/**
 * Generate Excel file formatted exactly like the official hospital physical tabulation document
 */
export function exportTabulasiToExcel(
  data: TabulasiDashboardData,
  dateStr: string = '30/06/2026',
  mealTime: string = 'PAGI'
) {
  const wb = XLSX.utils.book_new();

  // 1. Construct Rows matching the physical paper sheet
  const rows: (string | number)[][] = [];

  // Title / Blank
  rows.push(['TABULASI KEBUTUHAN MAKANAN PASIEN INSTALASI GIZI RS']);
  rows.push([`HARI/TANGGAL: ${dateStr.toUpperCase()}`, '', '', '', '', `WAKTU MAKAN: ${mealTime.toUpperCase()}`]);
  rows.push([]); // Spacer

  // --- SECTION 1: TOP REKAPITULASI PASIEN & DIET ---
  rows.push([
    '',
    'GEDUNG LAMA', '', '', '',
    'GEDUNG BARU', '', '',
    'TOTAL PASIEN'
  ]);
  rows.push([
    'BENTUK / DIET',
    'I', 'II', 'III', 'TOTAL',
    'I', 'II-III', 'TOTAL',
    ''
  ]);

  // Section 1 Data Rows
  rows.push(['B', 11, 12, 117, 140, 0, 32, 32, 172]);
  rows.push(['LN', 3, 2, 40, 45, 0, 11, 11, 56]);
  rows.push(['CT', 2, 4, 7, 13, 0, 4, 4, 17]);
  rows.push(['KENTANG', 0, 0, 0, 0, 0, 0, 0, 0]);
  rows.push(['TOTAL MAKAN', 16, 18, 164, 198, 0, 47, 47, 245]);
  rows.push(['PUM / PUASA', 1, 3, 15, 19, 2, 3, 5, 24]);
  rows.push(['SOND', 1, 0, 1, 2, 1, 0, 1, 3]);
  rows.push(['TOTAL PASIEN', 18, 21, 180, 219, 3, 50, 53, 272]);
  rows.push(['NON DIIT / BIASA', 3, 10, 115, 128, 0, 29, 29, 157]);
  rows.push(['DM', 5, 0, 9, 14, 0, 2, 2, 16]);
  rows.push(['RG', 9, 6, 23, 38, 0, 9, 9, 47]);
  rows.push(['DIIT', 6, 8, 17, 31, 0, 8, 8, 39]);
  rows.push(['TKTP', 1, 6, 36, 43, 0, 11, 11, 54]);
  rows.push(['PUTEL CETAK MAWAR', 0, 1, 1, 2, 0, 0, 0, 2]);
  rows.push(['EX PUTEL', 0, 0, 0, 0, 0, 0, 0, 0]);
  rows.push([]); // Spacer

  // --- SECTION 2: MIDDLE MENU TABULATION (GEDUNG LAMA & GEDUNG BARU) ---
  rows.push([
    'GEDUNG LAMA', '', '',
    'GEDUNG BARU', '', ''
  ]);
  rows.push([
    'KATEGORI', `${mealTime.toUpperCase()} (MENU HIDANGAN)`, 'DIET', 'JUMLAH PORSI',
    'KATEGORI', `${mealTime.toUpperCase()} (MENU HIDANGAN)`, 'DIET', 'JUMLAH PORSI'
  ]);

  if (data.hospitalData && data.hospitalData.allItems && data.hospitalData.allItems.length > 0) {
    for (const item of data.hospitalData.allItems) {
      rows.push([
        item.kategori,
        item.nama_menu,
        item.kode_diet,
        item.porsi_gedung_lama,
        item.kategori,
        item.nama_menu,
        item.kode_diet,
        item.porsi_gedung_baru,
      ]);
    }

    // Baris baru TKTP GABUNGAN: satu baris total semua kelas, plus rincian
    // Kelas I/II/III di nama bila varian beda hari itu.
    const gab = data.hospitalData.tktpGabungan;
    if (gab && gab.total_porsi > 0) {
      const namaLama = gab.is_uniform
        ? gab.nama_menu
        : `${gab.nama_menu} (Lama I:${gab.rincian_lama.kelas_1} II:${gab.rincian_lama.kelas_2} III:${gab.rincian_lama.kelas_3})`;
      const namaBaru = gab.is_uniform
        ? gab.nama_menu
        : `${gab.nama_menu} (Baru I:${gab.rincian_baru.kelas_1} II:${gab.rincian_baru.kelas_2} III:${gab.rincian_baru.kelas_3})`;
      rows.push([
        'TKTP GABUNGAN',
        namaLama,
        'TKTP',
        gab.porsi_gedung_lama,
        'TKTP GABUNGAN',
        namaBaru,
        'TKTP',
        gab.porsi_gedung_baru,
      ]);
    }

    rows.push([
      'TOTAL PORSI GEDUNG LAMA', '', '', data.hospitalData.totalGedungLama,
      'TOTAL PORSI GEDUNG BARU', '', '', data.hospitalData.totalGedungBaru
    ]);
  } else {
    const leftMenus = [
      ['HEWANI KELAS 1', 'Nasi Tim + Suir Ayam bb balado', 'B', 3],
      ['HEWANI KELAS 1', 'Suir Ayam (Iris + Rebus )', 'DM, RG', 17],
      ['HEWANI KELAS 2 DAN 3', 'Suir Ayam (Iris + Rebus )', 'B', 89],
      ['HEWANI KELAS 2 DAN 3', 'Tanpa Cakue (RG,DM)', 'RG, DM', 41],
      ['HEWANI KELAS 2 DAN 3', 'Telur rebus (seporsi 1/2 butir) (B, D, DM,RG)', 'B, D, DM, RG', 138],
      ['HEWANI KELAS 2 DAN 3', 'Putih telur cetak mawar ( DJ, RL, Rkol)', 'DJ, RL, Rkol', 19],
      ['NABATI', 'Sup labu siam, Tahu, Oyong (B, Diit, DM)', 'B, Diit, DM', 136],
      ['NABATI', 'Sup labu siam, Tahu, Oyong (RG)', 'RG', 31],
      ['NABATI', 'Sup Labu siam, Tahu (RS)', 'RS', 1],
      ['NABATI', 'Sup Labu siam (RP)', 'RP', 9],
      ['TKTP', 'Telur BB Kecap (Untuk tim ayam)', 'TKTP', 3],
      ['TKTP', 'Ayam Suwir BB Balado (Untuk bubur ayam)', 'TKTP', 40],
    ];

    const rightMenus = [
      ['HEWANI KELAS 1', 'Nasi Tim + Suir Ayam bb balado', 'B', 1],
      ['HEWANI KELAS 1', 'Suir Ayam (Iris + Rebus )', 'DM, RG', 1],
      ['HEWANI KELAS 2 DAN 3', 'Suir Ayam (Iris + Rebus )', 'B', 11],
      ['HEWANI KELAS 2 DAN 3', 'Tanpa Cakue (RG,DM)', 'RG, DM', 15],
      ['HEWANI KELAS 2 DAN 3', 'Telur rebus (seporsi 1/2 butir) (B, D, DM,RG)', 'B, D, DM, RG', 31],
      ['HEWANI KELAS 2 DAN 3', 'Putih telur cetak mawar ( DJ, RL, Rkol)', 'DJ, RL, Rkol', 4],
      ['NABATI', 'Sup labu siam, Tahu, Oyong (B, Diit, DM)', 'B, Diit, DM', 17],
      ['NABATI', 'Sup labu siam, Tahu, Oyong (RG)', 'RG', 14],
      ['NABATI', 'Sup Labu siam, Tahu (RS)', 'RS', 3],
      ['NABATI', 'Sup Labu siam (RP)', 'RP', 1],
      ['TKTP', 'Telur BB Kecap (Untuk tim ayam)', 'TKTP', 0],
      ['TKTP', 'Ayam Suwir BB Balado (Untuk bubur ayam)', 'TKTP', 13],
    ];

    const maxLen = Math.max(leftMenus.length, rightMenus.length);
    for (let i = 0; i < maxLen; i++) {
      const l = leftMenus[i] || ['', '', '', ''];
      const r = rightMenus[i] || ['', '', '', ''];
      rows.push([l[0], l[1], l[2], l[3], r[0], r[1], r[2], r[3]]);
    }
  }
  rows.push([]); // Spacer

  // --- SECTION 3: TABULASI SNACK ---
  rows.push([
    `HARI/TGL : ${dateStr.toUpperCase()} (${mealTime.toUpperCase()})`,
    'TABULASI SNACK', '', '', '', '', '', '', ''
  ]);
  rows.push([
    '',
    'GD. LAMA', '', '', '',
    'GD.BARU', '', '',
    'TOTAL'
  ]);
  rows.push([
    'DIET',
    'I', 'II', 'TOTAL (I-II)', 'III', 'TOTAL I-III',
    'I-II', 'III', 'TOTAL'
  ]);

  rows.push(['B', 3, 10, 13, 115, 128, 0, 29, 29]);
  rows.push(['DIIT', 3, 5, 8, 26, 34, 2, 11, 13]);
  rows.push(['DM', 5, 0, 5, 9, 14, 0, 2, 2]);
  rows.push(['RP RG RPUR', 6, 6, 12, 29, 41, 0, 8, 8]);
  rows.push(['TOTAL', '', '', 38, '', 217, 2, 50, 52, 269]);

  // Convert array to worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 22 }, // A: Kategori Lama
    { wch: 38 }, // B: Menu Lama
    { wch: 14 }, // C: Diet Lama
    { wch: 14 }, // D: Porsi Lama
    { wch: 22 }, // E: Kategori Baru
    { wch: 38 }, // F: Menu Baru
    { wch: 14 }, // G: Diet Baru
    { wch: 14 }, // H: Porsi Baru
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Tabulasi Gizi');

  // Trigger download
  const cleanDate = dateStr.replace(/[\/\s:]+/g, '-');
  const filename = `Tabulasi-Gizi-${mealTime}-${cleanDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Generate formatted HTML Excel sheet (.xls) preserving exact colors and table borders
 */
export function exportTabulasiToHtmlExcel(
  data: TabulasiDashboardData,
  dateStr: string = '30/06/2026',
  mealTime: string = 'PAGI'
) {
  // Tabel tengah dibuat dinamis dari data nyata (bukan contoh statis),
  // agar baris TKTP GABUNGAN ikut tercetak.
  const escHtml = (v: string | number) =>
    String(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  const excelItems = data.hospitalData?.allItems ?? [];
  const excelGab = data.hospitalData?.tktpGabungan ?? null;
  const gabLamaLabel =
    excelGab && !excelGab.is_uniform
      ? ` (Lama I:${excelGab.rincian_lama.kelas_1} II:${excelGab.rincian_lama.kelas_2} III:${excelGab.rincian_lama.kelas_3})`
      : '';
  const gabBaruLabel =
    excelGab && !excelGab.is_uniform
      ? ` (Baru I:${excelGab.rincian_baru.kelas_1} II:${excelGab.rincian_baru.kelas_2} III:${excelGab.rincian_baru.kelas_3})`
      : '';
  const middleLamaRows =
    excelItems
      .map(
        (it) =>
          `<tr><td class="text-left">${escHtml(it.nama_menu)} (${escHtml(it.kode_diet)})</td><td class="bold">${it.porsi_gedung_lama}</td></tr>`,
      )
      .join('') +
    (excelGab && excelGab.total_porsi > 0
      ? `<tr class="bg-yellow-light bold"><td class="text-left">TKTP GABUNGAN: ${escHtml(excelGab.nama_menu)}${escHtml(gabLamaLabel)}</td><td>${excelGab.porsi_gedung_lama}</td></tr>`
      : '');
  const middleBaruRows =
    excelItems
      .map(
        (it) =>
          `<tr><td class="text-left">${escHtml(it.nama_menu)} (${escHtml(it.kode_diet)})</td><td class="bold">${it.porsi_gedung_baru}</td></tr>`,
      )
      .join('') +
    (excelGab && excelGab.total_porsi > 0
      ? `<tr class="bg-yellow-light bold"><td class="text-left">TKTP GABUNGAN: ${escHtml(excelGab.nama_menu)}${escHtml(gabBaruLabel)}</td><td>${excelGab.porsi_gedung_baru}</td></tr>`
      : '');
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Tabulasi Gizi</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #000000; padding: 4px 6px; text-align: center; }
        .text-left { text-align: left !important; }
        .text-right { text-align: right !important; }
        .bg-yellow { background-color: #E5C358 !important; font-weight: bold; }
        .bg-yellow-light { background-color: #F7E8A4 !important; }
        .bg-green { background-color: #B8D0B8 !important; font-weight: bold; }
        .bg-grey { background-color: #D3D3D3 !important; font-weight: bold; }
        .bold { font-weight: bold; }
      </style>
    </head>
    <body>
      
      <!-- TOP TABLE: REKAPITULASI PASIEN -->
      <table>
        <thead>
          <tr>
            <th rowspan="2" class="bg-yellow"></th>
            <th colspan="4" class="bg-yellow">GEDUNG LAMA</th>
            <th colspan="3" class="bg-green">GEDUNG BARU</th>
            <th rowspan="2" class="bg-yellow">TOTAL PASIEN</th>
          </tr>
          <tr>
            <th class="bg-yellow">I</th>
            <th class="bg-yellow">II</th>
            <th class="bg-yellow">III</th>
            <th class="bg-yellow">TOTAL</th>
            <th class="bg-green">I</th>
            <th class="bg-green">II-III</th>
            <th class="bg-green">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="text-left bold">B</td><td>11</td><td>12</td><td>117</td><td class="bold">140</td><td>0</td><td>32</td><td class="bold">32</td><td class="bold">172</td></tr>
          <tr><td class="text-left bold">LN</td><td>3</td><td>2</td><td>40</td><td class="bold">45</td><td>0</td><td>11</td><td class="bold">11</td><td class="bold">56</td></tr>
          <tr><td class="text-left bold">CT</td><td>2</td><td>4</td><td>7</td><td class="bold">13</td><td>0</td><td>4</td><td class="bold">4</td><td class="bold">17</td></tr>
          <tr><td class="text-left bold">KENTANG</td><td>0</td><td>0</td><td>0</td><td class="bold">0</td><td>0</td><td>0</td><td class="bold">0</td><td class="bold">0</td></tr>
          <tr class="bg-yellow-light bold"><td class="text-left">TOTAL MAKAN</td><td>16</td><td>18</td><td>164</td><td>198</td><td>0</td><td>47</td><td>47</td><td>245</td></tr>
          <tr><td class="text-left bold">PUM</td><td>1</td><td>3</td><td>15</td><td class="bold">19</td><td>2</td><td>3</td><td class="bold">5</td><td class="bold">24</td></tr>
          <tr><td class="text-left bold">SOND</td><td>1</td><td>0</td><td>1</td><td class="bold">2</td><td>1</td><td>0</td><td class="bold">1</td><td class="bold">3</td></tr>
          <tr class="bg-yellow-light bold"><td class="text-left">TOTAL PASIEN</td><td>18</td><td>21</td><td>180</td><td>219</td><td>3</td><td>50</td><td>53</td><td>272</td></tr>
          <tr><td class="text-left bold">NON DIIT / BIASA</td><td>3</td><td>10</td><td>115</td><td class="bold">128</td><td>0</td><td>29</td><td class="bold">29</td><td class="bold">157</td></tr>
          <tr><td class="text-left bold">DM</td><td>5</td><td>0</td><td>9</td><td class="bold">14</td><td>0</td><td>2</td><td class="bold">2</td><td class="bold">16</td></tr>
          <tr><td class="text-left bold">RG</td><td>9</td><td>6</td><td>23</td><td class="bold">38</td><td>0</td><td>9</td><td class="bold">9</td><td class="bold">47</td></tr>
          <tr><td class="text-left bold">DIIT</td><td>6</td><td>8</td><td>17</td><td class="bold">31</td><td>0</td><td>8</td><td class="bold">8</td><td class="bold">39</td></tr>
          <tr><td class="text-left bold">TKTP</td><td>1</td><td>6</td><td>36</td><td class="bold">43</td><td>0</td><td>11</td><td class="bold">11</td><td class="bold">54</td></tr>
          <tr><td class="text-left bold">PUTEL CETAK MAWAR</td><td>0</td><td>1</td><td>1</td><td class="bold">2</td><td>0</td><td>0</td><td class="bold">0</td><td class="bold">2</td></tr>
          <tr><td class="text-left bold">EX PUTEL</td><td>0</td><td>0</td><td>0</td><td class="bold">0</td><td>0</td><td>0</td><td class="bold">0</td><td class="bold">0</td></tr>
        </tbody>
      </table>

      <!-- MIDDLE TABLE: MENU TABULATION -->
      <table style="width: 100%;">
        <tr>
          <!-- GEDUNG LAMA -->
          <td style="width: 50%; vertical-align: top; padding: 0 4px 0 0; border: none;">
            <table>
              <thead>
                <tr class="bg-yellow">
                  <th class="text-left">GEDUNG LAMA (${mealTime.toUpperCase()})</th>
                  <th>JUMLAH PORSI</th>
                </tr>
              </thead>
              <tbody>
                ${middleLamaRows}
              </tbody>
            </table>
          </td>

          <!-- GEDUNG BARU -->
          <td style="width: 50%; vertical-align: top; padding: 0 0 0 4px; border: none;">
            <table>
              <thead>
                <tr class="bg-yellow">
                  <th class="text-left">GEDUNG BARU (${mealTime.toUpperCase()})</th>
                  <th>JUMLAH PORSI</th>
                </tr>
              </thead>
              <tbody>
                ${middleBaruRows}
              </tbody>
            </table>
          </td>
        </tr>
      </table>

      <!-- BOTTOM TABLE: TABULASI SNACK -->
      <table>
        <thead>
          <tr>
            <th rowspan="2" class="text-left bg-yellow" style="width: 25%;">HARI/TGL : ${dateStr.toUpperCase()} (${mealTime.toUpperCase()})</th>
            <th colspan="8" class="bg-yellow">TABULASI SNACK</th>
          </tr>
          <tr>
            <th colspan="5" class="bg-yellow">GD. LAMA</th>
            <th colspan="3" class="bg-yellow">GD.BARU</th>
          </tr>
          <tr class="bg-yellow">
            <th class="text-left">KATEGORI DIET</th>
            <th>I</th>
            <th>II</th>
            <th class="bg-grey">TOTAL (I-II)</th>
            <th>III</th>
            <th class="bg-yellow">TOTAL I-III</th>
            <th>I-II</th>
            <th>III</th>
            <th class="bg-yellow">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="text-left bold">B</td><td>3</td><td>10</td><td class="bold">13</td><td>115</td><td class="bold bg-yellow-light">128</td><td>0</td><td>29</td><td class="bold bg-yellow-light">29</td></tr>
          <tr><td class="text-left bold">DIIT</td><td>3</td><td>5</td><td class="bold">8</td><td>26</td><td class="bold bg-yellow-light">34</td><td>2</td><td>11</td><td class="bold bg-yellow-light">13</td></tr>
          <tr><td class="text-left bold">DM</td><td>5</td><td>0</td><td class="bold">5</td><td>9</td><td class="bold bg-yellow-light">14</td><td>0</td><td>2</td><td class="bold bg-yellow-light">2</td></tr>
          <tr><td class="text-left bold">RP RG RPUR</td><td>6</td><td>6</td><td class="bold">12</td><td>29</td><td class="bold bg-yellow-light">41</td><td>0</td><td>8</td><td class="bold bg-yellow-light">8</td></tr>
          <tr class="bold">
            <td class="text-left bg-yellow-light">TOTAL</td>
            <td></td>
            <td></td>
            <td class="bg-grey">38</td>
            <td></td>
            <td class="bg-yellow">217</td>
            <td>2</td>
            <td>50</td>
            <td class="bg-yellow">52</td>
          </tr>
          <tr class="bold bg-yellow" style="font-size: 13pt;">
            <td colspan="8" class="text-right">GRAND TOTAL SNACK:</td>
            <td>269</td>
          </tr>
        </tbody>
      </table>

    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanDate = dateStr.replace(/[\/\s:]+/g, '-');
  link.href = url;
  link.download = `Tabulasi-RS-${mealTime}-${cleanDate}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
