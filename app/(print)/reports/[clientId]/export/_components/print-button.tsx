"use client";

import { Printer } from "lucide-react";

/** Triggers the browser print dialog (Save as PDF). Screen only; hidden in print. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md bg-[#C0531F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#A8471A]"
    >
      <Printer className="size-4" />
      Print / Save as PDF
    </button>
  );
}
