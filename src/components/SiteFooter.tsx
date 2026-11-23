import Image from 'next/image';
// Static import: with basePath set, a string src leaves the optimizer's `url`
// param unprefixed and the request 404s. A static import resolves correctly.
import cosoraLogo from '../../public/cosora-logo.png';
import Link from 'next/link';
import { CIN, COMPANY_COPYRIGHT, MARKETPLACE, REGISTERED_ADDRESS } from '@/lib/site';
import styles from './SiteFooter.module.css';

// About is internal now. It used to point at the marketplace's /about, which
// still resolves but only as a 308 back into this app.
const LINKS = [
  { label: 'Browse products', href: MARKETPLACE.browseProducts },
  { label: 'Join as a seller', href: MARKETPLACE.becomeSeller },
];

// Who runs Cosora (Mitra, 2026-11-24): the same legal pages, line, address and CIN as the marketplace's footer
// (textile-spark-net src/components/LegalFooter.tsx). /contact exists there since 2026-11-24.
const LEGAL_LINKS = [
  { label: 'Contact', href: MARKETPLACE.contact },
  { label: 'Privacy Policy', href: MARKETPLACE.privacy },
  { label: 'Terms of Service', href: MARKETPLACE.terms },
  { label: 'Refund Policy', href: MARKETPLACE.refund },
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
          <p className={styles.copy}>B2B sourcing for India&rsquo;s fashion and textile industry</p>
        </div>
        <div className={styles.legal}>
          <nav className={styles.legalLinks} aria-label="Legal">
            <Link href="/about" className={styles.legalLink}>
              About
            </Link>
            {LEGAL_LINKS.map((l) => (
              <a key={l.label} href={l.href} className={styles.legalLink}>
                {l.label}
              </a>
            ))}
          </nav>
          <p className={styles.copy}>{COMPANY_COPYRIGHT}</p>
          <p className={styles.registered}>
            Registered office: {REGISTERED_ADDRESS} · CIN: {CIN}
          </p>
        </div>
      </div>
    </footer>
  );
}
