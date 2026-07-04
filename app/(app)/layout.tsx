import { cookies } from "next/headers";
import { Sidebar } from "@/components/app/shell/sidebar";
import { CommandPalette } from "@/components/app/shell/command-palette";
import { ACTIVE_CLIENT_COOKIE } from "@/components/app/shell/constants";
import { listClients } from "@/lib/db";
import type { Client } from "@/lib/db/types";

// The shell reads the clients table at request time; never prerender it.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Resilient to a missing database in local dev: the shell still renders.
  const clients: Client[] = await listClients().catch(() => []);
  const cookieStore = await cookies();
  const activeClientId =
    cookieStore.get(ACTIVE_CLIENT_COOKIE)?.value ?? clients[0]?.id ?? null;

  return (
    <div className="flex min-h-svh">
      <Sidebar clients={clients} activeClientId={activeClientId} />
      <div className="flex min-w-0 flex-1 flex-col">
        <CommandPalette clients={clients} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
