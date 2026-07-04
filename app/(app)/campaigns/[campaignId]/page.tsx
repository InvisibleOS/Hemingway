import { notFound } from "next/navigation";
import { providerIsMock } from "@/lib/providers";
import { getCampaign, getClient, listPitchesByCampaignWithJournalist } from "@/lib/db";
import type { PitchStatus } from "@/lib/db/types";
import { CampaignHeader } from "./_components/campaign-header";
import { CampaignTabs, type CampaignTab } from "./_components/campaign-tabs";
import { MatchPanel } from "./_components/match-panel";
import { ApprovalQueue } from "./_components/approval-queue";
import { BoardPanel } from "./_components/board-panel";

export const dynamic = "force-dynamic";

const QUEUE_STATUSES = new Set<PitchStatus>(["drafted", "edited", "approved"]);

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { campaignId } = await params;
  const sp = await searchParams;

  const campaign = await getCampaign(campaignId);
  if (!campaign) notFound();

  const [client, pitches] = await Promise.all([
    getClient(campaign.client_id),
    listPitchesByCampaignWithJournalist(campaignId),
  ]);

  const queuePitches = pitches.filter((p) => QUEUE_STATUSES.has(p.status));

  const rawTab = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  // Default to the tab with content: the review queue if anything awaits review,
  // else the board if pitches have progressed, else matching for a fresh campaign.
  const tab: CampaignTab =
    rawTab === "match" || rawTab === "board" || rawTab === "approvals"
      ? rawTab
      : queuePitches.length > 0
        ? "approvals"
        : pitches.length > 0
          ? "board"
          : "match";

  const senderSandbox = providerIsMock("SENDER");
  const hasStoryAngle = Boolean(campaign.story_angle && campaign.story_angle.trim());

  return (
    <div className="space-y-6">
      <CampaignHeader campaign={campaign} client={client} senderSandbox={senderSandbox} />
      <CampaignTabs
        campaignId={campaignId}
        tab={tab}
        approvalsCount={queuePitches.length}
        boardCount={pitches.length}
      />

      {tab === "match" && <MatchPanel campaignId={campaignId} hasStoryAngle={hasStoryAngle} />}
      {tab === "approvals" && <ApprovalQueue campaignId={campaignId} pitches={queuePitches} />}
      {tab === "board" && <BoardPanel pitches={pitches} />}
    </div>
  );
}
