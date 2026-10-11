"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  Trash2,
  Plus,
  Layers,
  Sunrise,
  Sun,
  Sunset,
  Clock,
  Coffee,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { SiklusMenuItem } from "@/servers/siklus-menu.service";
import type { MenuTagOption } from "@/lib/siklus-menu-tags";
import { deleteSiklusMenuItem } from "@/servers/siklus-menu.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface SaringSlot {
  siklus_ke: number;
  kelas: string;
  jenis_makanan: string;
  waktu_makan: string;
  existingItems: SiklusMenuItem[];
}

interface SaringMatrixTableProps {
  items: SiklusMenuItem[];
  activeSiklus: number;
  dietOptions?: MenuTagOption[];
  onEditItem: (item: SiklusMenuItem) => void;
  onAddItemToSlot: (slot: Omit<SaringSlot, "existingItems">) => void;
  onEditSlot: (slot: SaringSlot) => void;
  onRefresh: () => void;
}

const SARING_BADGE_STYLE: Record<string, string> = {
  KARBOHIDRAT:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
  HEWANI:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300",
  NABATI:
    "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300",
  SAYUR:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300",
  BUAH: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300",
  SNACK:
    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300",
  LAINNYA:
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300",
};

// Baris Saring disamakan dengan menu umum (walau datanya masih kosong):
// dikelompokkan per kategori asal diet ber-flag Saring.
const SARING_ROWS: Array<{ id: string; kategori: string; label: string }> = [
  { id: "SARING-KARBOHIDRAT", kategori: "KARBOHIDRAT", label: "SARING KARBO" },
  { id: "SARING-HEWANI", kategori: "HEWANI", label: "SARING HEWANI" },
  { id: "SARING-NABATI", kategori: "NABATI", label: "SARING NABATI" },
  { id: "SARING-SAYUR", kategori: "SAYUR", label: "SARING SAYUR" },
  { id: "SARING-BUAH", kategori: "BUAH", label: "SARING BUAH" },
  { id: "SARING-SNACK", kategori: "SNACK", label: "SARING SNACK" },
];

const KNOWN_SARING_KATEGORI = new Set(SARING_ROWS.map((r) => r.kategori));

type SaringColId = "PAGI" | "SIANG" | "SORE" | "BELUM";

const SARING_COLS: Array<{
  id: SaringColId;
  label: string;
  hint: string;
}> = [
  { id: "PAGI", label: "Saring Pagi", hint: "waktu_makan = PAGI" },
  { id: "SIANG", label: "Saring Siang", hint: "waktu_makan = SIANG" },
  { id: "SORE", label: "Saring Sore", hint: "waktu_makan = SORE" },
  { id: "BELUM", label: "Belum Terjadwal", hint: "waktu_makan = SARING (data lama)" },
];

function isSaringStructural(item: SiklusMenuItem): boolean {
  const jenis = (item.jenis_makanan || "").trim().toUpperCase();
  const waktu = (item.waktu_makan || "").trim().toUpperCase();
  return jenis === "SARING" || waktu === "SARING";
}

/**
 * Kategori asal diet per kode tag (dari Konfigurasi Master Menu).
 * Dipakai untuk mengelompokkan hidangan Saring ke baris
 * SARING KARBO / HEWANI / NABATI / SAYUR / BUAH / SNACK.
 */
function buildKodeKategoriMap(options: MenuTagOption[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const option of options || []) {
    const key = (option.kode || "").trim().toUpperCase();
    if (key && !map.has(key)) {
      map.set(key, (option.kategori || "").trim().toUpperCase());
    }
  }
  return map;
}

function asalKategoriOf(
  item: SiklusMenuItem,
  kodeKategoriMap: Map<string, string>,
): string[] {
  const tags = (item.kategori_menu || "")
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t && t !== "DIIT");
  const set = new Set<string>();
  for (const tag of tags) {
    const kategori = kodeKategoriMap.get(tag);
    if (kategori) set.add(kategori);
  }
  return [...set];
}

