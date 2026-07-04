import { Radar } from "lucide-react";
import { ModulePlaceholder } from "@/components/app/module-placeholder";

export default function MonitorPage() {
  return (
    <ModulePlaceholder
      title="Monitor"
      description="Expert requests and brand mentions, ready for same-day responses."
      icon={Radar}
      note="The monitor digest and one-click response drafting are Module 3."
    />
  );
}
