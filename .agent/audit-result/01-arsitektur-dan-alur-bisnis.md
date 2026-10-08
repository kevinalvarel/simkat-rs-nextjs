# Arsitektur Sistem dan Alur Bisnis SIMKAT RS

Dokumen ini menjelaskan rancangan arsitektur teknologi serta alur kerja operasional end to end pada aplikasi SIMKAT RS.

## 1. Tumpukan Teknologi (Tech Stack)

Aplikasi dibangun menggunakan tumpukan teknologi modern:
- Kerangka Kerja (Framework): Next.js versi 16.3.0 dengan App Router
- Pustaka Tampilan: React versi 19.2.8
- Bahasa Pemrograman: TypeScript versi 5 dengan mode strict
- Basis Data: PostgreSQL tanpa server melalui Neon Database (@neondatabase/serverless)
- Pemetaan Objek Relasional (ORM): Drizzle ORM versi 0.45.2 dan Drizzle Kit versi 0.31.4
- Autentikasi: Better Auth versi 1.6.25 dengan adapter Drizzle
- Tata Letak dan Gaya: Tailwind CSS versi 4 dan Base UI / Shadcn UI
- Pengelolaan Waktu: Modul kustom wib.ts berbasis Intl.DateTimeFormat zona Asia/Jakarta
- Sinkronisasi Antar Tab: Pustaka peramban BroadcastChannel murni

## 2. Peta Peran Pengguna (Role Map)

Sistem memiliki tiga kelompok peran utama:

1. Ahli Gizi Rumah Sakit (gizi-rs):
   - Mengelola pasien pada ruangan rawat inap tertentu.
   - Mengisi nama pasien, nomor rekam medis (no_rm), kelas, bed, dan diet klinis.
   - Menandai pasien puasa (is_npo) atau pasien pulang.
   - Melakukan pemindahan ruangan (room transfer).
   - Mengajukan permohonan revisi diet darurat jika perubahan terjadi setelah jam cut off snapshot.

2. Ahli Gizi Katering (gizi-katering):
   - Memetakan teks diet bebas dari rumah sakit ke kategori diet baku (mapping diet).
   - Mengawasi waktu cut off dan memicu penguncian snapshot (Pagi, Siang, Malam).
   - Memeriksa matriks tabulasi makan dan tabulasi snack buah.
   - Mencetak etiket makan pasien per batch produksi.
   - Mencetak dokumen DPMP (Daftar Permintaan Makanan Pasien).
   - Mencetak faktur pengiriman (surat jalan) dan faktur penjualan.

3. Supervisor (supervisor):
   - Memberikan otorisasi persetujuan atau penolakan terhadap pengajuan perubahan diet pasca snapshot.
   - Mengelola master data siklus menu, hidangan, ruangan, kamar, dan kelas.
   - Mendaftarkan dan mengelola akun pengguna sistem.

## 3. Alur Bisnis Inti (Core Business Flow)

### Tahap 1: Penginputan Data Pasien (Ahli Gizi RS)
1. Ahli Gizi RS masuk ke aplikasi dan diarahkan ke rute /dashboard/ag-rs.
2. Memilih jadwal waktu makan, gedung, dan ruangan.
3. Melakukan input data pasien baru, memperbarui diet, atau menandai pasien puasa / pulang.
4. Perubahan data tersimpan secara langsung pada tabel pasien di basis data.

### Tahap 2: Pemetaan Diet Bebas ke Standar Dapur (Mapping Diet)
1. Rumah sakit sering kali menulis diet klinis dalam format teks bebas (misalnya: RG II, DM 1700 kkal, Rendah Kolesterol).
2. Ahli Gizi Katering membuka menu /dashboard/ag-katering/mapping-diet.
3. Sistem mendeteksi teks mentah yang belum terpetakan (status UNMAPPED).
4. Pengguna memetakan teks tersebut ke atribut baku: bentuk makanan, karbohidrat, kategori diet, nabati, sayur, ekstra, buah, dan snack.
5. Pemetaan disimpan permanen pada tabel master_diet_mapping agar teks yang sama di masa depan terpetakan secara otomatis.

