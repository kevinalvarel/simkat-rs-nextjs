import React from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import MealCard from '@/components/ag-rs/selection/ui/MealCard';
import type {
  MealConfigItem,
  MealLockInfo,
  MealTimeType,
} from '@/types/ag-rs-types';

const MEAL_TIMES_CONFIG: MealConfigItem[] = [
  {
    key: 'Makan Pagi',
    title: 'Makan Pagi',
    jenisMakan: 'PAGI',
    distribusi: '06:00 - 08:00 WIB',
    defaultCutoff: '05:30',
    bgLight:
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    key: 'Makan Siang',
    title: 'Makan Siang',
    jenisMakan: 'SIANG',
    distribusi: '11:30 - 13:30 WIB',
    defaultCutoff: '10:30',
    bgLight:
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    key: 'Makan Malam',
    title: 'Makan Malam',
    jenisMakan: 'MALAM',
    distribusi: '17:00 - 19:00 WIB',
    defaultCutoff: '16:00',
    bgLight:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  },
];

interface StepMealTimeSectionProps {
  isLoading: boolean;
  selectedMealTime?: MealTimeType;
  getMealLockInfo: (
    jenisMakan: 'PAGI' | 'SIANG' | 'MALAM',
    defaultCutoff: string,
  ) => MealLockInfo;
  onSelectMealTime: (
    meal: 'Makan Pagi' | 'Makan Siang' | 'Makan Malam',
    lockInfo: MealLockInfo,
  ) => void;
}

export default function StepMealTimeSection({
  isLoading,
  selectedMealTime,
  getMealLockInfo,
  onSelectMealTime,
}: StepMealTimeSectionProps) {
  return (
    <div className='space-y-4 animate-in fade-in-50 duration-300'>
      {/* Callout Notice */}
      <div className='flex items-start gap-3 bg-muted/40 p-3.5 px-4 rounded-xl border text-xs text-muted-foreground'>
        <ShieldAlert className='w-4 h-4 text-amber-500 shrink-0 mt-0.5' />
        <div>
          <strong className='text-foreground font-semibold'>
            Aturan Revisi Post-Snapshot:
          </strong>
          <span className='ml-1'>
            Jika batch yang berjalan sudah berpindah, hanya{' '}
            <strong>BATCH SEBELUMNYA</strong> yang dapat direvisi secara langsung.
            Batch yang lebih lampau terkunci permanen.
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className='flex flex-col items-center justify-center p-8 space-y-3'>
          <Loader2 className='w-8 h-8 animate-spin text-primary' />
          <p className='text-xs text-muted-foreground'>
            Memuat status waktu cut-off & master RS...
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {MEAL_TIMES_CONFIG.map((meal) => {
            const lockInfo = getMealLockInfo(
              meal.jenisMakan,
              meal.defaultCutoff,
            );

            return (
              <MealCard
                key={meal.key}
                meal={meal}
                lockInfo={lockInfo}
                isSelected={selectedMealTime === meal.key}
                onSelect={() => onSelectMealTime(meal.key, lockInfo)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
