import { cookies } from "next/headers";
import { Megaphone, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { getPitchCountsByCampaigns, listCampaigns, listClients } from "@/lib/db";
import { ACTIVE_CLIENT_COOKIE } from "@/components/app/shell/constants";
import { CampaignFormDialog } from "./_components/campaign-form-dialog";
import { CampaignList } from "./_components/campaign-list";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const clients = await listClients().catch(() => []);
  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_CLIENT_COOKIE)?.value ?? clients[0]?.id ?? null;
  const activeClient = clients.find((c) => c.id === activeId) ?? null;

  if (!activeClient) {
    return (
      <div className="space-y-6">
        <PageHeader title="Campaigns" description="PR campaigns run per client." />
        <EmptyState
          icon={Megaphone}
          title="No client selected"
          description="Add a client, then pick one from the switcher to run a campaign."
        />
      </div>
    );
  }

  const campaigns = await listCampaigns(activeClient.id);
  const counts = await getPitchCountsByCampaigns(campaigns.map((c) => c.id));

  return (
    <div className="space-y-6">
      <PageHeader title="Campaigns" description={`PR campaigns for ${activeClient.name}.`}>
        <CampaignFormDialog
          mode="create"
          clientId={activeClient.id}
          trigger={
            <Button>
              <Plus className="size-4" />
              New campaign
            </Button>
          }
        />
      </PageHeader>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description={`Create the first campaign for ${activeClient.name}.`}
          action={
            <CampaignFormDialog
              mode="create"
              clientId={activeClient.id}
              trigger={
                <Button variant="outline" size="sm">
                  <Plus className="size-4" />
                  New campaign
                </Button>
              }
            />
          }
        />
      ) : (
        <CampaignList campaigns={campaigns} counts={counts} />
      )}
    </div>
  );
}
