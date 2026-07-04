import type { SendingDomainStatus } from "@/lib/db/types";

export interface DomainHealthProvider {
  getStatus(domain: string): Promise<SendingDomainStatus>;
}
