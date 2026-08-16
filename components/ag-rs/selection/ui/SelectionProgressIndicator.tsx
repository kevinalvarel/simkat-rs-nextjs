import React from 'react';

interface SelectionProgressIndicatorProps {
  currentStep: number;
}

export default function SelectionProgressIndicator({
  currentStep,
}: SelectionProgressIndicatorProps) {
  return (
    <div className='flex items-center justify-center gap-3'>
      {/* Step 1: Jam Makan */}
      <div className='flex items-center gap-1.5'>
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            currentStep >= 0 ? 'w-12 bg-primary' : 'w-8 bg-muted'
          }`}
        />
        <span className='text-xs font-medium text-muted-foreground hidden sm:inline'>
          Jam Makan
        </span>
      </div>

      {/* Step 2: Gedung */}
      <div className='flex items-center gap-1.5'>
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            currentStep >= 1 ? 'w-12 bg-primary' : 'w-8 bg-muted'
          }`}
        />
        <span className='text-xs font-medium text-muted-foreground hidden sm:inline'>
          Gedung
        </span>
      </div>

      {/* Step 3: Ruangan */}
      <div className='flex items-center gap-1.5'>
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            currentStep >= 2 ? 'w-12 bg-primary' : 'w-8 bg-muted'
          }`}
        />
        <span className='text-xs font-medium text-muted-foreground hidden sm:inline'>
          Ruangan
        </span>
      </div>
    </div>
  );
}
