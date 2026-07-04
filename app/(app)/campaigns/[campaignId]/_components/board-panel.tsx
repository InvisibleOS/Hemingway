import { LayoutGrid } from "lucide-react";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/empty-state";
import { pitchStatusMeta } from "@/lib/status";
import type { PitchStatus } from "@/lib/db/types";
import type { PitchWithJournalist } from "@/lib/db/pitches";

const COLUMNS: { id: string; label: string; statuses: PitchStatus[] }[] = [
  { id: "drafted", label: "Drafted", statuses: ["drafted", "edited"] },
  { id: "approved", label: "Approved", statuses: ["approved"] },
  { id: "pushed", label: "Pushed", statuses: ["pushed"] },
  { id: "replied", label: "Replied", statuses: ["replied"] },
  { id: "placed", label: "Placed", statuses: ["placed"] },
];

export function BoardPanel({ pitches }: { pitches: PitchWithJournalist[] }) {
  if (pitches.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No pitches yet"
        description="Draft pitches from the Match tab to populate the board."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {COLUMNS.map((col) => {
        const items = pitches.filter((p) => col.statuses.includes(p.status));
        return (
          <div key={col.id} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium">{col.label}</span>
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                  Empty
                </div>
              ) : (
                items.map((p) => (
                  <div key={p.id} className="space-y-1.5 rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.journalist.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {p.journalist.publication.name}
                        </div>
                      </div>
                      {p.match_score != null && (
                        <span className="shrink-0 text-xs font-semibold tabular-nums">
                          {Math.round(p.match_score * 100)}
                        </span>
                      )}
                    </div>
                    {p.subject && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{p.subject}</p>
                    )}
                    <StatusPill {...pitchStatusMeta(p.status)} />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
