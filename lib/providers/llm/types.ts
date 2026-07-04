export type ClassifyInput = {
  name: string;
  role?: string;
  publication?: string;
  articles: { title: string; summary?: string }[];
};

export type JournalistClassification = {
  beatSummary: string;
  receptivityNotes: string;
  quotesFounders: boolean;
  usesDataStudies: boolean;
};

export type DraftPitchInput = {
  journalist: { name: string; beatSummary?: string; receptivityNotes?: string };
  client: { name: string };
  storyAngle: string;
  dataStudy?: { title?: string; summary?: string };
};

export type DraftedPitch = {
  subject: string;
  body: string;
};

export type DraftMonitorInput = {
  client: { name: string; knowledgeBase?: string };
  event: { title: string; summary?: string; source: string };
};

export interface LlmProvider {
  classifyJournalist(input: ClassifyInput): Promise<JournalistClassification>;
  draftPitch(input: DraftPitchInput): Promise<DraftedPitch>;
  draftMonitorResponse(input: DraftMonitorInput): Promise<string>;
  /** Returns one 1024-dim embedding per input text (Voyage voyage-3.5 in real mode). */
  embed(texts: string[]): Promise<number[][]>;
}
