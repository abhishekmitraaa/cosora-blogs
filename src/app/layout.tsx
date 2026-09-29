import type { Metadata } from 'next';
import { Barlow_Condensed, Open_Sans, Roboto } from 'next/font/google';
import { PUBLIC_BASE_URL, SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import './globals.css';

/**
 * Self-hosted via next/font: no render-blocking request to fonts.googleapis.com,
 * and the CSS ships with the page.
 */
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-barlow-condensed',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-roboto',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-open-sans',
});

export const metadata: Metadata = {
  // Every relative URL in page metadata resolves against the canonical origin,
  // never the deployment host.
  metadataBase: new URL(PUBLIC_BASE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, locale: 'en_IN', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${barlowCondensed.variable} ${roboto.variable} ${openSans.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
