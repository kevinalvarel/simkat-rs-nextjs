'use client';

import React, { useState, useMemo } from 'react';
import type { GedungHierarkis, RuanganDetail } from '@/servers/tempat.service';
import {
  createGedung,
  updateGedung,
  deleteGedung,
  createRuangan,
  updateRuangan,
  deleteRuangan,
  updateBedCount,
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
import {
  DeleteGedungDialog,
  DeleteRuanganDialog,
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
  const [ruanganKelasInput, setRuanganKelasInput] = useState('Kelas 1');
  const [ruanganBedInput, setRuanganBedInput] = useState<number>(6);
  const [isSubmittingRuangan, setIsSubmittingRuangan] = useState(false);

  // 3. Delete Confirmation Dialogs
  const [deletingGedungTarget, setDeletingGedungTarget] =
    useState<GedungHierarkis | null>(null);
  const [deletingRuanganTarget, setDeletingRuanganTarget] =
    useState<RuanganDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------- Track Unsaved Bed Changes ----------
  const pendingBedChanges = useMemo(() => {
    const changes: {
      idRuangan: number;
      newJumlahBed: number;
      oldJumlahBed: number;
      namaRuangan: string;
    }[] = [];

    gedungList.forEach((g) => {
      const savedG = savedGedungList.find((sg) => sg.idGedung === g.idGedung);
      if (!savedG) return;
      g.ruanganList.forEach((r) => {
        const savedR = savedG.ruanganList.find(
          (sr) => sr.idRuangan === r.idRuangan,
        );
        if (savedR && savedR.jumlahBed !== r.jumlahBed) {
          changes.push({
            idRuangan: r.idRuangan,
            newJumlahBed: r.jumlahBed,
            oldJumlahBed: savedR.jumlahBed,
            namaRuangan: r.namaRuangan,
          });
        }
      });
    });

    return changes;
  }, [gedungList, savedGedungList]);

  const hasUnsavedChanges = pendingBedChanges.length > 0;

  async function handleSaveChanges() {
    if (pendingBedChanges.length === 0) return;

    setIsSaving(true);
    try {
      const results = await Promise.all(
        pendingBedChanges.map((change) =>
          updateBedCount(change.idRuangan, change.newJumlahBed),
        ),
      );

      const allSuccess = results.every((res) => res.success);
      if (allSuccess) {
        toast.success(
          `Berhasil menyimpan ${pendingBedChanges.length} perubahan kapasitas bed.`,
        );
        setSavedGedungList(gedungList);
      } else {
        const successCount = results.filter((r) => r.success).length;
        toast.error(
          `Sebagian perubahan gagal disimpan (${successCount}/${pendingBedChanges.length} berhasil).`,
        );
        const updatedSaved = JSON.parse(
          JSON.stringify(savedGedungList),
        ) as GedungHierarkis[];
        pendingBedChanges.forEach((change, idx) => {
          if (results[idx].success) {
            updatedSaved.forEach((g) => {
              const r = g.ruanganList.find(
                (rItem) => rItem.idRuangan === change.idRuangan,
              );
              if (r) r.jumlahBed = change.newJumlahBed;
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
  const totalBed = useMemo(
    () =>
      gedungList.reduce(
        (acc, g) =>
          acc + g.ruanganList.reduce((rAcc, r) => rAcc + r.jumlahBed, 0),
        0,
      ),
    [gedungList],
  );
  const avgBedPerRuangan =
    totalRuangan > 0 ? (totalBed / totalRuangan).toFixed(1) : '0';

  // ---------- Search Filter ----------
  const filteredGedungList = useMemo(() => {
    if (!searchQuery.trim()) return gedungList;
    const query = searchQuery.toLowerCase().trim();

    return gedungList
      .map((g) => {
        const matchesGedung = g.namaGedung.toLowerCase().includes(query);
        const matchingRuangan = g.ruanganList.filter(
          (r) =>
            r.namaRuangan.toLowerCase().includes(query) ||
            r.kelas.toLowerCase().includes(query),
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
    setRuanganKelasInput(kelasList[0] || 'Kelas 1');
    setRuanganBedInput(6);
    setIsRuanganDialogOpen(true);
  }

  function openEditRuanganModal(ruangan: RuanganDetail) {
    setTargetGedungId(ruangan.gedungId);
    setEditingRuangan(ruangan);
    setRuanganNameInput(ruangan.namaRuangan);
    setRuanganKelasInput(ruangan.kelas);
    setRuanganBedInput(ruangan.jumlahBed);
    setIsRuanganDialogOpen(true);
  }

  async function handleSaveRuangan() {
    if (!ruanganNameInput.trim()) {
      toast.error('Nama ruangan wajib diisi.');
      return;
    }

    if (ruanganBedInput < 1) {
      toast.error('Jumlah bed minimal 1.');
      return;
    }

    setIsSubmittingRuangan(true);
    try {
      if (editingRuangan) {
        const res = await updateRuangan(
          editingRuangan.idRuangan,
          ruanganNameInput,
          ruanganKelasInput,
          ruanganBedInput,
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
                        jumlahBed: ruanganBedInput,
                      }
                    : r,
                );
                const totalB = updatedList.reduce(
                  (acc, r) => acc + r.jumlahBed,
                  0,
                );
                return {
                  ...g,
                  ruanganList: updatedList,
                  totalBed: totalB,
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
          ruanganBedInput,
        );
        if (res.success) {
          toast.success(res.message);
          const newRuanganObj: RuanganDetail = {
            idRuangan: Date.now(),
            namaRuangan: ruanganNameInput.trim(),
            kelas: ruanganKelasInput,
            jumlahBed: ruanganBedInput,
            gedungId: targetGedungId,
          };
          const addFn = (prev: GedungHierarkis[]) =>
            prev.map((g) => {
              if (g.idGedung === targetGedungId) {
                const updatedList = [...g.ruanganList, newRuanganObj];
                return {
                  ...g,
                  totalRuangan: g.totalRuangan + 1,
                  totalBed: g.totalBed + ruanganBedInput,
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

  function handleQuickAdjustBed(ruangan: RuanganDetail, delta: number) {
    const nextCount = ruangan.jumlahBed + delta;
    if (nextCount < 1) {
      toast.error('Jumlah bed minimal 1.');
      return;
    }

    setGedungList((prev) =>
      prev.map((g) => {
        if (g.idGedung === ruangan.gedungId) {
          const updatedList = g.ruanganList.map((r) =>
            r.idRuangan === ruangan.idRuangan
              ? { ...r, jumlahBed: nextCount }
              : r,
          );
          const totalB = updatedList.reduce(
            (acc, r) => acc + r.jumlahBed,
            0,
          );
          return { ...g, ruanganList: updatedList, totalBed: totalB };
        }
        return g;
      }),
    );
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

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header Hero Banner */}
      <KonfigurasiHeader
        hasUnsavedChanges={hasUnsavedChanges}
        pendingCount={pendingBedChanges.length}
        isSaving={isSaving}
        onReset={handleResetChanges}
        onSave={handleSaveChanges}
        onOpenAddGedung={openAddGedungModal}
      />

      {/* 2. Top Stats Overview */}
      <KonfigurasiStats
        totalGedung={totalGedung}
        totalRuangan={totalRuangan}
        totalBed={totalBed}
        avgBedPerRuangan={avgBedPerRuangan}
      />

      {/* 3. Search & Toolbar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border/60'>
        <div className='relative flex-1 max-w-md'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Cari nama gedung, ruangan, atau kelas...'
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
            className='h-8 gap-1 text-xs'
          >
            <ChevronDown className='w-3.5 h-3.5' /> Expand All
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={collapseAll}
            className='h-8 gap-1 text-xs'
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
                    ? `Tidak ada gedung atau ruangan yang cocok dengan "${searchQuery}".`
                    : 'Belum ada gedung yang terdaftar dalam sistem.'}
                </p>
              </div>
              <Button onClick={openAddGedungModal} className='gap-2 mt-2'>
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
          pendingCount={pendingBedChanges.length}
          isSaving={isSaving}
          onReset={handleResetChanges}
          onSave={handleSaveChanges}
        />
      )}

      {/* Dialogs */}
      <GedungDialog
        isOpen={isGedungDialogOpen}
        editingGedung={editingGedung}
        gedungNameInput={gedungNameInput}
        isSubmitting={isSubmittingGedung}
        onNameChange={setGedungNameInput}
        onClose={() => setIsGedungDialogOpen(false)}
        onSave={handleSaveGedung}
      />

      <RuanganDialog
        isOpen={isRuanganDialogOpen}
        editingRuangan={editingRuangan}
        ruanganNameInput={ruanganNameInput}
        ruanganKelasInput={ruanganKelasInput}
        ruanganBedInput={ruanganBedInput}
        kelasList={kelasList}
        isSubmitting={isSubmittingRuangan}
        onNameChange={setRuanganNameInput}
        onKelasChange={setRuanganKelasInput}
        onBedChange={setRuanganBedInput}
        onClose={() => setIsRuanganDialogOpen(false)}
        onSave={handleSaveRuangan}
      />

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
    </div>
  );
}