export default function SaringMatrixTable({
  items,
  activeSiklus,
  dietOptions = [],
  onEditItem,
  onAddItemToSlot,
  onEditSlot,
  onRefresh,
}: SaringMatrixTableProps) {
  const [itemToDelete, setItemToDelete] = useState<SiklusMenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const kodeKategoriMap = useMemo(
    () => buildKodeKategoriMap(dietOptions),
    [dietOptions],
  );

  // Semua hidangan struktural Saring (jenis / waktu SARING).
  const saringItems = useMemo(
    () => items.filter(isSaringStructural),
    [items],
  );

  // Cache kategori asal per item agar sel tidak menghitung ulang.
  const asalMap = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const item of saringItems) {
      map.set(item.id, asalKategoriOf(item, kodeKategoriMap));
    }
    return map;
  }, [saringItems, kodeKategoriMap]);

  // Baris LAINNYA hanya muncul bila ada hidangan Saring tanpa tag
  // yang dikenali (mis. tanpa tag / hanya DIIT).
  const showLainnya = useMemo(
    () =>
      saringItems.some((item) => {
        const asal = asalMap.get(item.id) || [];
        return (
          asal.length === 0 ||
          asal.every((c) => !KNOWN_SARING_KATEGORI.has(c))
        );
      }),
    [saringItems, asalMap],
  );

  function getSaringCellItems(
    rowKategori: string,
    colId: SaringColId,
  ): SiklusMenuItem[] {
    return saringItems.filter((item) => {
      const waktu = (item.waktu_makan || "").trim().toUpperCase();
      if (colId === "BELUM") {
        // Data lama (waktu = SARING) + nilai waktu tak dikenal
        // ditampung dulu di sini sebelum dijadwalkan ulang.
        if (waktu === "PAGI" || waktu === "SIANG" || waktu === "SORE") {
          return false;
        }
      } else if (waktu !== colId) {
        return false;
      }
      const asal = asalMap.get(item.id) || [];
      if (rowKategori === "LAINNYA") {
        return (
          asal.length === 0 ||
          asal.every((c) => !KNOWN_SARING_KATEGORI.has(c))
        );
      }
      return asal.includes(rowKategori);
    });
  }

  async function handleDeleteConfirm() {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteSiklusMenuItem(itemToDelete.id);
      if (res.success) {
        toast.success(res.message);
        onRefresh();
        setItemToDelete(null);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus hidangan saring.");
    } finally {
      setIsDeleting(false);
    }
  }

  function renderSaringCell(rowKategori: string, colId: SaringColId) {
    const dishes = getSaringCellItems(rowKategori, colId);
    const waktuMakan = colId === "BELUM" ? "SARING" : colId;

    return (
      <div className="group/slot min-h-[90px] p-2 flex flex-col justify-between rounded-lg transition-colors hover:bg-muted/40 relative">
        <div className="space-y-1.5">
          {dishes.length === 0 ? (
            <div className="text-[11px] text-muted-foreground/60 italic py-2">
              - Belum ada menu -
            </div>
          ) : (
            dishes.map((dish) => (
              <div
                key={dish.id}
                className="text-xs text-foreground border border-border/80 rounded-md p-1.5 shadow-2xs group/item hover:border-primary/50 transition-all flex items-start justify-between gap-1.5"
              >
                <div className="leading-tight">
                  <span className="font-medium text-foreground">
                    {dish.nama_makanan}
                  </span>
                  {dish.kategori_menu && (
                    <span className="ml-1 font-bold text-primary text-[11px]">
                      ({dish.kategori_menu})
                    </span>
                  )}
                  {dish.catatan && (
                    <span className="ml-1 text-[10px] text-amber-700 dark:text-amber-400 font-mono italic">
                      {dish.catatan}
                    </span>
                  )}
                </div>
                <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEditItem(dish)}
                    className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                    title="Edit hidangan saring"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemToDelete(dish)}
                    className="h-5 w-5 rounded flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                    title="Hapus hidangan saring"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="opacity-0 group-hover/slot:opacity-100 flex items-center justify-end gap-1 pt-2 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() =>
              onAddItemToSlot({
                siklus_ke: activeSiklus,
                kelas: "Semua Kelas",
                jenis_makanan: "SARING",
                waktu_makan: waktuMakan,
              })
            }
            className="h-6 px-1.5 text-[10px] font-semibold text-primary hover:bg-primary/10"
            title="Tambah satu hidangan saring ke slot ini"
          >
            <Plus className="w-3 h-3 mr-0.5" /> Tambah
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() =>
              onEditSlot({
                siklus_ke: activeSiklus,
                kelas: "Semua Kelas",
                jenis_makanan: "SARING",
                waktu_makan: waktuMakan,
                existingItems: dishes,
              })
            }
            className="h-6 px-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
            title="Kelola / edit seluruh hidangan saring dalam slot ini"
          >
            <Layers className="w-3 h-3 mr-0.5" /> Edit Slot
          </Button>
        </div>
      </div>
    );
  }

  const rows = showLainnya
    ? [...SARING_ROWS, { id: "SARING-LAINNYA", kategori: "LAINNYA", label: "SARING LAINNYA" }]
    : SARING_ROWS;

  return (
    <>
      <div className="border rounded-2xl bg-card overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 border-b bg-primary/5">
          <Coffee className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Menu Saring
          </h3>
          <Badge
            variant="secondary"
            className="text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5"
          >
            {saringItems.length} item
          </Badge>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Per jenis × Saring Pagi / Siang / Sore. Data lama (waktu SARING)
            ditampung di Belum Terjadwal.
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table className="border-collapse min-w-[760px]">
            <TableHeader className="bg-muted/60 border-b select-none">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-32 text-center text-xs font-bold uppercase tracking-wider text-foreground border-r">
                  Jenis Saring
                </TableHead>
                <TableHead
                  className="min-w-[170px] text-xs font-bold uppercase tracking-wider text-foreground border-r"
                  title={SARING_COLS[0].hint}
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    <Sunrise className="w-4 h-4 text-amber-500" />
                    Saring Pagi
                  </div>
                </TableHead>
                <TableHead
                  className="min-w-[170px] text-xs font-bold uppercase tracking-wider text-foreground border-r"
                  title={SARING_COLS[1].hint}
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    <Sun className="w-4 h-4 text-orange-500" />
                    Saring Siang
                  </div>
                </TableHead>
                <TableHead
                  className="min-w-[170px] text-xs font-bold uppercase tracking-wider text-foreground border-r"
                  title={SARING_COLS[2].hint}
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    <Sunset className="w-4 h-4 text-indigo-500" />
                    Saring Sore
                  </div>
                </TableHead>
                <TableHead
                  className="min-w-[170px] text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400"
                  title={SARING_COLS[3].hint}
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    <Clock className="w-4 h-4" />
                    Belum Terjadwal
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => {
                const badgeStyle =
                  SARING_BADGE_STYLE[row.kategori] ||
                  "bg-gray-100 text-gray-800 border-gray-300";
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "hover:bg-muted/20 transition-colors",
                      idx !== rows.length - 1 && "border-b",
                    )}
                  >
                    <TableCell className="text-center align-middle border-r bg-muted/5">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-extrabold px-2.5 py-1 uppercase tracking-wider ${badgeStyle}`}
                      >
                        {row.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-r align-top p-1 bg-background">
                      {renderSaringCell(row.kategori, "PAGI")}
                    </TableCell>
                    <TableCell className="border-r align-top p-1 bg-background">
                      {renderSaringCell(row.kategori, "SIANG")}
                    </TableCell>
                    <TableCell className="border-r align-top p-1 bg-background">
                      {renderSaringCell(row.kategori, "SORE")}
                    </TableCell>
                    <TableCell className="align-top p-1 bg-amber-500/[0.04]">
                      {renderSaringCell(row.kategori, "BELUM")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="gap-2">
            <div className="p-3 rounded-full bg-rose-500/10 text-rose-600 w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold">
              Hapus Hidangan Saring?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Apakah Anda yakin ingin menghapus hidangan saring{" "}
              <strong className="text-foreground">
                &quot;{itemToDelete?.nama_makanan}&quot;
                {itemToDelete?.kategori_menu &&
                  ` (${itemToDelete.kategori_menu})`}
              </strong>{" "}
              dari Siklus #{itemToDelete?.siklus_ke}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setItemToDelete(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Hidangan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
