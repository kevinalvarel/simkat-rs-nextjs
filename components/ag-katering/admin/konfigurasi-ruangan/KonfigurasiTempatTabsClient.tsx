'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, BedDouble } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { GedungHierarkis } from '@/servers/tempat.service';
import type { KelasItem } from '@/servers/kelas.service';
import KonfigurasiRuanganClient from './KonfigurasiRuanganClient';
import KonfigurasiKelasClient from '../konfigurasi-kelas/KonfigurasiKelasClient';

export type TempatTab = 'ruangan' | 'kelas';

interface KonfigurasiTempatTabsClientProps {
  initialGedungList: GedungHierarkis[];
  kelasOptions: string[];
  initialKelasList: KelasItem[];
  defaultTab?: TempatTab;
}

export default function KonfigurasiTempatTabsClient({
  initialGedungList,
  kelasOptions,
  initialKelasList,
  defaultTab = 'ruangan',
}: KonfigurasiTempatTabsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TempatTab>(defaultTab);

  function handleTabChange(value: string) {
    const next = value === 'kelas' ? ('kelas' as const) : ('ruangan' as const);
    setActiveTab(next);
    router.replace(`${pathname}?tab=${next}`, { scroll: false });
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className='flex flex-1 flex-col w-full min-w-0'
    >
      {/* Tab switcher bar */}
      <div className='max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-4 sm:pt-6'>
        <TabsList className='grid grid-cols-2 w-full sm:w-auto sm:min-w-[420px] h-10'>
          <TabsTrigger value='ruangan' className='text-xs font-bold gap-2 px-4'>
            <Building2 className='w-4 h-4' />
            Ruangan
            <Badge variant='outline' className='text-[10px] font-mono'>
              {initialGedungList.length} Gedung
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='kelas' className='text-xs font-bold gap-2 px-4'>
            <BedDouble className='w-4 h-4' />
            Kelas
            <Badge variant='outline' className='text-[10px] font-mono'>
              {initialKelasList.length} Kelas
            </Badge>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Tab content — kedua client reuse apa adanya dengan container masing-masing */}
      <TabsContent value='ruangan' className='flex flex-1 flex-col w-full min-w-0'>
        <KonfigurasiRuanganClient
          initialGedungList={initialGedungList}
          kelasList={kelasOptions}
        />
      </TabsContent>
      <TabsContent value='kelas' className='flex flex-1 flex-col w-full min-w-0'>
        <KonfigurasiKelasClient initialKelasList={initialKelasList} />
      </TabsContent>
    </Tabs>
  );
}
