# Ringkasan Eksekutif Audit Sistem SIMKAT RS

Dokumen ini memuat hasil evaluasi menyeluruh terhadap aplikasi SIMKAT RS (Sistem Manajemen Katering dan Gizi Rumah Sakit). Pemeriksaan ini mencakup arsitektur aplikasi, skema basis data, logika bisnis pada server, komponen antarmuka, autentikasi, serta kepatuhan terhadap Scope of Work.

## 1. Ikhtisar Sistem

Aplikasi SIMKAT RS dibangun untuk menjembatani dua bagian utama dalam tata kelola nutrisi pasien:
1. Ahli Gizi Rumah Sakit (gizi-rs): Bertanggung jawab atas pengelolaan data pasien rawat inap, penentuan diet klinis, mutasi ruangan, serta status puasa (NPO).
2. Ahli Gizi Katering (gizi-katering): Bertanggung jawab atas standardisasi diet (mapping diet), penyusunan siklus menu makanan, penguncian snapshot produksi, tabulasi rekapitulasi, cetak etiket, cetak DPMP, serta penagihan (faktur pengiriman dan faktur penjualan).
3. Supervisor: Bertanggung jawab atas otorisasi perubahan diet darurat setelah snapshot terkunci, konfigurasi master fasilitas, dan tata kelola akun pengguna.

## 2. Skor Kesehatan Sistem

Secara keseluruhan, sistem ini berada pada tingkat kematangan tinggi dan siap digunakan pada lingkungan produksi dengan catatan perbaikan kecil.

| Area Audit | Nilai (0 sampai 100) | Status | Ringkasan Kondisi |
|---|---|---|---|
| Arsitektur dan Alur Bisnis | 94 | Sangat Baik | Alur snapshot, siklus menu, dan tabulasi dirancang sangat rapi |
| Kepatuhan Scope of Work | 92 | Sangat Baik | Tidak menggunakan folder src, CSS global bersih, tipe data terpusat |
| Basis Data dan Skema | 86 | Baik | Desain tabel lengkap, terdapat catatan kecil pada kolom gedung untuk kamar |
| Server dan Logika Bisnis | 88 | Baik | Layanan lengkap dan modular, penanganan zona waktu WIB sangat disiplin |
| Keamanan dan Autentikasi | 82 | Cukup Baik | Autentikasi Better Auth berjalan, perlu penguatan sesi di Server Actions |
| Kualitas Kode dan Lint | 84 | Baik | Lolos kompilasi TypeScript nol eror, terdapat peringatan linter dan any |

Skor Rata Rata: 87.7 / 100 (Predikat: Sangat Layak Produksi)

## 3. Kekuatan Utama Sistem

1. Penanganan Zona Waktu yang Sangat Rapi:
   Aplikasi memiliki modul wib.ts sebagai satu sumber kebenaran waktu Asia/Jakarta. Hal ini mencegah bug pergeseran tanggal saat pergantian hari pada server Next.js.

2. Konsep Snapshot Terkunci yang Matang:
   Mekanisme snapshot memisahkan data pasien dinamis dengan data produksi dapur. Dapur katering mendapatkan kepastian porsi tanpa terganggu oleh perubahan data di tengah jam memasak.

3. Kepatuhan Tinggi Terhadap Scope of Work:
   Proyek ini mematuhi prinsip inti: tidak membuat folder src, menjaga globals.css tetap bersih tanpa kelas komponen lokal, dan memusatkan berkas definisi tipe pada folder types.

4. Sinkronisasi Antar Tab yang Cepat:
   Implementasi BroadcastChannel pada modul realtime-sync.ts memungkinkan pembaruan instan pada browser tanpa jeda saat terjadi perubahan status pasien atau snapshot.

5. Ketahanan Tipe TypeScript:
   Pemeriksaan ketat tsc berjalan tanpa ada eror kompilasi sedikit pun (0 eror pada mode strict).

## 4. Temuan Kritis yang Perlu Perhatian

1. Keamanan Server Actions (Defense in Depth):
   Meskipun halaman admin dilindungi pada tingkat layout, beberapa fungsi Server Actions pada servers/user.service.ts dan servers/snapshot.service.ts belum memeriksa sesi pengguna secara eksplisit di dalam fungsi. Kami menyarankan penambahan pengecekan sesi pada setiap mutasi data sensitif.

2. Makna Kolom gedung pada Tabel Pasien:
   Pada tabel pasienTable, kolom gedung saat ini digunakan secara praktis untuk menyimpan nomor kamar. Hal ini terdokumentasi dengan baik pada kode kamar-occupancy.ts, namun perlu diselaraskan dalam jangka panjang agar penamaan skema konsisten.

3. Penggunaan Tipe any pada Beberapa Berkas Layanan:
   Ditemukan penggunaan any pada berkas servers/invoice.service.ts, servers/user.service.ts, lib/npo-utils.ts, dan lib/exportTabulasiExcel.ts yang memicu peringatan ESLint.

4. Peringatan Hook React pada use-mobile.ts:
   Terdapat pemanggilan setState langsung di dalam useEffect pada berkas hooks/use-mobile.ts yang memicu peringatan render bertingkat pada React 19.

## 5. Ringkasan Rekomendasi Tindakan

1. Langkah Cepat:
   - Tambahkan verifikasi sesi auth.api.getSession pada fungsi createUserAccount dan triggerManualSnapshot.
   - Perbaiki pemanggilan setState pada hooks/use-mobile.ts.
   - Ganti tipe any dengan interface spesifik pada modul utilitas.

2. Langkah Menengah:
   - Tambahkan automated test untuk alur snapshot dan kalkulasi faktur penjualan.
   - Sempurnakan struktur subfolder layout pada beberapa komponen halaman yang masih berada di root folder komponen.

3. Langkah Lanjutan:
   - Lakukan migrasi skema basis data untuk memisahkan kamar dan gedung secara formal jika rumah sakit memiliki struktur multi gedung yang kompleks.
