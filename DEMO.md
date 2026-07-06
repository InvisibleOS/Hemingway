# Hemingway demo

Hemingway is Strategi's internal PR operations platform: our team runs client
media outreach through it end to end. Clients never log in; they receive
placements and reports. This file is the exact demo script plus a fresh-clone
setup that gets you from `git clone` to a running demo in under five minutes.

The seed builds a two-client story:

- **Kadai and Co** (F&B): the flagship, mid-flight. A rich media database, an
  active campaign with a pitch in every status, a monitor feed with a request
  due today, and six months of reporting with a clear AI-mentions uplift.
- **Verandah Stays** (hospitality): earlier-stage, for contrast. A campaign still
  being pitched with nothing sent yet, a warming sending domain, two fresh
  monitor requests, and three months of modest early metrics.

---

## Setup from a fresh clone

Prerequisites: Node 20+, the Supabase CLI, and a container runtime for local
Supabase (Docker Desktop, OrbStack, or colima).

```bash
# 1. Install dependencies
npm install

# 2. Start local Supabase (applies every migration in supabase/migrations)
supabase start

# 3. Point the app at it
cp .env.example .env.local
#    Fill these three from the `supabase start` output (or `supabase status`):
#      NEXT_PUBLIC_SUPABASE_URL        -> API URL      (http://127.0.0.1:54321)
#      NEXT_PUBLIC_SUPABASE_ANON_KEY   -> anon key
#      SUPABASE_SERVICE_ROLE_KEY       -> service_role key
#    Leave everything else as shipped. The three live modules (scraper, AI,
#    DataForSEO) are wired real and simply read seeded data with no keys set;
#    the four mocked modules return realistic sandbox data.

# 4. Seed the demo (deterministic; safe to re-run any time)
npm run seed:demo

# 5. Run it
npm run dev
```

Open <http://localhost:3000>. It lands on the Dashboard with **Kadai and Co**
active (the client switcher is top-left).

**Reset between demos:** `npm run seed:demo` wipes and reseeds deterministically,
so the story is identical on every run.

---

## The three-minute click path

Start on the Dashboard, Kadai and Co active.

**1. Dashboard — the operator's morning (0:00)**
- "One screen for what needs attention today, across every client."
- Two queues: **Needs a response** (reactive monitor requests) and **Awaiting
  approval** (pitches a human must sign off). The Sandbox tag marks data that is
  mocked today.
- Point out the request due today, then move on.

**2. Media Database — the asset we build, not buy (0:25)**
- Go to **Media Database**. "India-first, built in-house: 50 journalists across
  five publications, organised by vertical."
- Filter by vertical or email status. Click a journalist to open the profile
  drawer: beat, receptivity signals (quotes founders, uses data studies), the
  verified email, and their recent articles.
- The **Sandbox** tag on email status: verification is mocked today and goes
  live with one key.
- Switch to the **Publications** tab: each publication shows its last ingestion
  state (complete, complete with skips, and one failed refresh).

**3. Campaign Workspace — the approval flow (0:55)**
- Go to **Campaigns**, open **Monsoon Menu Launch** (active).
- Header shows the story angle and the quarterly data study that hooks
  journalists. The Sandbox tag marks the mocked sending platform.
- **Approvals** tab: the review queue. Keyboard flow is `j`/`k` to move, `e` to
  edit, `a` to approve. Approve one pitch (optimistic, with an undo toast), then
  point at **Push approved** which hands off to the sending platform.
- **Board** tab: the whole pipeline at a glance, a pitch in every status from
  drafted through placed. "The app drafts and matches; a human approves every
  pitch before it sends."

**4. Monitor — the reactive layer (1:45)**
- Go to **Monitor**. Requests grouped by arrival day, **Today** at the top.
- The top request is **due today** with an urgent countdown. Open it: a response
  is already drafted in the client's voice, ready for review and same-day send.
- The **Sandbox** tag: expert-request feeds are mocked today.

**5. Reports — the monthly deliverable (2:15)**
- Go to **Reports**. The AI-mentions figure counts up to its current value with a
  clear month-over-month uplift, a per-engine breakdown, backlinks and referring
  domains, and the coverage log.
- Switch the client (top-left) to **Verandah Stays** to show the contrast: an
  earlier-stage client with smaller, three-month numbers.
- Hit **Export** to open the client-ready report document (opens in a new tab,
  print or save as PDF). The Sandbox tag notes metrics are sandbox until the
  DataForSEO keys are set.

**6. Settings, Integrations — the purchase checklist (2:50)**
- Go to **Settings, Integrations**. "This is the whole external-service bill."
- Three **Live** integrations run on subscriptions we already hold (Firecrawl,
  Anthropic and Voyage, DataForSEO). Four **Sandbox** integrations each read
  "Activates with API key."
- Close with the line: "Each Sandbox row is one API key to go live. Nothing else
  in the app changes."

---

## Preview deployment (no database)

For a hosted preview where the reviewer just needs to see the finished product,
this branch bakes the seeded demo data into the repo (`lib/db/_demo`) and serves
it through an in-memory client, so the app runs with no Supabase at all.

Deploy the branch to Vercel with no environment variables set. Demo mode
auto-enables whenever the Supabase vars are absent (or set `DEMO_MODE=1` to force
it), and every provider defaults to mock, so no external keys are needed. Every
screen renders exactly as on localhost. Interactions (approve, draft, snapshot)
work in memory and reset on the next cold start, which is the intended behaviour
for a throwaway preview.

To refresh the baked data from a seeded local database:

```bash
npx tsx --env-file=.env.local scripts/dump-fixtures.ts
```

---

## What is live vs sandbox

Every external service is reached only through `/lib/providers`, each with a mock
and a real implementation selected per `*_PROVIDER` env var. The Integrations
screen (`/settings/integrations`) is the source of truth.

| Service | MVP mode | Vendor |
|---|---|---|
| Scraper | Live | Firecrawl |
| AI models | Live | Anthropic + Voyage |
| Link and AI-mention data | Live | DataForSEO |
| Email verification | Sandbox | ZeroBounce / NeverBounce class |
| Sending platform | Sandbox | Smartlead / Instantly |
| Expert-request feeds | Sandbox | Qwoted / Featured |
| Domain health | Sandbox | Sending platform |

The demo runs entirely on seeded data, so no external keys are needed to walk the
path above. Adding a live key (for example `ANTHROPIC_API_KEY`) lets that module
run for real; adding the DataForSEO login flips the report from Sandbox to live
metrics on the next snapshot.

**Fully interactive offline playground (optional):** set every `*_PROVIDER=mock`
in `.env.local`. Then every action button works without any external key: adding
a publication ingests mock journalists, the match and draft actions return mock
output instantly, and snapshots use mock metrics.

---

## Troubleshooting

- **`supabase start` fails: port already allocated.** Another Supabase project is
  running on the default ports. Stop it (`supabase stop --project-id <name>`), or
  give this project its own ports in `supabase/config.toml` and update
  `NEXT_PUBLIC_SUPABASE_URL` to match.
- **A container fails its health check on colima** (for example `vector` or
  `storage` cannot mount the docker socket). These services are not needed for the
  demo: set `enabled = false` under `[analytics]` and `[storage]` in
  `supabase/config.toml`, then `supabase start` again. Docker Desktop and OrbStack
  do not need this.
- **The app cannot reach the database.** Confirm the three Supabase values in
  `.env.local` match `supabase status`, then restart `npm run dev`.
- **Numbers or data look stale.** Re-run `npm run seed:demo`; it wipes and
  reseeds deterministically.
