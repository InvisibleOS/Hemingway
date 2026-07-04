"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

export type TrendDatum = { label: string; value: number; selected?: boolean };

const VIEW_W = 640;

/**
 * Single-series trend. `area` anchors the fill to a zero baseline (honest
 * magnitude, used for the hero metric); `sparkline` fits the baseline to the data
 * so a gentle series still shows its shape (used for the secondary link measures).
 * Never a dual-axis chart: two measures of different scale get two charts.
 */
export function TrendChart({
  data,
  color,
  variant = "area",
  height = 200,
  format = formatNumber,
  ariaLabel,
  className,
}: {
  data: TrendDatum[];
  color: string;
  variant?: "area" | "sparkline";
  height?: number;
  format?: (n: number) => string;
  ariaLabel?: string;
  className?: string;
}) {
  const gradientId = React.useId();
  const [active, setActive] = React.useState<number | null>(null);

  const pad = { top: 18, right: 20, bottom: 26, left: 20 };
  const plotW = VIEW_W - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const n = data.length;
  const values = data.map((d) => d.value);
  const dataMax = Math.max(1, ...values);
  const dataMin = Math.min(...values);

  const [yMin, yMax] =
    variant === "area"
      ? [0, dataMax]
      : (() => {
          const range = dataMax - dataMin || Math.max(1, dataMax * 0.1);
          return [dataMin - range * 0.18, dataMax + range * 0.18];
        })();

  const xAt = (i: number) => pad.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) =>
    pad.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  const points = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value), d, i }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const areaPath =
    n >= 1
      ? `${linePath} L${points[n - 1].x} ${pad.top + plotH} L${points[0].x} ${pad.top + plotH} Z`
      : "";

  const gridYs = [0.25, 0.5, 0.75].map((t) => pad.top + t * plotH);
  const selectedIndex = data.findIndex((d) => d.selected);
  const activeIndex = active ?? (selectedIndex >= 0 ? selectedIndex : n - 1);
  const step = n <= 1 ? plotW : plotW / (n - 1);

  const summary =
    ariaLabel ??
    `Trend across ${n} months, from ${format(values[0] ?? 0)} to ${format(values[n - 1] ?? 0)}.`;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        width="100%"
        height="auto"
        role="img"
        aria-label={summary}
        className="block overflow-visible"
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={variant === "area" ? 0.28 : 0.16} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Recessive gridlines */}
        {gridYs.map((y, i) => (
          <line
            key={i}
            x1={pad.left}
            x2={VIEW_W - pad.right}
            y1={y}
            y2={y}
            stroke="var(--border)"
            strokeWidth={1}
            aria-hidden
          />
        ))}

        {variant === "area" && areaPath && <path d={areaPath} fill={`url(#${gradientId})`} aria-hidden />}
        {variant === "sparkline" && areaPath && (
          <path d={areaPath} fill={`url(#${gradientId})`} opacity={0.6} aria-hidden />
        )}

        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Crosshair on the active month */}
        {n > 0 && (
          <line
            x1={points[activeIndex].x}
            x2={points[activeIndex].x}
            y1={pad.top}
            y2={pad.top + plotH}
            stroke="var(--input)"
            strokeWidth={1}
            strokeDasharray="3 3"
            aria-hidden
          />
        )}

        {/* Markers; the active/selected point is emphasized with a surface ring */}
        {points.map((p) => {
          const isActive = p.i === activeIndex;
          return (
            <circle
              key={p.i}
              cx={p.x}
              cy={p.y}
              r={isActive ? 4.5 : 2.5}
              fill={color}
              stroke={isActive ? "var(--card)" : "none"}
              strokeWidth={isActive ? 2 : 0}
              aria-hidden
            />
          );
        })}

        {/* x-axis month ticks */}
        {points.map((p) => (
          <text
            key={`t-${p.i}`}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize={11}
            aria-hidden
          >
            {p.d.label}
          </text>
        ))}

        {/* Hit-testing slices */}
        {points.map((p) => (
          <rect
            key={`h-${p.i}`}
            x={p.x - step / 2}
            y={pad.top}
            width={step}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setActive(p.i)}
            onMouseMove={() => setActive(p.i)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {n > 0 && active !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2 py-1 text-xs shadow-md"
          style={{
            left: `${(points[active].x / VIEW_W) * 100}%`,
            top: `${(points[active].y / height) * 100}%`,
          }}
        >
          <div className="text-muted-foreground">{data[active].label}</div>
          <div className="font-semibold tabular-nums">{format(data[active].value)}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Per-engine magnitude. A single-hue horizontal bar chart: bars carry magnitude,
 * values are direct-labeled, so identity never rests on color. Ordered by count.
 */
export function EngineBars({
  data,
  color,
  format = formatNumber,
  className,
}: {
  data: { key: string; label: string; count: number; prev?: number }[];
  color: string;
  format?: (n: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((d) => {
        const pct = (d.count / max) * 100;
        const grew = d.prev !== undefined && d.count > d.prev;
        return (
          <div key={d.key} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3">
            <span className="truncate text-sm text-muted-foreground">{d.label}</span>
            <span className="relative h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <span
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(pct, d.count > 0 ? 4 : 0)}%`, backgroundColor: color }}
              />
            </span>
            <span className="flex items-baseline gap-1.5 text-sm font-semibold tabular-nums">
              {format(d.count)}
              {grew && (
                <span className="text-xs font-medium text-(--status-success-fg)">
                  +{format(d.count - (d.prev ?? 0))}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
