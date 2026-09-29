import { absoluteUrl } from './format';
import { DEFAULT_AUTHOR_SLUG, type Author } from './posts';
import { ORG_ID, ORG_LOGO, organizationSchema } from './schema';
import { canonical, COSORA_URL } from './site';

/**
 * Presentation and structured data for a byline.
 *
 * A person is emitted as a Person and Cosora as an Organization. That split is
 * deliberate and must not be flattened: an article written by the organisation
 * validates with an Organization author, and calling it a Person would be false.
 */

/** Everyone in public.authors works here; role holds the title alone. */
const EMPLOYER = 'Cosora';

export function isCosora(author: Author): boolean {
  return author.entity_type === 'organization' && author.slug === DEFAULT_AUTHOR_SLUG;
}

/** Router path, relative to basePath. */
export function authorPath(author: Author): string {
  return `/authors/${author.slug}`;
}

export function authorUrl(author: Author): string {
  return canonical(`authors/${author.slug}`);
}

/** "CEO, Cosora" for a person with a role; null for the organisation. */
export function authorRoleLine(author: Author): string | null {
  if (author.entity_type !== 'person' || !author.role?.trim()) return null;
  return `${author.role.trim()}, ${EMPLOYER}`;
}

/**
 * Stable @id per author. Cosora reuses the site-wide Organization @id, so the
 * byline, the publisher and the Organization on the About page are one entity.
 */
export function authorId(author: Author): string {
  if (isCosora(author)) return ORG_ID;
  return `${authorUrl(author)}#${author.entity_type === 'person' ? 'person' : 'organization'}`;
}

/** The full entity: the mainEntity of an author page, and a post's author. */
export function authorSchema(author: Author): Record<string, unknown> {
  if (isCosora(author)) {
    // Identical to what the root listing and the About page emit.
    const { '@context': _context, ...org } = organizationSchema();
    return org;
  }

  if (author.entity_type === 'organization') {
    return {
      '@type': 'Organization',
      '@id': authorId(author),
      name: author.name,
      url: author.website_url ?? authorUrl(author),
      logo: absoluteUrl(author.logo_url) ?? undefined,
      description: author.description ?? undefined,
    };
  }

  return {
    '@type': 'Person',
    '@id': authorId(author),
    name: author.name,
    jobTitle: author.role?.trim() || undefined,
    url: authorUrl(author),
    image: absoluteUrl(author.avatar_url) ?? undefined,
    description: author.description ?? undefined,
    worksFor: { '@type': 'Organization', '@id': ORG_ID, name: EMPLOYER, url: COSORA_URL },
    sameAs: author.linkedin_url ? [author.linkedin_url] : undefined,
  };
}

/**
 * A post's author. Named people get the full Person, which is the point of the
 * byline for E-E-A-T; Cosora gets the compact Organization (name, url, logo),
 * since the post already names the same @id as its publisher.
 */
export function bylineSchema(author: Author | null): Record<string, unknown> {
  return !author || isCosora(author) ? authorRef(author) : authorSchema(author);
}

/**
 * A short reference for places that list many posts (the listing ItemList),
 * where repeating the full entity per card would bloat the page. Type, name and
 * url keep it valid on a page that does not define the entity itself.
 */
export function authorRef(author: Author | null): Record<string, unknown> {
  if (!author || isCosora(author)) {
    return { '@type': 'Organization', '@id': ORG_ID, name: EMPLOYER, url: COSORA_URL, logo: ORG_LOGO };
  }
  return {
    '@type': author.entity_type === 'person' ? 'Person' : 'Organization',
    '@id': authorId(author),
    name: author.name,
    url: authorUrl(author),
  };
}
