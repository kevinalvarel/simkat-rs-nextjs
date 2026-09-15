/**
 * Navigasi Ahli Gizi Katering. Semua halaman bersifat pantau (read-only)
 * kecuali pengaturan waktu snapshot & mapping diet.
 */
export const routeDataProduksi = {
  navMain: [
    {
      title: 'Dashboard',
      items: [
        {
          title: 'Live Produksi',
          url: '/dashboard/ag-katering/overview/produksi',
        },
        {
          title: 'Live Pemorsian',
          url: '/dashboard/ag-katering/overview/pemorsian',
        },
        {
          title: 'Live Katering',
          url: '/dashboard/ag-katering/overview/katering',
        },
      ],
    },
    {
      title: 'Pasien',
      items: [
        {
          title: 'Mapping Diet Pasien',
          url: '/dashboard/ag-katering/mapping-diet',
        },
        {
          title: 'Cetak Etiket',
          url: '/dashboard/ag-katering/cetak-etiket',
        },
        {
          title: 'Cetak DPMP',
          url: '/dashboard/ag-katering/cetak-dpmp',
        },
      ],
    },
    {
      title: 'Cetak Faktur',
      items: [
        {
          title: 'Faktur Pengiriman',
          url: '/dashboard/ag-katering/faktur-pengiriman',
        },
        {
          title: 'Faktur Penjualan',
          url: '/dashboard/ag-katering/faktur-penjualan',
        },
      ],
    },
    {
      title: 'Master Data',
      items: [
       {
          title: 'Tabulasi Makan',
          url: '/dashboard/ag-katering/tabulasi-makan',
        },
        {
          title: 'Tabulasi Snack & Buah',
          url: '/dashboard/ag-katering/tabulasi-snack',
        },
      ],
    },
  ],
};

export const routeDataSupervisor = {
  navMain: [
    {
      title: 'Dashboard',
      items: [
        {
          title: 'Live Produksi',
          url: '/dashboard/ag-katering/overview/produksi',
        },
        {
          title: 'Live Pemorsian',
          url: '/dashboard/ag-katering/overview/pemorsian',
        },
        {
          title: 'Live Katering',
          url: '/dashboard/ag-katering/overview/katering',
        },
      ],
    },
    {
      title: 'Pasien',
      items: [
        {
          title: 'Mapping Diet Pasien',
          url: '/dashboard/ag-katering/mapping-diet',
        },
        {
          title: 'Cetak Etiket',
          url: '/dashboard/ag-katering/cetak-etiket',
        },
        {
          title: 'Cetak DPMP',
          url: '/dashboard/ag-katering/cetak-dpmp',
        },
      ],
    },
    {
      title: 'Cetak Faktur',
      items: [
        {
          title: 'Faktur Pengiriman',
          url: '/dashboard/ag-katering/faktur-pengiriman',
        },
        {
          title: 'Faktur Penjualan',
          url: '/dashboard/ag-katering/faktur-penjualan',
        },
      ],
    },
    {
      title: 'Master Data',
      items: [
         {
          title: 'Tabulasi Makan',
          url: '/dashboard/ag-katering/tabulasi-makan',
        },
        {
          title: 'Tabulasi Snack & Buah',
          url: '/dashboard/ag-katering/tabulasi-snack',
        },
      ],
    },

    {
      title: 'Riwayat & Approval (Admin)',
      items: [
        {
          title: 'Snapshot & Waktu Kunci',
          url: '/dashboard/ag-katering/admin/status-snapshot',
        },
        {
          title: 'Riwayat Diet Pasien',
          url: '/dashboard/ag-katering/admin/riwayat',
        },
        {
          title: 'Persetujuan Revisi',
          url: '/dashboard/ag-katering/admin/otorisasi-perubahan-diet',
        },
      ],
    },
    {
      title: 'Konfigurasi (Admin)',
      items: [
        {
          title: 'Konfigurasi Ruangan',
          url: '/dashboard/ag-katering/admin/konfigurasi-ruangan',
        },
        {
          title: 'Konfigurasi Pengguna',
          url: '/dashboard/ag-katering/admin/tambah-pengguna',
        },
        {
          title: 'Konfigurasi Menu',
          url: '/dashboard/ag-katering/admin/konfigurasi-menu',
        },
        {
          title: 'Konfigurasi Siklus Menu',
          url: '/dashboard/ag-katering/admin/konfigurasi-siklus-menu',
        },
      ],
    },
  ],
};