### Tahap 3: Siklus Menu Makanan Rumah Sakit
1. Rumah sakit menggunakan pola perputaran menu siklus sepuluh hari (Siklus 1 sampai Siklus 10), ditambah menu khusus tanggal 31.
2. Setiap siklus dibagi berdasarkan waktu makan (Pagi, Siang, Sore) dan kelas pasien (Kelas I, Kelas II, Kelas III, atau Semua Kelas).
3. Tabel master_siklus_menu menyimpan daftar hidangan beserta tag diet (misalnya tag B untuk Biasa, DM untuk Diabetes Melitus, RG untuk Rendah Garam).
4. Tag ganda didukung secara penuh (misalnya DM, RG) untuk pasien komplikasi.

### Tahap 4: Penguncian Snapshot Produksi (Cut Off Mechanism)
1. Untuk menjaga kepastian jumlah porsi saat juru masak bekerja, data pasien harus dibekukan pada jam cut off:
   - Makan Pagi: 05.30 WIB
   - Makan Siang: 10.30 WIB
   - Makan Malam: 16.00 WIB
2. Penguncian snapshot dapat berlangsung secara otomatis saat jam cut off terlampaui, atau dipicu secara manual oleh Ahli Gizi Katering.
3. Saat snapshot terkunci:
   - Satu baris batch baru dibuat pada tabel snapshot_batch dengan status LOCKED.
   - Salinan lengkap seluruh pasien aktif disalin ke tabel snapshot_detail_pasien beserta hasil mapping diet pada detik tersebut.
   - Pasien dengan status puasa (NPO) dikeluarkan dari hitungan porsi masak.

### Tahap 5: Otorisasi Perubahan Diet Pasca Snapshot (Emergent Workflow)
1. Jika pasien baru masuk atau dokter mengubah diet pasien setelah snapshot terkunci:
   - Ahli Gizi RS mengajukan revisi melalui antarmuka pasien.
   - Pengajuan dicatat pada tabel otorisasi_perubahan_diet dengan status PENDING.
   - Dapur katering menerima notifikasi adanya permohonan revisi.
2. Supervisor meninjau pengajuan pada /dashboard/ag-katering/admin/otorisasi-perubahan-diet:
   - Jika disetujui (APPROVED): Pasien ditambahkan atau diperbarui pada snapshot aktif sebagai porsi darurat (is_emergent = true).
   - Label cetak etiket darurat dapat langsung dicetak ulang.
   - Jika ditolak (REJECTED): Data produksi katering tidak berubah dan catatan penolakan tercatat.

### Tahap 6: Tabulasi dan Pemorsian
1. Modul tabulasi makan menyusun rekapitulasi kebutuhan bahan dan porsi berdasarkan lokasi gedung, ruangan, kelas, dan hidangan menu siklus hari tersebut.
2. Modul tabulasi snack dan buah mengelompokkan kebutuhan makanan selingan untuk pasien.
3. Data dapat diekspor langsung ke format lembar sebar Excel melalui berkas exportTabulasiExcel.ts.

### Tahap 7: Logistik dan Penagihan Finansial
1. Cetak DPMP: Menghasilkan lembar resmi permintaan makanan pasien per ruangan sebagai tanda terima serah terima makanan.
2. Cetak Etiket: Menghasilkan stiker label kotak makanan berisi identitas pasien, ruangan, bed, menu lauk hewani nabati sayur, dan tanggal produksi.
3. Faktur Pengiriman: Surat jalan pengantaran makanan dari unit katering ke instalasi gizi rumah sakit.
4. Faktur Penjualan: Rekapitulasi biaya makanan per kelas pasien dengan rincian harga satuan untuk TKTP dan porsi reguler, dilengkapi perhitungan terbilang otomatis dalam bahasa Indonesia.

## 4. Keunggulan Desain Sinkronisasi Real Time

Aplikasi memanfaatkan BroadcastChannel melalui helper realtime-sync.ts. Pola ini memberikan keuntungan besar:
- Nol pemakaian kuota jaringan eksternal: Komunikasi antar tab browser terjadi sepenuhnya di memori peramban lokal.
- Latensi instan: Ketika pengguna mencetak etiket atau mengunci batch di satu tab, tab pemantauan produksi di layar monitor dapur langsung memperbarui status dalam hitungan milidetik.
- Dukungan fallback: Jika tab baru dibuka, sistem membaca tanda waktu terakhir pada localStorage untuk memastikan status selalu segar.
