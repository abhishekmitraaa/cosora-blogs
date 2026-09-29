import { supabase } from './supabase';
import { POSTS_PER_PAGE } from './site';
import type { Block } from './blocks';

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

/**
 * The byline behind a post: one of the named people, or Cosora itself. Rows live
 * in public.authors and are chosen per post in Cosora-Admin.
 *
 * Nothing here is written by this app. A person has no bio unless one is stored,
 * and the Journal must never pad one out: the byline is name and role.
 */
export type Author = {
  id: string;
  slug: string;
  name: string;
  entity_type: 'person' | 'organization';
  role: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  description: string | null;
};

/** Landing-page configuration, authored in Cosora-Admin. */
export type BlogSettings = {
  hero_enabled: boolean;
  hero_image: string | null;
  hero_image_alt: string | null;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_label: string | null;
  hero_cta_href: string | null;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  hero_image: string | null;
  hero_image_alt: string | null;
  author_id: string | null;
  /** Null only for a post saved without one; read it through postAuthor(). */
  author: Author | null;
  category_id: string | null;
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  read_time: string | null;
  thumbnail: string | null;
  thumbnail_alt: string | null;
  tags: string[] | null;
  canonical_url: string | null;
  noindex: boolean;
  blocks: Block[] | null;
  created_at: string;
  updated_at: string;
  category: Category | null;
};

/**
 * Columns for list views. `body` is deliberately excluded — a listing page that
 * selects every article body pulls the whole blog over the wire to render excerpts.
 */
const AUTHOR_COLS =
  'id,slug,name,entity_type,role,linkedin_url,website_url,avatar_url,logo_url,description';

const LIST_COLS =
  'id,title,slug,excerpt,hero_image,hero_image_alt,thumbnail,thumbnail_alt,author_id,' +
  'category_id,is_featured,sort_order,published_at,read_time,tags,noindex,' +
  'created_at,updated_at,' +
  'category:blog_categories(id,name,slug,description,seo_title,seo_description),' +
  `author:authors(${AUTHOR_COLS})`;

const FULL_COLS = `${LIST_COLS},body,blocks,seo_title,seo_description,og_image,canonical_url`;

/**
 * Supabase types an embedded one-to-one join as an array. Collapse it.
 */
function one<T>(raw: unknown): T | null {
  return ((Array.isArray(raw) ? raw[0] : raw) as T | null | undefined) ?? null;
}

function normalize(row: Record<string, unknown>): Post {
  return {
    ...(row as object),
    category: one<Category>(row.category),
    author: one<Author>(row.author),
  } as Post;
}

/**
 * Mirrors the RLS policy exactly so ordering and pagination are computed on the
 * same predicate the database enforces.
 *
 * 'scheduled' is included on purpose: a scheduled post becomes live the moment
 * its published_at passes, with no job to flip a flag. Filtering on
 * status = 'published' alone would hide those rows even though the policy
 * exposes them.
 */
const LIVE_STATUSES = ['published', 'scheduled'];

function liveQuery(cols: string) {
  return supabase
    .from('blog_posts')
    .select(cols, { count: 'exact' })
    .in('status', LIVE_STATUSES)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString());
}

const CATEGORY_COLS = 'id,name,slug,description,seo_title,seo_description';

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('blog_categories')
    .select(CATEGORY_COLS)
    .order('sort_order')
    .order('name');
  if (error) throw new Error(`getCategories: ${error.message}`);
  return (data ?? []) as Category[];
}

/** Landing-page hero. Returns null when nothing is configured or enabled. */
export async function getBlogSettings(): Promise<BlogSettings | null> {
  const { data, error } = await supabase
    .from('blog_settings')
    .select(
      'hero_enabled,hero_image,hero_image_alt,hero_eyebrow,hero_title,hero_subtitle,' +
        'hero_cta_label,hero_cta_href',
    )
    .maybeSingle();
  if (error) throw new Error(`getBlogSettings: ${error.message}`);
  const row = data as BlogSettings | null;
  return row?.hero_enabled ? row : null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('blog_categories')
    .select(CATEGORY_COLS)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`getCategoryBySlug(${slug}): ${error.message}`);
  return (data as Category) ?? null;
}

/** The single headlined post, or null. Featured posts get visual priority on the listing. */
export async function getFeaturedPost(categoryId?: string): Promise<Post | null> {
  let q = liveQuery(LIST_COLS).eq('is_featured', true);
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, error } = await q
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false })
    .limit(1);
  if (error) throw new Error(`getFeaturedPost: ${error.message}`);
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  return rows.length ? normalize(rows[0]) : null;
}

export type PageResult = { posts: Post[]; total: number; totalPages: number };

