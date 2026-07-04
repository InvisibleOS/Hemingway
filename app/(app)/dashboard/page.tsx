import { LayoutDashboard } from "lucide-react";
import { ModulePlaceholder } from "@/components/app/module-placeholder";

export default function DashboardPage() {
  return (
    <ModulePlaceholder
      title="Dashboard"
      description="Operational overview across every client."
      icon={LayoutDashboard}
      note="Campaign health, monitor activity and reporting summaries will surface here once those modules are live."
    />
  );
}
