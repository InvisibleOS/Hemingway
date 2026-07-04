import { Megaphone } from "lucide-react";
import { ModulePlaceholder } from "@/components/app/module-placeholder";

export default function CampaignsPage() {
  return (
    <ModulePlaceholder
      title="Campaigns"
      description="Story angles, matched journalists and the pitch approval flow."
      icon={Megaphone}
      note="The campaign workspace, matching engine and approval queue are Module 2."
    />
  );
}
