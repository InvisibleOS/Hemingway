"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { StatusPill } from "@/components/app/status-pill";
import { monitorEventStatusMeta, monitorSourceMeta } from "@/lib/status";
import { dayKey, dayLabel, relativeDayLabel, hostname } from "@/lib/format";
import type { MonitorEvent } from "@/lib/db/types";
import { Deadline } from "./deadline";
import { MonitorDrawer } from "./monitor-drawer";

export function MonitorFeed({ events }: { events: MonitorEvent[] }) {
  const [items, setItems] = React.useState(events);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  // Absolute day labels on the server / first paint; upgrade to Today/Yesterday
  // after mount so the relative headings never cause a hydration mismatch.
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setItems(events), [events]);
  React.useEffect(() => setMounted(true), []);

  const selected = items.find((e) => e.id === selectedId) ?? null;

  const applyUpdate = (id: string, patch: Partial<MonitorEvent>) => {
    setItems((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  // Group by arrival day, preserving the newest-first order of `items`.
  const groups: { key: string; label: string; events: MonitorEvent[] }[] = [];
  const byKey = new Map<string, MonitorEvent[]>();
  for (const event of items) {
    const key = dayKey(event.created_at);
    let bucket = byKey.get(key);
    if (!bucket) {
      bucket = [];
      byKey.set(key, bucket);
      const label = mounted ? relativeDayLabel(event.created_at) : dayLabel(event.created_at);
      groups.push({ key, label, events: bucket });
    }
    bucket.push(event);
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.key} className="space-y-2">
          <h2
            suppressHydrationWarning
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {group.label}
          </h2>
          <div className="grid gap-2">
            {group.events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedId(event.id)}
                className="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <StatusPill {...monitorSourceMeta(event.source)} />
                  <StatusPill {...monitorEventStatusMeta(event.status)} />
                </div>
                <div className="mt-2 font-medium">{event.title}</div>
                {event.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.summary}</p>
                )}
                <div className="mt-3 flex items-center justify-between gap-3">
                  {event.url ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {hostname(event.url)}
                      <ExternalLink className="size-3" />
                    </span>
                  ) : (
                    <span />
                  )}
                  <Deadline iso={event.deadline_at} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <MonitorDrawer
        event={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onUpdate={(patch) => {
          if (selected) applyUpdate(selected.id, patch);
        }}
      />
    </div>
  );
}
