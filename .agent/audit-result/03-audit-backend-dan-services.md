# Audit Layanan Server dan Logika Bisnis SIMKAT RS

Dokumen ini memuat analisis terhadap 23 berkas modul layanan server yang berada di dalam folder servers/. Modul ini berperan sebagai backend yang menangani Server Actions Next.js, kueri Drizzle ORM, perhitungan porsi, dan pembaruan antarmuka.

## 1. Inventaris Berkas Layanan (Folder servers/)

Folder servers/ memuat 23 berkas layanan yang mencakup seluruh proses bisnis:

1. snapshot.service.ts (13.8 KB):
   Mengelola siklus makan, penentuan jam cut off, penguncian snapshot otomatis dan manual, serta pembuatan salinan data pasien beku.
2. overview.service.ts (48.0 KB):
   Layanan terbesar dalam sistem. Menghitung pemantauan produksi dapur secara langsung, agregasi porsi makan per kategori diet, pemorsian lauk, dan status hidangan siklus aktif.
3. tabulasi-makan.service.ts (20.2 KB):
   Mengompilasi matriks tabulasi kebutuhan makanan pasien, perpaduan hidangan siklus, pemetaan gedung dan ruangan, serta filter lokasi.
4. tabulasi-snack-buah.service.ts (6.3 KB):
   Mengelola tabulasi khusus untuk camilan dan buah pasien per ruangan dan kelas.
5. tabulasi.service.ts (3.5 KB):
   Fungsi pembantu dasar untuk kueri batch tabulasi.
6. invoice.service.ts (37.1 KB):
   Menghitung rekapitulasi konsumsi harian dan periodik, pemecahan diet, verifikasi revisi post snapshot, serta agregasi kelas.
7. sales-invoice.service.ts (6.9 KB):
   Mengonversi rekapitulasi konsumsi menjadi faktur penjualan bernilai rupiah, perhitungan harga satuan per kelas, dan penerjemahan angka terbilang.
8. dpmp.service.ts (11.6 KB):
   Menyediakan data cetak Daftar Permintaan Makanan Pasien per ruangan untuk arsip fisik serah terima makan.
9. kwitansi.service.ts (32 Byte):
   Re-export dari dpmp.service.ts. Berfungsi sebagai alias penyedia layanan cetak tanda terima.
10. mapping-diet.service.ts (22.9 KB):
    Mengelola pencarian diet belum terpetakan, penyimpanan pemetaan baru, mutasi massal (bulk mapping), dan revalidasi cache.
11. otorisasi-diet.service.ts (20.5 KB):
    Menangani alur persetujuan atau penolakan pengajuan perubahan diet pasca snapshot, pencatatan alasan klinis, dan penyesuaian porsi darurat.
12. revisi-snapshot.service.ts (9.3 KB):
    Layanan pembantu untuk mendeteksi dampak revisi terhadap dapur (apakah butuh masak ulang, ganti porsi, atau batalkan porsi).
13. patient.service.ts (17.1 KB):
    CRUD data pasien aktif, mutasi ruangan dan bed, perubahan status puasa (NPO), dan status pulang.
14. siklus-menu.service.ts (23.2 KB):
    Mengelola master siklus rotasi menu, konfigurasi hidangan, dan pemfilteran berdasarkan tag diet ganda.
15. konfigurasi-menu.service.ts (7.2 KB):
    Pengelolaan master kategori menu dan hidangan individual katering.
16. kelas.service.ts (8.1 KB):
    Pengelolaan konfigurasi nama kelas kamar dan tarif dasar.
17. tempat.service.ts (15.7 KB):
    Pengelolaan master gedung, ruangan, dan relasi kapasitas kamar.
18. riwayat-diet.service.ts (12.5 KB):
    Pencatatan dan penampilan linimasa riwayat diet pasien rawat inap.
19. riwayat-history.service.ts (16.4 KB):
    Pencatatan riwayat perubahan umum pasien untuk transparansi audit.
20. user.service.ts (5.4 KB):
    Pengelolaan pengguna sistem: pembuatan akun baru oleh supervisor, perubahan peran, dan statistik pengguna.
21. login.service.ts (1.1 KB):
    Layanan pendukung proses masuk pengguna.
22. wib.service.ts (548 Byte):
    Jembatan fungsi waktu WIB khusus untuk lingkungan server.
23. helper/tabulasi/ dan helper/siklus-menu/:
    Helper modular yang memecah kompleksitas pencocokan menu dan kalkulasi pasien.

## 2. Analisis Kualitas Logika Bisnis

### A. Penanganan Snapshot Terkunci (snapshot.service.ts)
- Ketepatan Logika:
  Pengecekan checkAndAutoLockSnapshots berjalan setiap kali daftar batch dimuat. Jika jam sekarang di WIB melampaui jam cut off, fungsi triggerManualSnapshot langsung dipanggil.
- Perlindungan Rendisi Server:
  Kode secara cerdas menyediakan parameter skipRevalidate dan menggunakan blok try-catch di sekitar revalidatePath. Hal ini mencegah eror render Next.js saat mutasi snapshot terjadi di tengah rendisi komponen server (RSC).

### B. Otomasi Siklus Menu dan Tag Diet Ganda (siklus-menu.service.ts)
- Logika Tag Diet Implisit:
  Sistem mendukung penggabungan diet secara otomatis saat sebuah hidangan memiliki tag lebih dari satu (misalnya DM, RG). Pasien yang memiliki indikasi medis komplikasi langsung dipasangkan dengan hidangan yang memenuhi kedua kriteria tersebut.

### C. Keamanan Revalidasi Cache (revalidatePath)
- Sebagian besar mutasi server actions memanggil revalidatePath dengan path target yang tepat. Sebagai contoh, saat waktu cut off diubah, sistem merevalidasi halaman status snapshot, rute overview, dan dashboard gizi-rs agar tampilan selalu mutakhir.

## 3. Catatan dan Area Penyempurnaan

1. Berkas kwitansi.service.ts Berukuran 32 Byte:
   Berkas ini hanya berisi export * from './dpmp.service';. Hal ini tidak menimbulkan masalah teknis, namun jika di masa depan kwitansi memiliki format atau logika berbeda dari DPMP, disarankan memberikan implementasi mandiri.

2. Kebutuhan Transaksi Basis Data (db.transaction) pada Mutasi Bertingkat:
   Pada fungsi triggerManualSnapshot, pembuatan snapshot_batch dan penyalinan data massal ke snapshot_detail_pasien dilakukan dalam dua operasi kueri berurutan. Untuk menjamin keutuhan data jika terjadi gangguan jaringan di tengah proses, disarankan membungkus kedua kueri ini di dalam transaksi Drizzle (db.transaction).

3. Penanganan Tipe any pada invoice.service.ts:
   Ditemukan penggunaan tipe any pada baris 154 dan 291 di invoice.service.ts. Mengganti tipe ini dengan interface terdefinisi akan memperkuat keamanan tipe sistem.
