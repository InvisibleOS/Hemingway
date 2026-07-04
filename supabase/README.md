# Hemingway database

SQL migrations for the Hemingway data model (see `docs/data-model.md`). This
pass is schema only: no application scaffold and no `/lib/db` query layer yet.

## Migrations

Ordered, each applied once:

| File | Contents |
|---|---|
| `..._extensions.sql` | pgvector |
| `..._enums.sql` | column enums (vertical, tiers, statuses, sources) |
| `..._functions.sql` | `set_updated_at()` trigger function |
| `..._tables.sql` | 9 tables, foreign keys, `updated_at` triggers |
| `..._indexes.sql` | FK/filter indexes, HNSW cosine indexes |
| `..._rls.sql` | RLS enabled, single-org authenticated policy per table |
| `..._match_journalists.sql` | pgvector matching RPC |

## Applying

With the Supabase CLI (recommended once the project is initialized):

    supabase db push

Against any Postgres 15+ with pgvector available, in filename order:

    for f in supabase/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done

## Embedding dimension

Vector columns are `vector(1024)`, matching the `llm` provider `embed` output
(Voyage voyage-3.5 / voyage-3-large, Anthropic's recommended embedding model).
To switch embedding models, change the dimension in **both** `..._tables.sql`
and `..._match_journalists.sql`, then re-embed every row.

## RLS model

Internal single-org tool: `authenticated` (our team) has full access, `anon`
has none, and the server `service_role` key bypasses RLS for seeds and
background jobs. No per-tenant isolation is encoded because there is one org.

## Matching RPC

`match_journalists(query_embedding, match_count, filter_vertical, min_score,
profile_weight)` returns ranked journalists by cosine similarity, blending the
profile embedding with each journalist's best recent article embedding. The
`/lib/matching` layer decides between this embedding path and a keyword
fallback; this RPC is only the embedding path.
