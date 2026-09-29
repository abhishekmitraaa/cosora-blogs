-- Applied to the shared Cosora project (vxdhhgdfubqedfpwfyrb) on 2026-09-29.
-- Additive only: no existing table, policy or function is touched.

create table if not exists public.blog_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  excerpt         text,
  body            text,
  hero_image      text,
  hero_image_alt  text,
  author          text,
  category_id     uuid references public.blog_categories(id) on delete set null,
  is_featured     boolean not null default false,
  sort_order      int     not null default 0,
  status          text    not null default 'draft'
                  check (status in ('draft','published','scheduled')),
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  og_image        text,
  read_time       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.blog_posts is
  'Public SEO blog served by the cosora-blogs Next.js app at www.cosora.in/blogs. body is Markdown (CommonMark + GFM tables), rendered to HTML server-side at build/ISR time. Read-only to all client roles; writes land via Cosora-Admin through the service role in a later phase.';
comment on column public.blog_posts.body is 'Markdown (CommonMark + GFM tables). Never raw HTML.';
comment on column public.blog_posts.hero_image_alt is 'Descriptive alt text for hero_image. Required for SEO/a11y; falls back to title when null.';

create index if not exists blog_posts_live_idx
  on public.blog_posts (published_at desc) where status = 'published';
create index if not exists blog_posts_category_idx on public.blog_posts (category_id);
create index if not exists blog_posts_featured_idx
  on public.blog_posts (is_featured, sort_order, published_at desc);

create or replace function public.touch_blog_posts_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at before update on public.blog_posts
for each row execute function public.touch_blog_posts_updated_at();

alter table public.blog_categories enable row level security;
alter table public.blog_posts      enable row level security;

drop policy if exists blog_categories_select_public on public.blog_categories;
create policy blog_categories_select_public on public.blog_categories
  for select to anon, authenticated using (true);

drop policy if exists blog_posts_select_published on public.blog_posts;
create policy blog_posts_select_published on public.blog_posts
  for select to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now());

grant select on public.blog_categories to anon, authenticated;
grant select on public.blog_posts      to anon, authenticated;

insert into public.blog_categories (name, slug)
values ('Community','community'), ('Company','company')
on conflict (slug) do nothing;
