"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Inbox, Radar, Send } from "lucide-react";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/empty-state";
import { SandboxBadge } from "@/components/app/sandbox-badge";
import { monitorEventStatusMeta, monitorSourceMeta, pitchStatusMeta } from "@/lib/status";
import { setActiveClient } from "@/components/app/shell/actions";
import { Deadline } from "@/app/(app)/monitor/_components/deadline";
import type { MonitorEventWithClient } from "@/lib/db/monitor-events";
import type { PitchAwaitingApproval } from "@/lib/db/pitches";

function QueueCard({
  title,
  count,
  headerExtra,
  children,
}: {
  title: string;
  count: number;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">{title}</h2>
          <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
            {count}
          </span>
        </div>
        {headerExtra}
      </div>
      {children}
    </section>
  );
}

export function DashboardQueues({
  monitorEvents,
  pitches,
  monitorSandbox,
}: {
  monitorEvents: MonitorEventWithClient[];
  pitches: PitchAwaitingApproval[];
  monitorSandbox: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();

  const go = (clientId: string, href: string) => {
    startTransition(async () => {
      await setActiveClient(clientId);
      router.push(href);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <QueueCard
        title="Needs a response"
        count={monitorEvents.length}
        headerExtra={monitorSandbox && <SandboxBadge title="Expert-request feeds are mocked" />}
      >
        {monitorEvents.length === 0 ? (
          <EmptyState icon={Radar} title="Nothing waiting" description="No monitor events need action." />
        ) : (
          <div className="grid gap-2">
            {monitorEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => go(event.client.id, "/monitor")}
                className="w-full space-y-1.5 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{event.client.name}</span>
                  <Deadline iso={event.deadline_at} />
                </div>
                <div className="line-clamp-1 text-sm font-medium">{event.title}</div>
                <div className="flex items-center gap-2">
                  <StatusPill {...monitorSourceMeta(event.source)} />
                  <StatusPill {...monitorEventStatusMeta(event.status)} />
                </div>
              </button>
            ))}
          </div>
        )}
      </QueueCard>

      <QueueCard title="Awaiting approval" count={pitches.length}>
        {pitches.length === 0 ? (
          <EmptyState icon={Inbox} title="Queue is clear" description="No pitches await approval." />
        ) : (
          <div className="grid gap-2">
            {pitches.map((pitch) => (
              <button
                key={pitch.id}
                type="button"
                onClick={() =>
                  go(pitch.campaign.client.id, `/campaigns/${pitch.campaign.id}?tab=approvals`)
                }
                className="w-full space-y-1.5 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{pitch.campaign.client.name}</span>
                  {pitch.match_score != null && (
                    <span className="text-xs font-semibold tabular-nums">
                      {Math.round(pitch.match_score * 100)}
                    </span>
                  )}
                </div>
                <div className="line-clamp-1 text-sm font-medium">{pitch.journalist.name}</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">
                    <Send className="mr-1 inline size-3" />
                    {pitch.campaign.name}
                  </span>
                  <StatusPill {...pitchStatusMeta(pitch.status)} />
                </div>
              </button>
            ))}
          </div>
        )}
      </QueueCard>
    </div>
  );
}
