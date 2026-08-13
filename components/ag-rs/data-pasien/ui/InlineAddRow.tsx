'use client';

import { TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, Loader2 } from 'lucide-react';
import type { InlineAddRowProps } from '@/types/data-pasien';

export function InlineAddRow({
  bedNumber,
  defaultBedLabel,
  inlineAddDraft,
  ruangan,
  gedung,
  kelasOptions,
  statusOptions,
  isSavingInline,
  onUpdateDraft,
  onSave,
  onCancel,
  onRowBlur,
}: InlineAddRowProps) {
  return (
    <TableRow
      key={`inline-add-${bedNumber}`}
      onBlur={(e) => onRowBlur(e, defaultBedLabel)}
      className='bg-amber-500/10 dark:bg-amber-950/30 border-2 border-amber-500/50 transition-colors animate-in fade-in duration-200'
    >
      {/* 1. Index */}
      <TableCell className='text-center text-xs text-amber-700 dark:text-amber-300 font-mono font-bold'>
        {bedNumber}
      </TableCell>

      {/* 2. Nama Pasien */}
      <TableCell className='p-1.5 min-w-[140px]'>
        <Input
          value={inlineAddDraft.nama_pasien}
          onChange={(e) => onUpdateDraft('nama_pasien', e.target.value)}
          placeholder='Nama Pasien *'
          autoFocus
          className='h-8 text-xs font-semibold bg-background border-primary/50 focus-visible:ring-primary'
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(defaultBedLabel);
            if (e.key === 'Escape') onCancel();
          }}
        />
      </TableCell>

      {/* 3. No. RM */}
      <TableCell className='p-1.5 min-w-[110px]'>
        <Input
          value={inlineAddDraft.no_rm}
          onChange={(e) => onUpdateDraft('no_rm', e.target.value)}
          placeholder='No. RM *'
          className='h-8 text-xs font-mono bg-background'
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(defaultBedLabel);
            if (e.key === 'Escape') onCancel();
          }}
        />
      </TableCell>

      {/* 4. Diet */}
      <TableCell className='p-1.5 min-w-[140px]'>
        <Input
          value={inlineAddDraft.diet}
          onChange={(e) => onUpdateDraft('diet', e.target.value)}
          placeholder='Diet (misal: MB, NPO)'
          className='h-8 text-xs font-semibold text-primary bg-background'
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(defaultBedLabel);
            if (e.key === 'Escape') onCancel();
          }}
        />
      </TableCell>

      {/* 5. Kelas */}
      <TableCell className='p-1.5 min-w-[110px]'>
        <Select
          value={inlineAddDraft.kelas}
          onValueChange={(val) => {
            if (val) onUpdateDraft('kelas', val);
          }}
        >
          <SelectTrigger className='h-8 text-xs bg-background'>
            <SelectValue placeholder='Kelas' />
          </SelectTrigger>
          <SelectContent>
            {kelasOptions.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* 6. Ruangan */}
      <TableCell className='p-1.5 text-xs text-muted-foreground font-medium'>
        {inlineAddDraft.ruangan || ruangan || '-'}
      </TableCell>

      {/* 7. Bed */}
      <TableCell className='p-1.5 min-w-[90px]'>
        <Input
          value={inlineAddDraft.bed}
          onChange={(e) => onUpdateDraft('bed', e.target.value)}
          placeholder='Bed'
          className='h-8 text-xs font-mono font-semibold bg-background w-20'
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(defaultBedLabel);
            if (e.key === 'Escape') onCancel();
          }}
        />
      </TableCell>

      {/* 8. Gedung */}
      <TableCell className='p-1.5 text-xs text-muted-foreground font-medium'>
        {inlineAddDraft.gedung || gedung || '-'}
      </TableCell>

      {/* 9. Status Pasien */}
      <TableCell className='p-1.5 min-w-[130px]'>
        <Select
          value={inlineAddDraft.status_pasien}
          onValueChange={(val) => {
            if (val) onUpdateDraft('status_pasien', val);
          }}
        >
          <SelectTrigger className='h-8 text-xs bg-background'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((st) => (
              <SelectItem key={st} value={st}>
                {st.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* 10. Action Buttons */}
      <TableCell className='p-1.5 text-right whitespace-nowrap'>
        <div className='flex items-center justify-end gap-1'>
          <Button
            size='sm'
            onClick={() => onSave(defaultBedLabel)}
            disabled={isSavingInline}
            className='h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm'
            title='Simpan Pasien Baru (Enter)'
          >
            {isSavingInline ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
            ) : (
              <Check className='h-3.5 w-3.5' />
            )}
            Simpan
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={onCancel}
            disabled={isSavingInline}
            className='h-8 w-8 p-0 text-xs'
            title='Batal (Esc)'
          >
            <X className='h-3.5 w-3.5' />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
