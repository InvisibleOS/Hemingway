import { cookies } from "next/headers";
import Link from "next/link";
import { BarChart3, FileDown } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { SandboxBadge } from "@/components/app/sandbox-badge";
import { Button } from "@/components/ui/button";
import { listClients, listSnapshots, listPlacements } from "@/lib/db";
import { buildMonthlyReport, availableReportMonths } from "@/lib/reporting/report";
import { ACTIVE_CLIENT_COOKIE } from "@/components/app/shell/constants";
import { MonthSelector } from "./_components/month-selector";
import { SnapshotButton } from "./_components/snapshot-button";
import { AiVisibility } from "./_components/ai-visibility";
import { LinksSection } from "./_components/links-section";
import { CoverageLog } from "./_components/coverage-log";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const clients = await listClients().catch(() => []);
  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_CLIENT_COOKIE)?.value ?? clients[0]?.id ?? null;
  const activeClient = clients.find((c) => c.id === activeId) ?? null;

  if (!activeClient) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Monthly coverage, links and AI visibility." />
        <EmptyState
          icon={BarChart3}
          title="No client selected"
          description="Pick a client from the switcher to see its monthly report."
        />
      </div>
    );
  }

  const [snapshots, placements] = await Promise.all([
    listSnapshots(activeClient.id),
    listPlacements(activeClient.id),
  ]);

  if (snapshots.length === 0 && placements.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description={`Monthly coverage, links and AI visibility for ${activeClient.name}.`}
        >
          <SnapshotButton clientId={activeClient.id} />
        </PageHeader>
        <EmptyState
          icon={BarChart3}
          title="No report data yet"
          description="Take the first metrics snapshot, or wait for the monthly job, to populate this client's report."
          action={<SnapshotButton clientId={activeClient.id} />}
        />
      </div>
    );
  }

  const months = availableReportMonths(snapshots, placements);
  const requested = (await searchParams).month;
  const monthKey = requested && months.some((m) => m.key === requested) ? requested : undefined;
  const report = buildMonthlyReport(snapshots, placements, monthKey);
  const current = report.current;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={`Coverage, links and AI visibility for ${activeClient.name}.`}
      >
        {report.isMock && <SandboxBadge title="Metrics are Sandbox data until DataForSEO keys are set" />}
        <MonthSelector months={report.availableMonths} value={report.monthKey} />
        <SnapshotButton clientId={activeClient.id} />
        <Button asChild size="sm">
          <Link href={`/reports/${activeClient.id}/export?month=${report.monthKey}`} target="_blank">
            <FileDown className="size-4" />
            Export
          </Link>
        </Button>
      </PageHeader>

      {current ? (
        <>
          <AiVisibility
            monthLabel={report.monthLabel}
            aiMentions={current.aiMentions}
            delta={report.deltas.aiMentions}
            previous={report.previous?.aiMentions ?? null}
            engines={report.engines}
            trend={report.trend}
          />
          <LinksSection
            monthLabel={report.monthLabel}
            backlinks={current.backlinks}
            referringDomains={current.referringDomains}
            backlinksDelta={report.deltas.backlinks}
            referringDomainsDelta={report.deltas.referringDomains}
            trend={report.trend}
          />
        </>
      ) : (
        <div className="rounded-lg border border-dashed bg-card/40 px-5 py-4 text-sm text-muted-foreground">
          No metrics snapshot for {report.monthLabel}. Take a snapshot to populate links and AI
          visibility for this month.
        </div>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-medium">Coverage log</h2>
          <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
            {report.placements.length}
          </span>
        </div>
        <CoverageLog placements={report.placements} />
      </section>
    </div>
  );
}
