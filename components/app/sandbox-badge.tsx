import { cn } from "@/lib/utils";

/**
 * Shown on any UI backed by a mock provider (docs/ui-style.md). Subtle amber dot
 * plus label. One shared component, used everywhere a Sandbox surface appears.
 */
export function SandboxBadge({
  label = "Sandbox",
  className,
  title = "Backed by a mock provider",
}: {
  label?: string;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-(--status-warning-bg) px-2 py-0.5 text-[11px] font-medium text-(--status-warning-fg)",
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-(--status-warning-fg)" aria-hidden />
      {label}
    </span>
  );
}
