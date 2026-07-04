import Anthropic from "@anthropic-ai/sdk";
import type {
  ClassifyInput,
  DraftMonitorInput,
  DraftPitchInput,
  DraftedPitch,
  JournalistClassification,
  LlmProvider,
} from "./types";

// The only place in the app that talks to Anthropic (text) and Voyage (embed).
// docs/providers.md: classify + embed on the light tier, draftPitch on the
// strongest tier. Anthropic has no embeddings endpoint, so embed uses Voyage
// (voyage-3.5, 1024 dims) to match the vector(1024) schema.
const STRONG = process.env.ANTHROPIC_MODEL_STRONG ?? "claude-opus-4-8";
const LIGHT = process.env.ANTHROPIC_MODEL_LIGHT ?? "claude-haiku-4-5";

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for llm (real). See .env.example.");
  }
  client ??= new Anthropic();
  return client;
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Pull the first JSON object out of a model response, tolerating code fences. */
function parseJson<T>(raw: string): T {
  const fenced = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  const slice = start >= 0 && end > start ? fenced.slice(start, end + 1) : fenced;
  return JSON.parse(slice) as T;
}

export const realLlm: LlmProvider = {
  async classifyJournalist(input: ClassifyInput): Promise<JournalistClassification> {
    const message = await anthropic().messages.create({
      model: LIGHT,
      max_tokens: 1024,
      system:
        "You classify journalists for a PR media database. Return ONLY a JSON object with keys " +
        "beatSummary (string), receptivityNotes (string), quotesFounders (boolean), usesDataStudies (boolean). " +
        "No prose, no markdown, no em dashes.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            name: input.name,
            role: input.role,
            publication: input.publication,
            recentArticles: input.articles.slice(0, 15),
          }),
        },
      ],
    });
    return parseJson<JournalistClassification>(textOf(message));
  },

  async draftPitch(input: DraftPitchInput): Promise<DraftedPitch> {
    const message = await anthropic().messages.create({
      model: STRONG,
      max_tokens: 1024,
      system: [
        "You write cold PR pitches to journalists. Hard rules:",
        "- Body under 120 words.",
        "- Lead the first line with a concrete data point.",
        "- Subject reads like a headline the journalist would write.",
        "- Offer the story exclusive-first, one clear ask.",
        "- No em dashes anywhere. Professional sign-off placeholder [sign-off].",
        "Return ONLY a JSON object: { subject: string, body: string }.",
      ].join("\n"),
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            journalist: input.journalist,
            client: input.client,
            storyAngle: input.storyAngle,
            dataStudy: input.dataStudy,
          }),
        },
      ],
    });
    return parseJson<DraftedPitch>(textOf(message));
  },

  async draftMonitorResponse(input: DraftMonitorInput): Promise<string> {
    const message = await anthropic().messages.create({
      model: STRONG,
      max_tokens: 1024,
      system:
        "You draft a same-day expert-comment response in the client's voice, grounded strictly in " +
        "their knowledge base. Terse, professional, no em dashes, no exclamation marks. Return the response text only.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            client: input.client,
            request: input.event,
          }),
        },
      ],
    });
    return textOf(message);
  },

  async embed(texts: string[]): Promise<number[][]> {
    const key = process.env.VOYAGE_API_KEY;
    if (!key) {
      throw new Error("VOYAGE_API_KEY is required for llm.embed (real). See .env.example.");
    }
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.VOYAGE_MODEL ?? "voyage-3.5",
        input: texts,
        input_type: "document",
      }),
    });
    if (!res.ok) {
      throw new Error(`Voyage embeddings failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { data: { embedding: number[] }[] };
    return json.data.map((d) => d.embedding);
  },
};
