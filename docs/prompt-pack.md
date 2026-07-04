# Hemingway Prompt Pack
Everything below goes into the repo before the first Claude Code session. Part A is the files to create. Part B is the exact prompt to paste for each session. Copy verbatim, adjust names only where marked.

---

# PART A: REPO FILES (create these first, by hand or in one setup session)

---

## FILE 1: CLAUDE.md (repo root)

```markdown
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
```

---

## FILE 2: /docs/fsd.md

Paste the FSD we already wrote (hemingway-fsd.md) here unchanged.

---

## FILE 3: /docs/data-model.md

```markdown
# Data model

All tables have id (uuid), created_at, updated_at. RLS on from day one,
single-org policies (this is internal, but do not skip RLS).

## publications
name, website, vertical (enum: fnb, hospitality, real_estate, d2c, other),
tier (enum: national, regional, trade, blog), scrape_config (jsonb),
last_scraped_at

## journalists
publication_id FK, name, role, email, email_status (enum: unverified,
pattern_guess, verified, bounced), email_verified_at, beat_summary (text),
receptivity_notes (text, AI-generated), quotes_founders (bool),
uses_data_studies (bool), profile_embedding (vector), last_profiled_at

## articles
journalist_id FK, title, url, published_at, summary (text),
embedding (vector)

## clients
name, website, vertical, sending_domain, sending_domain_status (enum:
not_setup, warming, ready, degraded), knowledge_base (text, from onboarding),
active (bool)

## campaigns
client_id FK, name, story_angle (text), data_study_title, data_study_summary,
data_study_url, status (enum: draft, matching, pitching, active, closed)

## pitches
campaign_id FK, journalist_id FK, subject, body, status (enum: drafted,
edited, approved, pushed, replied, placed, declined, bounced),
match_score (float), approved_by (text), approved_at, pushed_at

## monitor_events
client_id FK, source (enum: expert_platform, brand_mention, journo_request),
title, url, summary, deadline_at, status (enum: new, drafted, responded,
won, ignored), draft_response (text)

## placements
client_id FK, campaign_id FK nullable, pitch_id FK nullable,
monitor_event_id FK nullable, publication_name, url, headline,
published_at, placement_type (enum: feature, quote, listicle, directory,
mention)

## metrics_snapshots
client_id FK, snapshot_date, backlinks_count, referring_domains,
ai_mentions_count, ai_mentions_breakdown (jsonb per engine), source (enum:
dataforseo, mock)

## Matching
Story angle text is embedded and compared against journalist
profile_embedding + recent article embeddings via pgvector cosine
similarity. MVP can fall back to a weighted keyword score if embeddings
are not ready; put the scoring behind /lib/matching/ so the
implementation can swap.
```

---

## FILE 4: /docs/ui-style.md

```markdown
# UI direction: modern, premium, operational

The feel: a serious internal tool a well-funded team uses daily.
Linear/Vercel-dashboard energy, not a marketing site, not default shadcn.

## Foundation
- Dark-neutral base: near-black/deep slate surfaces (#0B0E11 background,
  #14181D cards, #1E242B borders as a starting palette, tune as needed)
- One accent only: Strategi orange #C0531F. Used for primary actions,
  active nav, focus rings, key chart series. Never for large fills.
- Light mode not required for MVP.
- Typography: Geist or Inter for everything. A serif (Source Serif 4) is
  allowed ONLY for report headings in Module 4 exports.
- Spacing is generous. Dense tables, calm chrome.

## Components
- shadcn/ui, customized: kill the default zinc look. Rounded-lg max,
  subtle 1px borders over shadows, muted hover states.
- Status pills everywhere state exists (pitch status, email status, domain
  status, event status). Pill colors: muted backgrounds, readable text,
  accent reserved for "approved/won" states.
- Data tables: comfortable row height, sticky header, column sort,
  right-aligned numbers, tabular-nums.
- Skeleton loaders on every async view. No spinners as primary loading UI.
- Command palette (cmdk) on Cmd+K: jump to client, campaign, journalist.
- A small "Sandbox" badge component: subtle amber dot + label, shown on
  any UI backed by a mock provider. One shared component, used everywhere.

## Layout
- Left sidebar: logo, client switcher at top, nav (Dashboard, Media
  Database, Campaigns, Monitor, Reports, Settings), collapse to icons.
- Page pattern: title row with primary action right-aligned, filter bar,
  content. No breadcrumbs deeper than two levels.
- Detail views open as right-side drawers (journalist profile, pitch
  review), not new pages, to keep operators in flow.

## Banned
- Gradient blobs, glassmorphism, emoji in UI, exclamation marks in copy,
  default shadcn appearance with no customization, more than one accent
  color, dashboard "welcome" hero sections.

## Micro-details that make it feel expensive
- Keyboard flow in the pitch approval queue: j/k to move, e to edit,
  a to approve.
- Optimistic UI on approvals with undo toast.
- Numbers animate on the reporting view (count-up, subtle).
- Every timestamp is relative with absolute on hover.
```

