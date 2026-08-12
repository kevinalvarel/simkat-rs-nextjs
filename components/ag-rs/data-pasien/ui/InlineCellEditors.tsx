'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Check, X } from 'lucide-react';

// ==========================================
// 1. INLINE TEXT CELL
// ==========================================
interface InlineTextCellProps {
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  isModified?: boolean;
  placeholder?: string;
  inputClassName?: string;
  displayClassName?: string;
  title?: string;
  extraDisplayContent?: React.ReactNode;
}

export function InlineTextCell({
  value,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  isModified = false,
  placeholder = 'Input...',
  inputClassName = 'h-7 text-xs font-medium',
  displayClassName = '',
  title = 'Klik untuk edit',
  extraDisplayContent,
}: InlineTextCellProps) {
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value, isEditing]);

  const handleSave = () => {
    if (tempValue.trim() !== '' && tempValue !== value) {
      onSave(tempValue.trim());
    } else {
      onCancel();
    }
  };

  return (
    <td
      className={`relative transition-all cursor-pointer select-none ${
        isModified
          ? 'ring-1 ring-amber-500/50 bg-amber-500/10 rounded'
          : 'hover:bg-primary/5'
      }`}
      onClick={() => {
        if (!isEditing) onStartEdit();
      }}
      title={title}
    >
      {isEditing ? (
        <div
          className='flex items-center gap-1 p-1 bg-popover rounded-md shadow-md border z-20 min-w-32 animate-in fade-in zoom-in-95'
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            autoFocus
            placeholder={placeholder}
            className={inputClassName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onCancel();
            }}
          />
          <Button
            size='icon'
            className='h-7 w-7 shrink-0'
            onClick={handleSave}
            type='button'
          >
            <Check className='h-3.5 w-3.5' />
          </Button>
          <Button
            size='icon'
            variant='ghost'
            className='h-7 w-7 shrink-0'
            onClick={onCancel}
            type='button'
          >
            <X className='h-3.5 w-3.5' />
          </Button>
        </div>
      ) : (
        <div className='flex items-center justify-between group/cell p-2 text-sm'>
          <div className={`flex items-center gap-1.5 ${displayClassName}`}>
            <span>{value || '-'}</span>
            {extraDisplayContent}
          </div>
          <Pencil className='h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1 shrink-0' />
        </div>
      )}
    </td>
  );
}

// ==========================================
// 2. INLINE DIET CELL
// ==========================================
interface InlineDietCellProps {
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  isModified?: boolean;
  suggestions?: string[];
}

export function InlineDietCell({
  value,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  isModified = false,
  suggestions = [],
}: InlineDietCellProps) {
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value, isEditing]);

  const handleSave = (valToSave?: string) => {
    const target = valToSave ?? tempValue;
    if (target.trim() !== '' && target !== value) {
      onSave(target.trim());
    } else {
      onCancel();
    }
  };

  return (
    <td
      className={`relative transition-all cursor-pointer select-none ${
        isModified
          ? 'ring-1 ring-amber-500/50 bg-amber-500/10 rounded'
          : 'hover:bg-primary/5'
      }`}
      onClick={() => {
        if (!isEditing) onStartEdit();
      }}
      title='Klik untuk mengedit Diet'
    >
      {isEditing ? (
        <div
          className='flex flex-col gap-1.5 p-1.5 bg-popover rounded-md shadow-md border z-20 min-w-48 animate-in fade-in zoom-in-95'
          onClick={(e) => e.stopPropagation()}
        >
          <div className='flex items-center gap-1'>
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              autoFocus
              placeholder='Input Diet...'
              className='h-7 text-xs font-semibold'
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onCancel();
              }}
            />
            <Button
              size='icon'
              className='h-7 w-7 shrink-0'
              onClick={() => handleSave()}
              type='button'
            >
              <Check className='h-3.5 w-3.5' />
            </Button>
            <Button
              size='icon'
              variant='ghost'
              className='h-7 w-7 shrink-0'
              onClick={onCancel}
              type='button'
            >
              <X className='h-3.5 w-3.5' />
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className='flex flex-wrap gap-1 pt-1 border-t'>
              {suggestions.map((tag) => (
                <button
                  key={tag}
                  type='button'
                  onClick={() => {
                    setTempValue(tag);
                    handleSave(tag);
                  }}
                  className='text-[10px] px-1.5 py-0.5 bg-secondary hover:bg-primary hover:text-primary-foreground rounded transition-colors font-medium'
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className='flex items-center justify-between group/cell p-2 text-sm'>
          <span className='font-semibold text-primary'>{value || '-'}</span>
          <Pencil className='h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1 shrink-0' />
        </div>
      )}
    </td>
  );
}

// ==========================================
// 3. INLINE SELECT CELL
// ==========================================
interface SelectOption {
  label: string;
  value: string;
}

interface InlineSelectCellProps {
  value: string;
  options: (string | SelectOption)[];
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  isModified?: boolean;
  placeholder?: string;
  triggerClassName?: string;
  title?: string;
  renderDisplay?: (val: string) => React.ReactNode;
}

export function InlineSelectCell({
  value,
  options,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  isModified = false,
  placeholder = 'Pilih...',
  triggerClassName = 'h-7 text-xs w-32',
  title = 'Klik untuk edit',
  renderDisplay,
}: InlineSelectCellProps) {
  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  );

  return (
    <td
      className={`relative transition-all cursor-pointer select-none ${
        isModified
          ? 'ring-1 ring-amber-500/50 bg-amber-500/10 rounded'
          : 'hover:bg-primary/5'
      }`}
      onClick={() => {
        if (!isEditing) onStartEdit();
      }}
      title={title}
    >
      {isEditing ? (
        <div onClick={(e) => e.stopPropagation()} className='p-1'>
          <Select
            value={value}
            onValueChange={(val) => {
              if (val !== null && val !== value) {
                onSave(val);
              } else {
                onCancel();
              }
            }}
          >
            <SelectTrigger className={triggerClassName}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {normalizedOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className='flex items-center justify-between group/cell p-2 text-sm'>
          <div className='flex-1 truncate'>
            {renderDisplay ? renderDisplay(value) : value || '-'}
          </div>
          <Pencil className='h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1 shrink-0' />
        </div>
      )}
    </td>
  );
}
