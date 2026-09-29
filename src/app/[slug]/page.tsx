import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { PostCard } from '@/components/PostCard';
import { ShareLinks } from '@/components/ShareLinks';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import {
  absoluteUrl,
  formatDate,
  imageUrl,
  isoDate,
  markdownWordCount,
  readTime,
  summarise,
} from '@/lib/format';
import {
  blocksFaq,
  blocksImages,
  blocksToText,
  blocksToc,
  blocksWordCount,
  renderBlocks,
} from '@/lib/blocks';
import { inlineToText } from '@/lib/inlineHtml';
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
    post.seo_description?.trim() ||
    post.excerpt?.trim() ||
    summarise(blocksToText(post.blocks)) ||
    stripMarkdown(post.body, 160);
  // canonical_url lets an editor point a republished piece at its original.
  const url = post.canonical_url?.trim() || canonical(post.slug);
  const image = absoluteUrl(post.og_image) ?? absoluteUrl(post.hero_image);

  return {
    title: { absolute: `${title} · ${SITE_NAME}` },
    description,
    alternates: { canonical: url },
    robots: post.noindex ? { index: false, follow: true } : undefined,
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

  const hasBlocks = Boolean(post.blocks?.length);

  // Markdown is kept only for posts written before the block editor existed.
  // Re-saving such a post in Cosora-Admin moves it onto blocks.
  const [categories, related, markdown] = await Promise.all([
    getCategories(),
    getRelatedPosts(post, 3),
    hasBlocks ? Promise.resolve(null) : renderMarkdown(post.body),
  ]);

  const toc = hasBlocks ? blocksToc(post.blocks) : (markdown?.toc ?? []);
  const words = hasBlocks ? blocksWordCount(post.blocks) : markdownWordCount(post.body);
  const bodyText = hasBlocks ? blocksToText(post.blocks) : stripMarkdown(post.body, 5000);
  const faqs = blocksFaq(post.blocks);

  const hero = imageUrl(post.hero_image);
  const heroAlt = post.hero_image_alt ?? post.title;
  const url = post.canonical_url?.trim() || canonical(post.slug);
  const time = readTime(post.read_time, words);
  const ogImage = absoluteUrl(post.og_image) ?? absoluteUrl(post.hero_image);
  const categoryHref = post.category ? `/category/${post.category.slug}` : '/';

  // Every image on the page, hero first, so a rich result can pick a crop.
  const images = [ogImage, ...blocksImages(post.blocks)].filter(
    (v): v is string => Boolean(v),
  );

  // A named human author becomes a Person; "Cosora Team" and friends stay an
  // Organization, which is what they actually are.
  const authorName = post.author?.trim() || 'Cosora';
  const authorIsPerson = authorName.includes(' ') && !/cosora/i.test(authorName);

  const blogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description:
      post.seo_description || post.excerpt || summarise(bodyText) || undefined,
    image: images.length ? images : undefined,
    author: {
      '@type': authorIsPerson ? 'Person' : 'Organization',
      name: authorName,
    },
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
    keywords: post.tags?.length ? post.tags.join(', ') : undefined,
    wordCount: words || undefined,
    isPartOf: { '@type': 'Blog', '@id': canonical(), name: SITE_NAME },
    inLanguage: 'en-IN',
  };

  // Only emitted when the post actually has an FAQ block. The database caps that
  // at one per post, because two FAQPage entities on one URL is invalid.
  const faqPage = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: inlineToText(f.a) },
        })),
      }
    : null;

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
      {faqPage ? <JsonLd data={faqPage} /> : null}
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
          {toc.length > 2 ? (
            <aside className={styles.toc} aria-labelledby="toc-heading">
              <p id="toc-heading" className={styles.tocHeading}>
                On this page
              </p>
              <ol className={styles.tocList}>
                {toc.map((t) => (
                  <li key={t.id} className={t.depth === 3 ? styles.tocSub : undefined}>
                    <a href={`#${t.id}`}>{t.label}</a>
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}

          {/*
            Both paths render and sanitize entirely on the server, so neither a
            Markdown parser nor an HTML sanitizer reaches the browser.
          */}
          {hasBlocks ? (
            <article className={styles.body}>{renderBlocks(post.blocks, styles)}</article>
          ) : (
            <article
              className={styles.body}
              dangerouslySetInnerHTML={{ __html: markdown?.html ?? '' }}
            />
          )}
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
