import { BarChart3 } from "lucide-react";
import { ModulePlaceholder } from "@/components/app/module-placeholder";

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Reports"
      description="Monthly coverage, backlinks and AI mention deltas per client."
      icon={BarChart3}
      note="The reporting view and exportable deliverable are Module 4."
    />
  );
}
