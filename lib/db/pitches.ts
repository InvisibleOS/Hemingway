import { getDb, type Db } from "./_client";
import type { EmailStatus, Pitch, PitchInsert, PitchStatus } from "./types";

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

/** Pitch with the journalist (and their publication) embedded, for the queue and board. */
export type PitchWithJournalist = Pitch & {
  journalist: {
    id: string;
    name: string;
    email: string | null;
    email_status: EmailStatus;
    beat_summary: string | null;
    receptivity_notes: string | null;
    quotes_founders: boolean;
    uses_data_studies: boolean;
    publication: { id: string; name: string };
  };
};

const PITCH_WITH_JOURNALIST_SELECT =
  "*, journalist:journalists!inner(id, name, email, email_status, beat_summary, receptivity_notes, quotes_founders, uses_data_studies, publication:publications!inner(id, name))";

export async function listPitchesByCampaignWithJournalist(
  campaignId: string,
  db: Db = getDb(),
): Promise<PitchWithJournalist[]> {
  const { data, error } = await db
    .from("pitches")
    .select(PITCH_WITH_JOURNALIST_SELECT)
    .eq("campaign_id", campaignId)
    .order("match_score", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as PitchWithJournalist[];
}

export async function getPitchWithJournalist(
  id: string,
  db: Db = getDb(),
): Promise<PitchWithJournalist | null> {
  const { data, error } = await db
    .from("pitches")
    .select(PITCH_WITH_JOURNALIST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as PitchWithJournalist) ?? null;
}

export type PitchCounts = { total: number; byStatus: Partial<Record<PitchStatus, number>> };

/** Per-campaign pitch tallies (total and by status) for the campaign list. */
export async function getPitchCountsByCampaigns(
  campaignIds: string[],
  db: Db = getDb(),
): Promise<Record<string, PitchCounts>> {
  if (campaignIds.length === 0) return {};
  const { data, error } = await db
    .from("pitches")
    .select("campaign_id, status")
    .in("campaign_id", campaignIds);
  if (error) throw error;
  const out: Record<string, PitchCounts> = {};
  for (const row of data ?? []) {
    const bucket = (out[row.campaign_id] ??= { total: 0, byStatus: {} });
    bucket.total += 1;
    bucket.byStatus[row.status] = (bucket.byStatus[row.status] ?? 0) + 1;
  }
  return out;
}

/** Journalist ids already pitched in a campaign, so matching can flag duplicates. */
export async function getPitchedJournalistIds(
  campaignId: string,
  db: Db = getDb(),
): Promise<string[]> {
  const { data, error } = await db
    .from("pitches")
    .select("journalist_id")
    .eq("campaign_id", campaignId);
  if (error) throw error;
  return (data ?? []).map((r) => r.journalist_id);
}

export async function insertPitches(
  rows: PitchInsert[],
  db: Db = getDb(),
): Promise<Pitch[]> {
  const { data, error } = await db.from("pitches").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

export async function getPitch(id: string, db: Db = getDb()): Promise<Pitch | null> {
  const { data, error } = await db.from("pitches").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
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
