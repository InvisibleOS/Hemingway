# Hemingway

Internal PR and earned-media operations platform for Strategi. Our team runs
client media outreach through it end to end. Clients never log in; they receive
placements and a monthly report.

Built on Next.js 15 (App Router, TypeScript strict), Supabase (Postgres +
pgvector), Tailwind + shadcn/ui, Zod, and the Anthropic API. See
[CLAUDE.md](CLAUDE.md) for the non-negotiable stack and conventions, and
[docs/fsd.md](docs/fsd.md) for the full functional spec.

## The mental model

Hemingway is an internal tool. Everything except the Media Database is scoped to
an **active client** you pick from the switcher at the top left (stored in a
cookie by [setActiveClient](components/app/shell/actions.ts)). The Media Database
is the one shared asset: built once per vertical and reused across every client
in that vertical.

There are four modules, mapping to the four stages of an outreach cycle:

| Module | Screen | What it is for |
|---|---|---|
| Media Database | [/media](app/(app)/media/page.tsx) | The journalist and publication asset you build in-house |
| Campaign Workspace | [/campaigns](app/(app)/campaigns/page.tsx) | Match, draft, approve, and send pitches |
| Monitor | [/monitor](app/(app)/monitor/page.tsx) | Reactive: expert-request and brand-mention responses |
| Reporting | [/reports](app/(app)/reports/page.tsx) | The monthly client deliverable |

**The rule that shapes everything:** the app automates research, matching, and
drafting, but a human approves every pitch before it sends. The app never sends
mail itself; approved pitches hand off to an external sending platform. The
approval gate is the product, not a bolt-on.

## How it is wired

Every external service is reached only through [lib/providers/](lib/providers/),
and each has two implementations:

1. **mock**: realistic, instant, deterministic sandbox data
2. **real**: the actual API integration

Selection happens per provider via a `*_PROVIDER` env variable. No file outside
`lib/providers/` imports an SDK, calls an external API, or knows which mode is
active. In the MVP, three providers run live and four run sandboxed:

| Service | MVP mode | Vendor |
|---|---|---|
| Scraper | Live | Firecrawl |
| AI models | Live | Anthropic + Voyage |
| Link and AI-mention data | Live | DataForSEO |
| Email verification | Sandbox | ZeroBounce / NeverBounce class |
| Sending platform | Sandbox | Smartlead / Instantly |
| Expert-request feeds | Sandbox | Qwoted / Featured |
| Domain health | Sandbox | Sending platform |

Sandbox features look fully real in the UI and carry a small "Sandbox" badge.
[/settings/integrations](app/(app)/settings/integrations/page.tsx) is the source
of truth for what is live. Each Sandbox row is one API key away from live;
nothing else in the app changes when a key is added.

## Quick start

Prerequisites: Node 20+, the Supabase CLI, and a container runtime for local
Supabase (Docker Desktop, OrbStack, or colima).

```bash
# 1. Install dependencies
npm install

# 2. Start local Supabase (applies every migration in supabase/migrations)
supabase start

# 3. Point the app at it
cp .env.example .env.local
#    Fill three values from `supabase start` (or `supabase status`):
#      NEXT_PUBLIC_SUPABASE_URL       -> API URL (http://127.0.0.1:54321)
#      NEXT_PUBLIC_SUPABASE_ANON_KEY  -> anon key
#      SUPABASE_SERVICE_ROLE_KEY      -> service_role key
#    Leave everything else as shipped.

# 4. Seed the demo (deterministic; safe to re-run any time)
npm run seed:demo

# 5. Run it
npm run dev
```

Open <http://localhost:3000>. It lands on the Dashboard with Kadai and Co active.
Re-run `npm run seed:demo` to reset to a clean, identical state between demos.
For the full demo click-path and troubleshooting, see [DEMO.md](DEMO.md).

For a fully offline playground with no external keys, set every `*_PROVIDER=mock`
in `.env.local`: every action button then works against mock data.

## Running outreach for a new client

### Step 0: Create the client

