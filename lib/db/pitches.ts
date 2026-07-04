import { getDb, type Db } from "./_client";
import type { Pitch, PitchInsert } from "./types";

export async function listPitchesByCampaign(
  campaignId: string,
  db: Db = getDb(),
): Promise<Pitch[]> {
  const { data, error } = await db
    .from("pitches")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("match_score", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertPitches(
  rows: PitchInsert[],
  db: Db = getDb(),
): Promise<Pitch[]> {
  const { data, error } = await db.from("pitches").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

export async function updatePitch(
  id: string,
  patch: Partial<PitchInsert>,
  db: Db = getDb(),
): Promise<Pitch> {
  const { data, error } = await db
    .from("pitches")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
