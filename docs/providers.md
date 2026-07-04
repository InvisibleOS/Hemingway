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