There is no "add client" screen yet. Clients are created only by the seed script
([scripts/seed-demo.ts](scripts/seed-demo.ts) via `insertClients`); the switcher
only switches between existing ones. Onboarding a genuinely new client today
means adding a row (name, vertical, and a `knowledge_base` blob that powers
monitor-response drafting) through the seed or directly in Supabase. Once the
client exists, select it in the switcher. Everything below is scoped to that
selection. See [Known gaps](#known-gaps).

### Step 1: Build the media database for their vertical

Go to **Media Database, Publications, Add publication**. Give it a URL and a
vertical; [addPublicationAction](app/(app)/media/actions.ts) starts an ingestion
run ([lib/ingestion/pipeline.ts](lib/ingestion/pipeline.ts)) that:

- maps the site and scrapes author pages plus recent articles (Firecrawl, live),
- runs an AI pass to classify each journalist (beat, whether they quote founders,
  whether they respond to data studies),
- infers and then verifies each email before it enters the database
  (verification is Sandbox today).

Do this once per vertical. A second F&B client reuses the same journalists. You
can re-scrape any publication to refresh it.

### Step 2: Create the campaign

**Campaigns, New campaign** ([createCampaignAction](app/(app)/campaigns/actions.ts)).
Give it a story angle and, ideally, a quarterly data study (title, summary, URL).
The data study is the hook journalists respond to. The story angle is what the
matching engine embeds against, so write it well.

### Step 3: Match journalists

Open the campaign, **Match** panel, "Find matches"
([findMatchesAction](app/(app)/campaigns/[campaignId]/actions.ts)). It ranks the
best-fit journalists in the client's vertical by comparing the story against
journalist article embeddings, each with a score and a plain-language rationale.
Journalists already pitched on this campaign are flagged. Select the 15 to 25 you
want.

### Step 4: Draft pitches

With your selection, run draft
([draftPitchesAction](app/(app)/campaigns/[campaignId]/actions.ts)). Each pitch
is drafted by the strong model tier using the cold-email rules (under 120 words,
data point in line one). A failed draft becomes an editable placeholder rather
than dropping the journalist. Pitches land in status `drafted`.

### Step 5: Approve

Open the campaign, **Approvals** tab. This is the review queue, with a keyboard
flow: `j`/`k` to move, `e` to edit, `a` to approve. Editing
([savePitchAction](app/(app)/campaigns/[campaignId]/actions.ts)) moves a pitch to
`edited`; approving ([approvePitchAction](app/(app)/campaigns/[campaignId]/actions.ts))
stamps your identity and moves it to `approved`, with an undo toast. Nothing can
be approved or edited after it is sent.

### Step 6: Push to the sending platform

"Push approved"
([pushApprovedPitchesAction](app/(app)/campaigns/[campaignId]/actions.ts)) hands
every approved pitch to the external sending platform and marks them `pushed`.
This is Sandbox in the MVP; it goes live when the sending-platform key is set.
The **Board** tab shows the full pipeline: drafted, edited, approved, pushed,
replied, placed.

### Step 7: Work the Monitor feed

**Monitor** shows incoming expert-comment requests and brand mentions for the
active client, grouped by day with countdowns for anything due. Open one, draft a
response in the client's voice from their knowledge base
([draftMonitorResponseAction](app/(app)/monitor/actions.ts)), review, and mark it
responded, won, or ignored. Marking one won
([markWonAction](app/(app)/monitor/actions.ts)) records a placement that flows
into the report. Expert-request feeds are Sandbox today.

### Step 8: Deliver the monthly report

**Reports** shows AI-mention delta, a per-engine breakdown, backlinks, referring
domains, and the coverage log for the active client. "Take snapshot"
([takeSnapshotAction](app/(app)/reports/actions.ts)) pulls fresh backlinks and AI
mentions (DataForSEO, live) and records the month. **Export** opens a print-ready,
client-facing document (new tab, save as PDF). Metrics show a Sandbox note until
the DataForSEO login is configured.

## Known gaps

1. **Client creation is seed-only.** No UI path exists to onboard a new client.
   This is the first thing to build before the app leaves demo territory.
2. **Sending, email verification, and expert feeds are sandboxed.** They look and
   behave real but do not touch the outside world yet. Each is one API key away
   from live.

## Project layout

```
app/(app)/          Authenticated app shell and the four module screens
app/(print)/        Print-ready client report export
app/api/            Cron and ingestion route handlers
components/ui/      shadcn/ui primitives
components/app/     Shared app components (shell, tables, states, badges)
lib/providers/      Every external service, mock and real, env-switched
lib/db/             Typed Supabase query functions (no inline queries elsewhere)
lib/ingestion/      Publication scrape and classification pipeline
lib/matching/       Story-to-journalist matching engine
lib/reporting/      Snapshot and report assembly
lib/supabase/       SSR, browser, and service-role clients
scripts/seed-demo.ts  Deterministic demo seed
supabase/migrations/  Schema, RLS, and the match function
docs/               Functional spec, data model, providers, UI style
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed:demo` | Wipe and reseed the deterministic demo data |
