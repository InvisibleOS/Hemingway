import { deterministicVector, fnv1a } from "../_hash";
import type {
  ClassifyInput,
  DraftMonitorInput,
  DraftPitchInput,
  DraftedPitch,
  JournalistClassification,
  LlmProvider,
} from "./types";

export const mockLlm: LlmProvider = {
  async classifyJournalist(input: ClassifyInput): Promise<JournalistClassification> {
    const seed = fnv1a(input.name + (input.role ?? ""));
    const beat = input.articles[0]?.title
      ? input.articles[0].title.replace(/^A closer look at /i, "")
      : "food and beverage coverage";
    return {
      beatSummary: `Covers ${beat}. ${input.articles.length} recent pieces reviewed.`,
      receptivityNotes:
        "Responds to concrete data and clear exclusives. Prefers a single tight angle over broad pitches.",
      quotesFounders: seed % 2 === 0,
      usesDataStudies: seed % 3 === 0,
    };
  },

  async draftPitch(input: DraftPitchInput): Promise<DraftedPitch> {
    const stat = input.dataStudy?.title ?? "our latest category data";
    return {
      subject: `Data: ${input.storyAngle.slice(0, 48)}`,
      body: [
        `${stat} points to a clear shift worth a story.`,
        ``,
        `Hi ${input.journalist.name.split(" ")[0]}, ${input.client.name} pulled fresh numbers on ${input.storyAngle}. Happy to share the full dataset and a founder quote, exclusive to you first.`,
        ``,
        `Worth a look?`,
        `[sign-off]`,
      ].join("\n"),
    };
  },

  async draftMonitorResponse(input: DraftMonitorInput): Promise<string> {
    return [
      `On behalf of ${input.client.name}:`,
      ``,
      `Re "${input.event.title}" - here is a concise, on-record comment in the client's voice, grounded in their knowledge base. Ready to tailor length to the outlet.`,
    ].join("\n");
  },

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => deterministicVector(t));
  },
};
