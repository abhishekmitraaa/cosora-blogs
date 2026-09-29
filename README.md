# cosora-blogs

The public Cosora Journal. A standalone Next.js (App Router) app, reverse-proxied so it
is publicly reachable at **https://www.cosora.in/blogs**.

It is not a fork of `textile-spark-net` or `Cosora-Admin`. It shares their Supabase
project and nothing else: no login, no signup, no write path, no session. Every route is
publicly crawlable.

---

## Decisions

These were left to my judgement by the brief; here is what was chosen and why.

### `blog_posts.body` is Markdown

CommonMark plus GFM tables. Not rich text, not HTML.

The Markdown → HTML conversion happens **on the server at build/ISR time**
(`src/lib/markdown.ts`), so no Markdown parser reaches the browser and the client is
handed finished HTML. The pipeline is
`remark-parse → remark-gfm → remark-rehype → rehype-slug → rehype-sanitize → rehype-stringify`.

Sanitization runs even though authoring is admin-only: an XSS in a post body would
execute on the `cosora.in` origin, against real buyer sessions. `rehype-slug` gives every
heading an id, which is what the article table of contents links to.

### Pagination, not infinite scroll

Numbered pages over real routes:

| Route | Page |
| --- | --- |
| `/blogs` | all posts, page 1 |
| `/blogs/page/2` | all posts, page 2 |
| `/blogs/category/community` | one category, page 1 |
| `/blogs/category/community/page/2` | one category, page 2 |

9 posts per page (`POSTS_PER_PAGE` in `src/lib/site.ts`).

Infinite scroll needs client JavaScript and hides posts from crawlers that do not scroll.
Route segments instead of `?page=2` query params keep every variant statically
generable, individually cacheable, and each with its own canonical. The category filter
tabs are plain links for the same reason — there is no client-side filter state anywhere.

### The featured post

`is_featured` posts get the hero slot on page 1 in a split layout roughly twice the
visual weight of a grid card. The featured post is excluded from the grid on *every*
page, so pagination counts stay consistent rather than shifting by one between page 1
and page 2.

---

## SEO

- **Per-page title / description / canonical.** `seo_title` and `seo_description` when
  set, falling back to `title` and `excerpt`, then to the first 160 characters of the
  body with Markdown stripped.
- **Canonical is always built from `PUBLIC_BASE_URL`** — never from `window.location`,
  never from `VERCEL_URL`, never from the request host. A preview deployment that
  canonicalises to itself is how preview URLs end up in the index.
- **Open Graph + Twitter Card** on every page. `og:image` comes from `og_image`, falling
  back to `hero_image`, resolved to an absolute URL (social crawlers reject relative ones).
- **JSON-LD**: `BlogPosting` on articles (headline, image, author, datePublished,
  dateModified), `BreadcrumbList` on both routes.
- **Semantic HTML**: exactly one `<h1>` per page, `<h2>`/`<h3>` in order beneath it, a
  skip link, and image alt text from `hero_image_alt` falling back to the post title.
- **Core Web Vitals**: every page is static HTML with ISR. No client components exist in
  this app, so the only JavaScript is the Next runtime (~103 kB shared). Fonts are
  self-hosted through `next/font` so there is no render-blocking request to Google Fonts.
  Images go through `next/image` with AVIF/WebP.

### `noindex` on non-canonical hosts — implemented as a header

The brief asked for a `noindex` **meta tag** when the request Host is not
`www.cosora.in`. It is implemented in `src/middleware.ts` as an
`X-Robots-Tag: noindex, nofollow` **response header** instead.

Reading the Host header inside a page or `generateMetadata` opts that route into dynamic
rendering, which would throw away the ISR caching the brief also asks for — the two
requirements are in direct conflict. The header is the documented equivalent: Google,
Bing and the other majors treat `X-Robots-Tag: noindex` and `<meta name="robots">`
identically, and the header additionally covers non-HTML responses. Every page stays
static.

The middleware reads `x-forwarded-host` first (what the reverse proxy sets) and falls
back to `host`, so a request proxied through `www.cosora.in` is indexable while a direct
hit on the `.vercel.app` hostname is not.

### No `sitemap.xml` or `robots.txt` here

By design — those live in `textile-spark-net` and query this same Supabase project
directly.

---

## Supabase

Shared project `vxdhhgdfubqedfpwfyrb`. **Anon key only, read-only.** There is deliberately
no service-role key in this repo and no write path of any kind.

Two migrations in `supabase/migrations/`, both already applied:

- `blog_categories` (seeded with Community and Company) and `blog_posts`.
- RLS: public `SELECT` where `status = 'published' and published_at <= now()`. No public
  insert/update/delete — the `anon` and `authenticated` roles have those privileges
  explicitly **revoked** as well as having no policy, so the guarantee does not depend on
  nobody ever adding a permissive policy later.

Verified against the live API: drafts, `scheduled` posts and future-dated `published`
posts are all invisible to the anon key, and INSERT/UPDATE/DELETE all return 401.

Admin writes land through `Cosora-Admin` via the service role in a later phase. That path
is intentionally not built here.

### One schema addition

`hero_image_alt text` was added to `blog_posts`. The brief's SEO section asks for
"descriptive image alt text pulled from a post field (add one if it doesn't exist yet)" —
this is that field. It also doubles as the hero image caption on article pages.

---

## ISR revalidation

Pages revalidate on a 1-hour timer, and immediately on a Supabase webhook.

`POST /blogs/api/revalidate` with the shared secret in an `x-revalidate-secret` header
(or `?secret=`) purges the listing routes plus the affected article. On UPDATE it purges
both the old and the new slug, so renaming a post does not leave a stale page behind.

Wire it in the Supabase dashboard → Database → Webhooks:

| Field | Value |
| --- | --- |
| Table | `public.blog_posts` |
| Events | Insert, Update, Delete |
| Type | HTTP Request → POST |
| URL | `https://www.cosora.in/blogs/api/revalidate` |
| HTTP header | `x-revalidate-secret: <REVALIDATE_SECRET>` |

---

## Environment

| Variable | Purpose |
| --- | --- |
| `PUBLIC_BASE_URL` | Canonical origin, e.g. `https://www.cosora.in`. Everything canonical is built from this. |
| `NEXT_PUBLIC_SUPABASE_URL` | Shared Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key. Read-only by RLS and by grant. |
| `REVALIDATE_SECRET` | Shared secret for the revalidate webhook. |

Copy `.env.example` to `.env.local` to run locally.

---

## Reverse proxy

`basePath` is `/blogs` (`next.config.mjs`), so every route **and every static asset** is
served under `/blogs`. The proxy in `textile-spark-net` can forward `/blogs/*` verbatim
with no URL rewriting.

One consequence worth knowing: a post whose slug is `category`, `page` or `api` would be
shadowed by those static route segments. Such slugs are skipped at build time
(`RESERVED` in `src/app/[slug]/page.tsx`) rather than silently resolving to a listing.

---

## Commands

```bash
npm install
npm run dev        # http://localhost:3000/blogs
npm run build
npm start
npm run typecheck
```
