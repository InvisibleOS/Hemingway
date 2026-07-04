"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/app/error-state";

export default function CampaignDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-6">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        Campaigns
      </Link>
      <ErrorState
        title="Campaign failed to load"
        description="This campaign could not be loaded. Check the database connection and try again."
        retry={reset}
      />
    </div>
  );
}
