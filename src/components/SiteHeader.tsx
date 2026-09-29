import Image from 'next/image';
// Static import: with basePath set, a string src leaves the optimizer's `url`
// param unprefixed and the request 404s. A static import resolves correctly.
import cosoraLogo from '../../public/cosora-logo.png';
import Link from 'next/link';
import type { Category } from '@/lib/posts';
import { MARKETPLACE } from '@/lib/site';
import styles from './SiteHeader.module.css';

export function SiteHeader({ categories }: { categories: Category[] }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="The Cosora Journal, home">
          <Image
            src={cosoraLogo}
            alt="Cosora"
            width={107}
            height={22}
            priority
            className={styles.logo}
          />
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.wordmark}>Journal</span>
        </Link>

        <nav className={styles.nav} aria-label="Blog categories">
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className={styles.navLink}>
              {c.name}
            </Link>
          ))}
        </nav>

        <a className={styles.cta} href={MARKETPLACE.postRfq}>
          Post RFQ
        </a>
      </div>
    </header>
  );
}
