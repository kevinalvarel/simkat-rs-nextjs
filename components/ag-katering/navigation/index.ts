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
          title: 'Produksi',
          url: '/dashboard/ag-katering/overview/produksi',
        },
        {
          title: 'Pemorsian',
          url: '/dashboard/ag-katering/overview/pemorsian',
        },
      ],
    },
    {
      title: 'Monitoring Snapshot',
      items: [
        {
          title: 'Snapshot & Waktu Kunci',
          url: '/dashboard/ag-katering/status-snapshot',
        },
        {
          title: 'Revisi Post-Snapshot',
          url: '/dashboard/ag-katering/revisi-post-snapshot',
        },
      ],
    },
    {
      title: 'Master Data',
      items: [
        {
          title: 'Mapping Diet Pasien',
          url: '/dashboard/ag-katering/mapping-diet',
        },
        {
          title: 'Invoice',
          url: '/dashboard/ag-katering/invoice',
        },
        {
          title: 'Kwitansi',
          url: '/dashboard/ag-katering/kwitansi',
        },
      ],
    },
    {
      title: 'Produksi & Tabulasi',
      items: [
        {
          title: 'Tabulasi Rekapitulasi',
          url: '/dashboard/ag-katering/tabulasi',
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
          title: 'Produksi',
          url: '/dashboard/ag-katering/overview/produksi',
        },
        {
          title: 'Pemorsian',
          url: '/dashboard/ag-katering/overview/pemorsian',
        },
      ],
    },
    {
      title: 'Monitoring Snapshot',
      items: [
        {
          title: 'Snapshot & Waktu Kunci',
          url: '/dashboard/ag-katering/status-snapshot',
        },
        {
          title: 'Revisi Post-Snapshot',
          url: '/dashboard/ag-katering/revisi-post-snapshot',
        },
      ],
    },
    {
      title: 'Master Data',
      items: [
        {
          title: 'Mapping Diet Pasien',
          url: '/dashboard/ag-katering/mapping-diet',
        },
      ],
    },
    {
      title: 'Produksi & Tabulasi',
      items: [
        {
          title: 'Tabulasi Rekapitulasi',
          url: '/dashboard/ag-katering/tabulasi',
        },
        {
          title: 'Invoice',
          url: '/dashboard/ag-katering/invoice',
        },
        {
          title: 'Kwitansi',
          url: '/dashboard/ag-katering/kwitansi',
        },
      ],
    },
    {
      title: 'Riwayat & Approval (Admin)',
      items: [
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
