import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSigned } from "@/lib/format";
import type { MetricDelta } from "@/lib/reporting/report";

/**
 * Month-over-month change. Up is treated as good (more coverage, links, mentions),
 * so a rise reads success-green and a fall danger-red. A missing previous month
 * renders as a calm "New" tag rather than a fake zero.
 */
export function DeltaBadge({
  delta,
  size = "sm",
  className,
}: {
  delta: MetricDelta;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (delta.value === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-(--status-neutral-bg) px-2 py-0.5 font-medium text-(--status-neutral-fg)",
          size === "lg" ? "text-sm" : "text-xs",
          className,
        )}
      >
        New
      </span>
    );
  }

  const up = delta.value > 0;
  const flat = delta.value === 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const tone = flat
    ? "bg-(--status-neutral-bg) text-(--status-neutral-fg)"
    : up
      ? "bg-(--status-success-bg) text-(--status-success-fg)"
      : "bg-(--status-danger-bg) text-(--status-danger-fg)";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium tabular-nums",
        tone,
        size === "lg" ? "text-sm" : "text-xs",
        className,
      )}
    >
      <Icon className={size === "lg" ? "size-4" : "size-3.5"} aria-hidden />
      {formatSigned(delta.value)}
      {delta.percent !== null && !flat && (
        <span className="opacity-80">({formatSigned(delta.percent)}%)</span>
      )}
    </span>
  );
}
