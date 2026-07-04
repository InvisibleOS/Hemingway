"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { DataTable, type Column, type SortState } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { RelativeTime } from "@/components/app/relative-time";
import { placementTypeMeta } from "@/lib/status";
import { hostname } from "@/lib/format";
import { placementOrigin } from "@/lib/reporting/report";
import type { Placement } from "@/lib/db/types";

const ORIGIN_HUE: Record<string, string> = {
  pitch: "text-(--status-info-fg)",
  monitor: "text-(--status-signal-fg)",
  direct: "text-muted-foreground",
};

function outletName(p: Placement): string {
  return p.publication_name || (p.url ? hostname(p.url) : "") || "Unknown outlet";
}

export function CoverageLog({ placements }: { placements: Placement[] }) {
  const [sort, setSort] = React.useState<SortState>({ column: "date", dir: "desc" });

  const rows = React.useMemo(() => {
    const sorted = [...placements];
    const dir = sort.dir === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      switch (sort.column) {
        case "outlet":
          return dir * outletName(a).localeCompare(outletName(b));
        case "type":
          return dir * a.placement_type.localeCompare(b.placement_type);
        case "date":
        default:
          return dir * (a.published_at ?? "").localeCompare(b.published_at ?? "");
      }
    });
    return sorted;
  }, [placements, sort]);

  const columns: Column<Placement>[] = [
    {
      id: "outlet",
      header: "Outlet",
      sortId: "outlet",
      cell: (p) => <span className="font-medium">{outletName(p)}</span>,
    },
    {
      id: "headline",
      header: "Headline",
      cell: (p) =>
        p.url ? (
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-foreground/90 underline-offset-4 hover:text-foreground hover:underline"
          >
            <span className="line-clamp-1">{p.headline || p.url}</span>
            <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
          </a>
        ) : (
          <span className="line-clamp-1 text-muted-foreground">{p.headline || "Untitled"}</span>
        ),
      cellClassName: "max-w-[22rem]",
    },
    {
      id: "type",
      header: "Type",
      sortId: "type",
      cell: (p) => <StatusPill {...placementTypeMeta(p.placement_type)} />,
    },
    {
      id: "origin",
      header: "Origin",
      cell: (p) => {
        const origin = placementOrigin(p);
        return <span className={`text-xs ${ORIGIN_HUE[origin.key]}`}>{origin.label}</span>;
      },
    },
    {
      id: "date",
      header: "Date",
      sortId: "date",
      align: "right",
      cell: (p) => <RelativeTime iso={p.published_at} className="text-sm" fallback="Not dated" />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(p) => p.id}
      sort={sort}
      onSortChange={setSort}
      emptyLabel="No coverage logged for this month"
    />
  );
}
