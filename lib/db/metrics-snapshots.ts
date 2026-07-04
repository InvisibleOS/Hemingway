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
