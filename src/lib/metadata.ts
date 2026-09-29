import type { Metadata } from 'next';
import { getCategoryBySlug } from './posts';
import { canonical, SITE_NAME, SITE_TAGLINE } from './site';

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

  const base = category ? `${category.name} · ${SITE_NAME}` : SITE_NAME;
  const title = page > 1 ? `${base} — Page ${page}` : base;

  const description = category
    ? `${category.name} stories from ${SITE_NAME}. ${SITE_TAGLINE}`
    : SITE_TAGLINE;

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
