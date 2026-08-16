import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Building } from 'lucide-react';
import type { GedungWithRuangan } from '@/servers/tempat.service';

interface GedungCardProps {
  gedung: GedungWithRuangan;
  onSelect: () => void;
}

export default function GedungCard({ gedung, onSelect }: GedungCardProps) {
  const isNewBuilding = gedung.namaGedung.toLowerCase().includes('baru');

  return (
    <Card
      className='cursor-pointer border-2 hover:border-primary hover:shadow-lg transition-all duration-200 group'
      onClick={onSelect}
    >
      <CardContent className='p-6 flex flex-col items-center justify-center space-y-4 text-center'>
        <div className='p-4 rounded-full bg-secondary text-primary group-hover:scale-110 transition-transform duration-200'>
          {isNewBuilding ? (
            <Building2 className='w-10 h-10' />
          ) : (
            <Building className='w-10 h-10' />
          )}
        </div>
        <div>
          <h3 className='font-semibold text-lg'>{gedung.namaGedung}</h3>
          <p className='text-xs text-muted-foreground mt-1'>
            {gedung.ruanganList.length > 0
              ? `${gedung.ruanganList.length} Ruangan Tersedia`
              : 'Fasilitas & Instalasi Gizi'}
          </p>
        </div>
        <Button
          size='lg'
          className='w-full'
          variant={isNewBuilding ? 'default' : 'outline'}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Pilih {gedung.namaGedung}
        </Button>
      </CardContent>
    </Card>
  );
}
