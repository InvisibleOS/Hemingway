import { providerMode, type ProviderMode } from "./mode";

/**
 * Describes every provider for the leadership-facing integrations screen
 * (docs/providers.md is the purchase checklist). `mvpMode` is the intended mode
 * for the MVP; `mode()` reports what the current env actually resolves to.
 */
export type ProviderKey =
  | "SCRAPER"
  | "LLM"
  | "SEODATA"
  | "VERIFIER"
  | "SENDER"
  | "EXPERTFEEDS"
  | "DOMAINHEALTH";

export type ProviderInfo = {
  key: ProviderKey;
  label: string;
  description: string;
  mvpMode: ProviderMode;
  realVendor: string;
  mode: () => ProviderMode;
};

/**
 * Whether a provider currently resolves to its mock implementation. The app uses
 * this (server-side only) to decide where to show the Sandbox badge. It reads
 * through the provider layer rather than the env var directly, so no feature
 * code learns the env contract (CLAUDE.md, the provider rule).
 */
export function providerIsMock(key: ProviderKey): boolean {
  return providerMode(key) === "mock";
}

export const PROVIDER_REGISTRY: ProviderInfo[] = [
  {
    key: "SCRAPER",
    label: "Scraper",
    description: "Maps publication sites and scrapes author pages and articles.",
    mvpMode: "real",
    realVendor: "Firecrawl",
    mode: () => providerMode("SCRAPER"),
  },
  {
    key: "LLM",
    label: "AI models",
    description: "Journalist classification, pitch drafting, monitor responses, embeddings.",
    mvpMode: "real",
    realVendor: "Anthropic + Voyage",
    mode: () => providerMode("LLM"),
  },
  {
    key: "SEODATA",
    label: "Link and AI-mention data",
    description: "Backlinks and per-engine AI mentions for the monthly report.",
    mvpMode: "real",
    realVendor: "DataForSEO",
    mode: () => providerMode("SEODATA"),
  },
  {
    key: "VERIFIER",
    label: "Email verification",
    description: "Verifies addresses before they enter the media database.",
    mvpMode: "mock",
    realVendor: "ZeroBounce / NeverBounce",
    mode: () => providerMode("VERIFIER"),
  },
  {
    key: "SENDER",
    label: "Sending platform",
    description: "Pushes approved pitches to the outbound campaign and polls replies.",
    mvpMode: "mock",
    realVendor: "Smartlead / Instantly",
    mode: () => providerMode("SENDER"),
  },
  {
    key: "EXPERTFEEDS",
    label: "Expert-request feeds",
    description: "Fetches expert-comment requests into the monitor feed.",
    mvpMode: "mock",
    realVendor: "Qwoted / Featured",
    mode: () => providerMode("EXPERTFEEDS"),
  },
  {
    key: "DOMAINHEALTH",
    label: "Domain health",
    description: "Reports each client's sending-domain warmup status.",
    mvpMode: "mock",
    realVendor: "Sending platform",
    mode: () => providerMode("DOMAINHEALTH"),
  },
];
