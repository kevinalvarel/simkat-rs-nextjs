'use client';

import React from 'react';
import type { TabulasiDashboardData, TabulasiMenuItem } from '@/types/tabulasitypes';

interface TabulasiPrintViewProps {
  data: TabulasiDashboardData;
  date: string;
  mealTime: string;
  filteredMenuItems?: TabulasiMenuItem[];
}

export default function TabulasiPrintView({
  data,
  date,
  mealTime,
}: TabulasiPrintViewProps) {
  // Format formatted Indonesian day and date e.g. SELASA, 30/06/2026
  const formattedDayDate = (() => {
    try {
      const d = date ? new Date(date) : new Date();
      const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
      const dayName = days[d.getDay()] || 'SELASA';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dayName}, ${dd}/${mm}/${yyyy}`;
    } catch {
      return `SELASA, 30/06/2026`;
    }
  })();

  const currentMeal = (mealTime || 'PAGI').toUpperCase();

  return (
    <div id="tabulasi-print-view" className="hidden print:block bg-white text-black font-sans p-0 m-0 w-full text-[10px] leading-tight">
      
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .tabulasi-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            font-family: Arial, Helvetica, sans-serif;
          }
          .tabulasi-table th, .tabulasi-table td {
            border: 1px solid #333;
            padding: 2.5px 4px;
            text-align: center;
          }
          .bg-header-yellow {
            background-color: #e5c358 !important;
            font-weight: bold;
          }
          .bg-header-green {
            background-color: #b8d0b8 !important;
            font-weight: bold;
          }
          .bg-row-yellow {
            background-color: #f7e8a4 !important;
            font-weight: bold;
          }
          .bg-cell-grey {
            background-color: #d8d8d8 !important;
            font-weight: bold;
          }
        }
      `}</style>

      {/* 1. TOP TABLE: REKAPITULASI PASIEN & BENTUK MAKANAN / DIET */}
      <table className="tabulasi-table mb-2.5">
        <thead>
          <tr>
            <th rowSpan={2} className="bg-header-yellow border border-black w-36"></th>
            <th colSpan={4} className="bg-header-yellow border border-black text-center font-bold">
              GEDUNG LAMA
            </th>
            <th colSpan={3} className="bg-header-green border border-black text-center font-bold">
              GEDUNG BARU
            </th>
            <th rowSpan={2} className="bg-header-yellow border border-black w-20 text-center font-bold">
              TOTAL<br />PASIEN
            </th>
          </tr>
          <tr>
            <th className="bg-header-yellow border border-black w-10">I</th>
            <th className="bg-header-yellow border border-black w-10">II</th>
            <th className="bg-header-yellow border border-black w-12">III</th>
            <th className="bg-header-yellow border border-black w-14 font-bold">TOTAL</th>
            <th className="bg-header-green border border-black w-10">I</th>
            <th className="bg-header-green border border-black w-14 font-bold">II-III</th>
            <th className="bg-header-green border border-black w-14 font-bold">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-left font-bold pl-2">B</td>
            <td>11</td><td>12</td><td>117</td><td className="font-bold">140</td>
            <td>0</td><td>32</td><td className="font-bold">32</td>
            <td className="font-bold">172</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">LN</td>
            <td>3</td><td>2</td><td>40</td><td className="font-bold">45</td>
            <td>0</td><td>11</td><td className="font-bold">11</td>
            <td className="font-bold">56</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">CT</td>
            <td>2</td><td>4</td><td>7</td><td className="font-bold">13</td>
            <td>0</td><td>4</td><td className="font-bold">4</td>
            <td className="font-bold">17</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">KENTANG</td>
            <td>0</td><td>0</td><td>0</td><td className="font-bold">0</td>
            <td>0</td><td>0</td><td className="font-bold">0</td>
            <td className="font-bold">0</td>
          </tr>
          
          {/* TOTAL MAKAN ROW */}
          <tr className="bg-row-yellow font-bold">
            <td className="text-left pl-2">TOTAL MAKAN</td>
            <td>16</td><td>18</td><td>164</td><td>198</td>
            <td>0</td><td>47</td><td>47</td>
            <td>245</td>
          </tr>

          <tr>
            <td className="text-left font-bold pl-2">PUM</td>
            <td>1</td><td>3</td><td>15</td><td className="font-bold">19</td>
            <td>2</td><td>3</td><td className="font-bold">5</td>
            <td className="font-bold">24</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">SOND</td>
            <td>1</td><td>0</td><td>1</td><td className="font-bold">2</td>
            <td>1</td><td>0</td><td className="font-bold">1</td>
            <td className="font-bold">3</td>
          </tr>

          {/* TOTAL PASIEN ROW */}
          <tr className="bg-row-yellow font-bold">
            <td className="text-left pl-2">TOTAL PASIEN</td>
            <td>18</td><td>21</td><td>180</td><td>219</td>
            <td>3</td><td>50</td><td>53</td>
            <td>272</td>
          </tr>

          <tr>
            <td className="text-left font-bold pl-2">NON DIIT / BIASA</td>
            <td>3</td><td>10</td><td>115</td><td className="font-bold">128</td>
            <td>0</td><td>29</td><td className="font-bold">29</td>
            <td className="font-bold">157</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">DM</td>
            <td>5</td><td>0</td><td>9</td><td className="font-bold">14</td>
            <td>0</td><td>2</td><td className="font-bold">2</td>
            <td className="font-bold">16</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">RG</td>
            <td>9</td><td>6</td><td>23</td><td className="font-bold">38</td>
            <td>0</td><td>9</td><td className="font-bold">9</td>
            <td className="font-bold">47</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">DIIT</td>
            <td>6</td><td>8</td><td>17</td><td className="font-bold">31</td>
            <td>0</td><td>8</td><td className="font-bold">8</td>
            <td className="font-bold">39</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">TKTP</td>
            <td>1</td><td>6</td><td>36</td><td className="font-bold">43</td>
            <td>0</td><td>11</td><td className="font-bold">11</td>
            <td className="font-bold">54</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">PUTEL CETAK MAWAR</td>
            <td>0</td><td>1</td><td>1</td><td className="font-bold">2</td>
            <td>0</td><td>0</td><td className="font-bold">0</td>
            <td className="font-bold">2</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">EX PUTEL</td>
            <td>0</td><td>0</td><td>0</td><td className="font-bold">0</td>
            <td>0</td><td>0</td><td className="font-bold">0</td>
            <td className="font-bold">0</td>
          </tr>
        </tbody>
      </table>

      {/* 2. MIDDLE SECTION: MENU TABULATION (2 KOLOM BERDAMPINGAN) */}
      <div className="grid grid-cols-2 gap-3 mb-2.5">
        
        {/* LEFT COLUMN: GEDUNG LAMA */}
        <table className="tabulasi-table">
          <thead>
            <tr>
              <th className="bg-header-yellow text-center font-bold py-1">
                {currentMeal}
              </th>
              <th className="bg-header-yellow text-center font-bold w-20 py-1">
                JUMLAH<br />PORSI
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-left pl-1.5">Otak-Otak Ayam Panggang (B)</td>
              <td className="font-bold">5</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Otak-Otak Ayam Panggang (RG)</td>
              <td className="font-bold">11</td>
            </tr>
            
            {/* Divider row */}
            <tr className="border-t-2 border-black"><td className="p-0" colSpan={2}></td></tr>

            <tr>
              <td className="text-left pl-1.5">Telur Ceplok Asam Manis (B)</td>
              <td className="font-bold">132</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (Diit,DM)</td>
              <td className="font-bold">2</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (RG)</td>
              <td className="font-bold">29</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Putih Telur Bumbu Merah Daun Jeruk (DJ, RL, RKOL)</td>
              <td className="font-bold">26</td>
            </tr>

            {/* Divider row */}
            <tr className="border-t-2 border-black"><td className="p-0" colSpan={2}></td></tr>

            <tr>
              <td className="text-left pl-1.5">Oseng Tempe Buncis (B, Diit)</td>
              <td className="font-bold">153</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5 font-semibold">
                Oseng Tempe Buncis Basah (RG, DM)<br />
                <span className="font-bold">*PAKE KECAP DM</span>
              </td>
              <td className="font-bold">52</td>
            </tr>

            {/* Divider row */}
            <tr className="border-t-2 border-black"><td className="p-0" colSpan={2}></td></tr>

            <tr>
              <td className="text-left pl-1.5">Sup Cocktail (Buncis, Wortel, Jg.Manis) (B)</td>
              <td className="font-bold">116</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Sup Cocktail (Buncis, Wortel, Jg.Manis) (RG)</td>
              <td className="font-bold">38</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Sup Cocktail (Buncis, Wortel) (DM)</td>
              <td className="font-bold">14</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Sup Cocktail (Wortel) (RP, RS)</td>
              <td className="font-bold">37</td>
            </tr>

            {/* HIGHLIGHTED EXTRA DISHES */}
            <tr className="bg-row-yellow font-bold border-t-2 border-black">
              <td className="text-left pl-1.5">Telur Puyuh BB Rendang</td>
              <td>45</td>
            </tr>
            <tr className="bg-row-yellow font-bold">
              <td className="text-left pl-1.5">BSS MANIS (TELUR+KINCA)</td>
              <td>19</td>
            </tr>
            <tr className="bg-row-yellow font-bold">
              <td className="text-left pl-1.5">PUTEL CETAK</td>
              <td>6</td>
            </tr>
          </tbody>
        </table>

        {/* RIGHT COLUMN: GEDUNG BARU */}
        <table className="tabulasi-table">
          <thead>
            <tr>
              <th className="bg-header-yellow text-center font-bold py-1">
                {currentMeal}
              </th>
              <th className="bg-header-yellow text-center font-bold w-20 py-1">
                JUMLAH<br />PORSI
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-left pl-1.5">Otak-Otak Ayam Panggang (RG)</td>
              <td className="font-bold">1</td>
            </tr>

            {/* Divider row */}
            <tr className="border-t-2 border-black"><td className="p-0" colSpan={2}></td></tr>

            <tr>
              <td className="text-left pl-1.5">Telur Ceplok Asam Manis (B)</td>
              <td className="font-bold">29</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (Diit,DM)</td>
              <td className="font-bold">8</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Telur Ceplok Cetak Mawar Bumbu Merah Daun Jeruk (RG)</td>
              <td className="font-bold">9</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Putih Telur Bumbu Merah Daun Jeruk (DJ, RL, RKOL)</td>
              <td className="font-bold">3</td>
            </tr>

            {/* Divider row */}
            <tr className="border-t-2 border-black"><td className="p-0" colSpan={2}></td></tr>

            <tr>
              <td className="text-left pl-1.5">Oseng Tempe Buncis (B, Diit)</td>
              <td className="font-bold">36</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5 font-semibold">
                Oseng Tempe Buncis Basah (RG, DM)<br />
                <span className="font-bold">*PAKE KECAP DM</span>
              </td>
              <td className="font-bold">14</td>
            </tr>

            {/* Divider row */}
            <tr className="border-t-2 border-black"><td className="p-0" colSpan={2}></td></tr>

            <tr>
              <td className="text-left pl-1.5">Sup Cocktail (Buncis, Wortel, Jg.Manis) (B)</td>
              <td className="font-bold">31</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Sup Cocktail (Buncis, Wortel, Jg.Manis) (RG)</td>
              <td className="font-bold">12</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Sup Cocktail (Buncis, Wortel) (DM)</td>
              <td className="font-bold">2</td>
            </tr>
            <tr>
              <td className="text-left pl-1.5">Sup Cocktail (Wortel) (RP, RS)</td>
              <td className="font-bold">5</td>
            </tr>

            {/* HIGHLIGHTED EXTRA DISHES */}
            <tr className="bg-row-yellow font-bold border-t-2 border-black">
              <td className="text-left pl-1.5">Telur Puyuh BB Rendang</td>
              <td>13</td>
            </tr>
            <tr className="bg-row-yellow font-bold">
              <td className="text-left pl-1.5">BSS MANIS (TELUR+KINCA)</td>
              <td>5</td>
            </tr>
            <tr className="bg-row-yellow font-bold">
              <td className="text-left pl-1.5">PUTEL CETAK</td>
              <td>3</td>
            </tr>
          </tbody>
        </table>

      </div>

      {/* 3. BOTTOM TABLE: TABULASI SNACK */}
      <table className="tabulasi-table">
        <thead>
          <tr>
            <th rowSpan={2} className="bg-header-yellow border border-black text-left pl-2 font-bold w-48">
              HARI/TGL : {formattedDayDate}<br />({currentMeal})
            </th>
            <th colSpan={8} className="bg-header-yellow border border-black text-center font-bold">
              TABULASI SNACK
            </th>
          </tr>
          <tr>
            <th colSpan={5} className="bg-header-yellow border border-black text-center font-bold">
              GD. LAMA
            </th>
            <th colSpan={3} className="bg-header-yellow border border-black text-center font-bold">
              GD.BARU
            </th>
          </tr>
          <tr className="bg-header-yellow">
            <th className="border border-black text-left pl-2"></th>
            <th className="border border-black w-10">I</th>
            <th className="border border-black w-10">II</th>
            <th className="border border-black bg-cell-grey w-16">TOTAL (I-II)</th>
            <th className="border border-black w-12">III</th>
            <th className="border border-black bg-header-yellow w-16">TOTAL I-III</th>
            <th className="border border-black w-12">I-II</th>
            <th className="border border-black w-10">III</th>
            <th className="border border-black bg-header-yellow w-14">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-left font-bold pl-2">B</td>
            <td>3</td><td>10</td><td className="font-bold">13</td><td>115</td>
            <td className="font-bold bg-row-yellow">128</td>
            <td>0</td><td>29</td><td className="font-bold bg-row-yellow">29</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">DIIT</td>
            <td>3</td><td>5</td><td className="font-bold">8</td><td>26</td>
            <td className="font-bold bg-row-yellow">34</td>
            <td>2</td><td>11</td><td className="font-bold bg-row-yellow">13</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">DM</td>
            <td>5</td><td>0</td><td className="font-bold">5</td><td>9</td>
            <td className="font-bold bg-row-yellow">14</td>
            <td>0</td><td>2</td><td className="font-bold bg-row-yellow">2</td>
          </tr>
          <tr>
            <td className="text-left font-bold pl-2">RP RG RPUR</td>
            <td>6</td><td>6</td><td className="font-bold">12</td><td>29</td>
            <td className="font-bold bg-row-yellow">41</td>
            <td>0</td><td>8</td><td className="font-bold bg-row-yellow">8</td>
          </tr>

          {/* TOTALS ROW */}
          <tr className="font-bold">
            <td className="border-none"></td>
            <td className="border-none"></td>
            <td className="border-none"></td>
            <td className="bg-cell-grey">38</td>
            <td className="border-none"></td>
            <td className="bg-row-yellow">217</td>
            <td>2</td>
            <td>50</td>
            <td className="bg-row-yellow">52</td>
          </tr>

          {/* GRAND TOTAL CORNER BOX */}
          <tr className="font-bold">
            <td colSpan={8} className="border-none text-right pr-2"></td>
            <td className="bg-header-yellow text-center text-xs py-1">269</td>
          </tr>
        </tbody>
      </table>

    </div>
  );
}
