import Link from "next/link";
import { ChevronRight, Plug, Users, Building2, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { cn } from "@/lib/utils";

export const metadata = { title: "Settings" };

type SettingSection = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  note?: string;
};

const SECTIONS: SettingSection[] = [
  {
    title: "Integrations",
    description: "Provider modes and the API keys each one needs to go live.",
    icon: Plug,
    href: "/settings/integrations",
  },
  {
    title: "Team",
    description: "Operators, roles and pitch-approval permissions.",
    icon: Users,
    note: "Arrives in a later phase",
  },
  {
    title: "Clients",
    description: "Per-client sending domains, knowledge base and verticals.",
    icon: Building2,
    note: "Arrives in a later phase",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Team, provider integrations and per-client configuration." />

      <div className="grid gap-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const interactive = Boolean(section.href);
          const body = (
            <div
              className={cn(
                "flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors",
                interactive ? "hover:bg-muted/40" : "opacity-60",
              )}
            >
              <div className="rounded-md bg-muted p-2 text-muted-foreground">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{section.title}</span>
                  {section.note && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {section.note}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{section.description}</p>
              </div>
              {interactive && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
            </div>
          );

          return section.href ? (
            <Link key={section.title} href={section.href} className="block">
              {body}
            </Link>
          ) : (
            <div key={section.title}>{body}</div>
          );
        })}
      </div>
    </div>
  );
}
