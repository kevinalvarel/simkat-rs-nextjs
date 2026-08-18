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
  const rows: any[][] = [];

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
    'GEDUNG LAMA', '', '', '',
    'GEDUNG BARU', '', '', ''
  ]);
  rows.push([
    mealTime.toUpperCase(), 'JUMLAH PORSI', '', '',
    mealTime.toUpperCase(), 'JUMLAH PORSI', '', ''
  ]);

  const leftMenus = [
    ['Otak-Otak Ayam Panggang (B)', 5],
    ['Otak-Otak Ayam Panggang (RG)', 11],
    ['Telur Ceplok Asam Manis (B)', 132],
    ['Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (Diit, DM)', 2],
    ['Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (RG)', 29],
    ['Putih Telur Bumbu Merah Daun Jeruk (DJ, RL, RKOL)', 26],
    ['Oseng Tempe Buncis (B, Diit)', 153],
    ['Oseng Tempe Buncis Basah (RG, DM) *PAKE KECAP DM', 52],
    ['Sup Cocktail (Buncis, Wortel, Jg.Manis) (B)', 116],
    ['Sup Cocktail (Buncis, Wortel, Jg.Manis) (RG)', 38],
    ['Sup Cocktail (Buncis, Wortel) (DM)', 14],
    ['Sup Cocktail (Wortel) (RP, RS)', 37],
    ['Telur Puyuh BB Rendang (EXTRA)', 45],
    ['BSS MANIS (TELUR+KINCA) (EXTRA)', 19],
    ['PUTEL CETAK (EXTRA)', 6],
  ];

  const rightMenus = [
    ['Otak-Otak Ayam Panggang (RG)', 1],
    ['Telur Ceplok Asam Manis (B)', 29],
    ['Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (Diit, DM)', 8],
    ['Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (RG)', 9],
    ['Putih Telur Bumbu Merah Daun Jeruk (DJ, RL, RKOL)', 3],
    ['Oseng Tempe Buncis (B, Diit)', 36],
    ['Oseng Tempe Buncis Basah (RG, DM) *PAKE KECAP DM', 14],
    ['Sup Cocktail (Buncis, Wortel, Jg.Manis) (B)', 31],
    ['Sup Cocktail (Buncis, Wortel, Jg.Manis) (RG)', 12],
    ['Sup Cocktail (Buncis, Wortel) (DM)', 2],
    ['Sup Cocktail (Wortel) (RP, RS)', 5],
    ['Telur Puyuh BB Rendang (EXTRA)', 13],
    ['BSS MANIS (TELUR+KINCA) (EXTRA)', 5],
    ['PUTEL CETAK (EXTRA)', 3],
    ['', ''],
  ];

  const maxLen = Math.max(leftMenus.length, rightMenus.length);
  for (let i = 0; i < maxLen; i++) {
    const l = leftMenus[i] || ['', ''];
    const r = rightMenus[i] || ['', ''];
    rows.push([l[0], l[1], '', '', r[0], r[1], '', '', '']);
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
    { wch: 38 }, // A: Label / Left Menu
    { wch: 10 }, // B: Porsi / I
    { wch: 10 }, // C: II
    { wch: 14 }, // D: Total (I-II)
    { wch: 12 }, // E: Right Menu
    { wch: 38 }, // F: Porsi
    { wch: 10 }, // G: I-II
    { wch: 10 }, // H: III
    { wch: 14 }, // I: Grand Total
  ];

  // Merge headers
  ws['!merges'] = [
    // Top table merges
    { s: { r: 3, c: 1 }, e: { r: 3, c: 4 } }, // GEDUNG LAMA
    { s: { r: 3, c: 5 }, e: { r: 3, c: 7 } }, // GEDUNG BARU
    // Middle table merges
    { s: { r: 20, c: 0 }, e: { r: 20, c: 1 } }, // GEDUNG LAMA
    { s: { r: 20, c: 4 }, e: { r: 20, c: 5 } }, // GEDUNG BARU
    // Snack merges
    { s: { r: 38, c: 1 }, e: { r: 38, c: 8 } }, // TABULASI SNACK
    { s: { r: 39, c: 1 }, e: { r: 39, c: 4 } }, // GD LAMA
    { s: { r: 39, c: 5 }, e: { r: 39, c: 7 } }, // GD BARU
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
                <tr><td class="text-left">Otak-Otak Ayam Panggang (B)</td><td class="bold">5</td></tr>
                <tr><td class="text-left">Otak-Otak Ayam Panggang (RG)</td><td class="bold">11</td></tr>
                <tr><td class="text-left">Telur Ceplok Asam Manis (B)</td><td class="bold">132</td></tr>
                <tr><td class="text-left">Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (Diit,DM)</td><td class="bold">2</td></tr>
                <tr><td class="text-left">Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (RG)</td><td class="bold">29</td></tr>
                <tr><td class="text-left">Putih Telur Bumbu Merah Daun Jeruk (DJ, RL, RKOL)</td><td class="bold">26</td></tr>
                <tr><td class="text-left">Oseng Tempe Buncis (B, Diit)</td><td class="bold">153</td></tr>
                <tr><td class="text-left">Oseng Tempe Buncis Basah (RG, DM) *PAKE KECAP DM</td><td class="bold">52</td></tr>
                <tr><td class="text-left">Sup Cocktail (Buncis, Wortel, Jg.Manis) (B)</td><td class="bold">116</td></tr>
                <tr><td class="text-left">Sup Cocktail (Buncis, Wortel, Jg.Manis) (RG)</td><td class="bold">38</td></tr>
                <tr><td class="text-left">Sup Cocktail (Buncis, Wortel) (DM)</td><td class="bold">14</td></tr>
                <tr><td class="text-left">Sup Cocktail (Wortel) (RP, RS)</td><td class="bold">37</td></tr>
                <tr class="bg-yellow-light bold"><td class="text-left">Telur Puyuh BB Rendang</td><td>45</td></tr>
                <tr class="bg-yellow-light bold"><td class="text-left">BSS MANIS (TELUR+KINCA)</td><td>19</td></tr>
                <tr class="bg-yellow-light bold"><td class="text-left">PUTEL CETAK</td><td>6</td></tr>
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
                <tr><td class="text-left">Otak-Otak Ayam Panggang (RG)</td><td class="bold">1</td></tr>
                <tr><td class="text-left">Telur Ceplok Asam Manis (B)</td><td class="bold">29</td></tr>
                <tr><td class="text-left">Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (Diit,DM)</td><td class="bold">8</td></tr>
                <tr><td class="text-left">Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (RG)</td><td class="bold">9</td></tr>
                <tr><td class="text-left">Putih Telur Bumbu Merah Daun Jeruk (DJ, RL, RKOL)</td><td class="bold">3</td></tr>
                <tr><td class="text-left">Oseng Tempe Buncis (B, Diit)</td><td class="bold">36</td></tr>
                <tr><td class="text-left">Oseng Tempe Buncis Basah (RG, DM) *PAKE KECAP DM</td><td class="bold">14</td></tr>
                <tr><td class="text-left">Sup Cocktail (Buncis, Wortel, Jg.Manis) (B)</td><td class="bold">31</td></tr>
                <tr><td class="text-left">Sup Cocktail (Buncis, Wortel, Jg.Manis) (RG)</td><td class="bold">12</td></tr>
                <tr><td class="text-left">Sup Cocktail (Buncis, Wortel) (DM)</td><td class="bold">2</td></tr>
                <tr><td class="text-left">Sup Cocktail (Wortel) (RP, RS)</td><td class="bold">5</td></tr>
                <tr class="bg-yellow-light bold"><td class="text-left">Telur Puyuh BB Rendang</td><td>13</td></tr>
                <tr class="bg-yellow-light bold"><td class="text-left">BSS MANIS (TELUR+KINCA)</td><td>5</td></tr>
                <tr class="bg-yellow-light bold"><td class="text-left">PUTEL CETAK</td><td>3</td></tr>
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
