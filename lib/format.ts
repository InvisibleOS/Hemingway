/**
 * Small pure formatting helpers shared across the app. No provider or db access.
 */
import type { PublicationTier, Vertical } from "@/lib/db/types";

export const VERTICAL_LABELS: Record<Vertical, string> = {
  fnb: "F&B",
  hospitality: "Hospitality",
  real_estate: "Real Estate",
  d2c: "D2C",
  other: "Other",
};

export const VERTICAL_OPTIONS: { value: Vertical; label: string }[] = (
  Object.keys(VERTICAL_LABELS) as Vertical[]
).map((value) => ({ value, label: VERTICAL_LABELS[value] }));

export const TIER_LABELS: Record<PublicationTier, string> = {
  national: "National",
  regional: "Regional",
  trade: "Trade",
  blog: "Blog",
};

export const TIER_OPTIONS: { value: PublicationTier; label: string }[] = (
  Object.keys(TIER_LABELS) as PublicationTier[]
).map((value) => ({ value, label: TIER_LABELS[value] }));

export function verticalLabel(v: Vertical): string {
  return VERTICAL_LABELS[v] ?? v;
}

export function tierLabel(t: PublicationTier): string {
  return TIER_LABELS[t] ?? t;
}

/** Bare hostname, no scheme or www. Returns the input on parse failure. */
export function hostname(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

/** Prefix a bare domain with https:// so it parses as a URL. */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Derive a readable publication name from a URL host, e.g. "thehindu.com" -> "Thehindu". */
export function nameFromUrl(url: string): string {
  const host = hostname(url);
  const core = host.split(".").slice(0, -1).join(" ") || host;
  return core
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["week", 1000 * 60 * 60 * 24 * 7],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "3 days ago" style relative label for an ISO timestamp, computed against `now`. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = then - now;
  const abs = Math.abs(diff);
  if (abs < 45 * 1000) return "just now";
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

/** Absolute, human-readable timestamp used in tooltips. */
export function absoluteTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Format a pgvector column value for insert: number[] -> "[0.1,0.2,...]". */
export function toVectorLiteral(vec: number[]): string {
  return JSON.stringify(vec);
}
