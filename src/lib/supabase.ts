import { createClient } from '@supabase/supabase-js';

/**
 * Read-only Supabase client.
 *
 * Anon key only — this app never writes. RLS on blog_posts exposes published,
 * past-dated rows and nothing else, and the anon role has had INSERT/UPDATE/DELETE
 * revoked on both blog tables. There is deliberately no service-role key here.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env.local and fill them in.',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
