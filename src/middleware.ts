import { NextResponse, type NextRequest } from 'next/server';

/**
 * Keep preview hosts out of the index.
 *
 * Every page here is statically generated with ISR. Reading the Host header inside
 * a page or generateMetadata would opt that route into dynamic rendering and throw
 * the ISR cache away, so the noindex is emitted as an `X-Robots-Tag` response
 * header from middleware instead of a <meta> tag in the document. Google, Bing and
 * the other majors treat the header and the meta tag as equivalent, and the header
 * also covers non-HTML responses.
 *
 * The canonical host is whatever PUBLIC_BASE_URL points at. Anything else — a
 * *.vercel.app preview, the production deployment's own vercel.app hostname, a
 * staging domain — gets noindex.
 */
const canonicalHost = (() => {
  try {
    return new URL(process.env.PUBLIC_BASE_URL ?? 'https://www.cosora.in').host.toLowerCase();
  } catch {
    return 'www.cosora.in';
  }
})();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // x-forwarded-host is what the reverse proxy in textile-spark-net sets; fall back
  // to Host for direct hits on the vercel.app domain.
  const host = (
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    ''
  )
    .split(':')[0]
    .toLowerCase();

  if (host !== canonicalHost) {
    response.headers.set('x-robots-tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  // '/' is listed separately on purpose: the negative-lookahead pattern compiles to
  // a regex that requires a path segment after basePath, so on its own it never
  // matches the blog index itself (/blogs).
  matcher: ['/', '/((?!_next/static|_next/image|api/|favicon.ico).*)'],
};
