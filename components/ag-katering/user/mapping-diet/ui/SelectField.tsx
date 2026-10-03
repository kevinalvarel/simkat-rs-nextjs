'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import type { KategoriMenuOption } from '@/servers/mapping-diet.service';

export interface SelectFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: KategoriMenuOption[];
  disabled?: boolean;
  error?: string;
  allowClear?: boolean;
  includeSpecial?: boolean;
}

const CLEAR_SENTINEL = '__CLEAR__';

// Category Labels: KARBO, HEWANI, NABATI, SAYUR, BUAH, SNACK
export const KATEGORI_LABEL: Record<string, string> = {
  KARBO: 'Karbohidrat',
  KARBOHIDRAT: 'Karbohidrat',
  HEWANI: 'Lauk Hewani',
  NABATI: 'Lauk Nabati',
  SAYUR: 'Sayur',
  BUAH: 'Buah',
  SNACK: 'Snack',
  BENTUK_MAKANAN: 'Bentuk Makanan',
  DIIT: 'Kategori Diet',
  EXTRA: 'Extra Makanan',
};

export function SelectField({
  label,
  required,
  value,
  onChange,
  placeholder,
  options,
  disabled,
  error,
  allowClear = true,
  includeSpecial = false,
}: SelectFieldProps) {
  const hasValue = Boolean(value && value !== CLEAR_SENTINEL);

  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between'>
        <Label className='text-xs font-semibold text-foreground flex items-center gap-1'>
          {label}
          {required && <span className='text-rose-500 ml-0.5'>*</span>}
        </Label>
        {hasValue && allowClear && (
          <button
            type='button'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange('');
            }}
            className='text-[10px] text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 font-medium flex items-center gap-0.5 transition-colors cursor-pointer'
            title='Kosongkan Pilihan'
          >
            <X className='w-3 h-3' /> Kosongkan
          </button>
        )}
      </div>

      <div className='relative'>
        <Select
          value={value || ''}
          onValueChange={(val) => {
            if (val === CLEAR_SENTINEL) {
              onChange('');
            } else if (val !== null) {
              onChange(val);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className='w-full h-9 text-xs bg-background border-input focus:ring-2 focus:ring-primary/20 pr-8'>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {includeSpecial && (
              <SelectItem value='NPO'>NPO / Puasa</SelectItem>
            )}
            {/* Clear option inside dropdown */}
            {hasValue && allowClear && (
              <SelectItem
                value={CLEAR_SENTINEL}
                className='text-muted-foreground italic text-xs border-b pb-1.5 mb-1 text-rose-600 dark:text-rose-400 font-medium cursor-pointer'
              >
                ❌ -- Kosongkan / Batal Pilih --
              </SelectItem>
            )}

            <div className='px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 rounded-sm mb-1'>
              Pilihan Standar Menu
            </div>

            {options.length === 0 ? (
              <div className='p-2 text-xs text-muted-foreground italic text-center'>
                Tidak ada pilihan standar
              </div>
            ) : (
              options.filter((opt) => opt.kodeItem !== 'NPO').map((opt) => (
                <SelectItem key={opt.id} value={opt.kodeItem}>
                  <span className='font-mono font-bold text-primary mr-1'>
                    {opt.kodeItem}
                  </span>
                  <span className='text-muted-foreground'>—</span>
                  <span className='ml-1'>{opt.labelItem}</span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {error && <p className='text-[11px] text-destructive'>{error}</p>}
    </div>
  );
}
