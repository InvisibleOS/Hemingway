import type { SendingDomainStatus } from "@/lib/db/types";
import type { DomainHealthProvider } from "./types";

// Returns "ready" for demo clients (docs/providers.md).
export const mockDomainHealth: DomainHealthProvider = {
  async getStatus(): Promise<SendingDomainStatus> {
    return "ready";
  },
};
