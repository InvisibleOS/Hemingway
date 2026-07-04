/**
 * Pure reporting computation. Turns a client's raw metrics_snapshots + placements
 * into the shape the monthly report renders: current vs previous figures, deltas,
 * per-engine AI breakdown, the multi-month trend, and the month's coverage log.
 *
 * No db or provider access. Consumed by both the in-app report view and the
 * print/export document so the two never drift.
 */
import type { MetricsSnapshot, MetricsSource, Placement } from "@/lib/db/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Display names for the AI engines seen in ai_mentions_breakdown. */
const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  claude: "Claude",
  google: "Google AI",
  copilot: "Copilot",
};

export function engineLabel(key: string): string {
  if (ENGINE_LABELS[key]) return ENGINE_LABELS[key];
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** "YYYY-MM" -> "July 2026". */
export function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const name = MONTH_NAMES[Number(month) - 1] ?? month;
  return `${name} ${year}`;
}

/** "YYYY-MM" -> "Jul" (axis ticks). */
export function shortMonthLabel(key: string): string {
  const [, month] = key.split("-");
  return SHORT_MONTHS[Number(month) - 1] ?? month;
}

/** Calendar-month bucket for a date/timestamp string, by its stored (UTC) value. */
export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

export type PlacementOrigin = "pitch" | "monitor" | "direct";

export function placementOrigin(p: Placement): { key: PlacementOrigin; label: string } {
  if (p.pitch_id) return { key: "pitch", label: "Pitch" };
  if (p.monitor_event_id) return { key: "monitor", label: "Monitor event" };
  return { key: "direct", label: "Direct" };
}

function toBreakdown(value: MetricsSnapshot["ai_mentions_breakdown"]): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

export type ReportMetrics = {
  date: string;
  monthKey: string;
  backlinks: number;
  referringDomains: number;
  aiMentions: number;
  breakdown: Record<string, number>;
  source: MetricsSource;
};

export type TrendPoint = {
  monthKey: string;
  shortLabel: string;
  backlinks: number;
  referringDomains: number;
  aiMentions: number;
  selected: boolean;
};

export type EngineDatum = { key: string; label: string; count: number; prev: number };

export type MetricDelta = {
  /** current - previous, or null when there is no previous month to compare. */
  value: number | null;
  /** Rounded percentage change, or null when previous is absent or zero. */
  percent: number | null;
};

export type MonthlyReport = {
  monthKey: string;
  monthLabel: string;
  current: ReportMetrics | null;
  previous: ReportMetrics | null;
  deltas: { backlinks: MetricDelta; referringDomains: MetricDelta; aiMentions: MetricDelta };
  engines: EngineDatum[];
  trend: TrendPoint[];
  placements: Placement[];
  availableMonths: { key: string; label: string }[];
  isMock: boolean;
};

function toMetrics(s: MetricsSnapshot): ReportMetrics {
  return {
    date: s.snapshot_date,
    monthKey: monthKeyOf(s.snapshot_date),
    backlinks: s.backlinks_count,
    referringDomains: s.referring_domains,
    aiMentions: s.ai_mentions_count,
    breakdown: toBreakdown(s.ai_mentions_breakdown),
    source: s.source,
  };
}

function delta(current: number, previous: number | null): MetricDelta {
  if (previous === null) return { value: null, percent: null };
  const value = current - previous;
  const percent = previous === 0 ? null : Math.round((value / previous) * 100);
  return { value, percent };
}

/** Months that have any data (a snapshot or a placement), newest first. */
export function availableReportMonths(
  snapshots: MetricsSnapshot[],
  placements: Placement[],
): { key: string; label: string }[] {
  const keys = new Set<string>();
  for (const s of snapshots) keys.add(monthKeyOf(s.snapshot_date));
  for (const p of placements) if (p.published_at) keys.add(monthKeyOf(p.published_at));
  return [...keys]
    .sort((a, b) => b.localeCompare(a))
    .map((key) => ({ key, label: monthLabel(key) }));
}

/**
 * Build the monthly report for a client.
 *
 * @param snapshots  all of the client's snapshots, ascending by date.
 * @param placements all of the client's placements.
 * @param monthKey   selected "YYYY-MM"; defaults to the latest month with data.
 */
export function buildMonthlyReport(
  snapshots: MetricsSnapshot[],
  placements: Placement[],
  monthKey?: string,
): MonthlyReport {
  const sorted = [...snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  const available = availableReportMonths(snapshots, placements);
  const selectedKey = monthKey ?? available[0]?.key ?? monthKeyOf(new Date().toISOString());

  const currentIndex = sorted.findIndex((s) => monthKeyOf(s.snapshot_date) === selectedKey);
  const currentSnap = currentIndex >= 0 ? sorted[currentIndex] : null;
  // Previous is the snapshot immediately before the selected one; if the selected
  // month has no snapshot, compare against the latest snapshot that precedes it.
  const previousSnap = currentSnap
    ? (currentIndex > 0 ? sorted[currentIndex - 1] : null)
    : ([...sorted].reverse().find((s) => monthKeyOf(s.snapshot_date) < selectedKey) ?? null);

  const current = currentSnap ? toMetrics(currentSnap) : null;
  const previous = previousSnap ? toMetrics(previousSnap) : null;

  const deltas = {
    backlinks: delta(current?.backlinks ?? 0, previous?.backlinks ?? null),
    referringDomains: delta(current?.referringDomains ?? 0, previous?.referringDomains ?? null),
    aiMentions: delta(current?.aiMentions ?? 0, previous?.aiMentions ?? null),
  };

  const engineKeys = new Set<string>([
    ...Object.keys(current?.breakdown ?? {}),
    ...Object.keys(previous?.breakdown ?? {}),
  ]);
  const engines: EngineDatum[] = [...engineKeys]
    .map((key) => ({
      key,
      label: engineLabel(key),
      count: current?.breakdown[key] ?? 0,
      prev: previous?.breakdown[key] ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const trend: TrendPoint[] = sorted.map((s) => {
    const key = monthKeyOf(s.snapshot_date);
    return {
      monthKey: key,
      shortLabel: shortMonthLabel(key),
      backlinks: s.backlinks_count,
      referringDomains: s.referring_domains,
      aiMentions: s.ai_mentions_count,
      selected: key === selectedKey,
    };
  });

  const monthPlacements = placements
    .filter((p) => p.published_at && monthKeyOf(p.published_at) === selectedKey)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));

  return {
    monthKey: selectedKey,
    monthLabel: monthLabel(selectedKey),
    current,
    previous,
    deltas,
    engines,
    trend,
    placements: monthPlacements,
    availableMonths: available,
    isMock: current?.source === "mock",
  };
}
