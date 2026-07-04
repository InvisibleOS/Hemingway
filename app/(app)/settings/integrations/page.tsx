import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/app/status-pill";
import { SandboxBadge } from "@/components/app/sandbox-badge";
import { PROVIDER_REGISTRY, seoDataSource } from "@/lib/providers";

// Reads provider modes from the environment at request time; never prerender.
export const dynamic = "force-dynamic";

export const metadata = { title: "Integrations" };

/**
 * Leadership-facing purchase checklist (docs/providers.md). Read-only. Every
 * external service, what it does, whether it runs Live or in Sandbox, and what
 * each Sandbox row needs to go live: one API key, no other change to the app.
 *
 * Mode is classified by the intended MVP configuration so the checklist is
 * stable; where the current environment resolves differently (for example
 * DataForSEO running in Sandbox until its keys are set) a muted caption says so.
 * Provider state is read only through the provider layer (providerMode via the
 * registry, seoDataSource), so this screen never learns the env contract itself.
 */
export default function IntegrationsPage() {
  const rows = PROVIDER_REGISTRY.map((provider) => {
    const live = provider.mvpMode === "real";
    const runtime =
      provider.key === "SEODATA"
        ? seoDataSource() === "dataforseo"
          ? "real"
          : "mock"
        : provider.mode();
    return { ...provider, live, runtime, diverged: runtime !== provider.mvpMode };
  });

  const liveCount = rows.filter((row) => row.live).length;
  const sandboxCount = rows.length - liveCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Every external service Hemingway uses, its current mode, and what each needs to go live."
      />

      <p className="max-w-3xl text-sm text-muted-foreground">
        Live integrations run on subscriptions the team already holds. Sandbox integrations return
        realistic data today and activate with a single API key, with no other change to the app.
        Each Sandbox row below is one key to add.
      </p>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <StatusPill hue="success" label="Live" />
          <span className="tabular-nums">{liveCount}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <SandboxBadge title="Backed by a mock provider until its key is added" />
          <span className="tabular-nums">{sandboxCount}</span>
        </span>
      </div>

      <div className="overflow-auto rounded-lg border bg-card">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b">
              <th className="h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground">
                Integration
              </th>
              <th className="h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground">
                What it does
              </th>
              <th className="h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground">
                Mode
              </th>
              <th className="h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground">
                Activation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.key} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-medium">{row.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{row.realVendor}</div>
                </td>
                <td className="max-w-md px-4 py-4 text-muted-foreground">{row.description}</td>
                <td className="px-4 py-4">
                  {row.live ? (
                    <StatusPill hue="success" label="Live" />
                  ) : (
                    <SandboxBadge />
                  )}
                  {row.diverged && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {row.live ? "In Sandbox until keys are set" : "Running live now"}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {row.live ? "Uses an existing subscription" : "Activates with API key"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
