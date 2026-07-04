"use client";

import * as React from "react";
import { formatNumber } from "@/lib/format";

/**
 * Animate a number from `from` up to `value` once on mount (docs/ui-style.md:
 * "Numbers animate on the reporting view, count-up, subtle"). Eased, and skipped
 * entirely when the viewer prefers reduced motion.
 */
export function useCountUp(
  value: number,
  { from = 0, duration = 900 }: { from?: number; duration?: number } = {},
): number {
  const [display, setDisplay] = React.useState(from);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || duration <= 0) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    let startTs: number | null = null;
    const delta = value - from;

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const t = Math.min(1, (ts - startTs) / duration);
      // easeOutCubic: fast then settling, reads as "counting up".
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + delta * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, from, duration]);

  return display;
}

export function CountUp({
  value,
  from = 0,
  duration = 900,
  className,
}: {
  value: number;
  from?: number;
  duration?: number;
  className?: string;
}) {
  const current = useCountUp(value, { from, duration });
  return (
    <span className={className} suppressHydrationWarning>
      {formatNumber(current)}
    </span>
  );
}
