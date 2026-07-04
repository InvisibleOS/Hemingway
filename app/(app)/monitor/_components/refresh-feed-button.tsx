"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshMonitorFeedAction } from "../actions";

export function RefreshFeedButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const refresh = () => {
    startTransition(async () => {
      try {
        const res = await refreshMonitorFeedAction(clientId);
        toast(
          res.inserted
            ? `${res.inserted} new ${res.inserted === 1 ? "request" : "requests"}`
            : "No new requests",
        );
        router.refresh();
      } catch {
        toast.error("Could not refresh the feed", { description: "Try again shortly." });
      }
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={refresh} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      Check for requests
    </Button>
  );
}
