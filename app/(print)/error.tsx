"use client";

/**
 * Light-themed error boundary for the print/export document. ErrorState is styled
 * for the dark app chrome, so this uses a plain light card to match the white
 * report surface a failed export would otherwise replace with an unstyled page.
 */
export default function PrintError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 print:hidden">
      <div className="max-w-md space-y-3 rounded-lg bg-white p-8 text-center shadow-sm">
        <p className="text-base font-semibold text-neutral-900">Report failed to load</p>
        <p className="text-sm text-neutral-600">
          This report could not be generated. Check the database connection and try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
