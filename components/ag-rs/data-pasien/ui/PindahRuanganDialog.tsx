'use client';

import { useState, useMemo } from 'react';
import type { PindahRuanganDialogProps } from '@/types/data-pasien';
import type { Patient } from '@/servers/patient.service';
import type { KamarDetail } from '@/servers/tempat.service';
import { updatePatientField } from '@/servers/patient.service';
import {
  buildBedOptions,
  countKamarOccupancy,
  effectiveKamarCapacity,
  getBedOccupantName,
  getOccupiedBedLabels,
  isKamarFull,
  normLoc,
} from '@/lib/kamar-occupancy';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DoorOpen } from 'lucide-react';
import { toast } from 'sonner';

function findGedungForRuangan(
  gedungList: PindahRuanganDialogProps['gedungList'],
  ruangan: string,
) {
  const target = normLoc(ruangan);
  return (
    gedungList.find((g) =>
      g.ruanganList.some((r) => normLoc(r.namaRuangan) === target),
    ) || null
  );
}

function kamarListFor(
  ruanganObj:
    | PindahRuanganDialogProps['gedungList'][number]['ruanganList'][number]
    | undefined,
): KamarDetail[] {
  if (ruanganObj?.kamarList && ruanganObj.kamarList.length > 0) {
    return ruanganObj.kamarList;
  }
  if (!ruanganObj) return [];
  return [
    {
      idKamar: `fallback-${ruanganObj.idRuangan}`,
      nomorKamar: 'Kamar 1',
      jumlahBed: ruanganObj.jumlahBed && ruanganObj.jumlahBed > 0 ? ruanganObj.jumlahBed : 6,
      kelas: ruanganObj.kelas,
    },
  ];
}

