import Link from "next/link";
import { cn } from "@/lib/utils";

/** Segmented control switching the media views. Links so it works without JS. */
export function MediaTabs({
  tab,
  journalistsCount,
  publicationsCount,
}: {
  tab: "journalists" | "publications";
  journalistsCount: number;
  publicationsCount: number;
}) {
  const tabs = [
    { id: "journalists" as const, label: "Journalists", count: journalistsCount },
    { id: "publications" as const, label: "Publications", count: publicationsCount },
  ];

  return (
    <div className="inline-flex rounded-lg border bg-card p-0.5">
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <Link
            key={t.id}
            href={`/media?tab=${t.id}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="rounded-full bg-background px-1.5 text-xs text-muted-foreground tabular-nums">
              {t.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
