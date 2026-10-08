# Audit Basis Data dan Skema SIMKAT RS

Dokumen ini memuat analisis terperinci terhadap pemodelan data, integritas relasi tabel, dan performa skema basis data pada aplikasi SIMKAT RS menggunakan Drizzle ORM dan PostgreSQL.

## 1. Peta Skema Basis Data

Skema basis data dikelompokkan ke dalam empat domain utama pada folder db/schemas:

### Kelompok Master (db/schemas/master/)
- gedung.ts (tabel gedung): Menyimpan daftar fisik bangunan rumah sakit.
- ruangan.ts (tabel ruangan): Menyimpan nama ruangan rawat inap, berelasi ke gedung.
- kamar.ts (tabel kamar): Menyimpan nomor kamar, kelas, dan jumlah bed per kamar, berelasi ke ruangan.
- kelas.ts (tabel kelas): Menyimpan nama kelas kanonis (KELAS I, KELAS II, KELAS III, VIP).
- kategori-menu.ts (tabel kategori_menu): Menyimpan master pengelompokan menu makanan katering.
- mapping-diet.ts (tabel master_diet_mapping): Kamus permanen pemetaan teks diet bebas rumah sakit ke standar porsi dapur katering.
- siklus-menu.ts (tabel master_siklus dan master_siklus_menu): Header dan rincian hidangan per siklus menu sepuluh harian.

### Kelompok Pasien (db/schemas/patient/)
- pasien.ts (tabel pasien): Data aktif pasien rawat inap yang sedang dirawat.
- waktu-makan.ts (tabel waktu_makan): Konfigurasi jam cut off makan Pagi, Siang, dan Malam.

### Kelompok Snapshot (db/schemas/snapshot/)
- snapshot-batch.ts (tabel snapshot_batch): Catatan penguncian batch produksi per tanggal dan waktu makan.
- snapshot-detail.ts (tabel snapshot_detail_pasien): Salinan beku data pasien pada saat batch dikunci, berelasi ke snapshot_batch dengan opsi cascade delete.
- perizinan-revisi.ts (tabel otorisasi_perubahan_diet): Log pengajuan revisi diet darurat pasca snapshot terkunci.
- riwayat-history.ts (tabel riwayat_history_pasien): Log jejak audit riwayat mutasi status pasien.
- revisi-etiket-print.ts (tabel revisi_etiket_print): Pencatatan status cetak ulang etiket pasien yang mengalami revisi diet.

### Kelompok Autentikasi (db/auth-schema.ts)
- user, session, account, verification: Tabel standar yang dikelola oleh pustaka Better Auth.

## 2. Temuan dan Analisis Skema

### Temuan 1: Kolom gedung pada Tabel Pasien Berfungsi sebagai Kamar
- Kondisi:
  Pada berkas db/schemas/patient/pasien.ts, kolom gedung bertipe text dengan nilai default string kosong.
- Analisis Kode:
  Dalam implementasi praktis (sebagaimana didokumentasikan pada lib/kamar-occupancy.ts baris 3 dan servers/patient.service.ts baris 54), kolom gedung tersebut sebenarnya diisi dengan nilai nomor kamar (misalnya Kamar 1, Kamar 2A).
- Dampak:
  Fungsionalitas saat ini berjalan lancar karena seluruh helper konsisten membaca kolom tersebut sebagai kamar. Namun, dari sisi tata kelola skema, hal ini menciptakan ambiguitas semantik antara gedung fisik dengan nomor kamar.
- Rekomendasi:
  Untuk jangka panjang, disarankan menambahkan kolom kamar secara eksplisit pada tabel pasien, lalu menjalankan skrip migrasi data dari kolom gedung ke kamar sebelum memfungsikan kembali kolom gedung sebagai nama gedung sebenarnya.

### Temuan 2: Penerapan Soft Delete yang Konsisten pada Master Mapping
- Kondisi:
  Tabel master_diet_mapping dan master_siklus menggunakan kolom is_active bertipe boolean.
- Evaluasi Positif:
  Hal ini sangat tepat sesuai aturan bisnis rumah sakit. Teks diet bebas yang pernah dipetakan tidak boleh dihapus secara permanen dari basis data agar di masa mendatang teks serupa langsung terpetakan otomatis tanpa entri ulang.

### Temuan 3: Kebutuhan Indeks untuk Kueri Skalabilitas Tinggi
- Kondisi Saat Ini:
  Indeks eksplisit sudah terpasang dengan baik pada tabel sesi autentikasi (session_userId_idx dan account_userId_idx).
- Rekomendasi Tambahan:
  Pada tabel operasional yang sering difilter harian, disarankan menambahkan indeks majemuk:
  1. snapshot_batch: Indeks pada kombinasi tanggal_produksi dan waktu_makan.
  2. snapshot_detail_pasien: Indeks pada batch_id dan no_rm.
  3. otorisasi_perubahan_diet: Indeks pada status dan requested_at untuk mempercepat query antrean verifikasi supervisor.

### Temuan 4: Penanganan Relasi Siklus Menu
- Kondisi:
  Tabel master_siklus_menu berelasi dengan master_siklus melalui nomor_siklus dengan opsi onDelete: 'cascade'.
- Evaluasi Positif:
  Relasi ini menjamin bahwa jika sebuah nomor siklus dihapus atau direset, seluruh hidangan di bawah siklus tersebut akan terbersihkan secara rapi tanpa meninggalkan data yatim (orphaned rows).

## 3. Kesimpulan Audit Basis Data

Struktur basis data SIMKAT RS dirancang secara matang dan efisien. Drizzle ORM memberikan keamanan tipe yang tinggi dari lapisan basis data hingga ke komponen antarmuka. Catatan anomali semantik nama kolom gedung merupakan prioritas penyempurnaan sekunder yang tidak mengganggu kelancaran operasional saat ini.
