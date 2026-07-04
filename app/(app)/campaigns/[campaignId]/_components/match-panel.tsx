"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/empty-state";
import { ReceptivityFlags } from "@/app/(app)/media/_components/receptivity-flags";
import { emailStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import { findMatchesAction, draftPitchesAction } from "../actions";
import type { CandidateView, PitchSelection } from "./types";

const PRESELECT = 20;
const MAX_SELECT = 25;
const MIN_SELECT = 15;

export function MatchPanel({
  campaignId,
  hasStoryAngle,
}: {
  campaignId: string;
  hasStoryAngle: boolean;
}) {
  const router = useRouter();
  const [candidates, setCandidates] = React.useState<CandidateView[] | null>(null);
  const [method, setMethod] = React.useState<"vector" | "keyword">("vector");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [finding, setFinding] = React.useState(false);
  const [drafting, setDrafting] = React.useState(false);

  const find = () => {
    setFinding(true);
    findMatchesAction(campaignId)
      .then((res) => {
        setCandidates(res.candidates);
        setMethod(res.method);
        const preselect = res.candidates
          .filter((c) => !c.alreadyPitched)
          .slice(0, PRESELECT)
          .map((c) => c.journalistId);
        setSelected(new Set(preselect));
        if (res.candidates.length === 0) {
          toast("No matches found", { description: "Try refining the story angle." });
        }
      })
      .catch(() => toast.error("Matching failed", { description: "Try again shortly." }))
      .finally(() => setFinding(false));
  };

  const toggle = (candidate: CandidateView) => {
    if (candidate.alreadyPitched) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(candidate.journalistId)) next.delete(candidate.journalistId);
      else if (next.size < MAX_SELECT) next.add(candidate.journalistId);
      else toast("Selection is capped at 25", { description: "Deselect one to add another." });
      return next;
    });
  };

  const draft = () => {
    if (!candidates || selected.size === 0) return;
    const selections: PitchSelection[] = candidates
      .filter((c) => selected.has(c.journalistId))
      .map((c) => ({ journalistId: c.journalistId, matchScore: c.score }));
    setDrafting(true);
    draftPitchesAction(campaignId, selections)
      .then((res) => {
        toast("Pitches drafted", {
          description: `${res.drafted} drafted${res.skipped ? `, ${res.skipped} already pitched` : ""}.`,
        });
        router.push(`/campaigns/${campaignId}?tab=approvals`);
        router.refresh();
      })
      .catch((err) =>
        toast.error("Drafting failed", {
          description: err instanceof Error ? err.message : "Try again.",
        }),
      )
      .finally(() => setDrafting(false));
  };

  if (!hasStoryAngle) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Add a story angle to match"
        description="Matching embeds the story angle and ranks journalists against it. Edit the campaign to add one."
      />
    );
  }

  if (candidates === null) {
    return (
      <EmptyState
        icon={Search}
        title="Find matched journalists"
        description="Rank the media database against this story angle, then select the 15 to 25 best fits to pitch."
        action={
          <Button onClick={find} disabled={finding}>
            {finding ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Find journalists
          </Button>
        }
      />
    );
  }

  if (candidates.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No matches found"
        description="No journalists ranked for this angle. Refine the story angle and try again."
        action={
          <Button variant="outline" onClick={find} disabled={finding}>
            {finding ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Retry
          </Button>
        }
      />
    );
  }

  const belowTarget = selected.size > 0 && selected.size < MIN_SELECT;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium tabular-nums">{selected.size} selected</span>
          <span className="text-muted-foreground">
            {belowTarget ? "Aim for 15 to 25" : "Ready to draft"}
          </span>
          {method === "keyword" && (
            <StatusPill hue="warning" label="Keyword fallback" hideDot />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={find} disabled={finding || drafting}>
            {finding ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Re-run match
          </Button>
          <Button onClick={draft} disabled={drafting || selected.size === 0}>
            {drafting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Draft pitches ({selected.size})
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <ul className="divide-y">
          {candidates.map((c, i) => {
            const isSelected = selected.has(c.journalistId);
            return (
              <li key={c.journalistId}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors",
                    c.alreadyPitched ? "cursor-default opacity-70" : "hover:bg-muted/30",
                  )}
                >
                  {c.alreadyPitched ? (
                    <StatusPill hue="neutral" label="Pitched" hideDot className="mt-0.5" />
                  ) : (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(c)}
                      className="mt-1 size-4 shrink-0"
                      style={{ accentColor: "var(--primary)" }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{c.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c.publicationName}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{c.rationale}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <ReceptivityFlags
                        quotesFounders={c.quotesFounders}
                        usesDataStudies={c.usesDataStudies}
                        emptyLabel=""
                      />
                      <StatusPill {...emailStatusMeta(c.emailStatus)} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {Math.round(c.score * 100)}
                    </div>
                    <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
                      {i === 0 ? "top match" : "match"}
                    </div>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
