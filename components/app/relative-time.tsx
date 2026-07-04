"use client";

import * as React from "react";
import { absoluteTime, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Relative timestamp with the absolute value on hover (docs/ui-style.md). Renders
 * the absolute form first so server and client markup match, then upgrades to the
 * relative form after mount.
 */
export function RelativeTime({
  iso,
  className,
  fallback = "Never",
}: {
  iso: string | null | undefined;
  className?: string;
  fallback?: string;
}) {
  const [label, setLabel] = React.useState(() => (iso ? absoluteTime(iso) : ""));

  React.useEffect(() => {
    if (iso) setLabel(relativeTime(iso));
  }, [iso]);

  if (!iso) {
    return <span className={cn("text-muted-foreground", className)}>{fallback}</span>;
  }

  return (
    <time dateTime={iso} title={absoluteTime(iso)} suppressHydrationWarning className={className}>
      {label}
    </time>
  );
}
