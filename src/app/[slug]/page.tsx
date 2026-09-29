import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { PostCard } from '@/components/PostCard';
import { ShareLinks } from '@/components/ShareLinks';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { absoluteUrl, formatDate, imageUrl, isoDate, readTime } from '@/lib/format';
import { renderMarkdown, stripMarkdown } from '@/lib/markdown';
import { getAllSlugs, getCategories, getPostBySlug, getRelatedPosts } from '@/lib/posts';
import { canonical, COSORA_URL, SITE_NAME } from '@/lib/site';
import styles from './article.module.css';

export const revalidate = 3600;

/**
 * Static listing segments win over this catch-all in Next's router, so a post whose
 * slug collides with one would be unreachable. Skip them at build rather than
 * emitting a route that silently resolves to the listing.
 */
const RESERVED = new Set(['category', 'page', 'api']);

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.filter((s) => !RESERVED.has(s)).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Article not found' };

  const title = post.seo_title?.trim() || post.title;
  const description =
    post.seo_description?.trim() || post.excerpt?.trim() || stripMarkdown(post.body, 160);
  const url = canonical(post.slug);
  const image = absoluteUrl(post.og_image) ?? absoluteUrl(post.hero_image);

  return {
    title: { absolute: `${title} · ${SITE_NAME}` },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: SITE_NAME,
      publishedTime: isoDate(post.published_at),
      modifiedTime: isoDate(post.updated_at),
      authors: post.author ? [post.author] : undefined,
      images: image
        ? [{ url: image, alt: post.hero_image_alt ?? post.title, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  if (RESERVED.has(slug)) notFound();

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [categories, related, rendered] = await Promise.all([
    getCategories(),
    getRelatedPosts(post, 3),
    renderMarkdown(post.body),
  ]);

  const hero = imageUrl(post.hero_image);
  const heroAlt = post.hero_image_alt ?? post.title;
  const url = canonical(post.slug);
  const time = readTime(post.read_time, post.body);
  const ogImage = absoluteUrl(post.og_image) ?? absoluteUrl(post.hero_image);
  const categoryHref = post.category ? `/category/${post.category.slug}` : '/';

  const blogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo_description || post.excerpt || stripMarkdown(post.body, 160),
    image: ogImage ? [ogImage] : undefined,
    author: { '@type': 'Organization', name: post.author || 'Cosora' },
    publisher: {
      '@type': 'Organization',
      name: 'Cosora',
      logo: { '@type': 'ImageObject', url: `${COSORA_URL}/blogs/cosora-logo.png` },
    },
    datePublished: isoDate(post.published_at),
    dateModified: isoDate(post.updated_at) ?? isoDate(post.published_at),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    articleSection: post.category?.name,
    inLanguage: 'en-IN',
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Cosora', item: COSORA_URL },
      { '@type': 'ListItem', position: 2, name: SITE_NAME, item: canonical() },
      ...(post.category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: post.category.name,
              item: canonical(`category/${post.category.slug}`),
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: post.category ? 4 : 3,
        name: post.title,
        item: url,
      },
    ],
  };

  return (
    <>
      <JsonLd data={blogPosting} />
      <JsonLd data={breadcrumb} />
      <SiteHeader categories={categories} />

      <main id="main">
        <div className={styles.head}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/">Journal</Link>
            {post.category ? (
              <>
                <span aria-hidden="true" className={styles.chevron}>
                  &rsaquo;
                </span>
                <Link href={categoryHref}>{post.category.name}</Link>
              </>
            ) : null}
          </nav>

          <div className={styles.headInner}>
            {post.category ? (
              <Link href={categoryHref} className={styles.category}>
                {post.category.name}
              </Link>
            ) : null}

            <h1 className={styles.title}>{post.title}</h1>

            {post.excerpt ? <p className={styles.standfirst}>{post.excerpt}</p> : null}

            <div className={styles.byline}>
              <div className={styles.author}>
                <span className={styles.avatar} aria-hidden="true">
                  C
                </span>
                <div className={styles.authorText}>
                  <span className={styles.authorName}>{post.author || 'Cosora Team'}</span>
                  <span className={styles.authorMeta}>
                    {post.published_at ? (
                      <time dateTime={isoDate(post.published_at)}>
                        {formatDate(post.published_at)}
                      </time>
                    ) : null}
                    {post.published_at && time ? <span aria-hidden="true"> · </span> : null}
                    {time}
                  </span>
                </div>
              </div>
              <ShareLinks url={url} title={post.title} />
            </div>
          </div>

          {hero ? (
            <figure className={styles.hero}>
              <div className={styles.heroFrame}>
                <Image
                  src={hero}
                  alt={heroAlt}
                  fill
                  sizes="(max-width: 1152px) 100vw, 1152px"
                  className={styles.heroImage}
                  priority
                />
              </div>
              {post.hero_image_alt ? (
                <figcaption className={styles.caption}>{post.hero_image_alt}</figcaption>
              ) : null}
            </figure>
          ) : null}
        </div>

        <div className={styles.columns}>
          {rendered.toc.length > 2 ? (
            <aside className={styles.toc} aria-labelledby="toc-heading">
              <p id="toc-heading" className={styles.tocHeading}>
                On this page
              </p>
              <ol className={styles.tocList}>
                {rendered.toc.map((t) => (
                  <li key={t.id} className={t.depth === 3 ? styles.tocSub : undefined}>
                    <a href={`#${t.id}`}>{t.label}</a>
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}

          {/*
            Rendered from Markdown on the server and sanitized in the same pipeline
            (see lib/markdown.ts). No Markdown parser reaches the browser.
          */}
          <article
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
        </div>

        {related.length ? (
          <section className={styles.related} aria-labelledby="related-heading">
            <div className={styles.relatedHead}>
              <h2 id="related-heading" className={styles.relatedTitle}>
                More for you to read
              </h2>
              <Link href="/" className={styles.viewAll}>
                View all <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            <div className={styles.relatedGrid}>
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </>
  );
}
