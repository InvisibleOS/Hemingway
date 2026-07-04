# Functional Specification Document
## Hemingway: PR and Earned Media Platform for Strategi Clients

**Date:** July 2026
**Status:** For internal approval
**Entity:** AT AI Solutions Private Limited

---

## 1. Execution summary

Hemingway is an internal Strategi platform: our team uses it to run PR and media outreach on behalf of clients, who never access the app and simply receive placements and reports. It is built on the exact stack and patterns of Tolstoy, our existing CMS. It is assembled in four modules over four phases, starting with a fully manual, billable pilot so the app encodes a proven workflow instead of a guess. Total time to a working platform: 13 to 14 weeks. New recurring spend at launch: roughly ₹15,000 to ₹30,000 per month, almost all usage-based, scaling only with paying clients.

Every spend decision in this document follows one principle: save wherever quality is unaffected, spend wherever quality is decided. The two places quality is decided in PR are deliverability (does the pitch reach the inbox) and pitch fit (is it sent to the right journalist with the right story). Those two get funded without compromise. Everything else runs on free tiers, existing subscriptions, or usage-based pricing until volume justifies more.

One rule shapes every build decision: the app automates research, matching and drafting. A human reviews and approves every pitch before it is sent. Journalists who receive automated-looking pitches screenshot them publicly, so approval gates are built into the product, not bolted on.

---

## 2. The four modules and how each is built

### Module 1: Media Database
A living, India-first database of journalists and publications, built by us, not bought. Commercial media databases cost several lakh per year and are weak on Indian publications; building our own is both the cheaper and the higher-quality path.

**How it is built:**
- Firecrawl maps each target publication's site and scrapes author pages plus each journalist's 10 to 15 most recent articles.
- An automated AI pass classifies every journalist: beat, story preferences, whether they quote founders, whether they respond to data studies. Bulk classification runs on a lighter, cheaper model tier; quality-critical drafting later uses the stronger tier. Same output quality where it matters, materially lower API bill.
- Journalist emails are found by free pattern inference (publication email formats are predictable) and then verified through a pay-as-you-go email verification service before any address enters the database. This step is deliberately included as new spend: unverified emails cause bounces, bounces destroy sender reputation, and sender reputation is the whole game. A paid email-finding service is added only if pattern inference falls below an acceptable hit rate.
- Everything is stored in Supabase, organised by vertical (F&B, hospitality, real estate, D2C). Article content is embedded with pgvector so stories are matched to journalists mathematically, not by guesswork.
- Scheduled re-scrapes keep profiles fresh automatically.

**Build effort:** the largest single piece; the scraping pipeline and classification pass are the core of Phase 1.

### Module 2: Campaign Workspace
Where a client's PR campaign runs day to day.

**How it is built:**
- Multi-tenant workspaces, one per client, reusing the tenant pattern from the CMS directly.
- Each workspace holds the client's story angles and their quarterly data study (produced from our DataForSEO and AI-visibility data; this is the hook journalists respond to, and it costs nothing extra because the data subscriptions already exist).
- A matching engine ranks the 15 to 25 best-fit journalists for a story by comparing story embeddings against journalist article embeddings.
- Pitch drafting runs on the strongest model tier, using our proven cold email rules: under 120 words, data point in line one, one polite follow-up maximum. This is a deliberate quality spend; a weak pitch wastes the entire pipeline behind it.
- An approval flow is the centre of the UI: draft, edit, approve, send. Approved pitches push to our existing sending platform via API; the app itself never sends.
- Each client gets a dedicated sending domain with proper warmup. This is the other non-negotiable quality spend: it isolates every client's deliverability from every other client's, so one bad campaign can never poison the rest.

**Build effort:** second half of Phase 1; the approval flow and sending integration are the key work items.

### Module 3: Monitor Feed
The reactive layer, where speed wins placements.

**How it is built:**
- Firecrawl monitors watch expert-comment platforms and each client's brand mentions, supplemented by free alert services for redundancy.
- Matching requests are flagged into a daily digest view inside the app.
- One click drafts a response in the client's voice, sourced from their onboarding knowledge base, ready for review and same-day send.
- Expert-request platforms are used on free tiers first; paid tiers are added per platform only when won placements justify it.

**Build effort:** light; monitors are configuration plus a digest UI. First half of Phase 2.

### Module 4: Reporting
The monthly client report, generated from live data.

**How it is built:**
- Coverage log maintained in the campaign workspace as placements land.
- Backlinks gained pulled from the DataForSEO API on schedule.
- AI mention delta pulled from the LLM mentions endpoints we already use for GEO reporting.
- Rendered as a report screen and exportable client deliverable.

**Build effort:** second half of Phase 2; mostly wiring existing APIs into one view.

---

## 3. Technology decisions

Every layer reuses what already runs in production. No new technology is introduced anywhere.

| Layer | Choice | Why |
|---|---|---|
| Frontend + backend | Next.js 15, TypeScript | Same as CMS, team knows it |
| Database | Supabase (Postgres + pgvector) | Same as CMS; pgvector powers matching |
| Scraping + monitors | Firecrawl API | Already subscribed and integrated |
| AI classification | Claude, lighter tier | Bulk work at a fraction of the cost |
| AI pitch drafting | Claude, strongest tier | Quality-critical; deliberate spend |
| Hosting + cron | Vercel | Same as CMS, existing plan covers it |
| Queues / rate limiting | Upstash Redis | Same as CMS |
| Sending | Existing outbound platform API | Already subscribed |
| Email verification | Pay-as-you-go service | New; protects sender reputation |
| Link + AI mention data | DataForSEO API | Already subscribed |

