import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/app/module-placeholder";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Settings"
      description="Team, provider integrations and per-client configuration."
      icon={Settings}
      note="Provider status and integration keys will live here, driven by the provider registry."
    />
  );
}
