"use client";

import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";

export default function CampaignsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Campaigns" description="PR campaigns run per client." />
      <ErrorState
        title="Campaigns failed to load"
        description="The campaign list could not be fetched. Check the database connection and try again."
        retry={reset}
      />
    </div>
  );
}
