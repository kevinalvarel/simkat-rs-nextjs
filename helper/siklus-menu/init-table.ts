import { sql, asc, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  masterSiklusTable,
  masterSiklusMenuTable,
} from "@/db/schemas/master/siklus-menu";
import {
  addCalendarDays,
  formatIndo,
  getWibHari,
  getWibTodayKey,
} from "@/lib/wib";
import { HARI_ROTASI_LIST } from "@/types/siklus-menu.types";

let initPromise: Promise<void> | null = null;

async function runInit(): Promise<void> {
  // 1. Ensure master_siklus table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "master_siklus" (
      "id" serial PRIMARY KEY NOT NULL,
      "nomor_siklus" integer UNIQUE NOT NULL,
      "nama_siklus" text NOT NULL,
      "hari" text,
      "deskripsi" text,
      "is_active" boolean DEFAULT true NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  // Ensure hari & tanggal columns exist if created previously
  await db.execute(sql`
    ALTER TABLE "master_siklus" ADD COLUMN IF NOT EXISTS "hari" text;
  `);
  await db.execute(sql`
    ALTER TABLE "master_siklus" ADD COLUMN IF NOT EXISTS "tanggal" text;
  `);

  // 2. Ensure master_siklus_menu table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "master_siklus_menu" (
      "id" serial PRIMARY KEY NOT NULL,
      "siklus_ke" integer DEFAULT 1 NOT NULL,
      "kelas" text DEFAULT 'Semua Kelas' NOT NULL,
      "jenis_makanan" text NOT NULL,
      "waktu_makan" text NOT NULL,
      "nama_makanan" text NOT NULL,
      "kategori_menu" text,
      "catatan" text,
      "is_active" boolean DEFAULT true NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  // 3. Auto-seed default cycles 1-10 (+11) if master_siklus is empty
  const countRes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(masterSiklusTable);
  const totalCycles = countRes[0]?.count || 0;

  if (totalCycles === 0) {
    // Look for any existing cycles in master_siklus_menu
    const existingMenuCycles = await db
      .selectDistinct({ siklus_ke: masterSiklusMenuTable.siklus_ke })
      .from(masterSiklusMenuTable);

    const distinctNums = existingMenuCycles
      .map((r) => r.siklus_ke)
      .filter(Boolean);

    const defaultNumbers = Array.from(
      new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, ...distinctNums]),
    ).sort((a, b) => a - b);

    await db.insert(masterSiklusTable).values(
      defaultNumbers.map((num) => {
        // WIB sentral: seeding dari tanggal WIB, bukan tanggal UTC server.
        const iso = addCalendarDays(getWibTodayKey(), num - 1);
        const displayTarget = formatIndo(iso);
        return {
          nomor_siklus: num,
          nama_siklus: `Siklus ${num}${num === 31 ? " (Tgl 31)" : ""}`,
          hari: HARI_ROTASI_LIST[(num - 1) % 7],
          tanggal: iso,
          deskripsi: `Rotasi menu makanan siklus tanggal ${displayTarget}`,
          is_active: true,
        };
      }),
    );
  } else {
    // If table already has cycles but tanggal is null, initialize them
    const nullTanggalCycles = await db
      .select({
        id: masterSiklusTable.id,
        nomor_siklus: masterSiklusTable.nomor_siklus,
      })
      .from(masterSiklusTable)
      .where(sql`"tanggal" IS NULL`)
      .orderBy(asc(masterSiklusTable.nomor_siklus));

    if (nullTanggalCycles.length > 0) {
      const todayKey = getWibTodayKey();
      for (let i = 0; i < nullTanggalCycles.length; i++) {
        const row = nullTanggalCycles[i];
        const iso = addCalendarDays(todayKey, row.nomor_siklus - 1);
        const day = getWibHari(iso);
        const displayTarget = formatIndo(iso);

        await db
          .update(masterSiklusTable)
          .set({
            tanggal: iso,
            hari: day,
            deskripsi: `Rotasi menu makanan siklus tanggal ${displayTarget}`,
            updated_at: new Date(),
          })
          .where(eq(masterSiklusTable.id, row.id));
      }
    }
  }
}

/**
 * Ensures database tables master_siklus and master_siklus_menu exist,
 * with required columns and seed data.
 * Memoized per server instance for high performance.
 */
export async function ensureTableInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = runInit().catch((err) => {
      initPromise = null;
      console.error("Error ensuring master_siklus / menu tables exist:", err);
    });
  }
  return initPromise;
}
