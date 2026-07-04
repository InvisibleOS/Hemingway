"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getCampaign,
  getClient,
  getJournalistsByIds,
  getPitch,
  getPitchedJournalistIds,
  insertPitches,
  listPitchesByCampaignWithJournalist,
  updateCampaign,
  updatePitch,
  type PitchInsert,
  type PitchStatus,
} from "@/lib/db";
import { llm, sender, providerIsMock } from "@/lib/providers";
import { matchStory } from "@/lib/matching";
import { mapWithConcurrency } from "@/lib/async";
import type { CandidateView, FindMatchesResult, PitchSelection } from "./_components/types";

// No auth yet; the signed-in operator approves. Stored in pitches.approved_by.
const APPROVER = "tech@strategi.is";

// A pitch can only be edited or approved before it is sent. Once pushed (or
// beyond), it is terminal, so a stale queue view cannot revert an already-sent
// pitch back into the queue.
const EDITABLE_STATUSES = new Set<PitchStatus>(["drafted", "edited", "approved"]);

// A single draft is a strong-tier Claude call; a small pool keeps a batch of
// 15-25 within a request budget. Production would move this behind a queue.
const DRAFT_CONCURRENCY = 4;
const MAX_SELECTIONS = 25;

export async function findMatchesAction(campaignId: string): Promise<FindMatchesResult> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");
  const client = await getClient(campaign.client_id);

  const [result, pitchedIds] = await Promise.all([
    matchStory({
      storyAngle: campaign.story_angle ?? "",
      vertical: client?.vertical ?? null,
      matchCount: 25,
    }),
    getPitchedJournalistIds(campaignId),
  ]);

  const pitched = new Set(pitchedIds);
  const candidates: CandidateView[] = result.candidates.map((c) => ({
    journalistId: c.journalist.id,
    name: c.journalist.name,
    role: c.journalist.role,
    email: c.journalist.email,
    emailStatus: c.journalist.email_status,
    publicationName: c.journalist.publication.name,
    beatSummary: c.journalist.beat_summary,
    quotesFounders: c.journalist.quotes_founders,
    usesDataStudies: c.journalist.uses_data_studies,
    score: c.score,
    rationale: c.rationale,
    alreadyPitched: pitched.has(c.journalist.id),
  }));

  if (campaign.status === "draft" && candidates.length) {
    await updateCampaign(campaignId, { status: "matching" });
    revalidatePath(`/campaigns/${campaignId}`);
  }

  return { method: result.method, candidates };
}

const SelectionSchema = z.object({
  journalistId: z.string().uuid(),
  matchScore: z.number(),
});

export async function draftPitchesAction(
  campaignId: string,
  selectionsRaw: PitchSelection[],
): Promise<{ drafted: number; skipped: number }> {
  const selections = z.array(SelectionSchema).min(1).max(MAX_SELECTIONS).parse(selectionsRaw);
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");
  const client = await getClient(campaign.client_id);

  // Skip journalists already pitched, and de-duplicate ids within the request so
  // a repeated selection cannot create two pitches for the same journalist.
  const already = new Set(await getPitchedJournalistIds(campaignId));
  const seen = new Set<string>();
  const todo = selections.filter((s) => {
    if (already.has(s.journalistId) || seen.has(s.journalistId)) return false;
    seen.add(s.journalistId);
    return true;
  });
  if (todo.length === 0) return { drafted: 0, skipped: selections.length };

  const journalists = await getJournalistsByIds(todo.map((s) => s.journalistId));
  const byId = new Map(journalists.map((j) => [j.id, j]));
  const scoreById = new Map(todo.map((s) => [s.journalistId, s.matchScore]));

  const rows = await mapWithConcurrency(todo.map((s) => s.journalistId), DRAFT_CONCURRENCY, async (jid) => {
    const journalist = byId.get(jid);
    if (!journalist) return null;

    let subject: string;
    let body: string;
    try {
      const draft = await llm.draftPitch({
        journalist: {
          name: journalist.name,
          beatSummary: journalist.beat_summary ?? undefined,
          receptivityNotes: journalist.receptivity_notes ?? undefined,
        },
        client: { name: client?.name ?? "the client" },
        storyAngle: campaign.story_angle ?? "",
        dataStudy: {
          title: campaign.data_study_title ?? undefined,
          summary: campaign.data_study_summary ?? undefined,
        },
      });
      subject = draft.subject;
      body = draft.body;
    } catch {
      // Draft failed for this journalist: create an editable placeholder so the
      // pitch is never silently dropped from the batch.
      subject = `Story idea for ${journalist.name.split(" ")[0]}`;
      body = "Draft did not generate. Edit before approving.\n\n[sign-off]";
    }

    const row: PitchInsert = {
      campaign_id: campaignId,
      journalist_id: jid,
      subject,
      body,
      status: "drafted",
      match_score: scoreById.get(jid) ?? null,
    };
    return row;
  });

  const inserts = rows.filter((r): r is PitchInsert => r !== null);
  if (inserts.length) await insertPitches(inserts);
  if (campaign.status !== "active") await updateCampaign(campaignId, { status: "pitching" });

  revalidatePath(`/campaigns/${campaignId}`);
  return { drafted: inserts.length, skipped: selections.length - inserts.length };
}

const PitchEditSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(200),
  body: z.string().trim().min(1, "Body is required"),
});

export async function savePitchAction(
  pitchId: string,
  input: z.input<typeof PitchEditSchema>,
): Promise<void> {
  const parsed = PitchEditSchema.parse(input);
  const current = await getPitch(pitchId);
  if (!current) throw new Error("Pitch not found");
  if (!EDITABLE_STATUSES.has(current.status)) {
    throw new Error("This pitch has already been sent and cannot be edited.");
  }
  const pitch = await updatePitch(pitchId, {
    subject: parsed.subject,
    body: parsed.body,
    status: "edited",
    approved_by: null,
    approved_at: null,
  });
  revalidatePath(`/campaigns/${pitch.campaign_id}`);
}

export async function approvePitchAction(
  pitchId: string,
): Promise<{ approvedBy: string; approvedAt: string }> {
  const current = await getPitch(pitchId);
  if (!current) throw new Error("Pitch not found");
  if (!EDITABLE_STATUSES.has(current.status)) {
    throw new Error("This pitch has already been sent and cannot be approved.");
  }
  const approvedAt = new Date().toISOString();
  const pitch = await updatePitch(pitchId, {
    status: "approved",
    approved_by: APPROVER,
    approved_at: approvedAt,
  });
  revalidatePath(`/campaigns/${pitch.campaign_id}`);
  return { approvedBy: APPROVER, approvedAt };
}

const RevertStatus = z.enum(["drafted", "edited"]).catch("edited");

export async function unapprovePitchAction(
  pitchId: string,
  previousStatus: string,
): Promise<void> {
  const status = RevertStatus.parse(previousStatus);
  const pitch = await updatePitch(pitchId, {
    status,
    approved_by: null,
    approved_at: null,
  });
  revalidatePath(`/campaigns/${pitch.campaign_id}`);
}

export async function pushApprovedPitchesAction(
  campaignId: string,
): Promise<{ pushed: number; failed: number; sandbox: boolean }> {
  const pitches = await listPitchesByCampaignWithJournalist(campaignId);
  const approved = pitches.filter((p) => p.status === "approved");

  let pushed = 0;
  let failed = 0;
  for (const pitch of approved) {
    try {
      await sender.pushPitch({
        pitchId: pitch.id,
        subject: pitch.subject ?? "",
        body: pitch.body ?? "",
        toEmail: pitch.journalist.email ?? undefined,
      });
      await updatePitch(pitch.id, { status: "pushed", pushed_at: new Date().toISOString() });
      pushed += 1;
    } catch {
      failed += 1;
    }
  }

  if (pushed > 0) await updateCampaign(campaignId, { status: "active" });
  revalidatePath(`/campaigns/${campaignId}`);
  return { pushed, failed, sandbox: providerIsMock("SENDER") };
}
