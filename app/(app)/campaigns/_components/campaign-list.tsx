import Link from "next/link";
import { StatusPill } from "@/components/app/status-pill";
import { RelativeTime } from "@/components/app/relative-time";
import { campaignStatusMeta } from "@/lib/status";
import type { Campaign } from "@/lib/db/types";
import type { PitchCounts } from "@/lib/db/pitches";

export function CampaignList({
  campaigns,
  counts,
}: {
  campaigns: Campaign[];
  counts: Record<string, PitchCounts>;
}) {
  return (
    <div className="grid gap-3">
      {campaigns.map((campaign) => {
        const count = counts[campaign.id];
        const sent =
          (count?.byStatus.pushed ?? 0) +
          (count?.byStatus.replied ?? 0) +
          (count?.byStatus.placed ?? 0);
        return (
          <Link
            key={campaign.id}
            href={`/campaigns/${campaign.id}`}
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="font-medium">{campaign.name}</div>
                {campaign.story_angle && (
                  <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                    {campaign.story_angle}
                  </p>
                )}
              </div>
              <StatusPill {...campaignStatusMeta(campaign.status)} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="tabular-nums">{count?.total ?? 0} pitches</span>
              {sent > 0 && <span className="tabular-nums">{sent} sent</span>}
              {campaign.data_study_title && (
                <span className="truncate">Study: {campaign.data_study_title}</span>
              )}
              <span className="ml-auto">
                Created <RelativeTime iso={campaign.created_at} />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
