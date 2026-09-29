import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getCategories } from '@/lib/posts';

export const revalidate = 3600;

export default async function NotFound() {
  const categories = await getCategories().catch(() => []);
  return (
    <>
      <SiteHeader categories={categories} />
      <main
        id="main"
        style={{ maxWidth: 680, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          404
        </p>
        <h1
          style={{
            margin: '16px 0 0',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            fontSize: 'clamp(40px, 8vw, 80px)',
            lineHeight: 0.9,
            color: 'var(--ink)',
          }}
        >
          Page not found
        </h1>
        <p style={{ margin: '20px 0 28px', fontSize: 17, color: 'var(--muted)' }}>
          That story has moved or never existed. Try the journal index.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 44,
            padding: '0 24px',
            borderRadius: 999,
            background: 'var(--cosora-red)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Back to the Journal
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
