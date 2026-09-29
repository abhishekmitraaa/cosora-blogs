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

/**
 * Outbound links into the marketplace. Every one of these is a real route in
 * textile-spark-net, checked against its router: the previous set pointed at
 * /rfq/new, /sell and /contact, none of which exist, so all three 404'd.
 *
 * POST_RFQ is a dispatcher: it reads the session on the main app and sends a
 * signed-in buyer to the RFQ form, a signed-in vendor to their dashboard, and a
 * signed-out visitor to the landing page. The blog stays stateless.
 */
export const MARKETPLACE = {
  postRfq: `${COSORA_URL}/go/post-rfq`,
  browseProducts: `${COSORA_URL}/search`,
  becomeSeller: `${COSORA_URL}/seller`,
  about: `${COSORA_URL}/about`,
} as const;
export const POSTS_PER_PAGE = 9;
