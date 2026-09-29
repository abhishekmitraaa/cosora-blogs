import { notFound } from 'next/navigation';
import { CategoryTabs } from './CategoryTabs';
import { FeaturedPost } from './FeaturedPost';
import { JsonLd } from './JsonLd';
import { Pagination } from './Pagination';
import { PostCard } from './PostCard';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import {
  getBlogSettings,
  getCategories,
  getCategoryBySlug,
  getFeaturedPost,
  getPosts,
  type Category,
} from '@/lib/posts';
import { canonical, COSORA_URL, MARKETPLACE, SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import Image from 'next/image';
import { imageUrl } from '@/lib/format';
import styles from './ListingView.module.css';

const MONTH = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

/** Path prefix for pagination links, relative to basePath. */
export function listingBasePath(categorySlug: string | null): string {
  return categorySlug ? `/category/${categorySlug}` : '';
}

export async function ListingView({
  categorySlug,
  page,
}: {
  categorySlug: string | null;
  page: number;
}) {
  const categories = await getCategories();
  // Landing hero, authored in Cosora-Admin. Only on page 1 of the unfiltered list.
  const settings = categorySlug === null && page === 1 ? await getBlogSettings() : null;
  const heroImage = imageUrl(settings?.hero_image);

  let category: Category | null = null;
  if (categorySlug) {
    category = await getCategoryBySlug(categorySlug);
    if (!category) notFound();
  }

  // The featured post owns the hero slot on page 1 and is kept out of the grid on
  // every page, so pagination counts stay consistent across pages.
  const featured = await getFeaturedPost(category?.id);
  const { posts, total, totalPages } = await getPosts({
    page,
    categoryId: category?.id,
    excludeId: featured?.id,
  });

  if (page > totalPages && page !== 1) notFound();

  const basePath = listingBasePath(categorySlug);
  const heading = category ? category.name : SITE_NAME;
  const gridTitle = category ? `All in ${category.name}` : 'Latest';
  const shown = total + (featured ? 1 : 0);

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Cosora', item: COSORA_URL },
      { '@type': 'ListItem', position: 2, name: SITE_NAME, item: canonical() },
      ...(category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: category.name,
              item: canonical(`category/${category.slug}`),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumb} />
      <SiteHeader categories={categories} />

      <main id="main">
        {settings && heroImage ? (
          <section className={styles.heroBanner} aria-labelledby="hero-banner-heading">
            <div className={styles.heroBannerFrame}>
              <Image
                src={heroImage}
                alt={settings.hero_image_alt ?? ''}
                fill
                sizes="100vw"
                priority
                className={styles.heroBannerImage}
              />
              <div className={styles.heroBannerScrim} />
              <div className={styles.heroBannerBody}>
                {settings.hero_eyebrow ? (
                  <p className={styles.heroBannerEyebrow}>{settings.hero_eyebrow}</p>
                ) : null}
                {settings.hero_title ? (
                  <p id="hero-banner-heading" className={styles.heroBannerTitle}>
                    {settings.hero_title}
                  </p>
                ) : null}
                {settings.hero_subtitle ? (
                  <p className={styles.heroBannerSubtitle}>{settings.hero_subtitle}</p>
                ) : null}
                {settings.hero_cta_label && settings.hero_cta_href ? (
                  <a className={styles.heroBannerCta} href={settings.hero_cta_href}>
                    {settings.hero_cta_label}
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* Masthead */}
        <section className={styles.masthead}>
          <div className={styles.rule}>
            <span>Sourcing · Fabrics · Manufacturing</span>
            <span>{MONTH.format(new Date())}</span>
          </div>

          {category ? <p className={styles.kicker}>{SITE_NAME}</p> : null}
          <h1 className={styles.title}>
            {category ? (
              heading
            ) : (
              <>
                The Cosora <span className={styles.accent}>Journal</span>
              </>
            )}
          </h1>
          <p className={styles.intro}>{SITE_TAGLINE}</p>
        </section>

        {page === 1 && featured ? <FeaturedPost post={featured} /> : null}

        <CategoryTabs categories={categories} active={categorySlug} />

        <section className={styles.gridSection} aria-labelledby="grid-heading">
          <div className={styles.gridHead}>
            <h2 id="grid-heading" className={styles.gridTitle}>
              {gridTitle}
            </h2>
            <p className={styles.count}>
              {shown} {shown === 1 ? 'story' : 'stories'}
              {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}
            </p>
          </div>

          {posts.length ? (
            <div className={styles.grid}>
              {posts.map((p, i) => (
                <PostCard key={p.id} post={p} priority={page === 1 && !featured && i < 3} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>
              {featured
                ? 'No other stories in this section yet.'
                : 'No stories published here yet. Check back soon.'}
            </p>
          )}
        </section>

        <Pagination page={page} totalPages={totalPages} basePath={basePath} />

        {/* Conversion block — the journal exists to feed the marketplace. */}
        <section className={styles.cta}>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>Ready to source?</h2>
            <p className={styles.ctaCopy}>
              Post a Quick RFQ with an image and a quantity. Verified manufacturers send you
              quotes to compare.
            </p>
            <a className={styles.ctaButton} href={MARKETPLACE.postRfq}>
              Post RFQ <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
