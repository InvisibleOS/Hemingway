/**
 * Metrics snapshot job (Module 4). Pulls backlinks and per-engine AI mentions for
 * each client from the seoData provider and writes one metrics_snapshots row per
 * client per month.
 *
 * Provider access goes through /lib/providers; this file never touches an SDK or
 * knows whether DataForSEO is live (CLAUDE.md, the provider rule). The row's
 * `source` comes from seoDataSource(), so a snapshot taken without DataForSEO keys
 * is honestly recorded as "mock" and the report badges it Sandbox.
 *
 * Idempotent per month: a client that already has a snapshot this month is
 * skipped, so both the scheduled run and the manual action can run repeatedly
 * without duplicating or overwriting a month's figures.
 */
import { seoData, seoDataSource } from "@/lib/providers";
import { hostname } from "@/lib/format";
import {
  hasSnapshotForMonth,
  insertSnapshots,
  listActiveClients,
  type Client,
  type Json,
  type MetricsSource,
} from "@/lib/db";

export type SnapshotOutcome = "inserted" | "skipped" | "no_domain";

/** UTC "YYYY-MM" for the current month, and its first day as a date. */
function currentMonth(): { prefix: string; firstDay: string } {
  const prefix = new Date().toISOString().slice(0, 7);
  return { prefix, firstDay: `${prefix}-01` };
}

export async function snapshotClient(client: Client): Promise<SnapshotOutcome> {
  if (!client.website) return "no_domain";
  const { prefix, firstDay } = currentMonth();

  if (await hasSnapshotForMonth(client.id, prefix)) return "skipped";

  const domain = hostname(client.website);
  const [backlinks, ai] = await Promise.all([
    seoData.getBacklinks(domain),
    seoData.getAiMentions(domain),
  ]);

  await insertSnapshots([
    {
      client_id: client.id,
      snapshot_date: firstDay,
      backlinks_count: backlinks.backlinksCount,
      referring_domains: backlinks.referringDomains,
      ai_mentions_count: ai.total,
      ai_mentions_breakdown: ai.breakdown as Json,
      source: seoDataSource() as MetricsSource,
    },
  ]);
  return "inserted";
}

export type SnapshotSummary = {
  clients: number;
  inserted: number;
  skipped: number;
  source: MetricsSource;
  perClient: { client: string; outcome: SnapshotOutcome }[];
};

export async function snapshotAllClients(): Promise<SnapshotSummary> {
  const clients = await listActiveClients();
  const perClient: SnapshotSummary["perClient"] = [];
  let inserted = 0;
  let skipped = 0;
  for (const client of clients) {
    const outcome = await snapshotClient(client);
    if (outcome === "inserted") inserted += 1;
    if (outcome === "skipped") skipped += 1;
    perClient.push({ client: client.name, outcome });
  }
  return {
    clients: clients.length,
    inserted,
    skipped,
    source: seoDataSource() as MetricsSource,
    perClient,
  };
}
