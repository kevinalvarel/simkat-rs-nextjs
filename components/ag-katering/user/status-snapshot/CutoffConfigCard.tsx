'use client';

import { useState, useEffect, useMemo } from 'react';
import type {
  SnapshotBatch,
  WaktuMakanConfig,
  MealCycleStatus,
} from '@/lib/snapshot-cycle';
import {
  computeMealCycleStatuses,
  formatCountdown,
} from '@/lib/snapshot-cycle';
import {
  updateWaktuMakanConfig,
  triggerManualSnapshot,
} from '@/servers/snapshot.service';
import { broadcastProductionUpdate } from '@/lib/realtime-sync';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sun,
  SunMedium,
  Moon,
  Clock,
  Lock,
  Unlock,
  Play,
  Pencil,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Users,
  Timer,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface CutoffConfigCardProps {
  configs: WaktuMakanConfig[];
  batches?: SnapshotBatch[];
  onSnapshotTriggered?: () => void;
}

export default function CutoffConfigCard({
  configs,
  batches = [],
  onSnapshotTriggered,
}: CutoffConfigCardProps) {
  // State for edit time dialog
  const [editingConfig, setEditingConfig] = useState<WaktuMakanConfig | null>(
    null,
  );
  const [newTime, setNewTime] = useState<string>('00:00');
  const [isUpdatingTime, setIsUpdatingTime] = useState<boolean>(false);

  // State for manual trigger dialog
  const [triggeringTarget, setTriggeringTarget] = useState<{
    config: WaktuMakanConfig;
    status: MealCycleStatus;
  } | null>(null);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

  // Live Clock & Date state
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentTimeStr = now
    ? `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes(),
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    : '00:00:00';

  // Compute live cycle statuses for PAGI, SIANG, MALAM
  const cycleData = useMemo(() => {
    return computeMealCycleStatuses(configs, batches, now || new Date());
  }, [configs, batches, now]);

  async function handleSaveCutoffTime() {
    if (!editingConfig || !newTime) return;
    setIsUpdatingTime(true);
    try {
      const res = await updateWaktuMakanConfig(
        editingConfig.jenis_makan,
        newTime,
      );
      if (res.success) {
        toast.success(res.message);
        setEditingConfig(null);
        broadcastProductionUpdate('SNAPSHOT_TRIGGERED');
        if (onSnapshotTriggered) onSnapshotTriggered();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menyimpan waktu cut-off.');
    } finally {
      setIsUpdatingTime(false);
    }
  }

  async function handleConfirmTriggerSnapshot() {
    if (!triggeringTarget) return;
    setIsTriggering(true);
    try {
      const res = await triggerManualSnapshot(
        triggeringTarget.config.jenis_makan,
        triggeringTarget.config.waktu,
        false,
        triggeringTarget.status.targetDate,
      );
      if (res.success) {
        toast.success(res.message);
        setTriggeringTarget(null);
        broadcastProductionUpdate('SNAPSHOT_TRIGGERED');
        if (onSnapshotTriggered) onSnapshotTriggered();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal mengeksekusi snapshot manual.');
    } finally {
      setIsTriggering(false);
    }
  }

  const mealTimeMeta: Record<
    string,
    { title: string; icon: React.ReactNode; color: string; bg: string }
  > = {
    PAGI: {
      title: 'Makan Pagi',
      icon: <Sun className='w-6 h-6 text-amber-500' />,
      color: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
    },
    SIANG: {
      title: 'Makan Siang',
      icon: <SunMedium className='w-6 h-6 text-orange-500' />,
      color: 'border-orange-500/30',
      bg: 'bg-orange-500/10',
    },
    MALAM: {
      title: 'Makan Malam',
      icon: <Moon className='w-6 h-6 text-indigo-500' />,
      color: 'border-indigo-500/30',
      bg: 'bg-indigo-500/10',
    },
  };

  const lockedCount = cycleData.statuses.filter((s) => s.isLocked).length;
  const isAllLocked = lockedCount === cycleData.statuses.length;

  return (
    <div className='space-y-4'>
      {/* Live Time & System Lock Indicator */}
      <div className='flex flex-wrap items-center justify-between bg-card border rounded-xl p-4 shadow-sm gap-3'>
        <div className='flex items-center gap-3'>
          <div className='p-2.5 rounded-lg bg-primary/10 text-primary'>
            <Clock className='w-5 h-5 animate-pulse' />
          </div>
          <div>
            <h3 className='font-semibold text-sm flex items-center gap-2'>
              Waktu Server Realtime
              <span className='text-xs font-normal text-muted-foreground'>
                ({cycleData.summaryText})
              </span>
            </h3>
            <p className='text-xs text-muted-foreground'>
              Data diet pasien terkunci otomatis saat jam cut-off tercapai
            </p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Badge
            variant={isAllLocked ? 'secondary' : 'default'}
            className={`hidden sm:inline-flex gap-1.5 py-1 px-3 text-xs ${
              !isAllLocked && cycleData.isMalamLocked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : ''
            }`}
          >
            {isAllLocked ? (
              <>
                <Lock className='w-3.5 h-3.5' /> Seluruh Siklus Terkunci
              </>
            ) : cycleData.isMalamLocked ? (
              <>
                <Unlock className='w-3.5 h-3.5' /> Makan Pagi (Besok) Terbuka
              </>
            ) : (
              <>
                <Lock className='w-3.5 h-3.5' />
                {configs.length - lockedCount} Siklus Menunggu Cut-off
              </>
            )}
          </Badge>

          <div className='font-mono font-bold text-lg bg-muted/60 px-4 py-1.5 rounded-lg border text-primary tracking-wider'>
            {currentTimeStr} WIB
          </div>
        </div>
      </div>

      {/* Meal Time Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {cycleData.statuses.map((status) => {
          const config = configs.find(
            (c) => c.jenis_makan === status.jenis_makan,
          ) || {
            id: status.id,
            jenis_makan: status.jenis_makan,
            waktu: status.waktu,
          };

          const meta = mealTimeMeta[status.jenis_makan] || {
            title: status.jenis_makan,
            icon: <Clock className='w-6 h-6 text-primary' />,
            color: 'border-primary/30',
            bg: 'bg-primary/10',
          };

          const isLocked = status.isLocked;

          return (
            <Card
              key={config.id || status.jenis_makan}
              className={`border-2 ${
                isLocked
                  ? 'border-rose-500/40 bg-rose-500/[0.02]'
                  : `${meta.color} hover:shadow-md ring-1 ring-emerald-500/20`
              } shadow-sm transition-all duration-200 relative overflow-hidden flex flex-col justify-between`}
            >
              <CardHeader className='pb-3 flex flex-row items-start justify-between space-y-0'>
                <div className='flex items-center gap-3'>
                  <div className={`p-2.5 rounded-full ${meta.bg}`}>
                    {meta.icon}
                  </div>
                  <div>
                    <CardTitle className='text-base font-bold flex items-center gap-1.5'>
                      {meta.title}
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Siklus {status.jenis_makan}{' '}
                      {status.isTomorrow ? (
                        <span className='font-medium text-emerald-600 dark:text-emerald-400'>
                          (Besok, {status.targetDateDisplay})
                        </span>
                      ) : null}
                    </CardDescription>
                  </div>
                </div>

                {/* Status Badge */}
                {isLocked ? (
                  <Badge
                    variant='destructive'
                    className='text-[10px] font-semibold flex items-center gap-1 bg-rose-600 dark:bg-rose-950 text-white dark:text-rose-200 border-rose-500/50'
                  >
                    <Lock className='w-3 h-3' /> TERKUNCI
                  </Badge>
                ) : (
                  <Badge
                    variant='outline'
                    className='text-[10px] font-semibold flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 animate-pulse'
                  >
                    <Unlock className='w-3 h-3 text-emerald-600' />{' '}
                    {status.isTomorrow ? 'AKTIF (BESOK)' : 'AKTIF'}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className='space-y-3.5 pt-1 flex-1 flex flex-col justify-between'>
                {/* Cut-off info & Live Countdown */}
                <div className='space-y-2'>
                  <div className='bg-muted/40 p-2.5 rounded-lg border flex justify-between items-center text-xs'>
                    <span className='text-muted-foreground flex items-center gap-1.5 font-medium'>
                      <Clock className='w-3.5 h-3.5 text-primary' /> Jam Cut-off:
                    </span>
                    <div className='text-right'>
                      <strong className='font-mono text-sm font-bold text-foreground'>
                        {config.waktu} WIB
                      </strong>
                      {status.isTomorrow && (
                        <span className='block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium'>
                          Besok Pagi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Countdown Timer or Lock Notice */}
                  {!isLocked ? (
                    <div className='bg-emerald-500/10 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in duration-200'>
                      <span className='text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5'>
                        <Timer className='w-3.5 h-3.5 animate-spin' /> Sisa Waktu
                        Cut-off:
                      </span>
                      <strong className='font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded'>
                        {formatCountdown(status.remainingSeconds)}
                      </strong>
                    </div>
                  ) : (
                    <div className='bg-rose-500/10 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30 flex items-center justify-between text-xs'>
                      <span className='text-rose-800 dark:text-rose-300 font-medium flex items-center gap-1.5'>
                        <ShieldAlert className='w-3.5 h-3.5 text-rose-500' /> Status
                        Kunci:
                      </span>
                      <strong className='font-mono text-xs font-semibold text-rose-700 dark:text-rose-300'>
                        Terkunci ({config.waktu} WIB)
                      </strong>
                    </div>
                  )}

                  {/* Batch Info if created */}
                  {status.batch && (
                    <div className='bg-card p-2.5 rounded-lg border text-xs space-y-1 font-mono'>
                      <div className='flex justify-between items-center text-[11px] text-muted-foreground'>
                        <span>
                          Batch {status.isTomorrow ? 'Besok' : 'Today'}:
                        </span>
                        <strong className='text-foreground font-semibold truncate max-w-[140px]'>
                          {status.batch.batch_code}
                        </strong>
                      </div>
                      <div className='flex justify-between items-center text-[11px] text-muted-foreground'>
                        <span className='flex items-center gap-1'>
                          <Users className='w-3 h-3' /> Pasien Locked:
                        </span>
                        <strong className='text-emerald-600 font-bold'>
                          {status.batch.total_pasien} Pasien
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className='flex gap-2 pt-2 border-t mt-auto'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1 gap-1.5 text-xs'
                    onClick={() => {
                      setEditingConfig(config);
                      setNewTime(config.waktu);
                    }}
                  >
                    <Pencil className='w-3.5 h-3.5' /> Edit Jam
                  </Button>

                  <Button
                    size='sm'
                    className={`flex-1 gap-1.5 text-xs ${
                      isLocked
                        ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                    onClick={() =>
                      setTriggeringTarget({ config, status })
                    }
                  >
                    {isLocked ? (
                      <>
                        <Lock className='w-3.5 h-3.5' /> Re-Snapshot
                      </>
                    ) : (
                      <>
                        <Play className='w-3.5 h-3.5 fill-current' /> Kunci &
                        Snapshot
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* EDIT CUTOFF TIME DIALOG */}
      {editingConfig && (
        <Dialog
          open={Boolean(editingConfig)}
          onOpenChange={(open) => !open && setEditingConfig(null)}
        >
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Pencil className='w-5 h-5 text-primary' />
                Ubah Waktu Cut-Off ({editingConfig.jenis_makan})
              </DialogTitle>
              <DialogDescription>
                Tentukan jam cut-off baru untuk siklus{' '}
                {editingConfig.jenis_makan}. Data pasien akan terkunci secara
                otomatis tepat pada jam ini.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-3 py-2'>
              <label className='text-xs font-semibold text-foreground block'>
                Jam Cut-off (HH:mm WIB)
              </label>
              <Input
                type='time'
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className='font-mono text-base'
              />
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setEditingConfig(null)}
                disabled={isUpdatingTime}
              >
                Batal
              </Button>
              <Button onClick={handleSaveCutoffTime} disabled={isUpdatingTime}>
                {isUpdatingTime ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Jam Cut-off'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MANUAL SNAPSHOT CONFIRMATION DIALOG */}
      {triggeringTarget && (
        <Dialog
          open={Boolean(triggeringTarget)}
          onOpenChange={(open) => !open && setTriggeringTarget(null)}
        >
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-emerald-600'>
                <CheckCircle2 className='w-5 h-5' />
                Kunci & Trigger Snapshot Sekarang?
              </DialogTitle>
              <DialogDescription className='text-xs pt-1 space-y-2'>
                Sistem akan mengambil data real-time pasien aktif saat ini untuk
                siklus{' '}
                <strong className='text-foreground'>
                  {triggeringTarget.config.jenis_makan}{' '}
                  {triggeringTarget.status.isTomorrow ? '(Besok)' : ''}
                </strong>{' '}
                dan menguncinya dalam batch snapshot produksi.
              </DialogDescription>
            </DialogHeader>

            <div className='bg-muted/50 p-3 rounded-lg border text-xs space-y-1.5 my-2'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Siklus Makan:</span>
                <strong className='text-foreground'>
                  {triggeringTarget.config.jenis_makan}
                </strong>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground flex items-center gap-1'>
                  <Calendar className='w-3.5 h-3.5' /> Tanggal Produksi Target:
                </span>
                <strong className='text-foreground font-semibold'>
                  {triggeringTarget.status.targetDate} (
                  {triggeringTarget.status.targetDateDisplay})
                </strong>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground flex items-center gap-1'>
                  <Clock className='w-3.5 h-3.5' /> Waktu Acuan Cut-off:
                </span>
                <strong className='text-foreground font-mono'>
                  {triggeringTarget.config.waktu} WIB
                </strong>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setTriggeringTarget(null)}
                disabled={isTriggering}
              >
                Batal
              </Button>
              <Button
                className='bg-emerald-600 hover:bg-emerald-700 text-white'
                onClick={handleConfirmTriggerSnapshot}
                disabled={isTriggering}
              >
                {isTriggering ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Proses Snapshot...
                  </>
                ) : (
                  'Kunci & Snapshot Sekarang'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
