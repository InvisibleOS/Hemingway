/**
 * Dump the currently seeded database to a static JSON fixture for demo mode.
 *
 * Demo mode (see lib/db/_demo) serves these rows from memory through a fake
 * Supabase client so the app renders the full demo with no database, e.g. on a
 * preview deployment. Run against a seeded local database:
 *
 *   npx tsx --env-file=.env.local scripts/dump-fixtures.ts
 *
 * Embedding columns are dropped: they are large, and demo matching uses the
 * keyword fallback, so no read path needs them.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getDb } from "@/lib/db";

const TABLES = [
  "clients",
  "publications",
  "journalists",
  "articles",
  "campaigns",
  "pitches",
  "placements",
  "metrics_snapshots",
  "monitor_events",
] as const;

function stripEmbeddings(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key.toLowerCase().includes("embedding")) continue;
    out[key] = value;
  }
  return out;
}

async function main(): Promise<void> {
  const db = getDb();
  const dump: Record<string, unknown[]> = {};

  for (const table of TABLES) {
    const { data, error } = await db.from(table).select("*");
    if (error) throw new Error(`Failed dumping ${table}: ${error.message}`);
    dump[table] = (data ?? []).map((r) => stripEmbeddings(r as Record<string, unknown>));
    console.log(`  ${table}: ${dump[table].length} rows`);
  }

  const dir = path.join(process.cwd(), "lib", "db", "_demo");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "fixtures.json");
  writeFileSync(file, JSON.stringify(dump, null, 2));
  console.log(`Wrote ${file}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
