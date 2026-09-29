import { supabase } from './supabase';
import { POSTS_PER_PAGE } from './site';

export type Category = { id: string; name: string; slug: string };

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  hero_image: string | null;
  hero_image_alt: string | null;
  author: string | null;
  category_id: string | null;
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  read_time: string | null;
  created_at: string;
  updated_at: string;
  category: Category | null;
};

/**
 * Columns for list views. `body` is deliberately excluded — a listing page that
 * selects every article body pulls the whole blog over the wire to render excerpts.
 */
const LIST_COLS =
  'id,title,slug,excerpt,hero_image,hero_image_alt,author,category_id,is_featured,sort_order,' +
  'published_at,read_time,created_at,updated_at,category:blog_categories(id,name,slug)';

const FULL_COLS = `${LIST_COLS},body,seo_title,seo_description,og_image`;

/**
 * Supabase types an embedded one-to-one join as an array. Collapse it.
 */
function normalize(row: Record<string, unknown>): Post {
  const raw = row.category;
  const category = (Array.isArray(raw) ? raw[0] : raw) as Category | null | undefined;
  return { ...(row as object), category: category ?? null } as Post;
}

/**
 * The RLS policy already restricts reads to published, past-dated rows, so these
 * filters are redundant at the database level. They are here so the intent is
 * readable in the query and so ordering/pagination is computed on the same
 * predicate the policy enforces.
 */
function liveQuery(cols: string) {
  return supabase
    .from('blog_posts')
    .select(cols, { count: 'exact' })
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString());
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('id,name,slug')
    .order('name');
  if (error) throw new Error(`getCategories: ${error.message}`);
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('id,name,slug')
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
    .eq('status', 'published')
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
