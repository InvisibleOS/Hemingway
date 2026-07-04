/**
 * Provider mode selection. Each provider is chosen by a per-provider env var
 * `<NAME>_PROVIDER=mock|real` (docs/providers.md). Defaults to mock so the app
 * runs with no external keys. Only files inside /lib/providers may read this;
 * nothing else in the app knows which mode is active.
 */
export type ProviderMode = "mock" | "real";

export function providerMode(name: string): ProviderMode {
  return process.env[`${name}_PROVIDER`]?.toLowerCase() === "real"
    ? "real"
    : "mock";
}
