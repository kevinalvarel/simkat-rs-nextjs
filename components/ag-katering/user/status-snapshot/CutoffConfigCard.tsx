'use client';

import { useState, useEffect } from 'react';
import type { SnapshotBatch, WaktuMakanConfig } from '@/servers/snapshot.service';
import {
  updateWaktuMakanConfig,
  triggerManualSnapshot,
} from '@/servers/snapshot.service';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface CutoffConfigCardProps {
  configs: WaktuMakanConfig[];
  batches?: SnapshotBatch[];
  onSnapshotTriggered?: () => void;
}

// Calculate remaining seconds until cutoff time today
function getRemainingSeconds(cutoffTimeStr: string, now: Date): number {
  const [h, m] = cutoffTimeStr.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  return Math.floor((target.getTime() - now.getTime()) / 1000);
}

// Format seconds into readable string (e.g. "01j 24m 12s" or "24m 12s")
function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00m 00s';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}j ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
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
  const [triggeringConfig, setTriggeringConfig] =
    useState<WaktuMakanConfig | null>(null);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

  // Live Clock & Date state
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = now ? now.toISOString().slice(0, 10) : '';
  const currentTimeStr = now
    ? `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes(),
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    : '00:00:00';

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
    if (!triggeringConfig) return;
    setIsTriggering(true);
    try {
      const res = await triggerManualSnapshot(
        triggeringConfig.jenis_makan,
        triggeringConfig.waktu,
      );
      if (res.success) {
        toast.success(res.message);
        setTriggeringConfig(null);
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

  // Count locked vs active cycles today
  let lockedCount = 0;
  if (now) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    configs.forEach((cfg) => {
      const [h, m] = cfg.waktu.split(':').map(Number);
      const isPassed = currentMinutes >= h * 60 + m;
      const hasBatch = batches.some(
        (b) =>
          b.tanggal_produksi === todayStr &&
          b.waktu_makan === cfg.jenis_makan,
      );
      if (isPassed || hasBatch) lockedCount++;
    });
  }

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
                ({lockedCount}/{configs.length} Siklus Terkunci Hari Ini)
              </span>
            </h3>
            <p className='text-xs text-muted-foreground'>
              Data diet pasien terkunci otomatis saat jam cut-off tercapai
            </p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Badge
            variant={lockedCount === configs.length ? 'secondary' : 'default'}
            className='hidden sm:inline-flex gap-1.5 py-1 px-3 text-xs'
          >
            <Lock className='w-3.5 h-3.5' />
            {lockedCount === configs.length
              ? 'Seluruh Siklus Terkunci'
              : `${configs.length - lockedCount} Siklus Menunggu Cut-off`}
          </Badge>

          <div className='font-mono font-bold text-lg bg-muted/60 px-4 py-1.5 rounded-lg border text-primary tracking-wider'>
            {currentTimeStr} WIB
          </div>
        </div>
      </div>

      {/* Meal Time Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {configs.map((config) => {
          const meta = mealTimeMeta[config.jenis_makan] || {
            title: config.jenis_makan,
            icon: <Clock className='w-6 h-6 text-primary' />,
            color: 'border-primary/30',
            bg: 'bg-primary/10',
          };

          // Calculate lock status for this meal cycle
          const [h, m] = config.waktu.split(':').map(Number);
          const cutoffMinutes = h * 60 + m;
          const currentMinutes = now
            ? now.getHours() * 60 + now.getMinutes()
            : 0;

          const isCutoffPassed = currentMinutes >= cutoffMinutes;
          const todayBatch = batches.find(
            (b) =>
              b.tanggal_produksi === todayStr &&
              b.waktu_makan === config.jenis_makan,
          );
          const isLocked = isCutoffPassed || Boolean(todayBatch);

          const remainingSecs = now
            ? getRemainingSeconds(config.waktu, now)
            : 0;

          return (
            <Card
              key={config.id || config.jenis_makan}
              className={`border-2 ${
                isLocked
                  ? 'border-rose-500/40 bg-rose-500/[0.02]'
                  : `${meta.color} hover:shadow-md`
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
                      Siklus {config.jenis_makan}
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
                    className='text-[10px] font-semibold flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  >
                    <Unlock className='w-3 h-3 text-emerald-600' /> AKTIF
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
                    <strong className='font-mono text-sm font-bold text-foreground'>
                      {config.waktu} WIB
                    </strong>
                  </div>

                  {/* Countdown Timer or Lock Notice */}
                  {!isLocked ? (
                    <div className='bg-emerald-500/10 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in duration-200'>
                      <span className='text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5'>
                        <Timer className='w-3.5 h-3.5 animate-spin' /> Sisa Waktu Cut-off:
                      </span>
                      <strong className='font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded'>
                        {formatCountdown(remainingSecs)}
                      </strong>
                    </div>
                  ) : (
                    <div className='bg-rose-500/10 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30 flex items-center justify-between text-xs'>
                      <span className='text-rose-800 dark:text-rose-300 font-medium flex items-center gap-1.5'>
                        <ShieldAlert className='w-3.5 h-3.5 text-rose-500' /> Status Kunci:
                      </span>
                      <strong className='font-mono text-xs font-semibold text-rose-700 dark:text-rose-300'>
                        Terkunci ({config.waktu} WIB)
                      </strong>
                    </div>
                  )}

                  {/* Today's Batch Info if created */}
                  {todayBatch && (
                    <div className='bg-card p-2.5 rounded-lg border text-xs space-y-1 font-mono'>
                      <div className='flex justify-between items-center text-[11px] text-muted-foreground'>
                        <span>Batch Today:</span>
                        <strong className='text-foreground font-semibold truncate max-w-[140px]'>
                          {todayBatch.batch_code}
                        </strong>
                      </div>
                      <div className='flex justify-between items-center text-[11px] text-muted-foreground'>
                        <span className='flex items-center gap-1'>
                          <Users className='w-3 h-3' /> Pasien Locked:
                        </span>
                        <strong className='text-emerald-600 font-bold'>
                          {todayBatch.total_pasien} Pasien
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
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                    onClick={() => setTriggeringConfig(config)}
                  >
                    {isLocked ? (
                      <>
                        <Lock className='w-3.5 h-3.5' /> Re-Snapshot
                      </>
                    ) : (
                      <>
                        <Play className='w-3.5 h-3.5 fill-current' /> Kunci & Snapshot
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
                {editingConfig.jenis_makan}. Data pasien akan terkunci secara otomatis tepat pada jam ini.
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
      {triggeringConfig && (
        <Dialog
          open={Boolean(triggeringConfig)}
          onOpenChange={(open) => !open && setTriggeringConfig(null)}
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
                  {triggeringConfig.jenis_makan}
                </strong>{' '}
                dan menguncinya dalam batch snapshot produksi.
              </DialogDescription>
            </DialogHeader>

            <div className='bg-muted/50 p-3 rounded-lg border text-xs space-y-1 my-2'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Siklus Makan:</span>
                <strong className='text-foreground'>
                  {triggeringConfig.jenis_makan}
                </strong>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Waktu Acuan Cut-off:</span>
                <strong className='text-foreground font-mono'>
                  {triggeringConfig.waktu} WIB
                </strong>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setTriggeringConfig(null)}
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
