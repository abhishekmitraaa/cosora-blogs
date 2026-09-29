import type { Metadata } from 'next';
import { getCategoryBySlug } from './posts';
import { canonical, SITE_NAME, SITE_TAGLINE } from './site';

/**
 * The unfiltered listing's own title.
 *
 * "The Cosora Journal" alone was 18 characters and carried no query a buyer
 * would ever type. This keeps the masthead but leads with what the Journal is
 * about, inside the 60-character budget Google renders.
 */
export const LISTING_TITLE = `Fabric and Sourcing Guides for India · ${SITE_NAME}`;

/** Google truncates around 158; anything past it is paid for and never shown. */
const DESCRIPTION_MAX = 158;

/**
 * Trims to the last whole word inside the limit. Admin-authored
 * seo_description is free text, so the cap is enforced here rather than trusted.
 */
export function clampDescription(text: string, max = DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:—-]$/, '')}…`;
}

/**
 * Metadata for every listing variant (all / by category, page 1 / page N).
 *
 * Canonical always points at the page's own URL — a paginated page that canonicals
 * to page 1 tells Google the posts on page 2 do not exist.
 */
export async function listingMetadata(
  categorySlug: string | null,
  page: number,
): Promise<Metadata> {
  const category = categorySlug ? await getCategoryBySlug(categorySlug) : null;

  // An admin-set seo_title wins; otherwise the category name plus the masthead.
  const base = category
    ? category.seo_title?.trim() || `${category.name} · ${SITE_NAME}`
    : LISTING_TITLE;
  const title = page > 1 ? `${base} · Page ${page}` : base;

  /**
   * Prefers what an editor wrote, in Cosora-Admin, over anything generated. The
   * generated fallback used to append the full site tagline to the category
   * name, which pushed Community to 161 characters and got it cut off.
   */
  const description = clampDescription(
    category
      ? category.seo_description?.trim() ||
          category.description?.trim() ||
          `${category.name} stories from ${SITE_NAME}: sourcing, fabrics and manufacturing across India.`
      : SITE_TAGLINE,
  );

  const path = [
    category ? `category/${category.slug}` : '',
    page > 1 ? `page/${page}` : '',
  ]
    .filter(Boolean)
    .join('/');

  const url = canonical(path);

  return {
    // Absolute title: the layout template would otherwise append the site name twice.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: SITE_NAME,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}
