-- Defence in depth: RLS already denies these (no INSERT/UPDATE/DELETE policy exists),
-- but Supabase default privileges hand anon/authenticated the raw grant. Remove it so
-- the read-only guarantee does not rest on nobody ever adding a permissive write policy.
revoke insert, update, delete, truncate, references, trigger
  on public.blog_posts      from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.blog_categories from anon, authenticated;
