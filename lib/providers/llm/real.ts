import type {
  ClassifyInput,
  DraftMonitorInput,
  DraftPitchInput,
  DraftedPitch,
  JournalistClassification,
  LlmProvider,
} from "./types";

// The only place in the app that talks to the LLM. Text generation runs on Qwen
// through OpenRouter's OpenAI-compatible API: drafting on the strong tier,
// classification on the light tier (docs/providers.md). Embeddings stay on Voyage
// (voyage-3.5, 1024 dims) to match the vector(1024) schema, since OpenRouter has
// no embeddings endpoint; without a Voyage key, embed throws and /lib/matching
// takes its keyword fallback.
const OPENROUTER_BASE = process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1";
const STRONG = process.env.OPENROUTER_MODEL ?? "qwen/qwen3.6-plus";
const LIGHT = process.env.OPENROUTER_MODEL_LIGHT ?? "qwen/qwen3.6-flash";

function openRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is required for llm (real). See .env.example.");
  }
  return key;
}

type ChatResponse = { choices?: { message?: { content?: string } }[] };

/** One OpenRouter chat completion; returns the assistant's text. */
async function chat(model: string, system: string, user: string, maxTokens = 1024): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${openRouterKey()}`,
      // Optional attribution shown on the OpenRouter dashboard; harmless if unset.
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "https://strategi.is",
      "X-Title": "Hemingway",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenRouter chat failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as ChatResponse;
  return (json.choices?.[0]?.message?.content ?? "").trim();
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
    const text = await chat(
      LIGHT,
      "You classify journalists for a PR media database. Return ONLY a JSON object with keys " +
        "beatSummary (string), receptivityNotes (string), quotesFounders (boolean), usesDataStudies (boolean). " +
        "No prose, no markdown, no em dashes.",
      JSON.stringify({
        name: input.name,
        role: input.role,
        publication: input.publication,
        recentArticles: input.articles.slice(0, 15),
      }),
    );
    return parseJson<JournalistClassification>(text);
  },

  async draftPitch(input: DraftPitchInput): Promise<DraftedPitch> {
    const text = await chat(
      STRONG,
      [
        "You write cold PR pitches to journalists. Hard rules:",
        "- Body under 120 words.",
        "- Lead the first line with a concrete data point.",
        "- Subject reads like a headline the journalist would write.",
        "- Offer the story exclusive-first, one clear ask.",
        "- No em dashes anywhere. Professional sign-off placeholder [sign-off].",
        "Return ONLY a JSON object: { subject: string, body: string }.",
      ].join("\n"),
      JSON.stringify({
        journalist: input.journalist,
        client: input.client,
        storyAngle: input.storyAngle,
        dataStudy: input.dataStudy,
      }),
    );
    return parseJson<DraftedPitch>(text);
  },

  async draftMonitorResponse(input: DraftMonitorInput): Promise<string> {
    return chat(
      STRONG,
      "You draft a same-day expert-comment response in the client's voice, grounded strictly in " +
        "their knowledge base. Terse, professional, no em dashes, no exclamation marks. Return the response text only.",
      JSON.stringify({ client: input.client, request: input.event }),
    );
  },

  async embed(texts: string[]): Promise<number[][]> {
    const key = process.env.VOYAGE_API_KEY;
    if (!key) {
      // No embeddings provider configured. Return nothing rather than throwing:
      // matching then uses its keyword fallback and ingestion stores null
      // embeddings without logging a per-journalist error. (Qwen's only embedding
      // model on OpenRouter is 4096-dim and slow, so it is not wired here; add a
      // VOYAGE_API_KEY to enable vector matching. See docs/providers.md.)
      return [];
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
