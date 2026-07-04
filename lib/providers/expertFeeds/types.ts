import type { MonitorSource, Vertical } from "@/lib/db/types";

export type ExpertRequest = {
  source: MonitorSource;
  title: string;
  url?: string;
  summary: string;
  deadlineAt?: string;
};

export interface ExpertFeedsProvider {
  fetchNewRequests(vertical: Vertical): Promise<ExpertRequest[]>;
}
