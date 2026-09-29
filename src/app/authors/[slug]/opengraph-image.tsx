import fs from 'node:fs';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { authorRoleLine } from '@/lib/authors';
import { getAuthorBySlug } from '@/lib/posts';
import { SITE_NAME } from '@/lib/site';

/**
 * Share card for an author page. Same grammar as the article and About cards:
 * paper ground, real wordmark, red rule. It carries the name and role only,
 * the same facts the page states, and nothing written for the occasion.
 */
const LOGO = `data:image/png;base64,${fs
  .readFileSync(path.join(process.cwd(), 'public', 'cosora-logo.png'))
  .toString('base64')}`;

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = SITE_NAME;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug).catch(() => null);

  const name = author?.name ?? SITE_NAME;
  const role = author ? authorRoleLine(author) : null;

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="Cosora" height={30} />
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
            Author
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.02em',
              color: '#262626',
            }}
          >
            {name}
          </div>
          {role ? (
            <div style={{ display: 'flex', fontSize: 36, color: '#6b6862' }}>{role}</div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 6, background: '#C8102E' }} />
          <div style={{ fontSize: 24, color: '#6b6862' }}>{SITE_NAME}</div>
        </div>
      </div>
    ),
    size,
  );
}
