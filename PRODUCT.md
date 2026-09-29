# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences share every public Cosora surface, and the blog is read by both.

- **Buyers.** Fashion brands, retailers, boutiques and designers in India sourcing
  product at scale. They arrive with a requirement, not a product in mind, and
  need to find a manufacturer they can trust before committing a production run.
- **Vendors.** Manufacturers, mills, suppliers and service providers who want
  qualified leads instead of cold outreach.

The Journal (this repo) is read by both, plus a third group neither app serves:
people searching for sourcing information who have never heard of Cosora. The
About page is written for that third group first, because they are the ones who
need to decide whether Cosora is a real company.

## Product Purpose

Cosora is a B2B sourcing marketplace for India's fashion and textile supply
chain. It exists so a buyer can describe a requirement once and receive
comparable quotes from verified manufacturers, instead of running the same
conversation over WhatsApp with twenty vendors.

Success for the marketplace is a confirmed order. Success for the Journal is a
reader who arrived from search, understood the sourcing problem better, and
crossed into the marketplace as a buyer or a vendor.

## Positioning

The mechanism a neighbouring directory site cannot truthfully copy: a
requirement posted once is matched to verified manufacturers who respond with
price, MOQ and lead time in a comparable form, and the negotiation, order and
delivery all stay in one thread. Directories end at a phone number. Cosora
carries the transaction.

## Operating Context

The three-step flow the marketplace is built around, taken from the live landing
page and preserved verbatim in meaning:

1. **Post what you need.** A written requirement or a photo. A Quick RFQ takes
   under 30 seconds.
2. **Get matched quotes.** Verified manufacturers respond with pricing, MOQ and
   lead times that can be compared side by side.
3. **Order with confidence.** Negotiate in-app, lock terms, track the order
   through to delivery.

Cosora Studio is a real in-house service: product photography and video shoots
for brands selling on the platform.

## Capabilities and Constraints

- The Journal is a separate Next.js App Router application, mounted at
  `basePath: '/blogs'` and reverse-proxied so it is publicly reachable at
  `https://www.cosora.in/blogs`. It reads Supabase with the anon key only.
- **Every route on this site is public.** No login, no signup, no auth gate
  anywhere, and every page must be crawlable. This is a hard constraint, not a
  current state.
- Zero `'use client'` components. The whole site is server-rendered and static
  with ISR; the JavaScript bundle sits at Next's baseline and must stay there.
  Any interaction has to be expressible in CSS or plain HTML.
- Canonical URLs come from the `PUBLIC_BASE_URL` environment variable only,
  never from `window.location` and never from the Vercel deployment hostname.
- Outbound links into the marketplace must be real routes in
  `textile-spark-net`. Three previous links pointed at `/rfq/new`, `/sell` and
  `/contact`, none of which exist.

## Brand Commitments

- **Name and legal entity:** Cosora. Cosora Technologies Pvt Ltd.
- **Wordmark:** `public/cosora-logo.png`, the COSORA wordmark set in condensed
  extra-bold italic caps, in Cosora red. It is the only logo. There is no
  monogram, no icon lockup and no letter-in-a-circle mark.
- **Single accent:** Cosora red `#C8102E`, matched to the wordmark, with
  `#a60d24` for hover. The buyer app's pink `#ef4d62` is deliberately not used
  on this site: next to the deep red wordmark it read as two different brands.
- **Display face:** Barlow Condensed, extra-bold, italic, uppercase. It echoes
  the wordmark and is used at large sizes across the landing page and the
  Journal.
- **Contact:** hello@cosora.in
- **Social profiles**, confirmed by the user 2026-09-29. There is no X/Twitter
  presence; YouTube takes that slot.
  - https://www.linkedin.com/company/cosora1/
  - https://www.instagram.com/cosora.in/
  - https://www.facebook.com/profile.php?id=61577687235217
  - https://www.youtube.com/@Cosora_in

## Evidence on Hand

Approved public figures, confirmed by the user 2026-09-29 as the set that may
appear on an indexed page. These are already live on the cosora.in landing page.

| Figure | What it counts |
|---|---|
| ₹500Cr+ | sourced through Cosora |
| 50,000+ | products listed |
| 10,000+ | verified brands |
| 5,000+ | manufacturers |
| 28 | states covered |

Other confirmed facts: founded in 2024; the stated mission is to digitise
India's $120B fashion supply chain.

**Deliberately superseded.** The old About page in `textile-spark-net` carried
"10K+ Customers / 5K+ Suppliers / 2400+ Shoots Done". The user chose the landing
set over it. Do not reintroduce those three figures.

**Absent, and not to be invented:** founder names, customer names, testimonials,
press coverage, funding, headcount, office address, pricing, and any figure not
in the table above.

## Product Principles

1. **Public by default.** Nothing on this site may sit behind a login, and no
   surface may assume a session exists.
2. **Every claim is traceable.** Figures come from the approved table or they do
   not ship. This site is indexed, so an invented number is a published one.
3. **Both sides of the trade, equally.** Cosora is not a buyer tool with vendors
   attached. Public surfaces address buyers and vendors as peers.
4. **The Journal earns the marketplace.** Editorial quality is the acquisition
   channel, so a page that reads like an ad has failed at its actual job.
5. **Server-rendered or it does not ship.** An idea that needs client JavaScript
   needs a different idea.

## Accessibility & Inclusion

Body and placeholder text meets WCAG AA (4.5:1; 3:1 for large text). Every page
carries a skip link to `#main`, a single `<h1>`, visible focus rings drawn from
the brand palette, and full keyboard reachability. Motion respects
`prefers-reduced-motion`.
