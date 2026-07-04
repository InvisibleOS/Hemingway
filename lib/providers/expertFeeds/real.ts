import { NotImplementedError } from "../errors";
import type { ExpertFeedsProvider } from "./types";

// Shell. To go live: Qwoted / Featured APIs, or scheduled scrapes of the
// expert-request platforms. Map each incoming request into an ExpertRequest
// (source, title, url, summary, deadlineAt); the caller inserts them into
// monitor_events. Read credentials from EXPERTFEEDS_API_KEY.
export const realExpertFeeds: ExpertFeedsProvider = {
  async fetchNewRequests() {
    throw new NotImplementedError(
      "expertFeeds real provider not implemented. Add EXPERTFEEDS_API_KEY and a Qwoted/Featured integration.",
    );
  },
};
