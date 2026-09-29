Set up a new, standalone Next.js (App Router) project called cosora-blogs. This will be
reverse-proxied so it's publicly reachable at www.cosora.in/blogs — build it as a fully
independent SEO-first blog, not a fork or clone of any existing Cosora repo.

CONTEXT
- Cosora is a B2B fashion/textile sourcing marketplace (buyer app: textile-spark-net,
  admin: Cosora-Admin, both React + Supabase). This new repo shares the SAME Supabase
  project as those two — connect to it with the public anon key only, read-only.
- No login/signup anywhere on this site. Every route must be publicly crawlable.
- A design reference (Cosora Journal) is attached in this same folder/message — use it for
  visual language: colors, typography, header/hero treatment, card style. Match Cosora's
  brand, don't invent a new one.
- Canonical URL for everything this app serves: https://www.cosora.in/blogs/... — read
  this from a PUBLIC_BASE_URL env var, never from window.location or the Vercel deployment
  hostname. This app will itself be reachable at a throwaway *.vercel.app URL for previews;
  when a request's Host header is NOT www.cosora.in, render a noindex robots meta tag.

1. SUPABASE SCHEMA (apply as a migration; additive only, do not touch existing tables):
   - blog_categories: id uuid pk, name text, slug text unique (seed: Community, Company)
   - blog_posts: id uuid pk, title text, slug text unique, excerpt text, body text
     (rich text / markdown — pick one and document the choice), hero_image text,
     author text, category_id fk -> blog_categories, is_featured boolean default false,
     sort_order int default 0, status text check in ('draft','published','scheduled')
     default 'draft', published_at timestamptz, seo_title text, seo_description text,
     og_image text, read_time text, created_at/updated_at timestamptz default now()
   RLS: public SELECT where status = 'published' and published_at <= now(); no public
   insert/update/delete (admin will write via Cosora-Admin in a later phase, through the
   service role or an is_admin() RPC — do not build that write path in this repo).

2. ROUTES
   - /blogs — listing page: hero banner, category filter tabs (All / Community / Company),
     blog cards (thumbnail, category tag, author + date + read time, title, 2-line excerpt),
     tapping a card -> /blogs/[slug]. Paginate or infinite-scroll — your call, document it.
   - /blogs/[slug] — article page: back nav, full-width header image, category tag, author +
     date, title, social share icons (Facebook/LinkedIn/X), full article body, "More for you
     to read" related-posts section at the bottom.
   Both routes render fully-formed HTML server-side (SSG with ISR revalidation — do not
   client-side-render post content). Featured/headlined posts (is_featured) get visual
   priority on the listing page (e.g. a larger first card).

3. SEO — implement all of these, not a subset:
   - Per-page <title>, meta description, canonical link, from seo_title/seo_description
     when set, falling back to title/excerpt.
   - Open Graph + Twitter Card tags (og:title, og:description, og:image from og_image or
     hero_image, og:url built from PUBLIC_BASE_URL).
   - JSON-LD: BlogPosting schema on article pages (headline, image, author, datePublished,
     dateModified), BreadcrumbList on both routes.
   - Semantic HTML: one <h1> per page, proper heading hierarchy, descriptive image alt text
     pulled from a post field (add one if it doesn't exist yet).
   - Fast Core Web Vitals: no render-blocking JS for post content, optimized images
     (next/image), minimal client-side JS bundle overall.
   - No sitemap.xml or robots.txt in this repo — those live in textile-spark-net (separate
     prompt) and will query this same Supabase project directly.

4. Set up an ISR revalidation path (e.g. a revalidate API route triggered by a Supabase
   webhook on blog_posts insert/update) so a newly published post appears without a full
   redeploy.

5. Deploy this as its own Vercel project and give me the production URL when done — I'll
   wire the reverse proxy from textile-spark-net separately.

Confirm the actual current Supabase schema (existing tables/enums) yourself before writing
the migration, and tell me the exact migration SQL you're about to apply before running it.
