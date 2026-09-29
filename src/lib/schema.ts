import {
  canonical,
  CONTACT_EMAIL,
  COSORA_URL,
  FOUNDED,
  LEGAL_NAME,
  SITE_NAME,
  SITE_TAGLINE,
  SOCIALS,
} from './site';

/**
 * Shared structured-data entities.
 *
 * Organization and WebSite are emitted from more than one route, so they live
 * here rather than being written out twice. The @id values are what let a search
 * engine merge them into one entity instead of reading each page as a separate
 * organisation, so they must stay stable: change an @id and you split the
 * entity in two.
 */

export const ORG_ID = `${COSORA_URL}/#organization`;
export const SITE_ID = `${canonical()}/#website`;

export const ORG_DESCRIPTION =
  'Cosora is a B2B sourcing marketplace for India’s fashion and textile industry. ' +
  'Post a requirement once, compare quotes from verified manufacturers, and keep the ' +
  'order in one thread.';

export const ORG_LOGO = {
  '@type': 'ImageObject',
  url: `${COSORA_URL}/blogs/cosora-logo.png`,
  width: 420,
  height: 86,
};

/** The publisher behind both the marketplace and this Journal. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'Cosora',
    legalName: LEGAL_NAME,
    url: COSORA_URL,
    logo: ORG_LOGO,
    description: ORG_DESCRIPTION,
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
}

/**
 * No potentialAction/SearchAction: this site has no search endpoint, and
 * claiming one that 404s is worse than claiming nothing.
 */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: canonical(),
    name: SITE_NAME,
    description: SITE_TAGLINE,
    inLanguage: 'en-IN',
    publisher: { '@id': ORG_ID },
  };
}
