/**
 * Monitor feed ingestion. Pulls new expert-comment requests per client vertical
 * from the expertFeeds provider and inserts them into monitor_events. In mock
 * mode this generates the seeded plausible events (docs/providers.md).
 *
 * Provider access goes through /lib/providers; this file never touches an SDK or
 * knows whether the provider is mock or real (CLAUDE.md, the provider rule).
 *
 * Idempotent per day: the mock is deterministic by vertical and day, and inserts
 * are de-duplicated by url against existing events, so a repeated run inserts
 * nothing new.
 */
import { expertFeeds } from "@/lib/providers";
import {
  insertMonitorEvents,
  listMonitorEvents,
  listActiveClients,
  type Client,
  type MonitorEventInsert,
} from "@/lib/db";

export async function ingestClientEvents(client: Client): Promise<number> {
  const existing = await listMonitorEvents(client.id);
  const existingUrls = new Set(
    existing.map((e) => e.url).filter((u): u is string => Boolean(u)),
  );

  const requests = await expertFeeds.fetchNewRequests(client.vertical);
  const seen = new Set<string>();
  const rows: MonitorEventInsert[] = [];
  for (const r of requests) {
    // De-duplicate against stored events and within this batch by url.
    if (r.url && (existingUrls.has(r.url) || seen.has(r.url))) continue;
    if (r.url) seen.add(r.url);
    rows.push({
      client_id: client.id,
      source: r.source,
      title: r.title,
      url: r.url ?? null,
      summary: r.summary ?? null,
      deadline_at: r.deadlineAt ?? null,
      status: "new",
    });
  }

  if (rows.length) await insertMonitorEvents(rows);
  return rows.length;
}

export type IngestSummary = {
  clients: number;
  inserted: number;
  perClient: { client: string; inserted: number }[];
};

export async function ingestAllClients(): Promise<IngestSummary> {
  const clients = await listActiveClients();
  const perClient: IngestSummary["perClient"] = [];
  let inserted = 0;
  for (const client of clients) {
    const n = await ingestClientEvents(client);
    inserted += n;
    perClient.push({ client: client.name, inserted: n });
  }
  return { clients: clients.length, inserted, perClient };
}
