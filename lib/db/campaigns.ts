import { getDb, type Db } from "./_client";
import type { Campaign, CampaignInsert } from "./types";

export async function listCampaigns(
  clientId?: string,
  db: Db = getDb(),
): Promise<Campaign[]> {
  let query = db.from("campaigns").select("*").order("created_at", { ascending: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCampaign(
  id: string,
  db: Db = getDb(),
): Promise<Campaign | null> {
  const { data, error } = await db
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertCampaign(
  row: CampaignInsert,
  db: Db = getDb(),
): Promise<Campaign> {
  const { data, error } = await db.from("campaigns").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateCampaign(
  id: string,
  patch: Partial<CampaignInsert>,
  db: Db = getDb(),
): Promise<Campaign | null> {
  const { data, error } = await db
    .from("campaigns")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}