export default function PindahRuanganDialog({
  patient,
  gedungList,
  patients = [],
  onClose,
  onSuccess,
  onPindahOptimistic,
  revisionContext,
}: PindahRuanganDialogProps) {
  const movingId = patient?.id ?? null;

  // Nilai awal dihitung sekali per mount dari lokasi pasien saat ini.
  // PatientTable me-remount dialog per pasien via `key`, jadi tidak perlu effect.
  function computeInitial(): {
    gedung: string;
    ruangan: string;
    kamar: string;
    bed: string;
  } {
    const empty = { gedung: '', ruangan: '', kamar: '', bed: '' };
    if (!patient || gedungList.length === 0) return empty;
    const gObj =
      findGedungForRuangan(gedungList, patient.ruangan) || gedungList[0];
    const rObj =
      gObj.ruanganList.find(
        (r) => normLoc(r.namaRuangan) === normLoc(patient.ruangan),
      ) || gObj.ruanganList[0];
    if (!rObj) return empty;
    const kamars = kamarListFor(rObj);
    const kMatch = kamars.find(
      (k) => normLoc(k.nomorKamar) === normLoc(patient.gedung),
    );
    const kName = kMatch
      ? kMatch.nomorKamar
      : firstFreeKamar(rObj.namaRuangan, kamars) || kamars[0]?.nomorKamar || '';
    if (!kName) {
      return { gedung: gObj.namaGedung, ruangan: rObj.namaRuangan, kamar: '', bed: '' };
    }
    const occupied = getOccupiedBedLabels(
      patients,
      rObj.namaRuangan,
      kName,
      patient.id,
    );
    const options = buildBedOptions(
      kamars.find((k) => k.nomorKamar === kName)?.jumlahBed,
    );
    const ownBedKept =
      options.includes(patient.bed) &&
      (!occupied.has(normLoc(patient.bed)) ||
        (normLoc(patient.ruangan) === normLoc(rObj.namaRuangan) &&
          normLoc(patient.gedung) === normLoc(kName)));
    return {
      gedung: gObj.namaGedung,
      ruangan: rObj.namaRuangan,
      kamar: kName,
      bed: ownBedKept
        ? patient.bed
        : options.find((b) => !occupied.has(normLoc(b))) || '',
    };
  }

  const [initial] = useState(computeInitial);
  const [targetGedung, setTargetGedung] = useState<string>(initial.gedung);
  const [targetRuangan, setTargetRuangan] = useState<string>(initial.ruangan);
  const [targetKamar, setTargetKamar] = useState<string>(initial.kamar);
  const [targetBed, setTargetBed] = useState<string>(initial.bed);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gedungObj = useMemo(
    () => gedungList.find((g) => g.namaGedung === targetGedung) || null,
    [gedungList, targetGedung],
  );
  const ruanganObj = useMemo(
    () =>
      gedungObj?.ruanganList.find((r) => r.namaRuangan === targetRuangan) ||
      null,
    [gedungObj, targetRuangan],
  );
  const kamarList = useMemo(
    () => kamarListFor(ruanganObj || undefined),
    [ruanganObj],
  );
  const kamarObj = useMemo(
    () => kamarList.find((k) => k.nomorKamar === targetKamar) || null,
    [kamarList, targetKamar],
  );
  const bedOptions = useMemo(
    () => buildBedOptions(kamarObj?.jumlahBed),
    [kamarObj],
  );

  function firstFreeKamar(
    ruanganName: string,
    kamars: KamarDetail[],
  ): string {
    const free = kamars.find(
      (k) => !isKamarFull(patients, ruanganName, k.nomorKamar, k.jumlahBed, movingId),
    );
    return free ? free.nomorKamar : '';
  }

  function firstFreeBed(
    ruanganName: string,
    nomorKamar: string,
    kamars?: KamarDetail[],
  ): string {
    const occupied = getOccupiedBedLabels(
      patients,
      ruanganName,
      nomorKamar,
      movingId,
    );
    const source = kamars || kamarList;
    const kamar = source.find((k) => k.nomorKamar === nomorKamar);
    const options = buildBedOptions(kamar?.jumlahBed);
    // Bed pasien saat ini tetap boleh dipilih (dihitung sebagai miliknya)
    if (
      patient &&
      normLoc(patient.ruangan) === normLoc(ruanganName) &&
      normLoc(patient.gedung) === normLoc(nomorKamar) &&
      options.includes(patient.bed)
    ) {
      return patient.bed;
    }
    return options.find((b) => !occupied.has(normLoc(b))) || '';
  }

  if (!patient) return null;

  const patientRef: Patient = patient;

  function handleGedungChange(val: string | null) {
    if (!val) return;
    const gObj = gedungList.find((g) => g.namaGedung === val);
    if (!gObj || gObj.ruanganList.length === 0) return;
    const rObj = gObj.ruanganList[0];
    const kamars = kamarListFor(rObj);
    const kName =
      firstFreeKamar(rObj.namaRuangan, kamars) || kamars[0]?.nomorKamar || '';
    setTargetGedung(val);
    setTargetRuangan(rObj.namaRuangan);
    setTargetKamar(kName);
    setTargetBed(kName ? firstFreeBed(rObj.namaRuangan, kName, kamars) : '');
  }

  function handleRuanganChange(val: string | null) {
    if (!val) return;
    const rObj = gedungObj?.ruanganList.find((r) => r.namaRuangan === val);
    if (!rObj) return;
    const kamars = kamarListFor(rObj);
    const kName =
      firstFreeKamar(rObj.namaRuangan, kamars) || kamars[0]?.nomorKamar || '';
    setTargetRuangan(val);
    setTargetKamar(kName);
    setTargetBed(kName ? firstFreeBed(rObj.namaRuangan, kName, kamars) : '');
  }

  function handleKamarChange(val: string | null) {
    if (!val) return;
    setTargetKamar(val);
    setTargetBed(targetRuangan ? firstFreeBed(targetRuangan, val) : '');
  }

  const targetKelas =
    kamarObj?.kelas || ruanganObj?.kelas || patientRef.kelas || '';

  function ruanganOccupancy(namaRuangan: string): { occ: number; cap: number } {
    const rObj = gedungObj?.ruanganList.find((r) => r.namaRuangan === namaRuangan);
    const kamars = kamarListFor(rObj);
    return kamars.reduce(
      (acc, k) => ({
        occ:
          acc.occ +
          countKamarOccupancy(patients, namaRuangan, k.nomorKamar, movingId),
        cap: acc.cap + effectiveKamarCapacity(k.jumlahBed),
      }),
      { occ: 0, cap: 0 },
    );
  }

  async function handleSavePindah() {
    if (!patientRef || !targetGedung || !targetRuangan || !targetKamar || !targetBed) {
      toast.error('Lengkapi Gedung, Ruangan, Nomor Kamar, dan Bed tujuan.');
      return;
    }
    const kamarCapacity = effectiveKamarCapacity(kamarObj?.jumlahBed);
    const kamarOcc = countKamarOccupancy(
      patients,
      targetRuangan,
      targetKamar,
      movingId,
    );
    if (kamarOcc >= kamarCapacity) {
      toast.error(
        `${targetKamar} penuh (${kamarOcc}/${kamarCapacity} terisi). Pilih kamar lain.`,
      );
      return;
    }
    const bedOccupant = getBedOccupantName(
      patients,
      targetRuangan,
      targetKamar,
      targetBed,
      movingId,
    );
    if (bedOccupant) {
      toast.error(`${targetBed} di ${targetKamar} sudah terisi (${bedOccupant}). Pilih bed lain.`);
      return;
    }

    if (onPindahOptimistic) {
      onPindahOptimistic(
        patientRef.id,
        targetKamar,
        targetRuangan,
        targetBed,
        targetKelas,
      );
      onSuccess?.(patientRef.id);
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updatePatientField(
        patientRef.id,
        {
          gedung: targetKamar,
          ruangan: targetRuangan,
          bed: targetBed,
          kelas: targetKelas,
          status_pasien: 'PINDAH_RUANGAN',
        },
        revisionContext,
      );
      if (res.success) {
        onSuccess?.(patientRef.id);
        toast.success(
          revisionContext?.isRevisiMode
            ? `Revisi perpindahan ${patientRef.nama_pasien} ke ${targetRuangan} ${targetKamar} ${targetBed} diajukan ke Otorisasi Supervisor.`
            : `${patientRef.nama_pasien} dipindahkan ke ${targetRuangan} - ${targetKamar} (${targetBed})`,
        );
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal memindahkan pasien.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const occupiedBedLabels = targetRuangan && targetKamar
    ? getOccupiedBedLabels(patients, targetRuangan, targetKamar, movingId)
    : new Set<string>();

  return (
    <Dialog open={Boolean(patient)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <DoorOpen className='w-5 h-5 text-primary' />
            Pindah Ruangan Pasien
          </DialogTitle>
          <DialogDescription>
            Pindahkan{' '}
            <strong className='text-foreground'>{patientRef.nama_pasien}</strong>{' '}
            (RM: {patientRef.no_rm}) — saat ini di {patientRef.ruangan},{' '}
            {patientRef.gedung} ({patientRef.bed}).
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Gedung Select */}
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Pilih Gedung</label>
            <Select value={targetGedung} onValueChange={handleGedungChange}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Pilih Gedung' />
              </SelectTrigger>
              <SelectContent>
                {gedungList.map((g) => (
                  <SelectItem key={g.idGedung} value={g.namaGedung}>
                    {g.namaGedung}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ruangan Select */}
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Pilih Ruangan</label>
            <Select value={targetRuangan} onValueChange={handleRuanganChange}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Pilih Ruangan' />
              </SelectTrigger>
              <SelectContent>
                {(gedungObj?.ruanganList || []).map((r) => {
                  const { occ, cap } = ruanganOccupancy(r.namaRuangan);
                  const full = cap > 0 && occ >= cap;
                  return (
                    <SelectItem
                      key={r.idRuangan}
                      value={r.namaRuangan}
                      disabled={full}
                    >
                      {r.namaRuangan} — {occ}/{cap} terisi{full ? ' (Penuh)' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Nomor Kamar Select */}
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Pilih Nomor Kamar</label>
            <Select
              value={targetKamar}
              onValueChange={handleKamarChange}
              disabled={kamarList.length === 0}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Pilih Nomor Kamar' />
              </SelectTrigger>
              <SelectContent>
                {kamarList.map((k) => {
                  const occ = countKamarOccupancy(
                    patients,
                    targetRuangan,
                    k.nomorKamar,
                    movingId,
                  );
                  const cap = effectiveKamarCapacity(k.jumlahBed);
                  const full = occ >= cap;
                  return (
                    <SelectItem
                      key={k.idKamar}
                      value={k.nomorKamar}
                      disabled={full}
                    >
                      {k.nomorKamar} — {occ}/{cap} terisi{full ? ' (Penuh)' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Bed Select */}
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Pilih Bed</label>
            <Select
              value={targetBed}
              onValueChange={(val) => {
                if (val) setTargetBed(val);
              }}
              disabled={bedOptions.length === 0}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Pilih Bed' />
              </SelectTrigger>
              <SelectContent>
                {bedOptions.map((b) => {
                  const occupant = occupiedBedLabels.has(normLoc(b))
                    ? getBedOccupantName(
                      patients,
                      targetRuangan,
                      targetKamar,
                      b,
                      movingId,
                    )
                    : null;
                  return (
                    <SelectItem key={b} value={b} disabled={Boolean(occupant)}>
                      {b}
                      {occupant ? ` — Terisi (${occupant})` : ' — Kosong'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Kelas info */}
          <div className='rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground'>
            Kelas mengikuti kamar tujuan:{' '}
            <strong className='text-foreground'>{targetKelas || '-'}</strong>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={handleSavePindah}
            disabled={
              isSubmitting ||
              !targetGedung ||
              !targetRuangan ||
              !targetKamar ||
              !targetBed
            }
          >
            {isSubmitting ? 'Memindahkan...' : 'Pindahkan Pasien'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
