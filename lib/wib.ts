/**
 * Single source of truth untuk hari & tanggal WIB (Asia/Jakarta).
 *
 * Kenapa file ini ada:
 * - `new Date().toISOString().slice(0,10)` = tanggal UTC, bukan WIB.
 *   Tiap jam 00:00-06:59 WIB hasilnya kemarin (off-by-one).
 * - `date.getHours()/getDate()/getDay()` di server Next.js = zona UTC,
 *   bukan WIB.
 * - `new Date('YYYY-MM-DD')` di-parse sebagai UTC midnight, lalu
 *   `getDay()/toLocaleDateString()` tanpa timeZone bisa geser hari.
 *
 * Semua modul (server + client) WAJIB pakai helper di sini, jangan
 * pakai `toISOString().slice`, `getHours`, atau `new Date(key)` langsung.
 */

export const WIB_TIMEZONE = 'Asia/Jakarta';

export const HARI_INDONESIA = [
  'MINGGU',
  'SENIN',
  'SELASA',
  'RABU',
  'KAMIS',
  'JUMAT',
  'SABTU',
] as const;

export type HariIndonesia = (typeof HARI_INDONESIA)[number];

export interface WibParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23 WIB
  minute: number; // 0-59 WIB
}

function two(n: number): string {
  return String(n).padStart(2, '0');
}

/** Ambil parts WIB dari sebuah instant. Tidak pernah pakai getter lokal. */
export function getWibParts(now: Date = new Date()): WibParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return {
    year: Number(get('year')) || now.getUTCFullYear(),
    month: Number(get('month')) || now.getUTCMonth() + 1,
    day: Number(get('day')) || now.getUTCDate(),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

/** `YYYY-MM-DD` hari ini dalam WIB. Pengganti `new Date().toISOString().slice(0,10)`. */
export function getWibTodayKey(now: Date = new Date()): string {
  const p = getWibParts(now);
  return `${p.year}-${two(p.month)}-${two(p.day)}`;
}

/** Menit sejak 00:00 WIB. Pengganti `date.getHours()*60+getMinutes()`. */
export function getWibMinutes(now: Date = new Date()): number {
  const p = getWibParts(now);
  return p.hour * 60 + p.minute;
}

/** Validasi + parse `YYYY-MM-DD` tanpa melibatkan Date/Timezone. */
export function parseCalendarDate(key: string): { year: number; month: number; day: number } | null {
  if (!key || typeof key !== 'string') return null;
  const dateOnly = key.split('T')[0].trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Validasi hari beneran ada (mis. tolak 2026-02-30).
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function isCalendarKey(key: string): boolean {
  return parseCalendarDate(key) !== null;
}

export function toCalendarKey(year: number, month: number, day: number): string {
  return `${year}-${two(month)}-${two(day)}`;
}

/** Math kalender murni via UTC (tidak kena DST/TZ). */
export function addCalendarDays(key: string, days: number): string {
  const p = parseCalendarDate(key);
  if (!p) throw new Error(`addCalendarDays: invalid date key "${key}"`);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day));
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())}`;
}

/** Selisih hari kalender (b - a). */
export function diffCalendarDays(aKey: string, bKey: string): number {
  const a = parseCalendarDate(aKey);
  const b = parseCalendarDate(bKey);
  if (!a || !b) throw new Error(`diffCalendarDays: invalid keys "${aKey}" / "${bKey}"`);
  const aUtc = Date.UTC(a.year, a.month - 1, a.day);
  const bUtc = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((bUtc - aUtc) / 86400000);
}

/** Index hari 0=Minggu..6=Sabtu, dihitung dari kalender (deterministik). */
export function getWibDayIndex(key: string): number {
  const p = parseCalendarDate(key);
  if (!p) return 1; // fallback Senin, sama seperti kode lama
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
}

export function getWibHari(key: string): HariIndonesia {
  return HARI_INDONESIA[getWibDayIndex(key)] || 'SENIN';
}

/**
 * Instant aman untuk sebuah tanggal kalender: jam 12:00 WIB (=05:00 UTC).
 * Dipakai saat butuh object Date (kalender UI, cutoff) agar tidak
 * menyeberang ke hari sebelah di UTC maupun WIB.
 */
export function wibKeyToSafeDate(key: string): Date {
  const p = parseCalendarDate(key);
  if (!p) return new Date(`${key}T12:00:00+07:00`);
  return new Date(`${toCalendarKey(p.year, p.month, p.day)}T12:00:00+07:00`);
}

/** Cutoff makan `HH:mm` pada tanggal kalender dalam WIB. */
export function wibCutoffToDate(key: string, timeHHmm: string): Date {
  return new Date(`${key}T${timeHHmm.slice(0, 5)}:00+07:00`);
}

/** "23 September 2026" — selalu zona WIB. */
export function formatIndo(key: string): string {
  if (!isCalendarKey(key)) return key;
  return wibKeyToSafeDate(key).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: WIB_TIMEZONE,
  });
}

/** "Selasa, 23 September 2026" — selalu zona WIB. */
export function formatIndoFull(key: string): string {
  if (!isCalendarKey(key)) return key;
  return wibKeyToSafeDate(key).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: WIB_TIMEZONE,
  });
}

/** "23 Sep 2026" — untuk badge/list padat. */
export function formatIndoShort(key: string): string {
  if (!isCalendarKey(key)) return key;
  return wibKeyToSafeDate(key).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: WIB_TIMEZONE,
  });
}
