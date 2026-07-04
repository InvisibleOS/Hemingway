"use client";

import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";

export default function SettingsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Team, provider integrations and per-client configuration." />
      <ErrorState
        title="Settings failed to load"
        description="This screen could not load. Try again."
        retry={reset}
      />
    </div>
  );
}
