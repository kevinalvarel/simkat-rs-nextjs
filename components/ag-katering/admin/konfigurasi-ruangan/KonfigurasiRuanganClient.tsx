'use client';

import React, { useState, useMemo } from 'react';
import type {
  GedungHierarkis,
  RuanganDetail,
  KamarDetail,
} from '@/servers/tempat.service';
import {
  createGedung,
  updateGedung,
  deleteGedung,
  createRuangan,
  updateRuangan,
  deleteRuangan,
  updateRuanganKamarList,
} from '@/servers/tempat.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building, Plus, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

import { KonfigurasiHeader } from './KonfigurasiHeader';
import { KonfigurasiStats } from './KonfigurasiStats';
import { GedungCard } from './GedungCard';
import { FloatingSaveBar } from './FloatingSaveBar';
import { GedungDialog } from './GedungDialog';
import { RuanganDialog } from './RuanganDialog';
import { KamarDialog } from './KamarDialog';
import {
  DeleteGedungDialog,
  DeleteRuanganDialog,
  DeleteKamarDialog,
} from './DeleteConfirmDialog';

interface KonfigurasiRuanganClientProps {
  initialGedungList: GedungHierarkis[];
  kelasList: string[];
}

export default function KonfigurasiRuanganClient({
  initialGedungList,
  kelasList,
}: KonfigurasiRuanganClientProps) {
  const [gedungList, setGedungList] =
    useState<GedungHierarkis[]>(initialGedungList);
  const [savedGedungList, setSavedGedungList] =
    useState<GedungHierarkis[]>(initialGedungList);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGedung, setExpandedGedung] = useState<Record<number, boolean>>(
    () => {
      const initial: Record<number, boolean> = {};
      initialGedungList.forEach((g) => {
        initial[g.idGedung] = true;
      });
      return initial;
    },
  );

  // ---------- Dialog States ----------
  // 1. Gedung Dialog
  const [isGedungDialogOpen, setIsGedungDialogOpen] = useState(false);
  const [editingGedung, setEditingGedung] = useState<GedungHierarkis | null>(
    null,
  );
  const [gedungNameInput, setGedungNameInput] = useState('');
  const [isSubmittingGedung, setIsSubmittingGedung] = useState(false);

  // 2. Ruangan Dialog
  const [isRuanganDialogOpen, setIsRuanganDialogOpen] = useState(false);
  const [targetGedungId, setTargetGedungId] = useState<number | null>(null);
  const [editingRuangan, setEditingRuangan] = useState<RuanganDetail | null>(
    null,
  );
  const [ruanganNameInput, setRuanganNameInput] = useState('');
  const [ruanganKelasInput, setRuanganKelasInput] = useState(kelasList[0] || 'KELAS I');
  const [ruanganKamarListInput, setRuanganKamarListInput] = useState<
    KamarDetail[]
  >([]);
  const [isSubmittingRuangan, setIsSubmittingRuangan] = useState(false);

  // 3. Kamar Dialog (Quick Add / Edit Kamar)
  const [isKamarDialogOpen, setIsKamarDialogOpen] = useState(false);
  const [kamarParentRuangan, setKamarParentRuangan] =
    useState<RuanganDetail | null>(null);
  const [editingKamar, setEditingKamar] = useState<KamarDetail | null>(null);
  const [nomorKamarInput, setNomorKamarInput] = useState('');
  const [kamarBedInput, setKamarBedInput] = useState<number>(2);
  const [kamarKelasInput, setKamarKelasInput] = useState('');
  const [isSubmittingKamar, setIsSubmittingKamar] = useState(false);

  // 4. Delete Confirmation Dialogs
  const [deletingGedungTarget, setDeletingGedungTarget] =
    useState<GedungHierarkis | null>(null);
  const [deletingRuanganTarget, setDeletingRuanganTarget] =
    useState<RuanganDetail | null>(null);
  const [deletingKamarTarget, setDeletingKamarTarget] = useState<{
    ruangan: RuanganDetail;
    kamar: KamarDetail;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------- Track Unsaved Bed / Kamar Changes ----------
  const pendingChanges = useMemo(() => {
    const changes: {
      idRuangan: number;
      namaRuangan: string;
      kamarList: KamarDetail[];
      totalBed: number;
    }[] = [];

    gedungList.forEach((g) => {
      const savedG = savedGedungList.find((sg) => sg.idGedung === g.idGedung);
      if (!savedG) return;
      g.ruanganList.forEach((r) => {
        const savedR = savedG.ruanganList.find(
          (sr) => sr.idRuangan === r.idRuangan,
        );
        if (!savedR) return;

        // Check if kamar count or any kamar's bed/name changed
        const isCountChanged = savedR.kamarList.length !== r.kamarList.length;
        const isKamarModified = r.kamarList.some((k) => {
          const savedK = savedR.kamarList.find(
            (sk) => sk.idKamar === k.idKamar,
          );
          if (!savedK) return true;
          return (
            savedK.jumlahBed !== k.jumlahBed ||
            savedK.nomorKamar !== k.nomorKamar ||
            savedK.kelas !== k.kelas
          );
        });

        if (
          isCountChanged ||
          isKamarModified ||
          savedR.jumlahBed !== r.jumlahBed
        ) {
          changes.push({
            idRuangan: r.idRuangan,
            namaRuangan: r.namaRuangan,
            kamarList: r.kamarList,
            totalBed: r.jumlahBed,
          });
        }
      });
    });

    return changes;
  }, [gedungList, savedGedungList]);

  const hasUnsavedChanges = pendingChanges.length > 0;

  async function handleSaveChanges() {
    if (pendingChanges.length === 0) return;

    setIsSaving(true);
    try {
      const results = await Promise.all(
        pendingChanges.map((change) =>
          updateRuanganKamarList(change.idRuangan, change.kamarList),
        ),
      );

      const allSuccess = results.every((res) => res.success);
      if (allSuccess) {
        toast.success(
          `Berhasil menyimpan perubahan pada ${pendingChanges.length} ruangan.`,
        );
        setSavedGedungList(gedungList);
      } else {
        const successCount = results.filter((r) => r.success).length;
        toast.error(
          `Sebagian perubahan gagal disimpan (${successCount}/${pendingChanges.length} berhasil).`,
        );
        const updatedSaved = JSON.parse(
          JSON.stringify(savedGedungList),
        ) as GedungHierarkis[];
        pendingChanges.forEach((change, idx) => {
          if (results[idx].success) {
            updatedSaved.forEach((g) => {
              const r = g.ruanganList.find(
                (rItem) => rItem.idRuangan === change.idRuangan,
              );
              if (r) {
                r.kamarList = JSON.parse(JSON.stringify(change.kamarList));
                r.jumlahBed = change.totalBed;
              }
            });
          }
        });
        setSavedGedungList(updatedSaved);
      }
    } catch {
      toast.error('Gagal menyimpan perubahan ke server.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleResetChanges() {
    setGedungList(savedGedungList);
    toast.info('Perubahan dibatalkan.');
  }

  // ---------- Stats ----------
  const totalGedung = gedungList.length;
  const totalRuangan = useMemo(
    () => gedungList.reduce((acc, g) => acc + g.ruanganList.length, 0),
    [gedungList],
  );
  const totalKamar = useMemo(
    () =>
      gedungList.reduce(
        (acc, g) =>
          acc +
          g.ruanganList.reduce(
            (rAcc, r) => rAcc + (r.kamarList?.length || 0),
            0,
          ),
        0,
      ),
    [gedungList],
  );
  const totalBed = useMemo(
    () =>
      gedungList.reduce(
        (acc, g) =>
          acc + g.ruanganList.reduce((rAcc, r) => rAcc + (r.jumlahBed || 0), 0),
        0,
      ),
    [gedungList],
  );
  const avgBedPerRuangan =
    totalRuangan > 0 ? (totalBed / totalRuangan).toFixed(1) : '0';

  // ---------- Search Filter (Matches Gedung, Ruangan, Kamar, Kelas) ----------
  const filteredGedungList = useMemo(() => {
    if (!searchQuery.trim()) return gedungList;
    const query = searchQuery.toLowerCase().trim();

    return gedungList
      .map((g) => {
        const matchesGedung = g.namaGedung.toLowerCase().includes(query);
        const matchingRuangan = g.ruanganList.filter(
          (r) =>
            r.namaRuangan.toLowerCase().includes(query) ||
            r.kelas.toLowerCase().includes(query) ||
            r.kamarList.some(
              (k) =>
                k.nomorKamar.toLowerCase().includes(query) ||
                (k.kelas && k.kelas.toLowerCase().includes(query)),
            ),
        );

        if (matchesGedung) return g;
        if (matchingRuangan.length > 0) {
          return {
            ...g,
            ruanganList: matchingRuangan,
          };
        }
        return null;
      })
      .filter((g): g is GedungHierarkis => g !== null);
  }, [gedungList, searchQuery]);

  // Expand / Collapse helper
  function toggleGedungExpand(idGedung: number) {
    setExpandedGedung((prev) => ({
      ...prev,
      [idGedung]: !prev[idGedung],
    }));
  }

  function expandAll() {
    const next: Record<number, boolean> = {};
    gedungList.forEach((g) => {
      next[g.idGedung] = true;
    });
    setExpandedGedung(next);
  }

  function collapseAll() {
    setExpandedGedung({});
  }

  // ---------- GEDUNG ACTIONS ----------
  function openAddGedungModal() {
    setEditingGedung(null);
    setGedungNameInput('');
    setIsGedungDialogOpen(true);
  }

  function openEditGedungModal(gedung: GedungHierarkis) {
    setEditingGedung(gedung);
    setGedungNameInput(gedung.namaGedung);
    setIsGedungDialogOpen(true);
  }

  async function handleSaveGedung() {
    if (!gedungNameInput.trim()) {
      toast.error('Nama gedung wajib diisi.');
      return;
    }

    setIsSubmittingGedung(true);
    try {
      if (editingGedung) {
        const res = await updateGedung(editingGedung.idGedung, gedungNameInput);
        if (res.success) {
          toast.success(res.message);
          const updateFn = (prev: GedungHierarkis[]) =>
            prev.map((g) =>
              g.idGedung === editingGedung.idGedung
                ? { ...g, namaGedung: gedungNameInput.trim() }
                : g,
            );
          setGedungList(updateFn);
          setSavedGedungList(updateFn);
          setIsGedungDialogOpen(false);
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await createGedung(gedungNameInput);
        if (res.success) {
          toast.success(res.message);
          const newGedungObj: GedungHierarkis = {
            idGedung: Date.now(),
            namaGedung: gedungNameInput.trim(),
            totalRuangan: 0,
            totalKamar: 0,
            totalBed: 0,
            ruanganList: [],
          };
          setGedungList((prev) => [...prev, newGedungObj]);
          setSavedGedungList((prev) => [...prev, newGedungObj]);
          setExpandedGedung((prev) => ({
            ...prev,
            [newGedungObj.idGedung]: true,
          }));
          setIsGedungDialogOpen(false);
        } else {
          toast.error(res.message);
        }
      }
    } catch {
      toast.error('Gagal memproses gedung.');
    } finally {
      setIsSubmittingGedung(false);
    }
  }

  async function handleConfirmDeleteGedung() {
    if (!deletingGedungTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteGedung(deletingGedungTarget.idGedung);
      if (res.success) {
        toast.success(res.message);
        const filterFn = (prev: GedungHierarkis[]) =>
          prev.filter((g) => g.idGedung !== deletingGedungTarget.idGedung);
        setGedungList(filterFn);
        setSavedGedungList(filterFn);
        setDeletingGedungTarget(null);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menghapus gedung.');
    } finally {
      setIsDeleting(false);
    }
  }

  // ---------- RUANGAN ACTIONS ----------
  function openAddRuanganModal(gedungId: number) {
    setTargetGedungId(gedungId);
    setEditingRuangan(null);
    setRuanganNameInput('');
    setRuanganKelasInput(kelasList[0] || 'KELAS I');
    setRuanganKamarListInput([
      {
        idKamar: `kamar-${Date.now()}-1`,
        nomorKamar: 'Kamar 1',
        jumlahBed: 2,
        kelas: kelasList[0] || 'KELAS I',
      },
      {
        idKamar: `kamar-${Date.now()}-2`,
        nomorKamar: 'Kamar 2',
        jumlahBed: 2,
        kelas: kelasList[0] || 'KELAS I',
      },
    ]);
    setIsRuanganDialogOpen(true);
  }

  function openEditRuanganModal(ruangan: RuanganDetail) {
    setTargetGedungId(ruangan.gedungId);
    setEditingRuangan(ruangan);
    setRuanganNameInput(ruangan.namaRuangan);
    setRuanganKelasInput(ruangan.kelas);
    setRuanganKamarListInput(JSON.parse(JSON.stringify(ruangan.kamarList)));
    setIsRuanganDialogOpen(true);
  }

  async function handleSaveRuangan() {
    if (!ruanganNameInput.trim()) {
      toast.error('Nama ruangan wajib diisi.');
      return;
    }

    if (ruanganKamarListInput.length === 0) {
      toast.error('Ruangan harus memiliki minimal 1 kamar/pintu.');
      return;
    }

    const finalKamarList = ruanganKamarListInput.map((k) => ({
      ...k,
      kelas: k.kelas || ruanganKelasInput,
    }));

    const computedBed = finalKamarList.reduce(
      (acc, k) => acc + (k.jumlahBed || 0),
      0,
    );

    setIsSubmittingRuangan(true);
    try {
      if (editingRuangan) {
        const res = await updateRuangan(
          editingRuangan.idRuangan,
          ruanganNameInput,
          ruanganKelasInput,
          finalKamarList,
        );
        if (res.success) {
          toast.success(res.message);
          const updateFn = (prev: GedungHierarkis[]) =>
            prev.map((g) => {
              if (g.idGedung === editingRuangan.gedungId) {
                const updatedList = g.ruanganList.map((r) =>
                  r.idRuangan === editingRuangan.idRuangan
                    ? {
                        ...r,
                        namaRuangan: ruanganNameInput.trim(),
                        kelas: ruanganKelasInput,
                        jumlahBed: computedBed,
                        kamarList: finalKamarList,
                      }
                    : r,
                );
                const totalB = updatedList.reduce(
                  (acc, r) => acc + r.jumlahBed,
                  0,
                );
                const totalK = updatedList.reduce(
                  (acc, r) => acc + r.kamarList.length,
                  0,
                );
                return {
                  ...g,
                  ruanganList: updatedList,
                  totalBed: totalB,
                  totalKamar: totalK,
                };
              }
              return g;
            });
          setGedungList(updateFn);
          setSavedGedungList(updateFn);
          setIsRuanganDialogOpen(false);
        } else {
          toast.error(res.message);
        }
      } else if (targetGedungId !== null) {
        const res = await createRuangan(
          targetGedungId,
          ruanganNameInput,
          ruanganKelasInput,
          finalKamarList,
        );
        if (res.success) {
          toast.success(res.message);
          const newRuanganObj: RuanganDetail = {
            idRuangan: Date.now(),
            namaRuangan: ruanganNameInput.trim(),
            kelas: ruanganKelasInput,
            jumlahBed: computedBed,
            gedungId: targetGedungId,
            kamarList: finalKamarList,
          };
          const addFn = (prev: GedungHierarkis[]) =>
            prev.map((g) => {
              if (g.idGedung === targetGedungId) {
                const updatedList = [...g.ruanganList, newRuanganObj];
                return {
                  ...g,
                  totalRuangan: g.totalRuangan + 1,
                  totalKamar: g.totalKamar + ruanganKamarListInput.length,
                  totalBed: g.totalBed + computedBed,
                  ruanganList: updatedList,
                };
              }
              return g;
            });
          setGedungList(addFn);
          setSavedGedungList(addFn);
          setIsRuanganDialogOpen(false);
        } else {
          toast.error(res.message);
        }
      }
    } catch {
      toast.error('Gagal memproses ruangan.');
    } finally {
      setIsSubmittingRuangan(false);
    }
  }

  async function handleConfirmDeleteRuangan() {
    if (!deletingRuanganTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteRuangan(deletingRuanganTarget.idRuangan);
      if (res.success) {
        toast.success(res.message);
        const deleteFn = (prev: GedungHierarkis[]) =>
          prev.map((g) => {
            if (g.idGedung === deletingRuanganTarget.gedungId) {
              const updatedList = g.ruanganList.filter(
                (r) => r.idRuangan !== deletingRuanganTarget.idRuangan,
              );
              return {
                ...g,
                totalRuangan: updatedList.length,
                totalKamar: updatedList.reduce(
                  (acc, r) => acc + r.kamarList.length,
                  0,
                ),
                totalBed: updatedList.reduce((acc, r) => acc + r.jumlahBed, 0),
                ruanganList: updatedList,
              };
            }
            return g;
          });
        setGedungList(deleteFn);
        setSavedGedungList(deleteFn);
        setDeletingRuanganTarget(null);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menghapus ruangan.');
    } finally {
      setIsDeleting(false);
    }
  }

  // ---------- KAMAR ACTIONS (Quick Adjust Bed, Add, Edit, Delete) ----------
  function handleQuickAdjustBed(
    ruangan: RuanganDetail,
    kamarId: string,
    delta: number,
  ) {
    setGedungList((prev) =>
      prev.map((g) => {
        if (g.idGedung === ruangan.gedungId) {
          const updatedRuanganList = g.ruanganList.map((r) => {
            if (r.idRuangan === ruangan.idRuangan) {
              const updatedKamarList = r.kamarList.map((k) => {
                if (k.idKamar === kamarId) {
                  const nextBed = k.jumlahBed + delta;
                  if (nextBed < 1) {
                    toast.error('Jumlah bed di kamar minimal 1.');
                    return k;
                  }
                  return { ...k, jumlahBed: nextBed };
                }
                return k;
              });
              const totalB = updatedKamarList.reduce(
                (acc, k) => acc + k.jumlahBed,
                0,
              );
              return {
                ...r,
                kamarList: updatedKamarList,
                jumlahBed: totalB,
              };
            }
            return r;
          });
          const totalGedungBed = updatedRuanganList.reduce(
            (acc, r) => acc + r.jumlahBed,
            0,
          );
          return {
            ...g,
            ruanganList: updatedRuanganList,
            totalBed: totalGedungBed,
          };
        }
        return g;
      }),
    );
  }

  function openAddKamarModal(ruangan: RuanganDetail) {
    setKamarParentRuangan(ruangan);
    setEditingKamar(null);
    setNomorKamarInput(`Kamar ${ruangan.kamarList.length + 1}`);
    setKamarBedInput(2);
    setKamarKelasInput(ruangan.kelas);
    setIsKamarDialogOpen(true);
  }

  function openEditKamarModal(ruangan: RuanganDetail, kamar: KamarDetail) {
    setKamarParentRuangan(ruangan);
    setEditingKamar(kamar);
    setNomorKamarInput(kamar.nomorKamar);
    setKamarBedInput(kamar.jumlahBed);
    setKamarKelasInput(kamar.kelas || ruangan.kelas);
    setIsKamarDialogOpen(true);
  }

  async function handleSaveKamarModal() {
    if (!kamarParentRuangan) return;
    if (!nomorKamarInput.trim()) {
      toast.error('Nomor pintu / nama kamar wajib diisi.');
      return;
    }
    if (kamarBedInput < 1) {
      toast.error('Jumlah bed minimal 1.');
      return;
    }

    setIsSubmittingKamar(true);
    try {
      let updatedKamarList: KamarDetail[];

      if (editingKamar) {
        updatedKamarList = kamarParentRuangan.kamarList.map((k) =>
          k.idKamar === editingKamar.idKamar
            ? {
                ...k,
                nomorKamar: nomorKamarInput.trim(),
                jumlahBed: kamarBedInput,
                kelas: kamarKelasInput || kamarParentRuangan.kelas,
              }
            : k,
        );
      } else {
        const newKamar: KamarDetail = {
          idKamar: `kamar-${Date.now()}-${kamarParentRuangan.kamarList.length + 1}`,
          nomorKamar: nomorKamarInput.trim(),
          jumlahBed: kamarBedInput,
          kelas: kamarKelasInput || kamarParentRuangan.kelas,
        };
        updatedKamarList = [...kamarParentRuangan.kamarList, newKamar];
      }

      // Persist to server
      const res = await updateRuanganKamarList(
        kamarParentRuangan.idRuangan,
        updatedKamarList,
      );
      if (res.success) {
        toast.success(
          editingKamar
            ? `Kamar "${nomorKamarInput.trim()}" berhasil diperbarui.`
            : `Kamar "${nomorKamarInput.trim()}" berhasil ditambahkan.`,
        );

        const updateFn = (prev: GedungHierarkis[]) =>
          prev.map((g) => {
            if (g.idGedung === kamarParentRuangan.gedungId) {
              const updatedRuangan = g.ruanganList.map((r) => {
                if (r.idRuangan === kamarParentRuangan.idRuangan) {
                  const totalB = updatedKamarList.reduce(
                    (acc, k) => acc + k.jumlahBed,
                    0,
                  );
                  return {
                    ...r,
                    kamarList: updatedKamarList,
                    jumlahBed: totalB,
                  };
                }
                return r;
              });
              const totalGedungB = updatedRuangan.reduce(
                (acc, r) => acc + r.jumlahBed,
                0,
              );
              const totalGedungK = updatedRuangan.reduce(
                (acc, r) => acc + r.kamarList.length,
                0,
              );
              return {
                ...g,
                ruanganList: updatedRuangan,
                totalBed: totalGedungB,
                totalKamar: totalGedungK,
              };
            }
            return g;
          });

        setGedungList(updateFn);
        setSavedGedungList(updateFn);
        setIsKamarDialogOpen(false);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menyimpan konfigurasi kamar.');
    } finally {
      setIsSubmittingKamar(false);
    }
  }

  async function handleConfirmDeleteKamar() {
    if (!deletingKamarTarget) return;
    const { ruangan, kamar } = deletingKamarTarget;

    if (ruangan.kamarList.length <= 1) {
      toast.error(
        'Ruangan harus memiliki minimal 1 kamar. Tidak dapat menghapus kamar terakhir.',
      );
      setDeletingKamarTarget(null);
      return;
    }

    setIsDeleting(true);
    try {
      const updatedKamarList = ruangan.kamarList.filter(
        (k) => k.idKamar !== kamar.idKamar,
      );
      const res = await updateRuanganKamarList(
        ruangan.idRuangan,
        updatedKamarList,
      );

      if (res.success) {
        toast.success(
          `Kamar "${kamar.nomorKamar}" berhasil dihapus dari ${ruangan.namaRuangan}.`,
        );
        const updateFn = (prev: GedungHierarkis[]) =>
          prev.map((g) => {
            if (g.idGedung === ruangan.gedungId) {
              const updatedRuangan = g.ruanganList.map((r) => {
                if (r.idRuangan === ruangan.idRuangan) {
                  const totalB = updatedKamarList.reduce(
                    (acc, k) => acc + k.jumlahBed,
                    0,
                  );
                  return {
                    ...r,
                    kamarList: updatedKamarList,
                    jumlahBed: totalB,
                  };
                }
                return r;
              });
              const totalGedungB = updatedRuangan.reduce(
                (acc, r) => acc + r.jumlahBed,
                0,
              );
              const totalGedungK = updatedRuangan.reduce(
                (acc, r) => acc + r.kamarList.length,
                0,
              );
              return {
                ...g,
                ruanganList: updatedRuangan,
                totalBed: totalGedungB,
                totalKamar: totalGedungK,
              };
            }
            return g;
          });

        setGedungList(updateFn);
        setSavedGedungList(updateFn);
        setDeletingKamarTarget(null);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menghapus kamar.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header Hero Banner */}
      <KonfigurasiHeader
        hasUnsavedChanges={hasUnsavedChanges}
        pendingCount={pendingChanges.length}
        isSaving={isSaving}
        onReset={handleResetChanges}
        onSave={handleSaveChanges}
        onOpenAddGedung={openAddGedungModal}
      />

      {/* 2. Top Stats Overview */}
      <KonfigurasiStats
        totalGedung={totalGedung}
        totalRuangan={totalRuangan}
        totalKamar={totalKamar}
        totalBed={totalBed}
        avgBedPerRuangan={avgBedPerRuangan}
      />

      {/* 3. Search & Toolbar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border/60'>
        <div className='relative flex-1 max-w-md'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Cari nama gedung, ruangan, nomor pintu/kamar, atau kelas...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9 h-9 text-xs bg-background'
          />
        </div>

        <div className='flex items-center gap-2 self-end sm:self-auto text-xs'>
          <Button
            variant='outline'
            size='sm'
            onClick={expandAll}
            className='h-8 gap-1 text-xs cursor-pointer'
          >
            <ChevronDown className='w-3.5 h-3.5' /> Expand All
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={collapseAll}
            className='h-8 gap-1 text-xs cursor-pointer'
          >
            <ChevronUp className='w-3.5 h-3.5' /> Collapse All
          </Button>
        </div>
      </div>

      {/* 4. Hierarchical Gedung List Cards */}
      <div className='space-y-4 w-full'>
        {filteredGedungList.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='flex flex-col items-center justify-center py-12 text-center space-y-3'>
              <div className='p-4 bg-muted rounded-full'>
                <Building className='w-8 h-8 text-muted-foreground' />
              </div>
              <div className='space-y-1'>
                <h3 className='font-bold text-base'>Gedung Tidak Ditemukan</h3>
                <p className='text-xs text-muted-foreground max-w-xs'>
                  {searchQuery
                    ? `Tidak ada gedung, ruangan, atau kamar yang cocok dengan "${searchQuery}".`
                    : 'Belum ada gedung yang terdaftar dalam sistem.'}
                </p>
              </div>
              <Button
                onClick={openAddGedungModal}
                className='gap-2 mt-2 cursor-pointer'
              >
                <Plus className='w-4 h-4' /> Tambah Gedung Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredGedungList.map((gedung) => (
            <GedungCard
              key={gedung.idGedung}
              gedung={gedung}
              isExpanded={Boolean(expandedGedung[gedung.idGedung])}
              savedGedungList={savedGedungList}
              onToggleExpand={toggleGedungExpand}
              onOpenAddRuangan={openAddRuanganModal}
              onOpenEditGedung={openEditGedungModal}
              onDeleteGedung={setDeletingGedungTarget}
              onOpenManageKamar={openEditRuanganModal}
              onOpenAddKamar={openAddKamarModal}
              onEditKamar={openEditKamarModal}
              onDeleteKamar={(ruangan, kamar) =>
                setDeletingKamarTarget({ ruangan, kamar })
              }
              onQuickAdjustBed={handleQuickAdjustBed}
              onEditRuangan={openEditRuanganModal}
              onDeleteRuangan={setDeletingRuanganTarget}
            />
          ))
        )}
      </div>

      {/* Sticky Floating Save Bar when Unsaved Changes exist */}
      {hasUnsavedChanges && (
        <FloatingSaveBar
          pendingCount={pendingChanges.length}
          isSaving={isSaving}
          onReset={handleResetChanges}
          onSave={handleSaveChanges}
        />
      )}

      {/* Dialogs */}
      {/* 1. Gedung Dialog */}
      <GedungDialog
        isOpen={isGedungDialogOpen}
        editingGedung={editingGedung}
        gedungNameInput={gedungNameInput}
        isSubmitting={isSubmittingGedung}
        onNameChange={setGedungNameInput}
        onClose={() => setIsGedungDialogOpen(false)}
        onSave={handleSaveGedung}
      />

      {/* 2. Ruangan Dialog (with Kamar manager & generator) */}
      <RuanganDialog
        isOpen={isRuanganDialogOpen}
        editingRuangan={editingRuangan}
        gedungNama={
          gedungList.find(
            (g) => g.idGedung === (editingRuangan?.gedungId ?? targetGedungId),
          )?.namaGedung
        }
        ruanganNameInput={ruanganNameInput}
        ruanganKelasInput={ruanganKelasInput}
        kamarListInput={ruanganKamarListInput}
        kelasList={kelasList}
        isSubmitting={isSubmittingRuangan}
        onNameChange={setRuanganNameInput}
        onKelasChange={setRuanganKelasInput}
        onKamarListChange={setRuanganKamarListInput}
        onClose={() => setIsRuanganDialogOpen(false)}
        onSave={handleSaveRuangan}
      />

      {/* 3. Kamar Quick Add/Edit Dialog */}
      <KamarDialog
        isOpen={isKamarDialogOpen}
        parentRuangan={kamarParentRuangan}
        editingKamar={editingKamar}
        nomorKamarInput={nomorKamarInput}
        kamarBedInput={kamarBedInput}
        kamarKelasInput={kamarKelasInput}
        kelasList={kelasList}
        isSubmitting={isSubmittingKamar}
        onNomorKamarChange={setNomorKamarInput}
        onBedChange={setKamarBedInput}
        onKelasChange={setKamarKelasInput}
        onClose={() => setIsKamarDialogOpen(false)}
        onSave={handleSaveKamarModal}
      />

      {/* 4. Delete Dialogs */}
      <DeleteGedungDialog
        gedung={deletingGedungTarget}
        isDeleting={isDeleting}
        onClose={() => setDeletingGedungTarget(null)}
        onConfirm={handleConfirmDeleteGedung}
      />

      <DeleteRuanganDialog
        ruangan={deletingRuanganTarget}
        isDeleting={isDeleting}
        onClose={() => setDeletingRuanganTarget(null)}
        onConfirm={handleConfirmDeleteRuangan}
      />

      <DeleteKamarDialog
        kamarTarget={deletingKamarTarget}
        isDeleting={isDeleting}
        onClose={() => setDeletingKamarTarget(null)}
        onConfirm={handleConfirmDeleteKamar}
      />
    </div>
  );
}
