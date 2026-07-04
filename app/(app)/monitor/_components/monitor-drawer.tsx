"use client";

import * as React from "react";
import { toast } from "sonner";
import { Ban, Check, ExternalLink, Loader2, Sparkles, Trophy } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/app/status-pill";
import { monitorEventStatusMeta, monitorSourceMeta } from "@/lib/status";
import { hostname } from "@/lib/format";
import type { MonitorEvent } from "@/lib/db/types";
import { Deadline } from "./deadline";
import {
  draftMonitorResponseAction,
  ignoreEventAction,
  markRespondedAction,
  markWonAction,
  saveMonitorDraftAction,
} from "../actions";

export function MonitorDrawer({
  event,
  open,
  onOpenChange,
  onUpdate,
}: {
  event: MonitorEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (patch: Partial<MonitorEvent>) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [drafting, setDrafting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [statusBusy, setStatusBusy] = React.useState(false);
  const [showWon, setShowWon] = React.useState(false);
  const [wonUrl, setWonUrl] = React.useState("");
  const [wonHeadline, setWonHeadline] = React.useState("");
  const [wonPublication, setWonPublication] = React.useState("");
  const [wonSaving, setWonSaving] = React.useState(false);

  const eventId = event?.id ?? null;

  React.useEffect(() => {
    setDraft(event?.draft_response ?? "");
    setShowWon(false);
    setWonUrl("");
    setWonHeadline("");
    setWonPublication("");
  }, [eventId, event?.draft_response]);

  if (!event) return <Sheet open={open} onOpenChange={onOpenChange} />;

  const draftedStatus = event.status === "new" ? "drafted" : event.status;

  const runDraft = () => {
    setDrafting(true);
    draftMonitorResponseAction(event.id)
      .then((res) => {
        setDraft(res.draft);
        onUpdate({ draft_response: res.draft, status: draftedStatus });
        toast("Response drafted");
      })
      .catch((err) =>
        toast.error("Draft failed", { description: err instanceof Error ? err.message : "Try again." }),
      )
      .finally(() => setDrafting(false));
  };

  const saveDraft = () => {
    if (!draft.trim()) {
      toast.error("Response is required");
      return;
    }
    setSaving(true);
    saveMonitorDraftAction(event.id, { draft })
      .then(() => {
        onUpdate({ draft_response: draft, status: draftedStatus });
        toast("Draft saved");
      })
      .catch((err) =>
        toast.error("Save failed", { description: err instanceof Error ? err.message : "Try again." }),
      )
      .finally(() => setSaving(false));
  };

  const changeStatus = (fn: () => Promise<void>, patch: Partial<MonitorEvent>, message: string) => {
    setStatusBusy(true);
    fn()
      .then(() => {
        onUpdate(patch);
        toast(message);
        onOpenChange(false);
      })
      .catch(() => toast.error("Update failed", { description: "Try again." }))
      .finally(() => setStatusBusy(false));
  };

  const saveWon = () => {
    if (!wonUrl.trim()) {
      toast.error("Placement URL is required");
      return;
    }
    setWonSaving(true);
    markWonAction(event.id, {
      url: wonUrl,
      headline: wonHeadline,
      publicationName: wonPublication,
    })
      .then(() => {
        onUpdate({ status: "won" });
        toast("Marked won", { description: "Placement recorded." });
        onOpenChange(false);
      })
      .catch((err) =>
        toast.error("Could not mark won", { description: err instanceof Error ? err.message : "Try again." }),
      )
      .finally(() => setWonSaving(false));
  };

  const terminal = event.status === "won" || event.status === "ignored";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-2">
            <StatusPill {...monitorSourceMeta(event.source)} />
            <StatusPill {...monitorEventStatusMeta(event.status)} />
          </div>
          <SheetTitle className="text-lg">{event.title}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {event.url && (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  {hostname(event.url)}
                  <ExternalLink className="size-3" />
                </a>
              )}
              <Deadline iso={event.deadline_at} />
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 py-5">
          {event.summary && (
            <section className="space-y-2">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Request
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90">{event.summary}</p>
            </section>
          )}

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Response
              </h3>
              {draft && (
                <Button variant="ghost" size="xs" onClick={runDraft} disabled={drafting}>
                  {drafting ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                  Regenerate
                </Button>
              )}
            </div>

            {draft ? (
              <div className="space-y-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-44"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={saveDraft} disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Save draft
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Draft a same-day response in the client voice, from their knowledge base.
                </p>
                <Button onClick={runDraft} disabled={drafting}>
                  {drafting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Draft response
                </Button>
              </div>
            )}
          </section>

          {!terminal && (
            <section className="space-y-3 border-t pt-4">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Outcome
              </h3>
              {showWon ? (
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="won-url">Placement URL</Label>
                    <Input
                      id="won-url"
                      value={wonUrl}
                      onChange={(e) => setWonUrl(e.target.value)}
                      placeholder="https://..."
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="won-headline">Headline</Label>
                      <Input
                        id="won-headline"
                        value={wonHeadline}
                        onChange={(e) => setWonHeadline(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="won-pub">Publication</Label>
                      <Input
                        id="won-pub"
                        value={wonPublication}
                        onChange={(e) => setWonPublication(e.target.value)}
                        placeholder="From URL if blank"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowWon(false)} disabled={wonSaving}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveWon} disabled={wonSaving}>
                      {wonSaving ? <Loader2 className="size-4 animate-spin" /> : <Trophy className="size-4" />}
                      Save win
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      changeStatus(() => markRespondedAction(event.id), { status: "responded" }, "Marked responded")
                    }
                    disabled={statusBusy}
                  >
                    <Check className="size-4" />
                    Mark responded
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowWon(true)} disabled={statusBusy}>
                    <Trophy className="size-4" />
                    Mark won
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      changeStatus(() => ignoreEventAction(event.id), { status: "ignored" }, "Ignored")
                    }
                    disabled={statusBusy}
                  >
                    <Ban className="size-4" />
                    Ignore
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
