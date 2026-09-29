import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/posts';
import { SITE_NAME } from '@/lib/site';

/**
 * Generated social card, one per article.
 *
 * This is the automatic half of "meta tags are optimised when a post is
 * published": an editor never has to make or upload a share image, and the card
 * stays correct when the title is edited, which a generate-and-upload approach
 * in the admin could not do without re-rendering.
 *
 * generateMetadata sets openGraph.images only when og_image or hero_image is
 * populated, so Next falls back to this route for every other post.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = SITE_NAME;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);

  const title = post?.title ?? SITE_NAME;
  const category = post?.category?.name ?? 'Journal';
  const author = post?.author ?? 'Cosora';

  // Long headlines step down rather than overflow the card.
  const fontSize = title.length > 90 ? 52 : title.length > 55 ? 64 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FAFAF8',
          padding: '64px 72px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#C8102E',
            }}
          >
            COSORA
          </div>
          <div style={{ width: 1, height: 26, background: '#d6d3cc' }} />
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#6b6862',
            }}
          >
            {category}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#262626',
              display: 'flex',
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 6, background: '#C8102E' }} />
          <div style={{ fontSize: 24, color: '#6b6862' }}>{author}</div>
        </div>
      </div>
    ),
    size,
  );
}
