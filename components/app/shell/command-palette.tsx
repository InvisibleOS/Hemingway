"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { verticalLabel } from "@/lib/format";
import type { Client } from "@/lib/db/types";
import { NAV_ITEMS } from "./nav";
import { setActiveClient } from "./actions";

export function CommandPalette({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const switchClient = async (id: string) => {
    setOpen(false);
    await setActiveClient(id);
    router.refresh();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search clients and pages" />
      <CommandList>
        <CommandEmpty>No results found</CommandEmpty>
        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.href} value={`nav ${item.title}`} onSelect={() => go(item.href)}>
              <item.icon className="size-4" />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
        {clients.length > 0 && (
          <CommandGroup heading="Clients">
            {clients.map((c) => (
              <CommandItem
                key={c.id}
                value={`client ${c.name}`}
                onSelect={() => switchClient(c.id)}
              >
                <Building2 className="size-4" />
                {c.name}
                <span className="ml-auto text-xs text-muted-foreground">
                  {verticalLabel(c.vertical)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
