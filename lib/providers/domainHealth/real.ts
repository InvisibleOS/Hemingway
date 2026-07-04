import { NotImplementedError } from "../errors";
import type { DomainHealthProvider } from "./types";

// Shell. To go live: the sending platform's domain / warmup status endpoint.
// Map the platform's warmup state to the sending_domain_status enum
// (not_setup | warming | ready | degraded). Read credentials from
// DOMAINHEALTH_API_KEY (often the same account as the sender provider).
export const realDomainHealth: DomainHealthProvider = {
  async getStatus() {
    throw new NotImplementedError(
      "domainHealth real provider not implemented. Wire the sending platform's domain/warmup status endpoint.",
    );
  },
};
