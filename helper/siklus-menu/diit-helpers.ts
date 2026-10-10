import {
  parseMenuTags,
  type MenuTagOption,
} from "@/lib/siklus-menu-tags";
import type { SiklusMenuItem } from "@/types/siklus-menu.types";

export type DiitWaktuKey = "PAGI" | "SIANG" | "SORE" | "SARING";

export const DIIT_WAKTU_LIST: DiitWaktuKey[] = [
  "PAGI",
  "SIANG",
  "SORE",
  "SARING",
];

/**
 * Kode yang tidak pernah masuk DIIT.
 * B/BIASA = fallback hidangan biasa, NPO/TKTP/SARING = jalur khusus,
 * DIIT = penampung fallback itu sendiri (bukan diet).
 */
export const DIIT_EXCLUDED_CODES = new Set([
  "B",
  "BIASA",
  "NPO",
  "TKTP",
  "SARING",
  "DIIT",
]);

/**
 * Kategori master yang kodenya tidak pernah masuk DIIT per waktu.
 * KARBOHIDRAT dikecualikan (hidangan pokok dihitung terpisah).
 * NABATI/SAYUR/BUAH/SNACK kini masuk DIIT seperti HEWANI/EXTRA.
 */
const DIIT_NON_DIET_KATEGORI = new Set(["KARBOHIDRAT"]);

/**
 * Kategori master (nama_kategori / jenis_makanan) yang relevan per waktu makan.
 * SARING dikembalikan kosong — tag kategori SARING masuk daftar excluded,
 * sehingga strip SARING tidak menampilkan noise diet reguler.
 */
function applicableKategoriForWaktu(waktu: DiitWaktuKey): Set<string> | null {
  switch (waktu) {
    case "PAGI":
      // Buah hanya Siang & Sore → tag asal BUAH tidak menuntut DIIT di Pagi.
      return new Set(["HEWANI", "NABATI", "SAYUR", "SNACK", "EXTRA", "BUAH", "SARING"].filter((k) => k !== "BUAH" && k !== "SARING"));
    case "SIANG":
      return new Set(["HEWANI", "NABATI", "SAYUR", "BUAH", "SNACK", "EXTRA"]);
    case "SORE":
      // Snack hanya Pagi & Siang → tag asal SNACK tidak menuntut DIIT di Sore.
      return new Set(["HEWANI", "NABATI", "SAYUR", "BUAH", "EXTRA"]);
    case "SARING":
      return new Set();
    default:
      return new Set();
  }
}

/**
 * Jenis yang memakai diet (selisih dihitung per tag).
 * NABATI/SAYUR/BUAH/SNACK kini sama seperti HEWANI/EXTRA.
 */
const DIIT_TAG_AWARE_JENIS = new Set([
  "HEWANI",
  "NABATI",
  "SAYUR",
  "BUAH",
  "SNACK",
  "EXTRA",
]);

/** Jenis yang tidak pernah menampilkan chip (tanpa konfigurasi diet). */
const DIIT_NO_CHIP_JENIS = new Set([
  "SARING",
  "KARBOHIDRAT",
  "POKOK",
  "BENTUK_MAKANAN",
]);

function isSemuaKelasLabel(value: string | null | undefined): boolean {
  const v = (value || "").trim().toUpperCase();
  return !v || v === "SEMUA KELAS" || v === "SEMUA" || v === "ALL" || v === "UMUM";
}

/**
 * True bila hidangan dengan kelas hidangan dipakai untuk baris kelas tersebut.
 * Hidangan Semua Kelas berlaku untuk semua baris, dan baris Semua Kelas
 * terisi bila ada hidangan apa pun di slot itu.
 */
function kelasCoversRow(
  dishKelas: string | null | undefined,
  rowKelas: string | null | undefined,
): boolean {
  if (isSemuaKelasLabel(dishKelas) || isSemuaKelasLabel(rowKelas)) return true;
  return (
    (dishKelas || "").trim().toUpperCase() ===
    (rowKelas || "").trim().toUpperCase()
  );
}

