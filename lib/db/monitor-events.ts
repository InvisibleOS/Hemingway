import { getDb, type Db } from "./_client";
import type { MonitorEvent, MonitorEventInsert } from "./types";

export async function listMonitorEvents(
  clientId?: string,
  db: Db = getDb(),
): Promise<MonitorEvent[]> {
  let query = db
    .from("monitor_events")
    .select("*")
    .order("deadline_at", { ascending: true, nullsFirst: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function insertMonitorEvents(
  rows: MonitorEventInsert[],
  db: Db = getDb(),
): Promise<MonitorEvent[]> {
  const { data, error } = await db.from("monitor_events").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}
