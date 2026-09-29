# Migrations

**This folder is one of three.** `cosora-blogs`, `textile-spark-net` and
`Cosora-Admin` each hold a `supabase/migrations/` directory, and all three apply
to the same Supabase project (`vxdhhgdfubqedfpwfyrb`).

This repo owns only the two migrations that created the Journal's tables:

- `20260929014507_create_blog_tables.sql`
- `20260929014529_blog_tables_revoke_client_writes.sql`

Both are named by the version Supabase recorded when they were applied, and
match the live statements (comment-insensitive md5).

**Nothing new goes here.** Blog schema changes (the CMS, triggers, read time,
reserved slugs) live in `textile-spark-net/supabase/migrations/`, the canonical
home, and they depend on the tables created here.

The full procedure, the ownership table and the ledger are in one place; do not
duplicate them here:

→ `textile-spark-net/MIGRATIONS.md`