/** Row count only, used to resolve an out-of-range page request. */
async function countPosts(categoryId?: string, excludeId?: string): Promise<number> {
  let q = supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .in('status', LIVE_STATUSES)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString());
  if (categoryId) q = q.eq('category_id', categoryId);
  if (excludeId) q = q.neq('id', excludeId);
  const { count, error } = await q;
  if (error) throw new Error(`countPosts: ${error.message}`);
  return count ?? 0;
}

/**
 * One page of the listing. `excludeId` keeps the featured post from appearing twice
 * on page 1 while leaving page 2+ numbering correct (the offset is shifted, not the
 * result set filtered after the fact).
 */
export async function getPosts(opts: {
  page: number;
  categoryId?: string;
  excludeId?: string;
}): Promise<PageResult> {
  const { page, categoryId, excludeId } = opts;
  let q = liveQuery(LIST_COLS);
  if (categoryId) q = q.eq('category_id', categoryId);
  if (excludeId) q = q.neq('id', excludeId);

  const from = (page - 1) * POSTS_PER_PAGE;
  const { data, error, count } = await q
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false })
    .range(from, from + POSTS_PER_PAGE - 1);

  if (error) {
    // PostgREST answers 416 / PGRST103 when the offset is past the end of the
    // result set. That is an out-of-range page, not a failure: report an empty
    // page with the real total so the route can render a 404 rather than a 500.
    if (error.code === 'PGRST103') {
      const total = await countPosts(categoryId, excludeId);
      return {
        posts: [],
        total,
        totalPages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
      };
    }
    throw new Error(`getPosts: ${error.message}`);
  }

  const total = count ?? 0;
  return {
    posts: ((data ?? []) as unknown as Record<string, unknown>[]).map(normalize),
    total,
    totalPages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
  };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await liveQuery(FULL_COLS).eq('slug', slug).limit(1);
  if (error) throw new Error(`getPostBySlug(${slug}): ${error.message}`);
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  return rows.length ? normalize(rows[0]) : null;
}

/** Every live slug, for generateStaticParams. */
export async function getAllSlugs(): Promise<string[]> {
  const { data, error } = await liveQuery('slug');
  if (error) throw new Error(`getAllSlugs: ${error.message}`);
  return ((data ?? []) as unknown as { slug: string }[]).map((r) => r.slug);
}

/** "More for you to read": same category first, topped up with the newest posts. */
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const collected: Post[] = [];
  const seen = new Set<string>([post.id]);

  if (post.category_id) {
    const { data, error } = await liveQuery(LIST_COLS)
      .eq('category_id', post.category_id)
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`getRelatedPosts: ${error.message}`);
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      const p = normalize(row);
      collected.push(p);
      seen.add(p.id);
    }
  }

  if (collected.length < limit) {
    const { data, error } = await liveQuery(LIST_COLS)
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(limit + seen.size);
    if (error) throw new Error(`getRelatedPosts(fallback): ${error.message}`);
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      if (collected.length >= limit) break;
      const p = normalize(row);
      if (seen.has(p.id)) continue;
      collected.push(p);
      seen.add(p.id);
    }
  }

  return collected.slice(0, limit);
}

// ── Authors ─────────────────────────────────────────────────────────────────

/**
 * The organisation row. A post with no author_id is read as Cosora's, which is
 * what the old free-text "Cosora Team" byline meant.
 */
export const DEFAULT_AUTHOR_SLUG = 'cosora';

export async function getAuthors(): Promise<Author[]> {
  const { data, error } = await supabase.from('authors').select(AUTHOR_COLS).order('name');
  if (error) throw new Error(`getAuthors: ${error.message}`);
  return (data ?? []) as Author[];
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const { data, error } = await supabase
    .from('authors')
    .select(AUTHOR_COLS)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`getAuthorBySlug(${slug}): ${error.message}`);
  return (data as Author) ?? null;
}

/** The post's author, falling back to Cosora for a post saved without one. */
export async function postAuthor(post: Post): Promise<Author | null> {
  return post.author ?? getAuthorBySlug(DEFAULT_AUTHOR_SLUG);
}

/**
 * Every live post by one author, newest first. Unpaginated: at the Journal's
 * pace this stays one screen for years, and the cap keeps a runaway count from
 * turning into one enormous page. Posts with no author_id count as Cosora's,
 * matching postAuthor().
 */
export async function getPostsByAuthor(author: Author, limit = 60): Promise<Post[]> {
  let q = liveQuery(LIST_COLS);
  q =
    author.slug === DEFAULT_AUTHOR_SLUG
      ? q.or(`author_id.eq.${author.id},author_id.is.null`)
      : q.eq('author_id', author.id);
  const { data, error } = await q.order('published_at', { ascending: false }).limit(limit);
  if (error) throw new Error(`getPostsByAuthor(${author.slug}): ${error.message}`);
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(normalize);
}
