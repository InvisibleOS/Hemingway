# Hemingway: internal PR operations platform for Strategi

## What this is
An internal web app our team uses to run PR and media outreach for clients.
Clients never access it. Read /docs/fsd.md before any task. Always read the
relevant /docs files before writing code.

## Stack (non-negotiable)
- Next.js 15, App Router, TypeScript strict mode
- Supabase (Postgres + pgvector) via @supabase/ssr
- Tailwind CSS + shadcn/ui, customized per /docs/ui-style.md
- Zod for all external data validation
- No other UI libraries without asking

## The provider rule (most important rule in this file)
Every external service is accessed ONLY through an interface defined in
/lib/providers/. Each interface has two implementations:
  1. mock: returns realistic fake data, instantly, deterministic where possible
  2. real: actual API integration (some are shells with documented TODOs for now)
Selection happens via env variable per provider (e.g. VERIFIER_PROVIDER=mock).
No file outside /lib/providers/ may import an SDK, call fetch to an external
API, or know which mode is active. See /docs/providers.md for the full list.
Violating this rule is the one thing that breaks the entire project plan.

## Modes
- Live in MVP: Supabase, Anthropic API, Firecrawl, DataForSEO
- Mocked in MVP: email verification, sending platform, expert-request feeds,
  domain health. Mocked features must look fully real in the UI, with a small
  "Sandbox" badge component (see ui-style.md).

## Conventions
- No em dashes anywhere: not in UI copy, not in comments, not in seed data
- Use "Bengaluru" never "Bangalore" in any copy or seed data
- UI copy is terse and professional, no exclamation marks, no emoji
- Server components by default, client components only when interactive
- All database access through /lib/db/ query functions, no inline queries in components
- Every list view needs: loading skeleton, empty state, error state
- Commit after each working feature, conventional commits (feat:, fix:, chore:)
- Never commit API keys. .env.example lists every variable with a comment.

## Testing the demo
`npm run seed:demo` must always leave the app in a state where the full demo
path works: two clients, populated media database, one campaign mid-flight,
monitor events waiting, and a reporting view with charts.
