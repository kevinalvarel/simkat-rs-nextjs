import React from 'react';
import { Check } from 'lucide-react';

interface SelectionProgressIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { id: 0, label: 'Waktu Makan' },
  { id: 1, label: 'Gedung' },
  { id: 2, label: 'Ruangan' },
];

export default function SelectionProgressIndicator({
  currentStep,
  onStepClick,
}: SelectionProgressIndicatorProps) {
  return (
    <nav
      aria-label='Tahapan Pemilihan'
      className='flex items-center justify-center gap-2 sm:gap-4 select-none'
    >
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isClickable = Boolean(onStepClick && step.id <= currentStep);

        return (
          <React.Fragment key={step.id}>
            {idx > 0 && (
              <div
                className={`h-0.5 w-4 sm:w-8 transition-colors duration-300 ${
                  currentStep >= step.id ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}

            <button
              type='button'
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(step.id)}
              className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30 ring-offset-2 ring-offset-background scale-105'
                  : isCompleted
                    ? 'bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer'
                    : 'bg-muted/60 text-muted-foreground cursor-not-allowed opacity-60'
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-primary-foreground text-primary'
                    : isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className='w-2.5 h-2.5 stroke-[3]' /> : step.id + 1}
              </span>
              <span className='hidden sm:inline font-medium'>
                {step.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

