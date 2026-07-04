import { NextResponse } from "next/server";
import { ingestAllClients } from "@/lib/monitor/ingest";

// Scheduled by vercel.json. Pulls new monitor events per client vertical.
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // No secret configured (local dev): allow. Vercel sets the header on cron runs.
  if (!secret) return true;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await ingestAllClients();
  return NextResponse.json(result);
}
