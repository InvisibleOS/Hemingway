import { notFound } from "next/navigation";
import { getClient, listSnapshots, listPlacements } from "@/lib/db";
import {
  availableReportMonths,
  buildMonthlyReport,
  placementOrigin,
  type MetricDelta,
} from "@/lib/reporting/report";
import { placementTypeMeta } from "@/lib/status";
import { verticalLabel, hostname, shortDate, formatNumber, formatSigned } from "@/lib/format";
import type { Placement } from "@/lib/db/types";
import { PrintButton } from "./_components/print-button";

export const dynamic = "force-dynamic";

const ACCENT = "#C0531F";
const BACKLINKS_COLOR = "#2563EB";
const REFERRING_COLOR = "#0D9488";

export default async function ReportExportPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) notFound();

  const [snapshots, placements] = await Promise.all([
    listSnapshots(client.id),
    listPlacements(client.id),
  ]);
  // Validate the month param against months that actually have data, matching the
  // in-app page, so a hand-edited URL falls back to the latest month rather than
  // rendering an "undefined" label.
  const { month } = await searchParams;
  const months = availableReportMonths(snapshots, placements);
  const monthKey = month && months.some((m) => m.key === month) ? month : undefined;
  const report = buildMonthlyReport(snapshots, placements, monthKey);
  const current = report.current;

  const generatedOn = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Screen-only toolbar; never printed. */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-300 bg-white/90 px-6 py-3 backdrop-blur print:hidden">
        <div className="text-sm text-neutral-600">
          Report preview: {client.name} · {report.monthLabel}
        </div>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-[900px] px-6 py-8 print:p-0">
        <article className="report-doc report-page mx-auto bg-white px-12 py-10 text-neutral-900 shadow-xl print:shadow-none">
          {/* Masthead */}
          <header className="report-avoid-break flex items-start justify-between gap-6 border-b-2 pb-5" style={{ borderColor: ACCENT }}>
            <div>
              <div className="text-[11px] font-semibold tracking-[0.16em] uppercase" style={{ color: ACCENT }}>
                Strategi · Monthly PR Report
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
                {client.name}
              </h1>
              <div className="mt-1 text-sm text-neutral-500">
                {client.website ? `${hostname(client.website)} · ` : ""}
                {verticalLabel(client.vertical)}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-medium text-neutral-900">{report.monthLabel}</div>
              <div className="text-neutral-500">Generated {generatedOn}</div>
            </div>
          </header>

          {/* AI visibility: the hero */}
          <section className="report-avoid-break mt-8">
            <h2 className="text-xs font-semibold tracking-[0.12em] text-neutral-500 uppercase">
              AI visibility
            </h2>
            {current ? (
              <div className="mt-3 grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.15fr] md:items-center">
                <div>
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-semibold tracking-tight text-neutral-900 tabular-nums">
                      {formatNumber(current.aiMentions)}
                    </span>
                    <DeltaText delta={report.deltas.aiMentions} className="mb-2" />
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    AI mentions in {report.monthLabel}
                    {report.previous && `, from ${formatNumber(report.previous.aiMentions)} last month`}
                  </p>
                  {report.engines.length > 0 && (
                    <div className="mt-6 space-y-2.5">
                      {report.engines.map((e) => {
                        const max = Math.max(1, ...report.engines.map((x) => x.count));
                        return (
                          <div key={e.key} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3">
                            <span className="truncate text-sm text-neutral-600">{e.label}</span>
                            <span className="h-2 overflow-hidden rounded-full bg-neutral-100">
                              <span
                                className="block h-full rounded-full"
                                style={{ width: `${Math.max((e.count / max) * 100, e.count > 0 ? 4 : 0)}%`, backgroundColor: ACCENT }}
                              />
                            </span>
                            <span className="text-sm font-semibold text-neutral-900 tabular-nums">
                              {formatNumber(e.count)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <StaticTrend
                  values={report.trend.map((t) => t.aiMentions)}
                  labels={report.trend.map((t) => t.shortLabel)}
                  color={ACCENT}
                  fill
                  baseline="zero"
                  height={150}
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">No metrics snapshot for {report.monthLabel}.</p>
            )}
          </section>

          {/* Links */}
          {current && (
            <section className="report-avoid-break mt-10 grid grid-cols-2 gap-6">
              <LinkStat
                label="Backlinks"
                value={current.backlinks}
                delta={report.deltas.backlinks}
                color={BACKLINKS_COLOR}
                values={report.trend.map((t) => t.backlinks)}
                labels={report.trend.map((t) => t.shortLabel)}
              />
              <LinkStat
                label="Referring domains"
                value={current.referringDomains}
                delta={report.deltas.referringDomains}
                color={REFERRING_COLOR}
                values={report.trend.map((t) => t.referringDomains)}
                labels={report.trend.map((t) => t.shortLabel)}
              />
            </section>
          )}

          {/* Coverage log */}
          <section className="mt-10">
            <h2 className="text-xs font-semibold tracking-[0.12em] text-neutral-500 uppercase">
              Coverage log
            </h2>
            {report.placements.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">No coverage recorded for this month.</p>
            ) : (
              <table className="mt-3 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-neutral-300 text-left text-[11px] tracking-wide text-neutral-500 uppercase">
                    <th className="py-2 pr-3 font-medium">Outlet</th>
                    <th className="py-2 pr-3 font-medium">Headline</th>
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Origin</th>
                    <th className="py-2 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {report.placements.map((p) => (
                    <CoverageRow key={p.id} placement={p} />
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <footer className="mt-12 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
            Prepared by Strategi. Backlinks and AI mentions sourced from DataForSEO; coverage from the
            Hemingway media operations log.{report.isMock ? " Figures shown are Sandbox data." : ""}{" "}
            Confidential. For the client named above.
          </footer>
        </article>
      </div>
    </>
  );
}

function CoverageRow({ placement }: { placement: Placement }) {
  const origin = placementOrigin(placement);
  const type = placementTypeMeta(placement.placement_type);
  const outlet = placement.publication_name || (placement.url ? hostname(placement.url) : "Unknown outlet");
  return (
    <tr className="border-b border-neutral-200 align-top">
      <td className="py-2.5 pr-3 font-medium text-neutral-900">{outlet}</td>
      <td className="max-w-[18rem] py-2.5 pr-3 text-neutral-700">
        {placement.url ? (
          <a href={placement.url} className="underline decoration-neutral-300 underline-offset-2">
            {placement.headline || placement.url}
          </a>
        ) : (
          placement.headline || "Untitled"
        )}
      </td>
      <td className="py-2.5 pr-3">
        <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
          {type.label}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-neutral-500">{origin.label}</td>
      <td className="py-2.5 text-right whitespace-nowrap text-neutral-500 tabular-nums">
        {placement.published_at ? shortDate(placement.published_at) : "Not dated"}
      </td>
    </tr>
  );
}

function LinkStat({
  label,
  value,
  delta,
  color,
  values,
  labels,
}: {
  label: string;
  value: number;
  delta: MetricDelta;
  color: string;
  values: number[];
  labels: string[];
}) {
  return (
    <div className="report-avoid-break rounded-lg border border-neutral-200 p-5">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="mt-2 flex items-end gap-2.5">
        <span className="text-3xl font-semibold text-neutral-900 tabular-nums">{formatNumber(value)}</span>
        <DeltaText delta={delta} className="mb-1" />
      </div>
      <div className="mt-3">
        <StaticTrend values={values} labels={labels} color={color} baseline="fit" height={80} />
      </div>
    </div>
  );
}

function DeltaText({ delta, className = "" }: { delta: MetricDelta; className?: string }) {
  if (delta.value === null) {
    return <span className={`text-sm font-medium text-neutral-500 ${className}`}>New</span>;
  }
  const up = delta.value > 0;
  const flat = delta.value === 0;
  const color = flat ? "#737373" : up ? "#15803D" : "#B91C1C";
  const arrow = flat ? "→" : up ? "▲" : "▼";
  return (
    <span className={`text-sm font-semibold tabular-nums ${className}`} style={{ color }}>
      {arrow} {formatSigned(delta.value)}
      {delta.percent !== null && !flat && ` (${formatSigned(delta.percent)}%)`}
    </span>
  );
}

/** Static (print-safe) trend. `zero` baseline for magnitude fills; `fit` for shape sparklines. */
function StaticTrend({
  values,
  labels,
  color,
  fill = false,
  baseline = "fit",
  height = 120,
}: {
  values: number[];
  labels: string[];
  color: string;
  fill?: boolean;
  baseline?: "zero" | "fit";
  height?: number;
}) {
  const W = 480;
  const pad = { top: 12, right: 12, bottom: 20, left: 12 };
  const plotW = W - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const n = values.length;

  const dataMax = Math.max(1, ...values);
  const dataMin = Math.min(...values);
  const [yMin, yMax] =
    baseline === "zero"
      ? [0, dataMax]
      : (() => {
          const range = dataMax - dataMin || Math.max(1, dataMax * 0.1);
          return [dataMin - range * 0.18, dataMax + range * 0.18];
        })();

  const xAt = (i: number) => pad.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => pad.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;
  const pts = values.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const area = n >= 1 ? `${line} L${pts[n - 1].x} ${pad.top + plotH} L${pts[0].x} ${pad.top + plotH} Z` : "";

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height="auto" className="block" aria-hidden>
      {[0.5].map((t) => (
        <line
          key={t}
          x1={pad.left}
          x2={W - pad.right}
          y1={pad.top + t * plotH}
          y2={pad.top + t * plotH}
          stroke="#E5E5E5"
          strokeWidth={1}
        />
      ))}
      {fill && area && <path d={area} fill={color} fillOpacity={0.12} />}
      {line && <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === n - 1 ? 3.5 : 2} fill={color} />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={xAt(i)} y={height - 6} textAnchor="middle" fontSize={10} fill="#A3A3A3">
          {l}
        </text>
      ))}
    </svg>
  );
}
