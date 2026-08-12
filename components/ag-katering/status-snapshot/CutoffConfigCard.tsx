'use client';

import { useState, useEffect } from 'react';
import type { WaktuMakanConfig } from '@/servers/snapshot.service';
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
  Play,
  Pencil,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface CutoffConfigCardProps {
  configs: WaktuMakanConfig[];
  onSnapshotTriggered?: () => void;
}

export default function CutoffConfigCard({
  configs,
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

  // Time state for live countdown display
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}:${ss}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className='space-y-4'>
      {/* Live Time Indicator */}
      <div className='flex flex-wrap items-center justify-between bg-card border rounded-xl p-4 shadow-sm gap-3'>
        <div className='flex items-center gap-3'>
          <div className='p-2.5 rounded-lg bg-primary/10 text-primary'>
            <Clock className='w-5 h-5 animate-pulse' />
          </div>
          <div>
            <h3 className='font-semibold text-sm'>Waktu Server Realtime</h3>
            <p className='text-xs text-muted-foreground'>
              Sistem akan secara otomatis membekukan data pasien sesuai waktu
              cut-off
            </p>
          </div>
        </div>
        <div className='font-mono font-bold text-lg bg-muted/60 px-4 py-1.5 rounded-lg border text-primary tracking-wider'>
          {currentTime || '00:00:00'} WIB
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

          return (
            <Card
              key={config.id || config.jenis_makan}
              className={`border-2 ${meta.color} shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden`}
            >
              <CardHeader className='pb-3 flex flex-row items-center justify-between space-y-0'>
                <div className='flex items-center gap-3'>
                  <div className={`p-2.5 rounded-full ${meta.bg}`}>
                    {meta.icon}
                  </div>
                  <div>
                    <CardTitle className='text-base font-bold'>
                      {meta.title}
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Siklus {config.jenis_makan}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant='outline' className='text-[11px] font-mono'>
                  {config.waktu} WIB
                </Badge>
              </CardHeader>

              <CardContent className='space-y-4 pt-1'>
                <div className='bg-muted/40 p-3 rounded-lg border flex justify-between items-center text-xs'>
                  <span className='text-muted-foreground flex items-center gap-1.5'>
                    <Lock className='w-3.5 h-3.5 text-muted-foreground' /> Waktu
                    Cut-off:
                  </span>
                  <strong className='font-mono text-sm font-semibold text-foreground'>
                    {config.waktu} WIB
                  </strong>
                </div>

                <div className='flex gap-2 pt-1'>
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
                    className='flex-1 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white'
                    onClick={() => setTriggeringConfig(config)}
                  >
                    <Play className='w-3.5 h-3.5 fill-current' /> Snapshot Now
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
                {editingConfig.jenis_makan}.
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
                <span className='text-muted-foreground'>Waktu Acuan:</span>
                <strong className='text-foreground'>
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
