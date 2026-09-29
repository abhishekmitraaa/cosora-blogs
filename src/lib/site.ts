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
} as const;

/** The public contact address, as published on the marketplace. */
export const CONTACT_EMAIL = 'hello@cosora.in';

/** Registered entity, used in the About imprint and in Organization JSON-LD. */
export const LEGAL_NAME = 'Cosora Technologies Pvt Ltd';

/** Year Cosora was founded. Stated on the marketplace's own About copy. */
export const FOUNDED = '2024';

/**
 * Confirmed social profiles (Mitra, 2026-09-29). These are the `sameAs` set in
 * Organization JSON-LD, which is how a search engine ties this site, the
 * marketplace and these accounts into one entity — so they must be the canonical
 * profile URLs, not share or feed-view links.
 *
 * There is no X/Twitter account. YouTube takes that slot; do not add an X link
 * on the assumption that a B2B brand must have one.
 */
export const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/cosora1/' },
  { label: 'Instagram', href: 'https://www.instagram.com/cosora.in/' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61577687235217' },
  { label: 'YouTube', href: 'https://www.youtube.com/@Cosora_in' },
] as const;
export const POSTS_PER_PAGE = 9;
