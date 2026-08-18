import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sun, SunMedium, Moon, Lock, Unlock, Edit3 } from 'lucide-react';
import type { MealConfigItem, MealLockInfo } from '@/types/ag-rs-types';

interface MealCardProps {
  meal: MealConfigItem;
  lockInfo: MealLockInfo;
  isSelected?: boolean;
  onSelect: () => void;
}

export default function MealCard({
  meal,
  lockInfo,
  isSelected = false,
  onSelect,
}: MealCardProps) {
  const { isPreviousBatch, isOlderLocked, cutoffTime } = lockInfo;

  const renderIcon = () => {
    if (isPreviousBatch) return <Edit3 className='w-8 h-8' />;
    if (isOlderLocked) return <Lock className='w-8 h-8' />;
    if (meal.jenisMakan === 'PAGI') return <Sun className='w-8 h-8' />;
    if (meal.jenisMakan === 'SIANG') return <SunMedium className='w-8 h-8' />;
    return <Moon className='w-8 h-8' />;
  };

  return (
    <Card
      className={`border-2 transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'border-primary ring-2 ring-primary/40 shadow-md scale-[1.02]'
          : isPreviousBatch
            ? 'border-amber-500/60 bg-amber-500/[0.04] dark:bg-amber-950/20 cursor-pointer hover:border-amber-500 hover:shadow-md group'
            : isOlderLocked
              ? 'bg-muted/40 border-muted opacity-60 cursor-not-allowed'
              : 'cursor-pointer hover:border-primary hover:shadow-md group'
      }`}
      onClick={() => {
        if (!isOlderLocked) onSelect();
      }}
    >
      <CardContent className='p-5 flex flex-col items-center text-center space-y-3 flex-1 justify-between'>
        {/* Top Lock / Revision Badge */}
        <div className='w-full flex justify-end'>
          {isPreviousBatch ? (
            <Badge
              variant='outline'
              className='text-[10px] gap-1 font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 animate-pulse'
            >
              <Edit3 className='w-3 h-3 text-amber-600' /> BATCH SEBELUMNYA
            </Badge>
          ) : isOlderLocked ? (
            <Badge
              variant='secondary'
              className='text-[10px] gap-1 font-semibold text-muted-foreground'
            >
              <Lock className='w-3 h-3' /> TERKUNCI
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='text-[10px] gap-1 font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
            >
              <Unlock className='w-3 h-3 text-emerald-600' /> AKTIF
            </Badge>
          )}
        </div>

        {/* Icon & Details */}
        <div className='space-y-2 flex flex-col items-center'>
          <div
            className={`p-3 rounded-full ${
              isPreviousBatch
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 group-hover:scale-110 transition-transform'
                : isOlderLocked
                  ? 'bg-muted text-muted-foreground'
                  : `${meal.bgLight} group-hover:scale-110 transition-transform`
            }`}
          >
            {renderIcon()}
          </div>
          <div>
            <h4 className='font-semibold text-base'>{meal.title}</h4>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {meal.distribusi}
            </p>
            <p
              className={`text-[11px] font-mono font-medium mt-1 ${
                isPreviousBatch
                  ? 'text-amber-800 dark:text-amber-300 font-bold'
                  : isOlderLocked
                    ? 'text-muted-foreground'
                    : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {isPreviousBatch
                ? `(Post-Snapshot Cut-off ${cutoffTime} WIB)`
                : `Cut-off: ${cutoffTime} WIB`}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          size='sm'
          variant={
            isPreviousBatch
              ? 'outline'
              : isOlderLocked
                ? 'secondary'
                : 'default'
          }
          disabled={isOlderLocked}
          className={`w-full mt-2 text-xs font-semibold ${
            isPreviousBatch
              ? 'border-amber-500/60 text-amber-900 dark:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20'
              : isOlderLocked
                ? 'bg-muted text-muted-foreground cursor-not-allowed border'
                : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isOlderLocked) onSelect();
          }}
        >
          {isPreviousBatch ? (
            <span className='flex items-center gap-1.5 justify-center'>
              <Edit3 className='w-3.5 h-3.5' /> Revisi Batch
            </span>
          ) : isOlderLocked ? (
            <span className='flex items-center gap-1.5 justify-center'>
              <Lock className='w-3.5 h-3.5' /> Terkunci (Selesai)
            </span>
          ) : (
            `Pilih ${meal.title.replace('Makan ', '')}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