The development effort reuses the CMS codebase conventions directly: tenant model, auth, API key handling, cron patterns, rate limiting. This is assembly, not invention.

---

## 4. Roadmap

**Phase 0: Manual proof (Weeks 1 to 4)**
Run the entire workflow by hand for one existing F&B client. Build the media list, produce one data study, send 20 matched pitches, answer expert requests, deliver one report. Billable from day one. Every friction point found here becomes a Phase 1 requirement, and the pilot validates cost assumptions (verification hit rates, API usage, reply rates) before any tooling is scaled.

**Phase 1: MVP (Weeks 5 to 9)**
Modules 1 and 2: scraping pipeline, media database, email verification step, campaign workspace, pitch drafting, approval flow, sending integration. This is the minimum that replaces manual work.

**Phase 2: Monitors and reporting (Weeks 10 to 13)**
Modules 3 and 4. At the end of this phase the full monthly deliverable set runs through the app.

**Phase 3: Scale (Week 14 onward)**
Onboard remaining clients vertical by vertical. Each vertical's media database is built once; every client in that vertical then onboards in days, since the data asset is shared. Cost per client falls with every client added to a vertical.

---

## 5. Requirements and costs

### People
| Role | Commitment |
|---|---|
| Product owner | Ongoing |
| Developer | Full focus, Phases 1 and 2 (approx. 9 weeks) |
| PR operations (pitch review, monitor responses) | Part-time from Phase 0, grows with client count |

### Tools and subscriptions
Most tools are already paid for under existing operations. The "new" rows are what this project actually adds. Prices are approximate and should be reconfirmed at sign-off since vendors revise plans often.

| Tool | Purpose | Status | Approx. monthly cost |
|---|---|---|---|
| Firecrawl | Scraping + monitors | Already subscribed | Existing plan; one tier upgrade only if scale demands (approx. USD 80 to 100) |
| DataForSEO | Backlinks, AI mentions, data studies | Already subscribed | Pay as you go; incremental usage small |
| Claude API | Classification (light tier) + drafting (strong tier) | Already in use | Usage-based; estimated USD 40 to 120 with the two-tier split |
| Supabase | Database | Already in use | Free tier during build, Pro (approx. USD 25) at launch |
| Vercel | Hosting + cron | Already in use | Existing plan covers it |
| Upstash | Queues, rate limiting | Already in use | Negligible at this scale |
| Sending platform | Pitch delivery | Already subscribed | Existing plan |
| Email verification | Bounce protection | New | Pay as you go, approx. USD 10 to 20 |
| Dedicated sending domains + inboxes | Per-client deliverability isolation | New | Approx. USD 5 to 10 per client |
| Expert-request platforms | Reactive placements | New | Free tiers; paid per platform only when placements justify (approx. USD 100 to 150 each) |

**Estimated new recurring cost at launch: roughly USD 175 to 350 per month (about ₹15,000 to ₹30,000), scaling only with paying clients.** The dominant real cost is the nine weeks of development time.

### Where we deliberately spend vs. save
- **Spend:** email verification, dedicated per-client domains, strongest model for pitch drafting. These three decide whether pitches land and get read. Cutting any of them saves hundreds of rupees and costs the entire outcome.
- **Save:** light model tier for bulk classification, free tiers on expert-request platforms until proven, free alert services as monitor redundancy, Supabase free tier during build, self-built media database instead of a several-lakh commercial subscription, pattern-based email finding before any paid finder.

### One-time costs
- Sending domain purchases and warmup: under ₹5,000.
- No design, licensing or infrastructure purchases needed.

---

## 6. Delivery model per client

The monthly deliverable set the app must produce end to end:

1. One original data study (doubles as owned content for the client's blog)
2. 15 to 25 matched, human-approved journalist pitches
3. Same-day responses to relevant expert-comment requests
4. Directory and listicle placement outreach in their category
5. Monthly report: coverage, links, AI mention delta

Sold as a flat monthly PR add-on on top of the existing content retainer. We never guarantee coverage; we guarantee the machine. At two clients on a modest add-on, the entire new tooling cost is covered many times over.

---

## 7. Risks and how they are handled

| Risk | Mitigation |
|---|---|
| Pitches read as automated, journalists blacklist us | Human approval on every pitch, low volume, dedicated domains per client, one follow-up maximum |
| Bounces damage sender reputation | Every address verified before entering the database; unverified addresses never receive mail |
| Scraped media data goes stale | Scheduled re-scrapes; journalist profiles refresh automatically |
| Coverage is slow in month one, client gets impatient | Reactive placements (expert quotes, listicles) land faster than features and fill early months; expectation set at sale |
| Build overruns | Phase 0 is manual and billable, so the service earns before the app exists; MVP scope is deliberately only two modules |
| Vendor price changes | All usage-based tools scale with revenue, not ahead of it |

---

## 8. What is needed to proceed

1. Approval to run the Phase 0 manual pilot with one existing client (4 weeks, near-zero incremental cost).
2. A developer allocated from Week 5 for the 9-week build.
3. Sign-off on the new tool spend (under ₹30,000 per month at launch).

Decision requested: approve Phase 0.