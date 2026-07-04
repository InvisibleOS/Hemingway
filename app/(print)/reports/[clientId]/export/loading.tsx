/**
 * Light-themed placeholder for the print/export document so the tab is never
 * blank while the server component resolves. Uses neutral blocks rather than the
 * dark app Skeleton, to match the white report surface.
 */
export default function ReportExportLoading() {
  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-300 bg-white/90 px-6 py-3 backdrop-blur print:hidden">
        <div className="h-4 w-64 animate-pulse rounded bg-neutral-300" />
        <div className="h-8 w-24 animate-pulse rounded bg-neutral-300" />
      </div>

      <div className="mx-auto max-w-[900px] px-6 py-8">
        <div className="space-y-8 rounded-lg bg-white p-10 shadow-sm">
          <div className="space-y-3">
            <div className="h-8 w-72 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
          </div>
          <div className="h-56 w-full animate-pulse rounded bg-neutral-100" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-36 w-full animate-pulse rounded bg-neutral-100" />
            <div className="h-36 w-full animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="h-64 w-full animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    </>
  );
}
