"use client";

import { Sparkles } from "lucide-react";
import { CountUp } from "./count-up";
import { DeltaBadge } from "./delta";
import { TrendChart, EngineBars } from "./charts";
import type { EngineDatum, MetricDelta, TrendPoint } from "@/lib/reporting/report";

/**
 * The hero of the report: AI mentions get the most visual weight. A count-up
 * headline, the month-over-month delta stated prominently, the multi-month trend
 * in the brand accent (the key series), and a per-engine breakdown.
 */
export function AiVisibility({
  monthLabel,
  aiMentions,
  delta,
  previous,
  engines,
  trend,
}: {
  monthLabel: string;
  aiMentions: number;
  delta: MetricDelta;
  previous: number | null;
  engines: EngineDatum[];
  trend: TrendPoint[];
}) {
  const trendData = trend.map((t) => ({
    label: t.shortLabel,
    value: t.aiMentions,
    selected: t.selected,
  }));

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-(--accent-subtle-bg) text-(--accent-subtle-fg)">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">AI visibility</h2>
            <p className="text-xs text-muted-foreground">Mentions across AI answer engines</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{monthLabel}</span>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-5 lg:items-center">
        <div className="lg:col-span-2">
          <div className="flex items-end gap-3">
            <CountUp
              value={aiMentions}
              className="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl"
            />
            <DeltaBadge delta={delta} size="lg" className="mb-2" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            AI mentions in {monthLabel}
            {previous !== null && (
              <>
                {" "}
                <span className="text-foreground/70">
                  (from {previous.toLocaleString("en-IN")} last month)
                </span>
              </>
            )}
          </p>

          {engines.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                By engine
              </p>
              <EngineBars data={engines} color="var(--accent-brand)" />
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <TrendChart
            data={trendData}
            color="var(--accent-brand)"
            variant="area"
            height={220}
            ariaLabel={`AI mentions trend ending ${monthLabel}, currently ${aiMentions.toLocaleString("en-IN")}.`}
          />
        </div>
      </div>
    </section>
  );
}
