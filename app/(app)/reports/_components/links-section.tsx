"use client";

import { Link2, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CountUp } from "./count-up";
import { DeltaBadge } from "./delta";
import { TrendChart } from "./charts";
import type { MetricDelta, TrendPoint } from "@/lib/reporting/report";

function LinkCard({
  icon: Icon,
  label,
  value,
  delta,
  color,
  series,
  monthLabel,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  delta: MetricDelta;
  color: string;
  series: { label: string; value: number; selected: boolean }[];
  monthLabel: string;
}) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-3 flex items-end gap-2.5">
        <CountUp value={value} className="text-3xl font-semibold tracking-tight tabular-nums" />
        <DeltaBadge delta={delta} className="mb-1.5" />
      </div>
      <div className="mt-3">
        <TrendChart
          data={series}
          color={color}
          variant="sparkline"
          height={96}
          ariaLabel={`${label} trend ending ${monthLabel}, currently ${value.toLocaleString("en-IN")}.`}
        />
      </div>
    </section>
  );
}

/**
 * Backlinks and referring domains. Two measures of different scale, so two
 * charts, never a shared axis. Both draw from metrics_snapshots.
 */
export function LinksSection({
  monthLabel,
  backlinks,
  referringDomains,
  backlinksDelta,
  referringDomainsDelta,
  trend,
}: {
  monthLabel: string;
  backlinks: number;
  referringDomains: number;
  backlinksDelta: MetricDelta;
  referringDomainsDelta: MetricDelta;
  trend: TrendPoint[];
}) {
  const backlinkSeries = trend.map((t) => ({
    label: t.shortLabel,
    value: t.backlinks,
    selected: t.selected,
  }));
  const referringSeries = trend.map((t) => ({
    label: t.shortLabel,
    value: t.referringDomains,
    selected: t.selected,
  }));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <LinkCard
        icon={Link2}
        label="Backlinks"
        value={backlinks}
        delta={backlinksDelta}
        color="var(--status-info-fg)"
        series={backlinkSeries}
        monthLabel={monthLabel}
      />
      <LinkCard
        icon={Globe}
        label="Referring domains"
        value={referringDomains}
        delta={referringDomainsDelta}
        color="var(--status-signal-fg)"
        series={referringSeries}
        monthLabel={monthLabel}
      />
    </div>
  );
}
