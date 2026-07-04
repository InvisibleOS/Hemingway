"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Something went wrong",
  description = "This view could not load. Try again.",
  retry,
  retryLabel = "Retry",
  className,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card/40 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="rounded-full bg-(--status-danger-bg) p-3 text-(--status-danger-fg)">
        <AlertTriangle className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {retry && (
        <Button variant="outline" size="sm" onClick={retry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
