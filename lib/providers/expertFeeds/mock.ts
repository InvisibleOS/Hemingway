import type { Vertical } from "@/lib/db/types";
import { fnv1a, mulberry32 } from "../_hash";
import type { ExpertFeedsProvider, ExpertRequest } from "./types";

const OUTLETS = [
  "Deccan Pulse",
  "Bengaluru Table",
  "The Filter Coffee",
  "Metro Plate",
  "Coastline Kitchen",
  "The Tasting Room",
];

const TOPICS: Record<Vertical, string[]> = {
  fnb: ["cloud kitchen economics", "regional cuisine trends", "cafe culture in Bengaluru"],
  hospitality: ["boutique hotel demand", "weekend travel spikes", "experiential stays"],
  real_estate: ["office absorption", "co-living growth", "plotted development demand"],
  d2c: ["repeat purchase rates", "quick-commerce shift", "founder-led brand building"],
  other: ["category outlook", "consumer sentiment", "pricing pressure"],
};

const SOURCES = ["expert_platform", "journo_request"] as const;

// Generates 3 to 5 plausible new events per call, deterministic by vertical and
// the current day, with believable outlet names and near-term deadlines.
export const mockExpertFeeds: ExpertFeedsProvider = {
  async fetchNewRequests(vertical: Vertical): Promise<ExpertRequest[]> {
    const day = new Date().toISOString().slice(0, 10);
    const rand = mulberry32(fnv1a(`${vertical}:${day}`));
    const count = 3 + Math.floor(rand() * 3);
    const topics = TOPICS[vertical] ?? TOPICS.other;

    return Array.from({ length: count }, (_, i): ExpertRequest => {
      const topic = topics[Math.floor(rand() * topics.length)];
      const outlet = OUTLETS[Math.floor(rand() * OUTLETS.length)];
      const deadlineDays = 1 + Math.floor(rand() * 4);
      return {
        source: SOURCES[Math.floor(rand() * SOURCES.length)],
        title: `Seeking expert comment on ${topic}`,
        url: `https://sandbox.expert-requests.example/${vertical}/${day}/${i}`,
        summary: `${outlet} is preparing a piece on ${topic} and wants a founder or operator quote.`,
        deadlineAt: new Date(Date.now() + deadlineDays * 86_400_000).toISOString(),
      };
    });
  },
};
