import Image from 'next/image';
// Static import: with basePath set, a string src leaves the optimizer's `url`
// param unprefixed and the request 404s. A static import resolves correctly.
import cosoraLogo from '../../public/cosora-logo.png';
import { COSORA_URL } from '@/lib/site';
import styles from './SiteFooter.module.css';

const LINKS = [
  { label: 'Browse products', href: `${COSORA_URL}/products` },
  { label: 'Join as a seller', href: `${COSORA_URL}/sell` },
  { label: 'About', href: `${COSORA_URL}/about` },
  { label: 'Contact', href: `${COSORA_URL}/contact` },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <p className={styles.slogan}>Source smarter.</p>
          <nav className={styles.links} aria-label="Cosora">
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
