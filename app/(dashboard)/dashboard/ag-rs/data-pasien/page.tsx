import { redirect } from 'next/navigation';
import Navbar from '@/components/ag-rs/navbar';
import DataPasienClient from '@/components/ag-rs/data-pasien/DataPasienClient';
import { getPatientsByRoom, getKelas } from '@/servers/patient.service';
import { getGedungWithRuangan } from '@/servers/tempat.service';

interface DataPasienPageProps {
  searchParams: Promise<{
    ruangan?: string;
    gedung?: string;
    ruanganId?: string;
    gedungId?: string;
  }>;
}

export default async function DataPasienPage({
  searchParams,
}: DataPasienPageProps) {
  const params = await searchParams;
  const ruangan = params.ruangan;
  const gedung = params.gedung;

  // Redirect back if no room is selected
  if (!ruangan || !gedung) {
    redirect('/dashboard/ag-rs');
  }

  // Fetch patients and master data in parallel from the database
  const [patients, kelasList, gedungList] = await Promise.all([
    getPatientsByRoom(ruangan),
    getKelas(),
    getGedungWithRuangan(),
  ]);

  return (
    <div className='min-h-dvh flex flex-col bg-background text-foreground'>
      <Navbar />

      <main className='flex-1 p-4 sm:p-6 md:p-8'>
        <div className='mx-auto max-w-7xl'>
          <DataPasienClient
            patients={patients}
            ruangan={ruangan}
            gedung={gedung}
            kelasList={kelasList}
            gedungList={gedungList}
          />
        </div>
      </main>
    </div>
  );
}
