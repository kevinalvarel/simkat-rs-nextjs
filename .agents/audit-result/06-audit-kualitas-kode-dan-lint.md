# Audit Kualitas Kode, TypeScript, dan Linter SIMKAT RS

Dokumen ini memuat hasil pengujian statis terhadap kualitas kode program, ketahanan tipe data TypeScript, kepatuhan linter ESLint, serta temuan peringatan pada pustaka React 19.

## 1. Hasil Uji Kompilasi TypeScript

- Perintah Uji: npx tsc --noEmit
- Status: Lolos dengan sempurna (Exit Code: 0)
- Jumlah Eror: 0 eror kompilasi
- Evaluasi:
  Konfigurasi tsconfig.json berjalan dalam mode ketat (strict: true). Seluruh modul impor, tipe generic Drizzle ORM, tipe properti komponen, dan parameter fungsi terikat dengan benar tanpa kegagalan tipe data statis.

## 2. Hasil Uji Linter ESLint

- Perintah Uji: npm run lint
- Status: 134 temuan (33 eror, 101 peringatan)
- Kategori Temuan:

### A. Penggunaan Tipe any (@typescript-eslint/no-explicit-any)
Ditemukan penggunaan tipe any eksplisit yang memicu eror linter:
1. servers/invoice.service.ts (baris 154 dan 291): Digunakan pada variabel agregasi matriks.
2. servers/user.service.ts (baris 162): Digunakan pada penanganan objek eror kueri.
3. servers/otorisasi-diet.service.ts (baris 228): Digunakan pada parsing nilai JSON data lama.
4. lib/exportTabulasiExcel.ts (baris 15): Didefinisikan sebagai array baris Excel (const rows: any[][] = []).
5. lib/npo-utils.ts (baris 38): Parameter pengecekan NPO (record?: PatientNpoCheckInput | any).
6. scratch/test-siklus-features.ts: Berkas pengujian sementara di folder scratch.

Rekomendasi Solusi:
Ganti any dengan tipe generic record terdefinisi (misalnya Record<string, unknown> atau unknown dengan type guard) agar mematuhi aturan SOW Bagian 6 dan menghilangkan eror linter.

### B. Variabel Tidak Digunakan (@typescript-eslint/no-unused-vars)
Mayoritas dari 101 peringatan linter disebabkan oleh variabel atau parameter fungsi yang dideklarasikan namun belum terpakai:
- Variabel penampung eror (_) pada blok try catch di servers/patient.service.ts, servers/riwayat-history.service.ts, servers/revisi-snapshot.service.ts, dan servers/otorisasi-diet.service.ts.
- Properti komponen yang tidak dibaca pada components/ag-rs/data-pasien/ui/EmptyBedRow.tsx (properti gedung) dan InlineAddRow.tsx.
- Variabel konstanta pembantu yang tidak terpakai pada servers/overview.service.ts (MISSING_CYCLE_MENU_TEXT, labelMap, defaultLabels).

Rekomendasi Solusi:
Hapus deklarasi variabel yang tidak dipakai atau gunakan opsi ESLint yang mengizinkan awalan garis bawah jika memang disiapkan untuk pengembangan masa depan.

### C. Peringatan Hook React (react-hooks/set-state-in-effect)
Pada berkas hooks/use-mobile.ts baris 14:
- Masalah:
  Fungsi setIsMobile dipanggil secara sinkron langsung di dalam badan useEffect:
  setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
- Dampak:
  React 19 dan React Compiler menandai pola ini sebagai potensi pemicu render berantai (cascading renders) yang dapat mengurangi performa antarmuka.
- Rekomendasi Solusi:
  Inisialisasi nilai awal state secara langsung saat pemanggilan useState:
  const [isMobile, setIsMobile] = React.useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false);

### D. Peringatan Kompatibilitas React Compiler
Pada berkas components/ag-rs/data-pasien/ui/PatientFormDialog.tsx baris 76:
- Masalah:
  Penggunaan form.watch('gedung') dari React Hook Form dilewati dari memoization otomatis oleh React Compiler karena watch() mengembalikan fungsi dinamis.
- Rekomendasi Solusi:
  Gunakan hook useWatch dari React Hook Form untuk pembacaan nilai field form yang terisolasi dan ramah memoization.

## 3. Evaluasi Berkas Pengujian dan Folder Scratch

1. Kondisi Testing Otomatis:
   Belum ditemukan berkas pengujian otomatis unit test (seperti Vitest atau Jest) pada direktori proyek.
2. Keberadaan Berkas Uji Manual:
   Terdapat tiga berkas skrip uji manual pada folder scratch/:
   - scratch/check-batches.ts
   - scratch/test-drizzle-date.ts
   - scratch/test-siklus-features.ts
3. Rekomendasi:
   Pindahkan skrip pembuktian konsep dari folder scratch/ ke dalam test suite terstruktur menggunakan Vitest jika tim berencana menerapkan integrasi berkelanjutan (CI/CD).
