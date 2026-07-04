"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Report month picker. Drives the report via the `?month=YYYY-MM` query param. */
export function MonthSelector({
  months,
  value,
}: {
  months: { key: string; label: string }[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const onChange = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("month", key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={pending || months.length === 0}>
      <SelectTrigger size="sm" className="min-w-40">
        <Calendar className="size-4" />
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent align="end">
        {months.map((m) => (
          <SelectItem key={m.key} value={m.key}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
