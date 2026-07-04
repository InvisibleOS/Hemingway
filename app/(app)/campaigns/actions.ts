"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { insertCampaign, updateCampaign } from "@/lib/db";

const CampaignSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  storyAngle: z.string().trim().min(1, "Story angle is required"),
  dataStudyTitle: z.string().trim().optional(),
  dataStudySummary: z.string().trim().optional(),
  dataStudyUrl: z.string().trim().optional(),
});

export async function createCampaignAction(
  clientId: string,
  input: z.input<typeof CampaignSchema>,
): Promise<{ id: string }> {
  if (!clientId) throw new Error("Select a client before creating a campaign.");
  const parsed = CampaignSchema.parse(input);
  const campaign = await insertCampaign({
    client_id: clientId,
    name: parsed.name,
    story_angle: parsed.storyAngle,
    data_study_title: parsed.dataStudyTitle || null,
    data_study_summary: parsed.dataStudySummary || null,
    data_study_url: parsed.dataStudyUrl || null,
    status: "draft",
  });
  revalidatePath("/campaigns");
  return { id: campaign.id };
}

export async function updateCampaignDetailsAction(
  campaignId: string,
  input: z.input<typeof CampaignSchema>,
): Promise<void> {
  const parsed = CampaignSchema.parse(input);
  await updateCampaign(campaignId, {
    name: parsed.name,
    story_angle: parsed.storyAngle,
    data_study_title: parsed.dataStudyTitle || null,
    data_study_summary: parsed.dataStudySummary || null,
    data_study_url: parsed.dataStudyUrl || null,
  });
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
}
