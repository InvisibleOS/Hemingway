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

/** A client's monitor events for the digest, newest arrival first. */
export async function listMonitorEventsForClient(
  clientId: string,
  db: Db = getDb(),
): Promise<MonitorEvent[]> {
  const { data, error } = await db
    .from("monitor_events")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMonitorEvent(
  id: string,
  db: Db = getDb(),
): Promise<MonitorEvent | null> {
  const { data, error } = await db
    .from("monitor_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertMonitorEvents(
  rows: MonitorEventInsert[],
  db: Db = getDb(),
): Promise<MonitorEvent[]> {
  const { data, error } = await db.from("monitor_events").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

export async function updateMonitorEvent(
  id: string,
  patch: Partial<MonitorEventInsert>,
  db: Db = getDb(),
): Promise<MonitorEvent | null> {
  const { data, error } = await db
    .from("monitor_events")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Monitor event with the owning client embedded, for the cross-client dashboard. */
export type MonitorEventWithClient = MonitorEvent & {
  client: { id: string; name: string };
};

/** Events still needing action (new or drafted) across all clients, soonest deadline first. */
export async function listActionableMonitorEvents(
  limit = 8,
  db: Db = getDb(),
): Promise<MonitorEventWithClient[]> {
  const { data, error } = await db
    .from("monitor_events")
    .select("*, client:clients!inner(id, name)")
    .in("status", ["new", "drafted"])
    .order("deadline_at", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as MonitorEventWithClient[];
}
