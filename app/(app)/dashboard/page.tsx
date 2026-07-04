import { PageHeader } from "@/components/app/page-header";
import { providerIsMock } from "@/lib/providers";
import { listActionableMonitorEvents, listPitchesAwaitingApproval } from "@/lib/db";
import { DashboardQueues } from "./_components/dashboard-queues";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [monitorEvents, pitches] = await Promise.all([
    listActionableMonitorEvents(8),
    listPitchesAwaitingApproval(8),
  ]);
  const monitorSandbox = providerIsMock("EXPERTFEEDS");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="What needs attention today, across every client."
      />
      <DashboardQueues
        monitorEvents={monitorEvents}
        pitches={pitches}
        monitorSandbox={monitorSandbox}
      />
    </div>
  );
}
