import { getDb, type Db } from "./_client";
import type { MetricsSnapshot, MetricsSnapshotInsert } from "./types";

export async function listSnapshots(
  clientId: string,
  db: Db = getDb(),
): Promise<MetricsSnapshot[]> {
  const { data, error } = await db
    .from("metrics_snapshots")
    .select("*")
    .eq("client_id", clientId)
    .order("snapshot_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertSnapshots(
  rows: MetricsSnapshotInsert[],
  db: Db = getDb(),
): Promise<MetricsSnapshot[]> {
  const { data, error } = await db.from("metrics_snapshots").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

/**
 * Whether a snapshot already exists for a client within a calendar month, keyed
 * by the "YYYY-MM" prefix. Lets the monthly snapshot job stay idempotent (a
 * repeated run in the same month inserts nothing).
 */
export async function hasSnapshotForMonth(
  clientId: string,
  monthPrefix: string,
  db: Db = getDb(),
): Promise<boolean> {
  const { start, nextStart } = monthBounds(monthPrefix);
  const { data, error } = await db
    .from("metrics_snapshots")
    .select("id")
    .eq("client_id", clientId)
    .gte("snapshot_date", start)
    .lt("snapshot_date", nextStart)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

/** First day of the given "YYYY-MM" month and of the month after, as YYYY-MM-DD. */
function monthBounds(monthPrefix: string): { start: string; nextStart: string } {
  const [year, month] = monthPrefix.split("-").map(Number);
  const start = `${monthPrefix}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextStart = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, nextStart };
}