---

## FILE 5: /docs/providers.md

```markdown
# Provider layer

Every row is an interface in /lib/providers/<name>/. Env var pattern:
<NAME>_PROVIDER=mock|real. Mock implementations ship complete. Real
implementations marked "shell" are typed, documented, and throw
NotImplementedError with the integration notes below.

| Provider | Interface | MVP mode | Real integration notes |
|---|---|---|---|
| scraper | mapSite, scrapeAuthorPage, scrapeArticle | real (Firecrawl) | Already subscribed. Use v2 endpoints. |
| llm | classifyJournalist, draftPitch, draftMonitorResponse, embed | real (Anthropic) | classify + embed on light tier, draftPitch on strongest tier. |
| seoData | getBacklinks, getAiMentions | real (DataForSEO) | Already subscribed. Snapshot into metrics_snapshots. |
| verifier | verifyEmail(email) -> status | mock | Real: any pay-as-you-go verifier (ZeroBounce/NeverBounce class). One POST per address, map result to email_status enum. |
| sender | pushPitch(pitch) -> externalId, getReplies() | mock | Real: Smartlead or Instantly API. Push approved pitches to a campaign, poll or webhook replies back to pitch status. |
| expertFeeds | fetchNewRequests(vertical) | mock | Real: Qwoted/Featured APIs or scheduled scrapes. Map into monitor_events. |
| domainHealth | getStatus(domain) | mock | Real: sending platform's domain/warmup status endpoint. |

## Mock behaviour requirements
- verifier: deterministic by email hash: ~85% verified, 10% pattern_guess,
  5% bounced. 300ms artificial delay.
- sender: pushPitch succeeds, sets status pushed, and a seeded background
  job flips ~20% of pushed pitches to replied over time in demo data.
- expertFeeds: seed generates 3 to 5 plausible new events per client per
  day with believable outlet names and deadlines.
- domainHealth: returns ready for demo clients.

## The pitch to leadership
This file is the purchase checklist. Each mock row = one API key + one
provider file to go live. Nothing else in the app changes.
```

---

# PART B: SESSION PROMPTS

Rules of use: one session per prompt. Start every session in plan mode
(shift+tab in Claude Code) and approve the plan before it writes code.
Commit at the end, then /clear before the next session.

---

## SESSION 1: Scaffold + design system + provider layer

```
Read CLAUDE.md and everything in /docs before doing anything.

Task: scaffold the entire project foundation. No feature modules yet.

1. Initialize Next.js 15 (App Router, TypeScript strict), Tailwind,
   shadcn/ui. Set up the customized theme per /docs/ui-style.md: color
   tokens, typography, the base component overrides.
2. Set up Supabase: full schema from /docs/data-model.md as SQL
   migrations, pgvector enabled, RLS single-org policies, typed client
   in /lib/db/ with query functions for each table.
3. Build the complete provider layer per /docs/providers.md: all seven
   interfaces, all mock implementations meeting the mock behaviour
   requirements, real implementations for scraper/llm/seoData wired to
   env keys, shells with NotImplementedError + integration notes for the
   rest. Env-var switching. .env.example fully documented.
4. Build the app shell: sidebar per ui-style.md layout section, client
   switcher (reads clients table), all nav routes as placeholder pages
   with correct titles, command palette with client/route jumping, the
   Sandbox badge component, status pill component, data table component,
   skeleton/empty/error state components.
5. Write the first version of scripts/seed-demo.ts: two clients (one F&B,
   one hospitality, Bengaluru-based, invented names), 5 publications,
   50 journalists with realistic Indian media names/beats/emails across
   verticals, 200 articles, one campaign in draft. Deterministic faker
   seed so reseeding is stable.

Definition of done: app runs, shell navigates, client switcher works,
Cmd+K works, seed script populates, every provider resolves in mock or
real mode per env, typecheck and lint pass. Commit in logical chunks.
```

