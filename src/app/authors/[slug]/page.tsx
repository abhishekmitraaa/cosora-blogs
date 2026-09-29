import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { PostCard } from '@/components/PostCard';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { SocialIcon } from '@/components/SocialIcon';
import listing from '@/components/ListingView.module.css';
import { authorRoleLine, authorSchema, authorUrl } from '@/lib/authors';
import { clampDescription } from '@/lib/metadata';
import { imageUrl } from '@/lib/format';
import {
  getAuthorBySlug,
  getAuthors,
  getCategories,
  getPostsByAuthor,
  type Author,
} from '@/lib/posts';
import { SITE_ID } from '@/lib/schema';
import { canonical, COSORA_URL, SITE_NAME } from '@/lib/site';
import styles from './author.module.css';

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const authors = await getAuthors();
  return authors.map((a) => ({ slug: a.slug }));
}

/**
 * Title and description say who this is and nothing more. There is no bio for
 * the three people, and the page must not imply one: "Articles by" is a fact
 * about the page, not about them.
 */
function pageTitle(author: Author): string {
  const role = authorRoleLine(author);
  return role ? `${author.name}, ${role}` : author.name;
}

function pageDescription(author: Author): string {
  if (author.entity_type === 'person') {
    const role = author.role?.trim();
    return role
      ? `Articles by ${author.name}, ${role} at Cosora, in ${SITE_NAME}.`
      : `Articles by ${author.name} in ${SITE_NAME}.`;
  }
  return clampDescription(author.description?.trim() || `Articles by ${author.name} in ${SITE_NAME}.`);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return { title: 'Author not found' };

  const posts = await getPostsByAuthor(author);
  const title = pageTitle(author);
  const description = pageDescription(author);
  const url = authorUrl(author);
  const image = `${url}/opengraph-image`;
  const [firstName, ...rest] = author.name.split(' ');

  return {
    title: { absolute: `${title} · ${SITE_NAME}` },
    description,
    alternates: { canonical: url },
    // A name, a role and a link, with no articles under them, is a thin page.
    // It stays out of the index until its first post is published; the post's
    // revalidation purges this page, so the flip needs no one to remember it.
    robots: posts.length ? undefined : { index: false, follow: true },
    openGraph:
      author.entity_type === 'person'
        ? {
            type: 'profile',
            title,
            description,
            url,
            siteName: SITE_NAME,
            firstName,
            lastName: rest.join(' ') || undefined,
            images: [{ url: image, width: 1200, height: 630, alt: title }],
          }
        : {
            type: 'website',
            title,
            description,
            url,
            siteName: SITE_NAME,
            images: [{ url: image, width: 1200, height: 630, alt: title }],
          },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function AuthorPage({ params }: Params) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const [categories, posts] = await Promise.all([getCategories(), getPostsByAuthor(author)]);

  const url = authorUrl(author);
  const role = authorRoleLine(author);
  const isPerson = author.entity_type === 'person';
  const photo = imageUrl(isPerson ? author.avatar_url : author.logo_url);

  /**
   * ProfilePage is the type Google reads for an author page; the person or the
   * organisation is its mainEntity. For Cosora that entity is the same
   * Organization, with the same @id, that the root listing and About page emit.
   */
  const profile = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': url,
    url,
    name: `${pageTitle(author)} · ${SITE_NAME}`,
    inLanguage: 'en-IN',
    isPartOf: { '@id': SITE_ID },
    mainEntity: authorSchema(author),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Cosora', item: COSORA_URL },
      { '@type': 'ListItem', position: 2, name: SITE_NAME, item: canonical() },
      { '@type': 'ListItem', position: 3, name: author.name, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={profile} />
      <JsonLd data={breadcrumb} />
      <SiteHeader categories={categories} />

      <main id="main">
        <section className={listing.masthead}>
          <div className={listing.rule}>
            <span>{SITE_NAME}</span>
            <span>Author</span>
          </div>

          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/">Journal</Link>
            <span aria-hidden="true" className={styles.chevron}>
              &rsaquo;
            </span>
            <span aria-current="page">{author.name}</span>
          </nav>

          <div className={styles.identity}>
            {/* No wordmark for Cosora: the heading already says it. A photo or
                logo shows only when one is stored. */}
            {photo ? (
              <Image
                src={photo}
                alt=""
                width={88}
                height={88}
                className={isPerson ? styles.photo : styles.logo}
              />
            ) : null}
            <h1 className={styles.name}>{author.name}</h1>
          </div>

          <div className={listing.introBlock}>
            {role ? <p className={listing.intro}>{role}</p> : null}
            {author.description ? <p className={listing.intro}>{author.description}</p> : null}

            <div className={styles.links}>
              {author.linkedin_url ? (
                <a
                  className={styles.link}
                  href={author.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer me"
                >
                  <SocialIcon name="LinkedIn" />
                  <span>LinkedIn</span>
                </a>
              ) : null}
              {author.website_url ? (
                <a className={styles.link} href={author.website_url} rel="me">
                  <span>{author.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className={listing.gridSection} aria-labelledby="author-posts">
          <div className={listing.gridHead}>
            <h2 id="author-posts" className={listing.gridTitle}>
              Articles
            </h2>
            <p className={listing.count}>
              {posts.length} {posts.length === 1 ? 'story' : 'stories'}
            </p>
          </div>

          {posts.length ? (
            <div className={listing.grid}>
              {posts.map((p, i) => (
                <PostCard key={p.id} post={p} priority={i < 3} />
              ))}
            </div>
          ) : (
            <p className={listing.empty}>No articles published yet.</p>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
