/**
 * This app is reverse-proxied from textile-spark-net so it is publicly reachable at
 * https://www.cosora.in/blogs. basePath keeps every route AND every static asset under
 * /blogs, so the proxy can forward /blogs/* verbatim without rewriting asset URLs.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/blogs',
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * The share-card routes read public/cosora-logo.png from disk to inline it.
   * public/ is served from the CDN and is not bundled into serverless
   * functions, so without this every dynamic card 500'd with ENOENT in
   * production. (The About card was unaffected only because it is prerendered
   * at build time, where the file exists.)
   */
  outputFileTracingIncludes: {
    '/**/opengraph-image': ['./public/cosora-logo.png'],
  },
  images: {
    // Only Supabase Storage. Leaving this open to `**` turns the Next image
    // optimizer into a public image proxy for any origin.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vxdhhgdfubqedfpwfyrb.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  /**
   * The proxied origin sent HSTS and nothing else. These are the cheap,
   * low-risk ones: no CSP, because this app is proxied under a domain whose
   * other pages are a separate SPA and a policy set here would only cover
   * /blogs, giving a false sense of coverage.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default nextConfig;
