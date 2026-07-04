"use client";

import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";

export default function MediaError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Database"
        description="India-first journalists and publications, built and maintained in-house."
      />
      <ErrorState
        title="Media Database failed to load"
        description="The journalist and publication data could not be fetched. Check the database connection and try again."
        retry={reset}
      />
    </div>
  );
}
