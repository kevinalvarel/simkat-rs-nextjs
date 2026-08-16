import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DoorOpen } from 'lucide-react';
import type { RuanganItem } from '@/servers/tempat.service';

interface RuanganCardProps {
  ruangan: RuanganItem;
  onSelect: () => void;
}

export default function RuanganCard({ ruangan, onSelect }: RuanganCardProps) {
  return (
    <Card
      className='cursor-pointer border-2 hover:border-primary hover:shadow-md transition-all duration-200 group'
      onClick={onSelect}
    >
      <CardContent className='p-5 flex flex-col items-center text-center space-y-3'>
        <div className='p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform'>
          <DoorOpen className='w-6 h-6' />
        </div>
        <div>
          <h4 className='font-semibold text-sm sm:text-base'>
            {ruangan.namaRuangan}
          </h4>
          <p className='text-xs text-muted-foreground mt-0.5'>
            ID: #{ruangan.idRuangan}
          </p>
        </div>
        <Button
          size='sm'
          className='w-full mt-1'
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Pilih Ruangan
        </Button>
      </CardContent>
    </Card>
  );
}