/**
 * Sisa tag diet untuk satu sel matriks (jenis + kelas + jam makan).
 * Tidak menggabungkan kelas: tiap baris kelas dihitung dari hidangan
 * kelasnya sendiri plus hidangan Semua Kelas.
 *
 * Semua jenis diet (hewani, nabati, sayur, buah, snack, extra):
 * kembalikan kode master yang belum dipakai hidangan di slot itu.
 * Hidangan tanpa tag dianggap wildcard (menutup semua kode).
 */
export function computeDiitForSel(
  jenis: string | null | undefined,
  kelas: string | null | undefined,
  waktu: string | null | undefined,
  activeTags: MenuTagOption[],
  items: Array<
    Pick<
      SiklusMenuItem,
      "jenis_makanan" | "kelas" | "waktu_makan" | "kategori_menu" | "is_active"
    >
  >,
): MenuTagOption[] {
  const jenisUpper = (jenis || "").trim().toUpperCase();
  const waktuUpper = (waktu || "").trim().toUpperCase();
  if (!jenisUpper || !waktuUpper) return [];
  if (DIIT_NO_CHIP_JENIS.has(jenisUpper)) return [];
  if (waktuUpper === "SARING") return [];

  const master: MenuTagOption[] = [];
  const seen = new Set<string>();
  for (const opt of activeTags || []) {
    if ((opt.kategori || "").trim().toUpperCase() !== jenisUpper) continue;
    const code = (opt.kode || "").trim().toUpperCase();
    if (!code || DIIT_EXCLUDED_CODES.has(code) || seen.has(code)) continue;
    seen.add(code);
    master.push({
      kode: opt.kode.trim(),
      label: opt.label,
      kategori: opt.kategori,
    });
  }
  if (master.length === 0) return [];

  const slotItems = (items || []).filter((item) => {
    if (item.is_active === false) return false;
    const itemWaktu = (item.waktu_makan || "").trim().toUpperCase();
    const itemJenis = (item.jenis_makanan || "").trim().toUpperCase();
    if (itemWaktu !== waktuUpper || itemJenis !== jenisUpper) return false;
    if (waktuUpper !== "SARING" && isSaringItem(item)) return false;
    return kelasCoversRow(item.kelas, kelas);
  });
  if (slotItems.length === 0) return master;

  if (!DIIT_TAG_AWARE_JENIS.has(jenisUpper)) return [];

  // Hidangan tanpa tag = wildcard: menutup semua kode (kompatibilitas data lama).
  for (const item of slotItems) {
    const validTags = parseMenuTags(item.kategori_menu)
      .map((t) => t.trim().toUpperCase())
      .filter((key) => key && !DIIT_EXCLUDED_CODES.has(key));
    if (validTags.length === 0) return [];
  }

  const used = new Set<string>();
  for (const item of slotItems) {
    for (const tag of parseMenuTags(item.kategori_menu)) {
      const key = tag.trim().toUpperCase();
      if (!key || DIIT_EXCLUDED_CODES.has(key)) continue;
      used.add(key);
    }
  }
  return master
    .filter((m) => !used.has(m.kode.trim().toUpperCase()))
    .sort((a, b) => a.kode.localeCompare(b.kode, "id", { sensitivity: "base" }));
}

function isActiveItem(item: Pick<SiklusMenuItem, "is_active">): boolean {
  return item.is_active !== false;
}

function isSaringItem(item: Pick<SiklusMenuItem, "jenis_makanan" | "waktu_makan">): boolean {
  return (
    (item.waktu_makan || "").trim().toUpperCase() === "SARING" ||
    (item.jenis_makanan || "").trim().toUpperCase() === "SARING"
  );
}

