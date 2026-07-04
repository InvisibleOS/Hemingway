import { cookies } from "next/headers";
import { Radar } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { SandboxBadge } from "@/components/app/sandbox-badge";
import { providerIsMock } from "@/lib/providers";
import { listClients, listMonitorEventsForClient } from "@/lib/db";
import { ACTIVE_CLIENT_COOKIE } from "@/components/app/shell/constants";
import { MonitorFeed } from "./_components/monitor-feed";
import { RefreshFeedButton } from "./_components/refresh-feed-button";

export const dynamic = "force-dynamic";

export default async function MonitorPage() {
  const clients = await listClients().catch(() => []);
  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_CLIENT_COOKIE)?.value ?? clients[0]?.id ?? null;
  const activeClient = clients.find((c) => c.id === activeId) ?? null;
  const sandbox = providerIsMock("EXPERTFEEDS");

  if (!activeClient) {
    return (
      <div className="space-y-6">
        <PageHeader title="Monitor" description="Expert requests and brand mentions per client." />
        <EmptyState
          icon={Radar}
          title="No client selected"
          description="Pick a client from the switcher to see its monitor feed."
        />
      </div>
    );
  }

  const events = await listMonitorEventsForClient(activeClient.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitor"
        description={`Reactive requests and mentions for ${activeClient.name}.`}
      >
        {sandbox && <SandboxBadge title="Expert-request feeds are mocked" />}
        <RefreshFeedButton clientId={activeClient.id} />
      </PageHeader>

      {events.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No monitor events yet"
          description="Check for requests to pull the latest expert-comment opportunities."
        />
      ) : (
        <MonitorFeed events={events} />
      )}
    </div>
  );
}
