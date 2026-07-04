import { getDb, type Db } from "./_client";
import type { Placement, PlacementInsert } from "./types";

export async function listPlacements(
  clientId?: string,
  db: Db = getDb(),
): Promise<Placement[]> {
  let query = db
    .from("placements")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function insertPlacement(
  row: PlacementInsert,
  db: Db = getDb(),
): Promise<Placement> {
  const { data, error } = await db.from("placements").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function insertPlacements(
  rows: PlacementInsert[],
  db: Db = getDb(),
): Promise<Placement[]> {
  const { data, error } = await db.from("placements").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}