/**
 * DIIT = sisa tag: kode diet aktif di Konfigurasi Diet yang tidak dipakai
 * oleh hidangan apapun pada siklus + jam tersebut.
 *
 * Contoh: RL dipakai di PAGI tapi tidak ada hidangan RL di SIANG
 * → DIIT SIANG memuat RL.
 */
export function computeDiitPerWaktu(
  activeTags: MenuTagOption[],
  items: Array<
    Pick<
      SiklusMenuItem,
      "jenis_makanan" | "waktu_makan" | "kategori_menu" | "is_active"
    >
  >,
): Record<DiitWaktuKey, MenuTagOption[]> {
  const canonical = new Map<string, MenuTagOption>();
  const codesByKategori = new Map<string, Set<string>>();
  for (const opt of activeTags || []) {
    const code = (opt.kode || "").trim().toUpperCase();
    if (!code || DIIT_EXCLUDED_CODES.has(code)) continue;
    const kategoriUpper = (opt.kategori || "").trim().toUpperCase();
    if (DIIT_NON_DIET_KATEGORI.has(kategoriUpper)) continue;
    if (!codesByKategori.has(kategoriUpper)) codesByKategori.set(kategoriUpper, new Set());
    codesByKategori.get(kategoriUpper)!.add(code);
    if (!canonical.has(code)) {
      canonical.set(code, {
        kode: opt.kode.trim(),
        label: opt.label,
        kategori: opt.kategori,
      });
    }
  }

  const result: Record<DiitWaktuKey, MenuTagOption[]> = {
    PAGI: [],
    SIANG: [],
    SORE: [],
    SARING: [],
  };

  for (const waktu of DIIT_WAKTU_LIST) {
    const applicable = applicableKategoriForWaktu(waktu);
    if (!applicable || applicable.size === 0) {
      result[waktu] = [];
      continue;
    }

    // Kumpulkan tag yang terpakai pada jam ini.
    // Hidangan tanpa tag = wildcard: menutup semua kode kategorinya
    // (kompatibilitas data lama sebelum aturan diet dihapus).
    const used = new Set<string>();
    const wildcardKategori = new Set<string>();
    for (const item of items || []) {
      if (!isActiveItem(item as Pick<SiklusMenuItem, "is_active">)) continue;
      const waktuItem = ((item as { waktu_makan?: string }).waktu_makan || "")
        .trim()
        .toUpperCase();
      const jenisItem = ((item as { jenis_makanan?: string }).jenis_makanan || "")
        .trim()
        .toUpperCase();

      if (waktu === "SARING") {
        if (!isSaringItem(item as Pick<SiklusMenuItem, "jenis_makanan" | "waktu_makan">)) continue;
      } else {
        // Hidangan saring ditampilkan di kolom SARING, bukan kolom reguler.
        if (jenisItem === "SARING" || waktuItem === "SARING") continue;
        if (waktuItem !== waktu) continue;
        if (applicable && jenisItem && !applicable.has(jenisItem)) continue;
      }

      const validTags = parseMenuTags(
        (item as { kategori_menu?: string | null }).kategori_menu,
      )
        .map((t) => t.trim().toUpperCase())
        .filter((key) => key && !DIIT_EXCLUDED_CODES.has(key));
      if (validTags.length === 0) {
        if (jenisItem) wildcardKategori.add(jenisItem);
        continue;
      }
      for (const key of validTags) used.add(key);
    }
    for (const kategori of wildcardKategori) {
      for (const code of codesByKategori.get(kategori) || []) used.add(code);
    }

    const missing: MenuTagOption[] = [];
    for (const [codeUpper, opt] of canonical) {
      const kategoriUpper = (opt.kategori || "").trim().toUpperCase();
      if (kategoriUpper && !applicable.has(kategoriUpper)) continue;
      if (!used.has(codeUpper)) missing.push(opt);
    }
    missing.sort((a, b) =>
      a.kode.localeCompare(b.kode, "id", { sensitivity: "base" }),
    );
    result[waktu] = missing;
  }

  return result;
}
