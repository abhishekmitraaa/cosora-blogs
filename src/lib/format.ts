import { PUBLIC_BASE_URL } from './site';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
/** Public bucket the admin panel will upload blog art into. */
const IMAGE_BUCKET = 'site-content';

/**
 * hero_image / og_image may hold either a full URL or a storage object path.
 * Resolve both to an absolute URL; return null so callers can fall back.
 */
export function imageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const path = v.replace(/^\/+/, '');
  if (!SUPABASE_URL) return null;
  const prefixed = path.startsWith(`${IMAGE_BUCKET}/`) ? path : `${IMAGE_BUCKET}/${path}`;
  return `${SUPABASE_URL}/storage/v1/object/public/${prefixed}`;
}

/** Absolute URL for og:image — social crawlers reject relative paths. */
export function absoluteUrl(value: string | null | undefined): string | null {
  const resolved = imageUrl(value);
  if (resolved) return resolved;
  if (!value) return null;
  return value.startsWith('/') ? `${PUBLIC_BASE_URL}${value}` : null;
}

const DATE_FMT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

/** "18 Sep 2026" in IST — Cosora's operating timezone. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : DATE_FMT.format(d);
}

/** ISO-8601 date for <time datetime> and JSON-LD. */
export function isoDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Prefer the stored read_time, else estimate from the body at ~200 wpm. */
export function readTime(stored: string | null, body: string | null): string {
  if (stored && stored.trim()) return stored.trim();
  if (!body) return '';
  const words = body.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}
