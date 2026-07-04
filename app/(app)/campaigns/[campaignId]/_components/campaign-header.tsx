import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/app/status-pill";
import { SandboxBadge } from "@/components/app/sandbox-badge";
import { campaignStatusMeta } from "@/lib/status";
import { verticalLabel } from "@/lib/format";
import type { Campaign, Client } from "@/lib/db/types";
import { CampaignFormDialog } from "../../_components/campaign-form-dialog";

export function CampaignHeader({
  campaign,
  client,
  senderSandbox = false,
}: {
  campaign: Campaign;
  client: Client | null;
  senderSandbox?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Campaigns
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="truncate text-xl font-semibold tracking-tight">{campaign.name}</h1>
            <StatusPill {...campaignStatusMeta(campaign.status)} />
          </div>
          <p className="text-sm text-muted-foreground">
            {client ? `${client.name} · ${verticalLabel(client.vertical)}` : "Client"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {senderSandbox && <SandboxBadge title="Sending platform is mocked" />}
          <CampaignFormDialog
            mode="edit"
            campaign={campaign}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="size-4" />
                Edit
              </Button>
            }
          />
        </div>
      </div>

      {(campaign.story_angle || campaign.data_study_title || campaign.data_study_summary) && (
        <div className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-2">
          {campaign.story_angle && (
            <div className="space-y-1">
              <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Story angle
              </div>
              <p className="text-sm leading-relaxed">{campaign.story_angle}</p>
            </div>
          )}
          {(campaign.data_study_title || campaign.data_study_summary) && (
            <div className="space-y-1">
              <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Data study
              </div>
              {campaign.data_study_title && (
                <p className="text-sm font-medium">{campaign.data_study_title}</p>
              )}
              {campaign.data_study_summary && (
                <p className="text-sm text-muted-foreground">{campaign.data_study_summary}</p>
              )}
              {campaign.data_study_url && (
                <a
                  href={campaign.data_study_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  View study
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
