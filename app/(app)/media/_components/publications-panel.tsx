"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Loader2, Newspaper, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { RelativeTime } from "@/components/app/relative-time";
import { EmptyState } from "@/components/app/empty-state";
import { isActiveIngestion, readIngestionState } from "@/lib/ingestion/types";
import { hostname, tierLabel, verticalLabel } from "@/lib/format";
import type { Publication } from "@/lib/db/types";
import { refreshPublicationAction } from "../actions";

function IngestionStatusCell({ pub }: { pub: Publication }) {
  const state = readIngestionState(pub.scrape_config);

  if (state && isActiveIngestion(state)) {
    const pct =
      state.status === "queued" ? 6 : state.total ? Math.round((state.processed / state.total) * 100) : 6;
    return (
      <div className="min-w-44 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs">
          <Loader2 className="size-3 shrink-0 animate-spin text-(--accent-subtle-fg)" />
          <span className="truncate">{state.phase}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.max(6, Math.min(100, pct))}%` }}
          />
        </div>
      </div>
    );
  }

  if (state?.status === "error") {
    return (
      <div className="space-y-1">
        <StatusPill hue="danger" label="Failed" />
        <div className="max-w-52 truncate text-xs text-muted-foreground" title={state.phase}>
          {state.phase}
        </div>
      </div>
    );
  }

  return (
    <div className="text-xs text-muted-foreground">
      {pub.last_scraped_at ? (
        <span className="flex items-center gap-1">
          Updated <RelativeTime iso={pub.last_scraped_at} />
        </span>
      ) : (
        <span>Not scraped</span>
      )}
      {state?.status === "complete" && state.errors.length > 0 && (
        <span className="ml-1">({state.errors.length} skipped)</span>
      )}
    </div>
  );
}

export function PublicationsPanel({
  initialPublications,
  initialCounts,
}: {
  initialPublications: Publication[];
  initialCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [publications, setPublications] = React.useState(initialPublications);
  const [counts, setCounts] = React.useState(initialCounts);
  const [refreshing, setRefreshing] = React.useState<Set<string>>(new Set());

  // Re-sync when the server sends fresh props (e.g. after adding a publication).
  React.useEffect(() => setPublications(initialPublications), [initialPublications]);
  React.useEffect(() => setCounts(initialCounts), [initialCounts]);

  const anyActive = publications.some((p) => isActiveIngestion(readIngestionState(p.scrape_config)));

  // Poll while any ingestion is running so the row progress stays live.
  React.useEffect(() => {
    if (!anyActive) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/media/ingestion", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          publications: Publication[];
          counts: Record<string, number>;
        };
        if (!cancelled) {
          setPublications(json.publications);
          setCounts(json.counts);
        }
      } catch {
        // Transient poll failure; the next tick retries.
      }
    };
    const id = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [anyActive]);

  const handleRefresh = (pub: Publication) => {
    setRefreshing((prev) => new Set(prev).add(pub.id));
    refreshPublicationAction(pub.id)
      .then(() => {
        toast("Refresh started", { description: `${pub.name} is being re-profiled.` });
        router.refresh();
      })
      .catch(() => toast.error("Could not refresh", { description: "Try again shortly." }))
      .finally(() =>
        setRefreshing((prev) => {
          const next = new Set(prev);
          next.delete(pub.id);
          return next;
        }),
      );
  };

  const columns: Column<Publication>[] = [
    {
      id: "name",
      header: "Publication",
      cell: (p) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{p.name}</div>
          <a
            href={p.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="truncate">{hostname(p.website)}</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      ),
    },
    {
      id: "vertical",
      header: "Vertical",
      cell: (p) => <span className="text-sm">{verticalLabel(p.vertical)}</span>,
    },
    {
      id: "tier",
      header: "Tier",
      cell: (p) => <span className="text-sm text-muted-foreground">{tierLabel(p.tier)}</span>,
    },
    {
      id: "journalists",
      header: "Journalists",
      align: "right",
      cell: (p) => <span className="text-sm">{counts[p.id] ?? 0}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (p) => <IngestionStatusCell pub={p} />,
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (p) => {
        const active = isActiveIngestion(readIngestionState(p.scrape_config));
        const isRefreshing = refreshing.has(p.id) || active;
        return (
          <Button
            variant="ghost"
            size="sm"
            disabled={isRefreshing}
            onClick={() => handleRefresh(p)}
          >
            <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        );
      },
    },
  ];

  if (publications.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title="No publications yet"
        description="Add a publication to map its site and ingest its journalists."
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      rows={publications}
      getRowId={(p) => p.id}
      className="max-h-[calc(100svh-16rem)]"
    />
  );
}
