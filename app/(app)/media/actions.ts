"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getJournalist,
  getPublication,
  insertPublication,
  listArticlesByJournalist,
  updateJournalist,
  updatePublication,
  type Article,
  type EmailStatus,
  type Json,
} from "@/lib/db";
import { verifier, providerIsMock } from "@/lib/providers";
import { startIngestion } from "@/lib/ingestion";
import type { IngestionState } from "@/lib/ingestion/types";
import { nameFromUrl, normalizeUrl } from "@/lib/format";

const VERTICALS = ["fnb", "hospitality", "real_estate", "d2c", "other"] as const;
const TIERS = ["national", "regional", "trade", "blog"] as const;

const AddPublicationSchema = z.object({
  url: z.string().trim().min(1, "Enter a publication URL"),
  vertical: z.enum(VERTICALS),
  tier: z.enum(TIERS).optional(),
  name: z.string().trim().optional(),
});

export type AddPublicationInput = z.input<typeof AddPublicationSchema>;

function queuedState(mode: "add" | "refresh"): IngestionState {
  return {
    status: "queued",
    phase: "Queued",
    processed: 0,
    total: 0,
    journalistsFound: 0,
    articlesFound: 0,
    errors: [],
    mode,
    startedAt: new Date().toISOString(),
  };
}

function baseScrapeConfig(scrapeConfig: unknown): Record<string, unknown> {
  if (scrapeConfig && typeof scrapeConfig === "object" && !Array.isArray(scrapeConfig)) {
    const { ...rest } = scrapeConfig as Record<string, unknown>;
    delete rest.ingestion;
    return rest;
  }
  return {};
}

export async function addPublicationAction(
  input: AddPublicationInput,
): Promise<{ id: string; name: string }> {
  const parsed = AddPublicationSchema.parse(input);
  const url = normalizeUrl(parsed.url);
  try {
    void new URL(url);
  } catch {
    throw new Error("Enter a valid URL");
  }

  const name = parsed.name && parsed.name.length ? parsed.name : nameFromUrl(url);
  const pub = await insertPublication({
    name,
    website: url,
    vertical: parsed.vertical,
    tier: parsed.tier ?? "regional",
    scrape_config: { ingestion: queuedState("add") } as unknown as Json,
  });

  startIngestion(pub.id, "add");
  revalidatePath("/media");
  return { id: pub.id, name: pub.name };
}

export async function refreshPublicationAction(publicationId: string): Promise<void> {
  const pub = await getPublication(publicationId);
  if (!pub) throw new Error("Publication not found");

  await updatePublication(publicationId, {
    scrape_config: {
      ...baseScrapeConfig(pub.scrape_config),
      ingestion: queuedState("refresh"),
    } as unknown as Json,
  });

  startIngestion(publicationId, "refresh");
  revalidatePath("/media");
}

export async function verifyJournalistEmailAction(
  journalistId: string,
): Promise<{ status: EmailStatus; verifiedAt: string | null; sandbox: boolean }> {
  const sandbox = providerIsMock("VERIFIER");
  const journalist = await getJournalist(journalistId);
  if (!journalist) throw new Error("Journalist not found");
  if (!journalist.email) {
    return { status: journalist.email_status, verifiedAt: journalist.email_verified_at, sandbox };
  }

  const status = await verifier.verifyEmail(journalist.email);
  const verifiedAt = new Date().toISOString();
  await updateJournalist(journalistId, {
    email_status: status,
    email_verified_at: verifiedAt,
  });

  revalidatePath("/media");
  return { status, verifiedAt, sandbox };
}

export async function getJournalistArticlesAction(
  journalistId: string,
): Promise<{ articles: Article[] }> {
  const articles = await listArticlesByJournalist(journalistId);
  return { articles };
}
