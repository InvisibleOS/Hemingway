"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/db/types";
import { NAV_ITEMS } from "./nav";
import { ClientSwitcher } from "./client-switcher";

const STORAGE_KEY = "hemingway:sidebar-collapsed";

export function Sidebar({
  clients,
  activeClientId,
}: {
  clients: Client[];
  activeClientId: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  // Only animate width once the persisted state has been applied, so a stored
  // collapsed preference does not visibly animate open then closed on first load.
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    setReady(true);
  }, []);

  const toggle = () =>
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });

  return (
    <aside
      className={cn(
        "sticky top-0 z-20 flex h-svh shrink-0 flex-col gap-3 border-r bg-card/40 p-3",
        ready && "transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <Link href="/dashboard" className="flex items-center gap-2 px-1 py-1">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          H
        </span>
        {!collapsed && (
          <span className="font-display text-base font-semibold tracking-tight">Hemingway</span>
        )}
      </Link>

      <ClientSwitcher clients={clients} activeClientId={activeClientId} collapsed={collapsed} />

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const link = (
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn("size-4 shrink-0", active && "text-(--accent-subtle-fg)")}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.title}</TooltipContent>
            </Tooltip>
          ) : (
            <React.Fragment key={item.href}>{link}</React.Fragment>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={toggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
          collapsed && "justify-center px-0",
        )}
      >
        {collapsed ? (
          <PanelLeft className="size-4" />
        ) : (
          <>
            <PanelLeftClose className="size-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}
