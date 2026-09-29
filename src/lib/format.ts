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

/**
 * Prefer the stored read_time, else estimate from a word count at ~200 wpm.
 *
 * Takes a count rather than the body text because a block-authored post has no
 * `body` at all: deriving it from the body would silently return nothing for
 * every post written in the new editor.
 */
export function readTime(stored: string | null, words = 0): string {
  if (stored && stored.trim()) return stored.trim();
  if (!words) return '';
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

/** Word count of a Markdown body, for the legacy rendering path. */
export function markdownWordCount(body: string | null): number {
  return body?.trim() ? body.trim().split(/\s+/).length : 0;
}

/** Trim text to a meta-description length on a word boundary. */
export function summarise(text: string, max = 155): string {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (t.length <= max) return t;
  return `${t.slice(0, max).replace(/\s+\S*$/, '')}…`;
}
