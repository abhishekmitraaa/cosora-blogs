import Image from 'next/image';
// Static import: with basePath set, a string src leaves the optimizer's `url`
// param unprefixed and the request 404s. A static import resolves correctly.
import cosoraLogo from '../../public/cosora-logo.png';
import Link from 'next/link';
import { MARKETPLACE } from '@/lib/site';
import styles from './SiteFooter.module.css';

// "Contact" is deliberately absent: textile-spark-net has no /contact route, so
// the old link 404'd. Add it back when that page exists.
//
// About is internal now. It used to point at the marketplace's /about, which
// still resolves but only as a 308 back into this app.
const LINKS = [
  { label: 'Browse products', href: MARKETPLACE.browseProducts },
  { label: 'Join as a seller', href: MARKETPLACE.becomeSeller },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <p className={styles.slogan}>Source smarter.</p>
          <nav className={styles.links} aria-label="Cosora">
            <Link href="/about" className={styles.link}>
              About
            </Link>
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} className={styles.link}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className={styles.bottom}>
          <Image
            src={cosoraLogo}
            alt="Cosora"
            width={107}
            height={22}
            className={styles.logo}
          />
          <p className={styles.copy}>
            © {new Date().getFullYear()} Cosora · B2B sourcing for India&rsquo;s fashion and
            textile industry
          </p>
        </div>
      </div>
    </footer>
  );
}
