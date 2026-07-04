import { NextResponse } from "next/server";
import { getJournalistCountsByPublication, listPublications } from "@/lib/db";

// Polled by the publications table while a job is active. Always live.
export const dynamic = "force-dynamic";

export async function GET() {
  const [publications, counts] = await Promise.all([
    listPublications(),
    getJournalistCountsByPublication(),
  ]);
  return NextResponse.json({ publications, counts });
}
