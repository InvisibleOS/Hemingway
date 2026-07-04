import { LineChart, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

function Flag({ icon: Icon, label }: { icon: typeof Quote; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      <Icon className="size-3" />
      {label}
    </span>
  );
}

/** Receptivity signals: quotes founders, uses data studies. */
export function ReceptivityFlags({
  quotesFounders,
  usesDataStudies,
  className,
  emptyLabel = "None noted",
}: {
  quotesFounders: boolean;
  usesDataStudies: boolean;
  className?: string;
  emptyLabel?: string;
}) {
  if (!quotesFounders && !usesDataStudies) {
    return <span className={cn("text-xs text-muted-foreground", className)}>{emptyLabel}</span>;
  }
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {quotesFounders && <Flag icon={Quote} label="Quotes founders" />}
      {usesDataStudies && <Flag icon={LineChart} label="Data studies" />}
    </div>
  );
}
