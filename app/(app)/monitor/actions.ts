"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getClient,
  getMonitorEvent,
  insertPlacement,
  updateMonitorEvent,
} from "@/lib/db";
import { llm } from "@/lib/providers";
import { ingestClientEvents } from "@/lib/monitor/ingest";
import { hostname, normalizeUrl } from "@/lib/format";

export async function draftMonitorResponseAction(
  eventId: string,
): Promise<{ draft: string }> {
  const event = await getMonitorEvent(eventId);
  if (!event) throw new Error("Event not found");
  const client = await getClient(event.client_id);

  const draft = await llm.draftMonitorResponse({
    client: { name: client?.name ?? "the client", knowledgeBase: client?.knowledge_base ?? undefined },
    event: { title: event.title, summary: event.summary ?? undefined, source: event.source },
  });

  await updateMonitorEvent(eventId, {
    draft_response: draft,
    status: event.status === "new" ? "drafted" : event.status,
  });
  revalidatePath("/monitor");
  return { draft };
}

const DraftSchema = z.object({ draft: z.string().trim().min(1, "Response is required") });

export async function saveMonitorDraftAction(
  eventId: string,
  input: z.input<typeof DraftSchema>,
): Promise<void> {
  const parsed = DraftSchema.parse(input);
  const event = await getMonitorEvent(eventId);
  if (!event) throw new Error("Event not found");
  await updateMonitorEvent(eventId, {
    draft_response: parsed.draft,
    status: event.status === "new" ? "drafted" : event.status,
  });
  revalidatePath("/monitor");
}

export async function markRespondedAction(eventId: string): Promise<void> {
  await updateMonitorEvent(eventId, { status: "responded" });
  revalidatePath("/monitor");
}

export async function ignoreEventAction(eventId: string): Promise<void> {
  await updateMonitorEvent(eventId, { status: "ignored" });
  revalidatePath("/monitor");
}

const WonSchema = z.object({
  url: z.string().trim().min(1, "Placement URL is required"),
  headline: z.string().trim().optional(),
  publicationName: z.string().trim().optional(),
});

export async function markWonAction(
  eventId: string,
  input: z.input<typeof WonSchema>,
): Promise<void> {
  const parsed = WonSchema.parse(input);
  const url = normalizeUrl(parsed.url);
  try {
    void new URL(url);
  } catch {
    throw new Error("Enter a valid placement URL");
  }

  const event = await getMonitorEvent(eventId);
  if (!event) throw new Error("Event not found");

  await insertPlacement({
    client_id: event.client_id,
    monitor_event_id: event.id,
    url,
    headline: parsed.headline || null,
    publication_name: parsed.publicationName || hostname(url),
    placement_type: event.source === "brand_mention" ? "mention" : "quote",
    published_at: new Date().toISOString(),
  });

  await updateMonitorEvent(eventId, { status: "won" });
  revalidatePath("/monitor");
}

export async function refreshMonitorFeedAction(
  clientId: string,
): Promise<{ inserted: number }> {
  const client = await getClient(clientId);
  if (!client) throw new Error("Client not found");
  const inserted = await ingestClientEvents(client);
  revalidatePath("/monitor");
  return { inserted };
}
