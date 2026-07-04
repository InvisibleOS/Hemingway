import Link from "next/link";
import { cn } from "@/lib/utils";

export type CampaignTab = "match" | "approvals" | "board";

export function CampaignTabs({
  campaignId,
  tab,
  approvalsCount,
  boardCount,
}: {
  campaignId: string;
  tab: CampaignTab;
  approvalsCount: number;
  boardCount: number;
}) {
  const tabs: { id: CampaignTab; label: string; count?: number }[] = [
    { id: "match", label: "Match" },
    { id: "approvals", label: "Approvals", count: approvalsCount },
    { id: "board", label: "Board", count: boardCount },
  ];

  return (
    <div className="inline-flex rounded-lg border bg-card p-0.5">
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <Link
            key={t.id}
            href={`/campaigns/${campaignId}?tab=${t.id}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.count != null && (
              <span className="rounded-full bg-background px-1.5 text-xs text-muted-foreground tabular-nums">
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
