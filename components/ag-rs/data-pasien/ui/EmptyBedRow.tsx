'use client';

import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyBedRowProps {
  bedNumber: number;
  defaultBedLabel: string;
  ruangan: string;
  gedung: string;
  kamar?: string;
  onStartInlineAdd: (bedLabel: string) => void;
}

export function EmptyBedRow({
  bedNumber,
  defaultBedLabel,
  ruangan,
  gedung,
  kamar,
  onStartInlineAdd,
}: EmptyBedRowProps) {
  return (
    <TableRow
      key={`empty-bed-${bedNumber}`}
      onClick={() => onStartInlineAdd(defaultBedLabel)}
      className='group hover:bg-primary/5 transition-colors cursor-pointer border-dashed/60'
    >
      <TableCell className='text-center text-xs text-muted-foreground/60 font-mono'>
        {bedNumber}
      </TableCell>
      <TableCell className='text-xs text-muted-foreground/40 italic font-medium'>
        (Kosong - Klik untuk isi inline)
      </TableCell>
      <TableCell className='text-xs font-mono text-muted-foreground/30'>
        -
      </TableCell>
      <TableCell className='text-xs text-muted-foreground/30'>
        -
      </TableCell>
      <TableCell className='text-xs text-muted-foreground/40'>
        -
      </TableCell>
      <TableCell className='text-xs text-muted-foreground/60'>
        {ruangan || '-'}
      </TableCell>
      <TableCell className='text-xs font-mono font-medium text-muted-foreground/70'>
        {defaultBedLabel}
      </TableCell>
      <TableCell className='text-xs text-muted-foreground/60'>
        {kamar || 'Kamar 1'}
      </TableCell>
      <TableCell>
        <span className='inline-flex items-center rounded-md border border-dashed border-muted-foreground/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/40 bg-muted/20'>
          KOSONG
        </span>
      </TableCell>
      <TableCell className='text-right'>
        <Button
          variant='ghost'
          size='sm'
          onClick={(e) => {
            e.stopPropagation();
            onStartInlineAdd(defaultBedLabel);
          }}
          className='h-7 text-xs text-primary hover:text-primary gap-1 opacity-70 group-hover:opacity-100'
        >
          <Plus className='h-3.5 w-3.5' />
          Isi Bed
        </Button>
      </TableCell>
    </TableRow>
  );
}
