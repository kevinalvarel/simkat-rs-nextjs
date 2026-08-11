'use client';

import { useEffect, useRef } from 'react';
import type { Patient } from '@/servers/patient.service';

export type ContextMenuState = {
  x: number;
  y: number;
  patient: Patient;
} | null;

interface PatientContextMenuProps {
  contextMenu: ContextMenuState;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
  onOpenPindah: (patient: Patient) => void;
  onQuickPulang: (patient: Patient) => void;
}

export default function PatientContextMenu({
  contextMenu,
  onClose,
  onEdit,
  onOpenPindah,
  onQuickPulang,
}: PatientContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  if (!contextMenu) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${Math.min(contextMenu.y, window.innerHeight - 220)}px`,
        left: `${Math.min(contextMenu.x, window.innerWidth - 240)}px`,
      }}
      className='z-50 w-64 rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl ring-1 ring-foreground/10 animate-in fade-in zoom-in-95 duration-100'
    >
      {/* Header */}
      <div className='px-3 py-2 border-b mb-1'>
        <p className='font-semibold text-sm truncate'>
          {contextMenu.patient.nama_pasien}
        </p>
        <p className='text-xs text-muted-foreground font-mono'>
          (RM-{contextMenu.patient.no_rm})
        </p>
      </div>

      {/* Menu Items */}
      <div className='space-y-0.5 text-sm font-medium'>
        <button
          type='button'
          onClick={() => {
            const pt = contextMenu.patient;
            onClose();
            onEdit(pt);
          }}
          className='w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors'
        >
          <span className='flex items-center gap-2'>
            <span>✏️</span> Edit Data
          </span>
          <span className='text-xs text-muted-foreground'>›</span>
        </button>

        <button
          type='button'
          onClick={() => {
            const pt = contextMenu.patient;
            onClose();
            onOpenPindah(pt);
          }}
          className='w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors'
        >
          <span className='flex items-center gap-2'>
            <span>🚪</span> Pindah Ruangan
          </span>
          <span className='text-xs text-muted-foreground'>›</span>
        </button>

        <button
          type='button'
          onClick={() => {
            const pt = contextMenu.patient;
            onClose();
            onQuickPulang(pt);
          }}
          className='w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors'
        >
          <span className='flex items-center gap-2'>
            <span>🏠</span> Pasien Pulang
          </span>
        </button>
      </div>

      {/* Divider & Batal Button */}
      <div className='pt-1.5 mt-1.5 border-t'>
        <button
          type='button'
          onClick={onClose}
          className='w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-300 text-rose-600 font-semibold text-xs transition-colors'
        >
          <span>❌</span> Batal
        </button>
      </div>
    </div>
  );
}
