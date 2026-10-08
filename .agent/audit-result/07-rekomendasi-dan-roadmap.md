# Rekomendasi Tindakan dan Peta Jalan Pengembangan SIMKAT RS

Dokumen ini merangkum seluruh rekomendasi perbaikan hasil audit dan menyusunnya ke dalam peta jalan (roadmap) berdasarkan tingkat urgensi.

## 1. Matriks Prioritas Rekomendasi

| Tingkat Prioritas | Item Tindakan | Lokasi Berkas | Estimasi Dampak |
|---|---|---|---|
| Tinggi (Keamanan) | Tambahkan verifikasi sesi dan peran supervisor pada Server Actions | servers/user.service.ts | Mencegah eskalasi hak akses oleh pengguna non supervisor |
| Tinggi (Keamanan) | Tambahkan verifikasi sesi pada pemicu manual snapshot | servers/snapshot.service.ts | Mencegah penguncian snapshot oleh pihak tidak berwenang |
| Tinggi (Performa UI) | Perbaiki pemanggilan setState di useEffect | hooks/use-mobile.ts | Mencegah render berantai pada React 19 |
| Sedang (Kualitas Kode) | Hilangkan tipe any dan ganti dengan interface spesifik | servers/invoice.service.ts, lib/npo-utils.ts | Menuntaskan 33 eror linter ESLint |
| Sedang (Integritas Data) | Bungkus pembuatan batch dan detail snapshot dalam db.transaction | servers/snapshot.service.ts | Menjamin keutuhan data jika koneksi terputus |
| Sedang (Kepatuhan SOW) | Rapikan peletakan komponen induk ke subfolder layout/ | components/ag-katering/user/mapping-diet/ | Menyelaraskan struktur berkas 100% dengan teks SOW |
| Rendah (Pembersihan) | Bersihkan variabel yang tidak terpakai | servers/overview.service.ts | Membersihkan 101 peringatan linter |
| Rendah (Skema DB) | Pisahkan kolom kamar dan gedung secara eksplisit | db/schemas/patient/pasien.ts | Menghilangkan ambiguitas semantik nama kolom |

## 2. Panduan Langkah demi Langkah Eksekusi Perbaikan

### Langkah 1: Penguatan Keamanan Server Actions
Buka berkas servers/user.service.ts dan perbarui fungsi mutasi:
1. Impor headers dari next/headers dan auth dari lib/auth.
2. Di awal fungsi createUserAccount, dapatkan sesi saat ini:
   const session = await auth.api.getSession({ headers: await headers() });
3. Jika sesi tidak ada atau session.user.role !== 'supervisor', kembalikan pesan penolakan:
   return { success: false, message: 'Akses ditolak: Anda tidak memiliki wewenang supervisor.' };

### Langkah 2: Perbaikan Peringatan Hook pada use-mobile.ts
Buka berkas hooks/use-mobile.ts:
Ganti inisialisasi state agar membaca ukuran jendela secara langsung saat komponen pertama kali dimuat:
```ts
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
```

### Langkah 3: Pengetatan Tipe Data (Menghilangkan any)
1. Pada lib/npo-utils.ts baris 38:
   Ganti parameter isNpoPatient(record?: PatientNpoCheckInput | any) menjadi isNpoPatient(record?: PatientNpoCheckInput | Record<string, unknown>).
2. Pada lib/exportTabulasiExcel.ts baris 15:
   Ganti const rows: any[][] = []; menjadi const rows: (string | number | null | undefined)[][] = [];.

### Langkah 4: Penerapan Transaksi Drizzle pada Snapshot
Buka berkas servers/snapshot.service.ts:
Bungkus operasi pembuatan snapshot_batch dan penulisan snapshot_detail_pasien ke dalam blok db.transaction:
```ts
await db.transaction(async (tx) => {
  const [insertedBatch] = await tx.insert(snapshotBatchTable).values(...).returning(...);
  await tx.insert(snapshotDetailTable).values(...);
});
```

## 3. Peta Jalan Pengembangan Fitur Masa Depan (Feature Roadmap)

1. Fase 1 (Stabilitas dan Keamanan):
   - Menerapkan penguatan Server Actions di atas.
   - Menghapus berkas scratch uji coba yang tidak dibutuhkan lagi.
   - Memastikan linter berjalan bersih tanpa eror.

2. Fase 2 (Pengujian Terotomasi):
   - Memasang Vitest untuk pengujian unit pada fungsi penentuan siklus menu (resolveActiveCycleForDate), perhitungan jam cut off, dan logika deteksi puasa (isNpoPatient).
   - Memasang Playwright untuk pengujian alur interaksi pengguna (e2e) pada proses input pasien dan penguncian snapshot.

3. Fase 3 (Fitur Lanjutan):
   - Dukungan integrasi webhook atau WhatsApp notifikasi ke supervisor saat ada permohonan revisi diet darurat yang mendesak.
   - Peningkatan visual dasbor pemantauan dapur dengan grafik konsumsi bahan makanan mingguan.
