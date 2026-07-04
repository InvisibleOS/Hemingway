"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { takeSnapshotAction } from "../actions";

export function SnapshotButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const run = () => {
    startTransition(async () => {
      try {
        const res = await takeSnapshotAction(clientId);
        const sourceLabel = res.source === "dataforseo" ? "DataForSEO" : "Sandbox";
        if (res.outcome === "inserted") {
          toast(`Snapshot captured from ${sourceLabel}`);
        } else if (res.outcome === "skipped") {
          toast("This month is already recorded", {
            description: "The next snapshot runs at the start of next month.",
          });
        } else {
          toast("No website set for this client");
        }
        router.refresh();
      } catch {
        toast.error("Could not take a snapshot", { description: "Try again shortly." });
      }
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={run} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      Take snapshot
    </Button>
  );
}
