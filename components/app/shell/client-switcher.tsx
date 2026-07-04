"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { verticalLabel } from "@/lib/format";
import type { Client } from "@/lib/db/types";
import { setActiveClient } from "./actions";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function ClientSwitcher({
  clients,
  activeClientId,
  collapsed = false,
}: {
  clients: Client[];
  activeClientId: string | null;
  collapsed?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const active = clients.find((c) => c.id === activeClientId) ?? clients[0] ?? null;

  const select = (id: string) => {
    startTransition(async () => {
      await setActiveClient(id);
      router.refresh();
    });
  };

  if (!clients.length) {
    return collapsed ? (
      <div className="flex h-9 items-center justify-center text-muted-foreground">
        <Building2 className="size-4" />
      </div>
    ) : (
      <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
        No clients yet
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={pending}>
        {collapsed ? (
          <button
            type="button"
            title={active?.name}
            className="mx-auto flex size-9 items-center justify-center rounded-md border bg-card text-[11px] font-semibold text-(--accent-subtle-fg) hover:bg-muted"
          >
            {active ? initials(active.name) : <Building2 className="size-4" />}
          </button>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md border bg-card px-2.5 py-2 text-left transition-colors hover:bg-muted"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/15 text-[11px] font-semibold text-(--accent-subtle-fg)">
              {active ? initials(active.name) : "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {active?.name ?? "Select client"}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {active ? verticalLabel(active.vertical) : ""}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Clients</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {clients.map((c) => (
          <DropdownMenuItem key={c.id} onSelect={() => select(c.id)} className="gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-semibold">
              {initials(c.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{c.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {verticalLabel(c.vertical)}
              </span>
            </span>
            {c.id === active?.id && <Check className="size-4 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
