"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Inbox, Loader2, Mail, Pencil, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/app/status-pill";
import { SandboxBadge } from "@/components/app/sandbox-badge";
import { RelativeTime } from "@/components/app/relative-time";
import { EmptyState } from "@/components/app/empty-state";
import { ReceptivityFlags } from "@/app/(app)/media/_components/receptivity-flags";
import { emailStatusMeta, pitchStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { PitchWithJournalist } from "@/lib/db/pitches";
import type { PitchStatus } from "@/lib/db/types";
import {
  approvePitchAction,
  pushApprovedPitchesAction,
  savePitchAction,
  unapprovePitchAction,
} from "../actions";

const APPROVER = "tech@strategi.is";
const WORD_LIMIT = 120;

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[11px] text-muted-foreground">
      {children}
    </kbd>
  );
}

function wordCount(text: string | null): number {
  if (!text) return 0;
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function ApprovalQueue({
  campaignId,
  pitches,
  senderSandbox,
}: {
  campaignId: string;
  pitches: PitchWithJournalist[];
  senderSandbox: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = React.useState(pitches);
  const [focusedId, setFocusedId] = React.useState<string | null>(pitches[0]?.id ?? null);
  const [editing, setEditing] = React.useState(false);
  const [editSubject, setEditSubject] = React.useState("");
  const [editBody, setEditBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [pushing, setPushing] = React.useState(false);

  const rowRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const itemsRef = React.useRef(items);
  const focusedIdRef = React.useRef(focusedId);
  const editingRef = React.useRef(editing);
  itemsRef.current = items;
  focusedIdRef.current = focusedId;
  editingRef.current = editing;

  // Membership follows the server (e.g. Push removes pitches from the queue), but
  // keep local optimistic field values for pitches still present so an unrelated
  // revalidation cannot clobber an in-flight approve or edit.
  React.useEffect(() => {
    setItems((prev) => {
      const prevById = new Map(prev.map((i) => [i.id, i]));
      return pitches.map((p) => prevById.get(p.id) ?? p);
    });
  }, [pitches]);

  // Keep focus on a valid row.
  React.useEffect(() => {
    if (items.length === 0) {
      if (focusedId !== null) setFocusedId(null);
      return;
    }
    if (!focusedId || !items.some((i) => i.id === focusedId)) setFocusedId(items[0].id);
  }, [items, focusedId]);

  React.useEffect(() => {
    if (focusedId) rowRefs.current.get(focusedId)?.scrollIntoView({ block: "nearest" });
  }, [focusedId]);

  const undoApprove = React.useCallback((id: string, previous: PitchStatus) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: previous, approved_by: null, approved_at: null } : i,
      ),
    );
    unapprovePitchAction(id, previous).catch(() => toast.error("Undo failed"));
  }, []);

  const approve = React.useCallback(
    (pitch: PitchWithJournalist) => {
      if (pitch.status === "approved") return;
      const previous = pitch.status;
      const approvedAt = new Date().toISOString();
      setItems((prev) =>
        prev.map((i) =>
          i.id === pitch.id
            ? { ...i, status: "approved", approved_by: APPROVER, approved_at: approvedAt }
            : i,
        ),
      );
      // Advance to the next pitch to keep the triage flow moving.
      const its = itemsRef.current;
      const idx = its.findIndex((i) => i.id === pitch.id);
      if (its[idx + 1]) setFocusedId(its[idx + 1].id);

      approvePitchAction(pitch.id)
        .then(() => {
          toast("Pitch approved", {
            description: pitch.journalist.name,
            action: { label: "Undo", onClick: () => undoApprove(pitch.id, previous) },
          });
        })
        .catch(() => {
          setItems((prev) =>
            prev.map((i) =>
              i.id === pitch.id
                ? { ...i, status: previous, approved_by: null, approved_at: null }
                : i,
            ),
          );
          toast.error("Approve failed", { description: "Try again." });
        });
    },
    [undoApprove],
  );

  const startEdit = React.useCallback(() => {
    const focused = itemsRef.current.find((i) => i.id === focusedIdRef.current);
    if (!focused) return;
    setEditSubject(focused.subject ?? "");
    setEditBody(focused.body ?? "");
    setEditing(true);
  }, []);

  const move = React.useCallback((direction: 1 | -1) => {
    const its = itemsRef.current;
    if (its.length === 0) return;
    const idx = its.findIndex((i) => i.id === focusedIdRef.current);
    const nextIdx = Math.max(0, Math.min(its.length - 1, (idx < 0 ? 0 : idx) + direction));
    const next = its[nextIdx];
    if (next) setFocusedId(next.id);
  }, []);

  const approveFocused = React.useCallback(() => {
    const focused = itemsRef.current.find((i) => i.id === focusedIdRef.current);
    if (focused) approve(focused);
  }, [approve]);

  // Global keyboard flow: j/k move, e edit, a approve (docs/ui-style.md).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editingRef.current) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Do not act while a modal is open (edit-campaign dialog, command palette).
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          move(1);
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          move(-1);
          break;
        case "e":
          e.preventDefault();
          startEdit();
          break;
        case "a":
          e.preventDefault();
          approveFocused();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, startEdit, approveFocused]);

  const focused = items.find((i) => i.id === focusedId) ?? null;

  const save = () => {
    if (!focused) return;
    const subject = editSubject.trim();
    const body = editBody.trim();
    if (!subject || !body) {
      toast.error("Subject and body are required");
      return;
    }
    setSaving(true);
    savePitchAction(focused.id, { subject, body })
      .then(() => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === focused.id
              ? { ...i, subject, body, status: "edited", approved_by: null, approved_at: null }
              : i,
          ),
        );
        setEditing(false);
        toast("Pitch saved");
      })
      .catch((err) =>
        toast.error("Save failed", {
          description: err instanceof Error ? err.message : "Try again.",
        }),
      )
      .finally(() => setSaving(false));
  };

  const approvedCount = items.filter((i) => i.status === "approved").length;

  const push = () => {
    setPushing(true);
    pushApprovedPitchesAction(campaignId)
      .then((res) => {
        toast(res.pushed ? `Pushed ${res.pushed} ${res.pushed === 1 ? "pitch" : "pitches"}` : "Nothing to push", {
          description: res.sandbox ? "Sandbox: no mail was actually sent." : undefined,
        });
        router.refresh();
      })
      .catch(() => toast.error("Push failed", { description: "Try again." }))
      .finally(() => setPushing(false));
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No pitches to review"
        description="Draft pitches from the Match tab, then approve them here."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Kbd>j</Kbd>
            <Kbd>k</Kbd> move
          </span>
          <span className="flex items-center gap-1">
            <Kbd>e</Kbd> edit
          </span>
          <span className="flex items-center gap-1">
            <Kbd>a</Kbd> approve
          </span>
        </div>
        <div className="flex items-center gap-2">
          {senderSandbox && <SandboxBadge title="Sending platform is mocked" />}
          <Button onClick={push} disabled={pushing || approvedCount === 0}>
            {pushing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Push approved ({approvedCount})
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
        {/* Queue list */}
        <div className="max-h-[calc(100svh-20rem)] overflow-auto rounded-lg border bg-card">
          <ul className="divide-y">
            {items.map((pitch) => {
              const active = pitch.id === focusedId;
              return (
                <li key={pitch.id}>
                  <button
                    type="button"
                    ref={(el) => {
                      if (el) rowRefs.current.set(pitch.id, el);
                      else rowRefs.current.delete(pitch.id);
                    }}
                    onClick={() => {
                      setFocusedId(pitch.id);
                      setEditing(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors",
                      active ? "bg-muted" : "hover:bg-muted/40",
                    )}
                  >
                    <span className="mt-0.5">
                      {pitch.status === "approved" ? (
                        <Check className="size-4 text-(--status-success-fg)" />
                      ) : (
                        <span className="block size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{pitch.journalist.name}</span>
                        {pitch.match_score != null && (
                          <span className="shrink-0 text-xs font-semibold tabular-nums">
                            {Math.round(pitch.match_score * 100)}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {pitch.journalist.publication.name}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Detail / editor */}
        {focused && (
          <div className="flex min-h-[24rem] flex-col rounded-lg border bg-card">
            <div className="flex items-start justify-between gap-3 border-b p-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{focused.journalist.name}</span>
                  <StatusPill {...pitchStatusMeta(focused.status)} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="size-3" />
                  <span className="truncate">{focused.journalist.email ?? "No email"}</span>
                  <StatusPill {...emailStatusMeta(focused.journalist.email_status)} />
                </div>
              </div>
              {!editing && (
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={startEdit}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approve(focused)}
                    disabled={focused.status === "approved"}
                  >
                    <Check className="size-4" />
                    {focused.status === "approved" ? "Approved" : "Approve"}
                  </Button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Subject</label>
                  <Input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditing(false);
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-col space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Body</label>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        wordCount(editBody) > WORD_LIMIT
                          ? "text-(--status-warning-fg)"
                          : "text-muted-foreground",
                      )}
                    >
                      {wordCount(editBody)} words
                    </span>
                  </div>
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="min-h-48 flex-1 font-sans"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditing(false);
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
                    }}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                    <X className="size-4" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={save} disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-4 p-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Subject</div>
                  <p className="mt-1 font-medium">{focused.subject}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-muted-foreground">Body</div>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        wordCount(focused.body) > WORD_LIMIT
                          ? "text-(--status-warning-fg)"
                          : "text-muted-foreground",
                      )}
                    >
                      {wordCount(focused.body)} words
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{focused.body}</p>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="text-xs font-medium text-muted-foreground">Why matched</div>
                  <ReceptivityFlags
                    quotesFounders={focused.journalist.quotes_founders}
                    usesDataStudies={focused.journalist.uses_data_studies}
                  />
                  {focused.journalist.beat_summary && (
                    <p className="text-sm text-muted-foreground">{focused.journalist.beat_summary}</p>
                  )}
                </div>

                {focused.status === "approved" && focused.approved_at && (
                  <div className="border-t pt-4 text-xs text-muted-foreground">
                    Approved by {focused.approved_by ?? "operator"} <RelativeTime iso={focused.approved_at} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
