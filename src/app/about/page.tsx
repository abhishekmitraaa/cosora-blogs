import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { SocialIcon } from '@/components/SocialIcon';
import { getCategories } from '@/lib/posts';
import {
  canonical,
  CONTACT_EMAIL,
  COSORA_URL,
  FOUNDED,
  LEGAL_NAME,
  MARKETPLACE,
  SITE_NAME,
  SOCIALS,
} from '@/lib/site';
import styles from './about.module.css';

export const revalidate = 86400;

const TITLE = 'About Cosora';
const DESCRIPTION =
  'Cosora is a B2B sourcing marketplace for India’s fashion and textile industry. Post a requirement once, compare quotes from verified manufacturers, and keep the order in one thread.';

const URL = canonical('about');

/**
 * Pointed at the generated card by URL rather than left to Next's
 * opengraph-image file convention. That convention is only merged when
 * openGraph.images is absent, and the merge has already been lost once here in
 * production; an explicit URL cannot silently disappear.
 */
const OG_IMAGE = `${URL}/opengraph-image`;

export const metadata: Metadata = {
  title: { absolute: `${TITLE} · ${SITE_NAME}` },
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    type: 'website',
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: SITE_NAME,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `About Cosora` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

/**
 * Figures approved for public use (PRODUCT.md, "Evidence on Hand"). Every one is
 * already published on the cosora.in landing page. Nothing may be added here
 * that is not on that list: this page is indexed, so an invented number is a
 * published one.
 */
type Figure = { value: string; label: string };
type Stage = { n: string; title: string; copy: string; figures: Figure[] };

const STAGES: Stage[] = [
  {
    n: '01',
    title: 'You post what you need',
    copy: 'A written requirement, or a photograph of the thing you are trying to match. A Quick RFQ takes under thirty seconds. You write it once, rather than twenty times into twenty different chat windows.',
    figures: [],
  },
  {
    n: '02',
    title: 'Verified makers answer',
    copy: 'Manufacturers, mills and suppliers reply with pricing, minimum order quantity and lead time, in a shape that lines up side by side. This is the part a directory cannot do for you. A phone number is not a quote.',
    figures: [
      { value: '5,000+', label: 'manufacturers' },
      { value: '50,000+', label: 'products listed' },
      { value: '28', label: 'states covered' },
    ],
  },
  {
    n: '03',
    title: 'You order, and it stays tracked',
    copy: 'Negotiate in the same thread you were quoted in, lock your terms, and follow the order through to delivery. Nothing moves to email halfway through, and nothing gets lost once it does.',
    figures: [
      { value: '₹500Cr+', label: 'sourced through Cosora' },
      { value: '10,000+', label: 'verified brands' },
    ],
  },
];

export default async function AboutPage() {
  const categories = await getCategories().catch(() => []);

  /**
   * Organization is the important one: `sameAs` is what ties this page, the
   * marketplace and the social accounts into a single entity in a knowledge
   * graph, and this is the only page on either origin that emits it.
   */
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${COSORA_URL}/#organization`,
    name: 'Cosora',
    legalName: LEGAL_NAME,
    url: COSORA_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${COSORA_URL}/blogs/cosora-logo.png`,
      width: 420,
      height: 86,
    },
    description: DESCRIPTION,
    foundingDate: FOUNDED,
    email: CONTACT_EMAIL,
    areaServed: { '@type': 'Country', name: 'India' },
    knowsAbout: [
      'B2B sourcing',
      'Textile manufacturing',
      'Apparel manufacturing',
      'Fabric sourcing',
    ],
    sameAs: SOCIALS.map((s) => s.href),
  };

  const aboutPage = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: TITLE,
    description: DESCRIPTION,
    url: URL,
    mainEntity: { '@id': `${COSORA_URL}/#organization` },
    isPartOf: { '@type': 'Blog', '@id': canonical(), name: SITE_NAME },
    inLanguage: 'en-IN',
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Cosora', item: COSORA_URL },
      { '@type': 'ListItem', position: 2, name: SITE_NAME, item: canonical() },
      { '@type': 'ListItem', position: 3, name: TITLE, item: URL },
    ],
  };

  return (
    <>
      <JsonLd data={organization} />
      <JsonLd data={aboutPage} />
      <JsonLd data={breadcrumb} />
      <SiteHeader categories={categories} />

      <main id="main">
        <section className={styles.statement}>
          <div className={styles.rule}>
            <span>About Cosora</span>
            <span>{LEGAL_NAME}</span>
            <span>Founded {FOUNDED}</span>
          </div>

          <h1 className={styles.title}>
            The shortest route from a requirement to a{' '}
            <span className={styles.accent}>finished order</span>
          </h1>

          <p className={styles.standfirst}>
            Cosora is a B2B sourcing marketplace for India&rsquo;s fashion and textile
            industry. A brand describes what it needs once. Verified manufacturers answer
            with a price, a quantity and a date. The negotiating, the order and the
            delivery all stay in the same place after that.
          </p>
        </section>

        {/*
          The three stage titles are the page's h2s. No hidden "How it works"
          heading above them: the sequence is the section, and a label announcing
          it would be a heading that says nothing the next one does not.
        */}
        <section className={styles.route} aria-label="How sourcing on Cosora works">
          <ol className={styles.stages}>
            {STAGES.map((stage) => (
              <li key={stage.n} className={styles.stage}>
                <span className={styles.stageNum} aria-hidden="true">
                  {stage.n}
                </span>
                <div className={styles.stageBody}>
                  <h2 className={styles.stageTitle}>{stage.title}</h2>
                  <p className={styles.stageCopy}>{stage.copy}</p>
                  {stage.figures.length ? (
                    <dl className={styles.figures}>
                      {stage.figures.map((f) => (
                        <div key={f.label} className={styles.figure}>
                          <dt className={styles.figureValue}>{f.value}</dt>
                          <dd className={styles.figureLabel}>{f.label}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.why} aria-labelledby="why-heading">
          <div className={styles.whyInner}>
            <h2 id="why-heading" className={styles.whyTitle}>
              Why we built it
            </h2>
            <div className={styles.whyBody}>
              <p>
                India&rsquo;s fashion supply chain is worth around $120 billion, and most of
                it still moves over phone calls, forwarded photographs and trust built one
                order at a time.
              </p>
              <p>
                None of that is wrong. It is how the trade has always worked, and it works
                well for the people already in the room. It is just slow, it is hard to
                compare, and it is invisible to everyone else. A mill with thirty years of
                finishing experience and no sales team is indistinguishable, from the
                outside, from one with neither.
              </p>
              <p>
                We started Cosora in {FOUNDED} to write that trade down. To give a
                manufacturer reach that does not depend on who they already know, and to
                give a buyer a way to compare them fairly, on price, on quantity and on the
                date the goods actually arrive.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.close} aria-label="Get started on Cosora">
          <div className={`${styles.side} ${styles.sideBuy}`}>
            <h2 className={styles.sideTitle}>If you are buying</h2>
            <p className={styles.sideCopy}>
              Describe the requirement once and let verified manufacturers come to you with
              comparable quotes.
            </p>
            <a className={styles.sideCta} href={MARKETPLACE.postRfq}>
              Post an RFQ <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <div className={`${styles.side} ${styles.sideSell}`}>
            <h2 className={styles.sideTitle}>If you are making</h2>
            <p className={styles.sideCopy}>
              List what you produce and answer requirements from brands that are already
              ready to order.
            </p>
            <a className={styles.sideCta} href={MARKETPLACE.becomeSeller}>
              Join as a seller <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </section>

        <section className={styles.imprint} aria-label="Contact Cosora">
          <div className={styles.imprintBlock}>
            <p className={styles.imprintLabel}>Talk to us</p>
            <a className={styles.email} href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            <p className={styles.legal}>
              {LEGAL_NAME} &middot; Founded {FOUNDED} &middot;{' '}
              <Link href="/">Read the Journal</Link>
            </p>
          </div>

          <div className={styles.socials}>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                className={styles.social}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`Cosora on ${s.label}`}
              >
                <SocialIcon name={s.label} />
              </a>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
