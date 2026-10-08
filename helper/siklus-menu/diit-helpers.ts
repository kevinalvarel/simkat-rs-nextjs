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
  for (const opt of activeTags || []) {
    const code = (opt.kode || "").trim().toUpperCase();
    if (!code || DIIT_EXCLUDED_CODES.has(code)) continue;
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
    const used = new Set<string>();
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
      }

      for (const tag of parseMenuTags(
        (item as { kategori_menu?: string | null }).kategori_menu,
      )) {
        const key = tag.trim().toUpperCase();
        if (!key || DIIT_EXCLUDED_CODES.has(key)) continue;
        used.add(key);
      }
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