After this session: review the shell visually. Fix anything you dislike
NOW, in this same session, before any module inherits it.

---

## SESSION 2: Module 1, Media Database

```
Read CLAUDE.md, /docs/fsd.md section on Module 1, /docs/data-model.md,
/docs/ui-style.md. The shell, schema, providers and seed exist.

Task: build the Media Database module end to end.

1. /media route: publications view and journalists view (tabbed or
   segmented). Journalists table: name, publication, beat summary,
   email status pill, receptivity flags (quotes founders, uses data
   studies), last profiled. Filters: vertical, publication, email
   status. Sort, search, pagination.
2. Journalist detail drawer: full profile, receptivity notes, recent
   articles list with links, email with verification status and a
   "Verify" action that calls the verifier provider and updates status
   (mock mode shows Sandbox badge).
3. Ingestion pipeline: an "Add publication" flow that takes a URL +
   vertical, then runs: scraper provider maps the site and pulls author
   pages and recent articles, llm provider classifies each journalist
   (beat_summary, receptivity_notes, flags) and embeds profiles and
   articles, verifier provider checks pattern-guessed emails. Run as a
   background job with visible progress state on the publication row.
   Handle partial failures gracefully: a journalist without an email is
   stored as unverified, never dropped.
4. A "Refresh profiles" action per publication re-running the pipeline.
5. Extend seed so the media database screens look rich immediately.

Definition of done: I can add one real publication URL and watch it
ingest live via Firecrawl + Claude, and the seeded 50 journalists browse
beautifully. All states (loading/empty/error) present. Commit.
```

---

## SESSION 3: Module 2, Campaign Workspace

```
Read CLAUDE.md, /docs/fsd.md section on Module 2, /docs/data-model.md,
/docs/ui-style.md. Media database exists.

Task: build the Campaign Workspace end to end.

1. /campaigns route per client: campaign list with status pills, create
   campaign flow: name, story angle (long text), data study fields.
2. Matching view inside a campaign: "Find journalists" runs the matching
   engine (/lib/matching/): embed the story angle via llm provider,
   cosine-match against journalist profile + article embeddings,
   return ranked list with match_score and a one-line "why matched"
   rationale. Operator selects the 15 to 25 to pitch.
3. Pitch drafting: "Draft pitches" calls llm provider draftPitch per
   selected journalist with the story, data study, and journalist
   profile as context. Hard rules in the prompt: under 120 words,
   data point in the first line, subject reads like a headline the
   journalist would write, no em dashes, one clear exclusive-first
   offer, professional sign-off placeholder.
4. Approval queue: the centerpiece. List of drafted pitches, keyboard
   flow per ui-style.md (j/k/e/a), inline editing of subject and body,
   approve sets approved_by/approved_at, "Push approved" calls sender
   provider (mock: Sandbox badge, status becomes pushed). Optimistic
   UI with undo toast.
5. Campaign board view: pitches by status column (drafted, approved,
   pushed, replied, placed) with counts.
6. Extend seed: the existing campaign now has drafted + approved +
   pushed + 2 replied pitches so the board looks alive.

Definition of done: full flow works live: create campaign, match against
seeded journalists, draft real pitches via Claude, edit, approve with
keyboard, push (mock). Commit.
```

---

## SESSION 4: Module 3, Monitor Feed

