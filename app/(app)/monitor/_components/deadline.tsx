"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { absoluteTime, deadlineInfo, type DeadlineInfo } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Live deadline countdown with urgent styling under 24 hours. Renders a neutral
 * absolute time on the server / first paint, then upgrades to the countdown after
 * mount (avoids a hydration mismatch), ticking every minute.
 */
export function Deadline({
  iso,
  className,
}: {
  iso: string | null | undefined;
  className?: string;
}) {
  const [info, setInfo] = React.useState<DeadlineInfo | null>(null);

  React.useEffect(() => {
    if (!iso) return;
    const update = () => setInfo(deadlineInfo(iso));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [iso]);

  if (!iso) {
    return <span className={cn("text-xs text-muted-foreground", className)}>No deadline</span>;
  }

  if (!info) {
    return (
      <span
        suppressHydrationWarning
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums",
          className,
        )}
      >
        <Clock className="size-3" />
        {absoluteTime(iso)}
      </span>
    );
  }

  return (
    <span
      title={absoluteTime(iso)}
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        info.overdue
          ? "text-(--status-danger-fg)"
          : info.urgent
            ? "text-(--status-warning-fg)"
            : "text-muted-foreground",
        className,
      )}
    >
      <Clock className="size-3" />
      {info.overdue ? "Overdue" : `Due in ${info.label}`}
    </span>
  );
}
