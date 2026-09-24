import { redirect } from 'next/navigation';

/**
 * Route lama digabung ke konfigurasi-ruangan bertab.
 * Bookmark / URL lama tetap hidup via redirect ke tab Kelas.
 */
export default function KonfigurasiKelasPage() {
  redirect('/dashboard/ag-katering/admin/konfigurasi-ruangan?tab=kelas');
}
