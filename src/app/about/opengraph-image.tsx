import fs from 'node:fs';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/site';

/**
 * Share card for the About page.
 *
 * Every article generates one of these, so the page people are most likely to
 * link to when introducing Cosora should not be the one that shares as a bare
 * blue link. Same grammar as [slug]/opengraph-image.tsx: paper ground, real
 * wordmark, red rule.
 */
const LOGO = `data:image/png;base64,${fs
  .readFileSync(path.join(process.cwd(), 'public', 'cosora-logo.png'))
  .toString('base64')}`;

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `About Cosora · ${SITE_NAME}`;

export default function Image() {
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
            About
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              color: '#262626',
            }}
          >
            The shortest route from a requirement to a finished order
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 6, background: '#C8102E' }} />
          <div style={{ fontSize: 24, color: '#6b6862' }}>
            B2B sourcing for India&apos;s fashion and textile industry
          </div>
        </div>
      </div>
    ),
    size,
  );
}
