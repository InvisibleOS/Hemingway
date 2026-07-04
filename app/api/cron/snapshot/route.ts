import { NextResponse } from "next/server";
import { snapshotAllClients } from "@/lib/reporting/snapshot";

// Scheduled by vercel.json (monthly). Snapshots backlinks + AI mentions per client
// into metrics_snapshots for the monthly report (Module 4).
export const dynamic = "force-dynamic";
// Live DataForSEO calls per client can be slow; give the run headroom.
export const maxDuration = 300;

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
  const result = await snapshotAllClients();
  return NextResponse.json(result);
}
