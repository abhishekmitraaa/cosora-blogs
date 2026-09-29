/**
 * Canonical origin for everything this app serves.
 *
 * Read from PUBLIC_BASE_URL only — never from window.location and never from
 * VERCEL_URL. The app is reachable at a throwaway *.vercel.app host for previews,
 * and a canonical built from the deployment hostname would tell Google the preview
 * is the real page.
 */
const RAW_BASE = process.env.PUBLIC_BASE_URL ?? 'https://www.cosora.in';

/** Origin with no trailing slash, e.g. "https://www.cosora.in". */
export const PUBLIC_BASE_URL = RAW_BASE.replace(/\/+$/, '');

/** The path this app is mounted at, kept in sync with basePath in next.config.mjs. */
export const BASE_PATH = '/blogs';

/** The canonical host. Requests arriving on any other Host get noindex (see middleware.ts). */
export const CANONICAL_HOST = new URL(PUBLIC_BASE_URL).host;

/** Absolute canonical URL for a path relative to the blog root. */
export function canonical(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `${PUBLIC_BASE_URL}${BASE_PATH}/${clean}` : `${PUBLIC_BASE_URL}${BASE_PATH}`;
}

/** Internal href. Next prefixes basePath automatically, so these stay basePath-relative. */
export function href(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `/${clean}` : '/';
}

export const SITE_NAME = 'The Cosora Journal';
export const SITE_TAGLINE =
  'Practical guides on sourcing, fabrics and manufacturing across India, for brands buying and vendors selling on Cosora.';

/** Marketing site links. Absolute — these leave this app. */
export const COSORA_URL = PUBLIC_BASE_URL;
export const POSTS_PER_PAGE = 9;
