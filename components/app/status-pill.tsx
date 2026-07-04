import { cn } from "@/lib/utils";
import type { StatusHue, StatusMeta } from "@/lib/status";

// Full literal class strings per hue so Tailwind's scanner emits them. The tokens
// resolve to the --status-<hue>-* pairs in app/globals.css; `accent` maps to the
// brand subtle tokens (reserved for approved/won per design/README.md).
const HUE_CLASS: Record<StatusHue, string> = {
  neutral: "bg-(--status-neutral-bg) text-(--status-neutral-fg)",
  info: "bg-(--status-info-bg) text-(--status-info-fg)",
  progress: "bg-(--status-progress-bg) text-(--status-progress-fg)",
  signal: "bg-(--status-signal-bg) text-(--status-signal-fg)",
  success: "bg-(--status-success-bg) text-(--status-success-fg)",
  warning: "bg-(--status-warning-bg) text-(--status-warning-fg)",
  danger: "bg-(--status-danger-bg) text-(--status-danger-fg)",
  accent: "bg-(--accent-subtle-bg) text-(--accent-subtle-fg)",
};

type StatusPillProps = StatusMeta & {
  className?: string;
  /** Hide the leading dot for compact category tags. */
  hideDot?: boolean;
};

export function StatusPill({ hue, label, dim, hideDot, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        HUE_CLASS[hue],
        dim && "opacity-70",
        className,
      )}
    >
      {!hideDot && (
        <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" aria-hidden />
      )}
      {label}
    </span>
  );
}
