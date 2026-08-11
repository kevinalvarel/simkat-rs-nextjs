/**
 * Navigasi Ahli Gizi Katering. Semua halaman bersifat pantau (read-only)
 * kecuali pengaturan waktu snapshot & mapping diet.
 */
export const routeData = {
  navMain: [
    {
      title: 'Dashboard',
      items: [
        {
          title: 'Overview',
          url: '/dashboard/ag-katering/overview',
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
        {
          title: 'Otorisasi Perubahan',
          url: '/dashboard/ag-katering/otorisasi-perubahan-diet',
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
      ],
    },
  ],
};
