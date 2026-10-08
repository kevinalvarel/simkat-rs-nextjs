# Audit Keamanan dan Autentikasi SIMKAT RS

Dokumen ini memuat evaluasi keamanan sistem, mekanisme autentikasi pengguna, pembatasan hak akses berbasis peran (RBAC), serta proteksi rute pada aplikasi SIMKAT RS.

## 1. Arsitektur Autentikasi (Better Auth)

Aplikasi mengadopsi pustaka Better Auth versi 1.6.25:
- Konfigurasi Server: Terletak pada lib/auth.ts menggunakan adapter Drizzle PostgreSQL.
- Pustaka Pendukung: Mengaktifkan plugin admin() dan nextCookies().
- Pembatasan Laju Akses (Rate Limiting): Dikonfigurasi dengan batas 100 permintaan per jendela waktu 10 detik.
- Kredensial: Menggunakan kombinasi email dan kata sandi dengan fungsi hash kata sandi terstandarisasi.
- Klien Autentikasi: Menggunakan auth-client.ts untuk metode masuk (signIn), keluar (signOut), dan sesi klien.

## 2. Pengendalian Hak Akses Berbasis Peran (RBAC)

Sistem membedakan tiga peran pengguna:
1. gizi-rs: Mengakses antarmuka data pasien rumah sakit (/dashboard/ag-rs).
2. gizi-katering: Mengakses pemantauan produksi katering, siklus menu, mapping diet, tabulasi, etiket, dan faktur (/dashboard/ag-katering).
3. supervisor: Mengakses seluruh fitur gizi-katering ditambah sub menu admin (/dashboard/ag-katering/admin/*) untuk otorisasi perubahan diet dan tata kelola pengguna.

## 3. Evaluasi Lapisan Proteksi Rute

### A. Proteksi Tingkat Middleware (proxy.ts)
Berkas proxy.ts bertindak sebagai penjaga gerbang awal pada tingkat jaringan HTTP Next.js:
- Memeriksa sesi pengguna via auth.api.getSession.
- Jika pengguna belum masuk dan mencoba mengakses /dashboard/:path*, pengguna langsung dialihkan ke halaman utama (/).
- Mengarahkan pengguna secara otomatis ke rute dashboard sesuai peran mereka saat membuka root dashboard:
  - Peran gizi-katering atau supervisor dialihkan ke /dashboard/ag-katering/overview/produksi.
  - Peran gizi-rs dialihkan ke /dashboard/ag-rs.

### B. Proteksi Tingkat Tata Letak (AdminLayout)
Pada berkas app/(app)/dashboard/ag-katering/admin/layout.tsx:
- Memeriksa sesi dan peran pengguna secara ketat:
  Jika peran pengguna bukan supervisor, sistem langsung merender komponen Forbidden yang memblokir akses ke seluruh halaman di bawah folder admin.
- Pola ini sangat baik karena melindungi seluruh rute admin sekaligus tanpa perlu menulis kode pengecekan berulang pada setiap page.tsx.

## 4. Temuan Celah Keamanan dan Rekomendasi (Defense in Depth)

### Temuan 1: Kurangnya Pengecekan Sesi Eksplisit di Dalam Server Actions Tertentu
- Deskripsi:
  Next.js Server Actions ('use server') dapat dipanggil secara langsung melalui permintaan POST terisolasi oleh klien tanpa melalui rendisi halaman RSC layout.
- Bukti Kode:
  Pada berkas servers/user.service.ts, fungsi createUserAccount menerima parameter CreateUserPayload dan langsung mengeksekusi penambahan baris pengguna ke basis data tanpa memeriksa apakah pemanggil fungsi tersebut memiliki sesi aktif dengan peran supervisor.
- Potensi Risiko:
  Pengguna dengan peran gizi-rs atau gizi-katering yang memiliki pengetahuan teknis dapat memanggil fungsi Server Action tersebut dari konsol peramban untuk membuat akun supervisor baru.
- Rekomendasi Perbaikan:
  Tambahkan verifikasi sesi di awal setiap mutasi administratif:
  ```ts
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== 'supervisor') {
    return { success: false, message: 'Akses ditolak: Hanya supervisor yang diizinkan.' };
  }
  ```

### Temuan 2: Validasi Input Menggunakan Skema Zod
- Kondisi Saat Ini:
  Validasi form pada sisi klien sudah menggunakan pustaka Zod (misalnya LoginFormSchema.ts dan PatientFormSchema.ts).
- Rekomendasi:
  Terapkan parsing skema Zod (schema.safeParse) secara konsisten di dalam seluruh fungsi Server Actions sebelum data diproses ke Drizzle ORM untuk mencegah injeksi nilai kosong atau format yang tidak valid.

## 5. Ringkasan Keamanan

Tingkat keamanan autentikasi dasar dan pemisahan tampilan peran sudah bekerja dengan sangat baik. Menambahkan verifikasi sesi pada tingkat fungsi Server Actions akan menyempurnakan strategi pertahanan berlapis (defense in depth) aplikasi hingga level standar enterprise.
