import React from 'react';
import type { Metadata } from 'next';
import {
  getTabulationBatches,
  getTabulationSummary,
} from '@/servers/tabulasi.service';
import TabulasiClient from '@/components/ag-katering/user/tabulasi-rekapitulasi/TabulasiClient';

export const metadata: Metadata = {
  title: 'Tabulasi & Rekapitulasi - Ahli Gizi Katering',
  description:
    'Rekapitulasi porsi, extra diet, buah, snack, dan lokasi dari snapshot katering RS.',
};

export default async function TabulationPage() {
  const batches = await getTabulationBatches();

  let initialSummary = null;
  if (batches.length > 0) {
    initialSummary = await getTabulationSummary(batches[0].id);
  }

  return <TabulasiClient batches={batches} initialSummary={initialSummary} />;
}
