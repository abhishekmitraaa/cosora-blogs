import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { BASE_PATH, PUBLIC_BASE_URL } from '@/lib/site';

/**
 * ISR revalidation hook, called by a Supabase Database Webhook on
 * INSERT/UPDATE/DELETE of public.blog_posts.
 *
 * Purges the listing routes plus the affected article so a newly published (or
 * unpublished, or re-slugged) post appears without a redeploy. Both the old and new
 * slug are purged on UPDATE, otherwise a renamed post leaves a stale page behind.
 */
export const dynamic = 'force-dynamic';

type WebhookBody = {
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  record?: { slug?: string | null } | null;
  old_record?: { slug?: string | null } | null;
};

/** Constant-time-ish comparison so the secret is not probe-able by timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'REVALIDATE_SECRET is not configured' }, { status: 500 });
  }

  // Supabase webhooks send custom headers; accept either the header or ?secret=.
  const provided =
    request.headers.get('x-revalidate-secret') ??
    request.nextUrl.searchParams.get('secret') ??
    '';

  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: WebhookBody = {};
  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    // A body-less ping is a valid "purge everything" request.
  }

  const revalidated: string[] = [];
  const purge = (path: string, type?: 'page' | 'layout') => {
    // For a dynamic route the literal segment pattern plus 'page' purges every
    // generated variant, e.g. all /category/* pages in one call.
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
    revalidated.push(path);
  };

  // Listings always change when any post changes: ordering, counts, pagination.
  purge('/');
  purge('/page/[page]', 'page');
  purge('/category/[category]', 'page');
  purge('/category/[category]/page/[page]', 'page');

  const slugs = new Set(
    [body.record?.slug, body.old_record?.slug].filter(
      (s): s is string => typeof s === 'string' && s.length > 0,
    ),
  );
  for (const slug of slugs) purge(`/${slug}`);

  // Tell the IndexNow engines (Bing, Yandex, Naver, Seznam) directly. Google is
  // not an IndexNow consumer and is covered by the sitemap instead.
  //
  // Both slugs are submitted on a rename, so the dead URL gets recrawled to its
  // 404 rather than lingering in the index.
  const indexNow = await pingIndexNow([...slugs]);

  return NextResponse.json({
    revalidated: true,
    paths: revalidated,
    indexNow,
    now: new Date().toISOString(),
  });
}

/**
 * Submits changed URLs to IndexNow. Never throws: a search-engine ping must not
 * be able to fail an ISR purge, which is the part that actually keeps the site
 * correct.
 *
 * The key file is served from this app at /blogs/<key>.txt. A non-root
 * keyLocation authorises only URLs beneath its own directory, and every URL here
 * is under /blogs/, so that is both valid and self-contained.
 */
async function pingIndexNow(slugs: string[]): Promise<string> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return 'skipped: no INDEXNOW_KEY';
  if (!slugs.length) return 'skipped: no slugs';

  const host = new URL(PUBLIC_BASE_URL).host;
  const payload = {
    host,
    key,
    keyLocation: `${PUBLIC_BASE_URL}${BASE_PATH}/${key}.txt`,
    urlList: slugs.map((s) => `${PUBLIC_BASE_URL}${BASE_PATH}/${s}`),
  };

  try {
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return `${res.status}`;
  } catch (err) {
    return `failed: ${err instanceof Error ? err.message : 'unknown'}`;
  }
}

/** Health check so the webhook URL can be verified from a browser. */
export async function GET() {
  return NextResponse.json({ ok: true, hint: 'POST with x-revalidate-secret to revalidate' });
}