```
Read CLAUDE.md, /docs/fsd.md section on Module 3, /docs/data-model.md,
/docs/ui-style.md.

Task: build the Monitor Feed end to end.

1. /monitor route per client: daily digest of monitor_events, newest
   first, grouped by day. Each event card: source pill, title, outlet,
   summary, deadline countdown (urgent styling under 24h), status pill.
2. Event actions: "Draft response" calls llm provider
   draftMonitorResponse with the event + the client's knowledge_base
   field as voice/context source. Draft opens in a drawer for editing.
   "Mark responded", "Mark won" (won prompts for placement URL and
   creates a placements row), "Ignore".
3. Feed ingestion: a scheduled job shape (cron route) that calls
   expertFeeds provider per client vertical and inserts new
   monitor_events. In mock mode this generates the seeded plausible
   events. Sandbox badge on the feed header while mocked.
4. Brand mention events render the same way with source=brand_mention.
5. Dashboard (home) route now gets its first real content: today's
   monitor events needing action + pitches awaiting approval across
   clients, as two compact queues.

Definition of done: digest renders rich seeded events, drafting a
response via Claude works live, won events create placements, dashboard
shows the two queues. Commit.
```

---

## SESSION 5: Module 4, Reporting

```
Read CLAUDE.md, /docs/fsd.md section on Module 4, /docs/data-model.md,
/docs/ui-style.md.

Task: build Reporting end to end.

1. /reports route per client: month selector, then the report view:
   - Coverage log: placements table (outlet, headline link, type pill,
     date, origin: pitch or monitor event)
   - Links: backlinks_count and referring_domains trend from
     metrics_snapshots, chart
   - AI visibility: ai_mentions_count trend + per-engine breakdown
     chart. This is the hero metric: give it the most visual weight,
     count-up animation, delta vs previous month prominently.
2. Snapshot job: cron route calling seoData provider per client and
   inserting metrics_snapshots. Wire the REAL DataForSEO calls for
   backlinks and AI mentions behind the provider; if env keys are
   absent fall back to mock and badge it.
3. Export: a clean print-stylesheet report view (serif headings allowed
   here per ui-style.md) that renders the month's report as a
   client-ready document via browser print to PDF. Strategi orange
   accents, no dashboard chrome.
4. Seed: 6 months of believable metrics_snapshots per client showing an
   upward AI mentions trend after campaign start, plus 8 to 10
   placements spread across months and types.

Definition of done: report view is the most impressive screen in the
app, export produces a document I would send a client, real DataForSEO
mode works when keys are present. Commit.
```

---

## SESSION 6: Demo polish

```
Read CLAUDE.md and /docs/ui-style.md. All four modules exist.

Task: make the three-minute demo flawless. No new features.

1. Audit every route for the ui-style.md standards: skeletons, empty
   states, error states, pill consistency, spacing, tabular-nums,
   relative timestamps with hover. Fix all gaps.
2. Perfect scripts/seed-demo.ts: after one run the app tells this
   story: client A has a rich media database, a campaign with pitches
   in every status, monitor events including one due today, and a
   reporting view with a clear AI-mentions uplift. Client B is
   earlier-stage to show the contrast.
3. Sandbox badges: verify every mocked surface has exactly one subtle
   badge, no more.
4. Add /settings/integrations: a read-only screen listing every
   provider from /docs/providers.md with its mode (Live / Sandbox), a
   one-line description, and for sandbox items the note "Activates
   with API key". This screen is shown to leadership as the purchase
   checklist.
5. Write DEMO.md: the exact three-minute click path, and a fresh-clone
   setup section (env, migrate, seed, run).
6. Full pass: typecheck, lint, build, seed on a clean database, walk
   DEMO.md start to finish, fix anything that stumbles.

Definition of done: fresh clone to running demo in under five minutes
following DEMO.md, and the demo path has zero rough edges. Commit.
```

---

# USAGE NOTES

- If a session's plan looks wrong, fix the plan, not the output. Cheaper.
- If a session runs long or drifts, stop it, commit what works, /clear,
  and re-run the same prompt with "The following already exists: ..."
  prepended.
- Between sessions, click through what was built. Feedback goes at the
  top of the next prompt as "Fixes from review:" with a short list.
- Keep real API keys in .env.local only. The demo runs fine with just
  Supabase + Anthropic + Firecrawl + DataForSEO keys; everything else
  is mock by design.