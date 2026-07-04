/**
 * Demo seed. Leaves the app in a state where the media database browses richly:
 * two Bengaluru clients, five publications, fifty profiled journalists, two
 * hundred articles, and one draft campaign. Deterministic (fixed faker seed) so
 * the demo path is identical on every run.
 *
 * Run with: npm run seed:demo  (loads .env.local for Supabase credentials)
 *
 * A script, not app code: it uses the service client via lib/db insert helpers.
 * Embeddings reuse the same deterministic vector helper as the mock LLM.
 */
import { faker } from "@faker-js/faker";
import { getDb } from "@/lib/db";
import { insertClients } from "@/lib/db/clients";
import { insertPublications } from "@/lib/db/publications";
import { insertJournalists } from "@/lib/db/journalists";
import { insertArticles } from "@/lib/db/articles";
import { insertCampaign } from "@/lib/db/campaigns";
import { insertPitches } from "@/lib/db/pitches";
import { insertPlacements } from "@/lib/db/placements";
import { insertSnapshots } from "@/lib/db/metrics-snapshots";
import { insertMonitorEvents } from "@/lib/db/monitor-events";
import type {
  ArticleInsert,
  Client,
  ClientInsert,
  EmailStatus,
  JournalistInsert,
  Json,
  MetricsSnapshotInsert,
  MonitorEventInsert,
  Pitch,
  PitchInsert,
  PitchStatus,
  PlacementInsert,
  PlacementType,
  PublicationInsert,
  Vertical,
} from "@/lib/db/types";
import { deterministicVector, pickBy } from "@/lib/providers/_hash";
import { hostname, toVectorLiteral } from "@/lib/format";

faker.seed(20260704);

const FIRST_NAMES = [
  "Aarav", "Ananya", "Rohan", "Devika", "Farhan", "Sneha", "Karthik", "Meera",
  "Arjun", "Ishaan", "Priya", "Nikhil", "Ritu", "Sanjay", "Kavya", "Vikram",
  "Anjali", "Rahul", "Divya", "Aditya", "Neha", "Siddharth", "Pooja", "Rakesh",
  "Shruti", "Manish", "Tara", "Vivek", "Lakshmi", "Imran", "Zoya", "Aryan",
  "Nandini", "Gaurav", "Sana", "Harsha", "Deepa", "Varun", "Aisha", "Kabir",
  "Radhika", "Naveen", "Sunita", "Yash", "Payal", "Kiran", "Sameer", "Trisha",
];

const LAST_NAMES = [
  "Rao", "Mehta", "Nair", "Qureshi", "Iyer", "Menon", "Bose", "Kapoor", "Reddy",
  "Sharma", "Pillai", "Krishnan", "Banerjee", "Chopra", "Desai", "Ghosh", "Hegde",
  "Joshi", "Kulkarni", "Malhotra", "Naidu", "Patel", "Shetty", "Verma", "Bhat",
  "Chandran", "Dutta", "Fernandes", "Gupta", "Prabhu",
];

const FNB_ROLES = ["Food Critic", "Features Editor", "Staff Writer", "Contributing Editor", "Correspondent", "Columnist"];
const HOSPITALITY_ROLES = ["Travel Editor", "Senior Correspondent", "Features Writer", "Contributing Editor", "Staff Writer", "Columnist"];

const FNB_BEATS = [
  "restaurant openings", "coastal Karnataka cuisine", "QSR and delivery",
  "bakeries and specialty cafes", "regional Indian thalis", "bar and cocktail culture",
  "vegetarian fine dining", "street food and darshinis",
];
const HOSPITALITY_BEATS = [
  "boutique hotels", "luxury resorts", "sustainable travel", "hospitality business",
  "homestays and villas", "heritage stays", "weekend getaways near Bengaluru", "wellness retreats",
];

const PITCH_SUBJECTS = [
  "Monsoon menus are quietly outselling summer specials",
  "The data behind Bengaluru's monsoon food shift",
  "Why coastal comfort food spikes every June",
  "Bengaluru is ordering warmer and spicier in the rain",
  "A three-year read on how the city eats through the monsoon",
];

const RECEPTIVITY_NOTES = [
  "Responds to concrete data and clear exclusives. Prefers a single tight angle over broad pitches.",
  "Values founder access and first-person stories. A strong data point in the opening line helps.",
  "Covers trends backed by numbers. Slow to reply but reliable once a story lands.",
  "Prefers embargoed exclusives with a named spokesperson and a clean set of figures.",
  "Open to category data studies. Keeps pitches for later even when not an immediate fit.",
  "Reads short, specific pitches. One follow-up is fine; more than that is not.",
];

type PubSeed = {
  name: string;
  website: string;
  vertical: Vertical;
  tier: PublicationInsert["tier"];
};

const PUBLICATIONS: PubSeed[] = [
  { name: "The Hindu", website: "https://www.thehindu.com", vertical: "fnb", tier: "national" },
  { name: "Deccan Herald", website: "https://www.deccanherald.com", vertical: "fnb", tier: "regional" },
  { name: "Mint Lounge", website: "https://www.livemint.com", vertical: "fnb", tier: "national" },
  { name: "Conde Nast Traveller India", website: "https://www.cntraveller.in", vertical: "hospitality", tier: "national" },
  { name: "Hospitality Biz India", website: "https://www.hospitalitybizindia.com", vertical: "hospitality", tier: "trade" },
];

const CLIENTS: ClientInsert[] = [
  {
    name: "Kadai and Co",
    website: "https://www.kadaiandco.in",
    vertical: "fnb",
    sending_domain: "mail.kadaiandco.in",
    sending_domain_status: "ready",
    knowledge_base:
      "Kadai and Co is a Bengaluru fast-casual chain built around coastal Karnataka recipes and single-origin spices. Founder-led, five outlets, known for its ghee-roast formats and a small-batch pantry line.",
    active: true,
  },
  {
    name: "Verandah Stays",
    website: "https://www.verandahstays.com",
    vertical: "hospitality",
    sending_domain: "mail.verandahstays.com",
    sending_domain_status: "warming",
    knowledge_base:
      "Verandah Stays runs restored heritage homestays across Bengaluru and the Western Ghats, with a focus on slow travel, regional food, and low-impact operations.",
    active: true,
  },
];

const ARTICLE_TEMPLATES = [
  "A closer look at Bengaluru {beat}",
  "How {beat} is reshaping the city table",
  "Inside the new wave of {beat}",
  "The quiet rise of {beat}",
  "What the numbers say about {beat}",
  "Five names to watch in {beat}",
];

function emailStatusForBucket(bucket: number): EmailStatus {
  if (bucket < 50) return "verified";
  if (bucket < 68) return "pattern_guess";
  if (bucket < 86) return "unverified";
  return "bounced";
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function wipe(): Promise<void> {
  const db = getDb();
  const tables = [
    "placements",
    "pitches",
    "metrics_snapshots",
    "monitor_events",
    "articles",
    "campaigns",
    "journalists",
    "publications",
    "clients",
  ] as const;
  for (const table of tables) {
    const { error } = await db.from(table).delete().not("id", "is", null);
    if (error) throw new Error(`Failed clearing ${table}: ${error.message}`);
  }
}

async function main(): Promise<void> {
  console.log("Clearing existing demo data...");
  await wipe();

  console.log("Inserting clients...");
  const clients = await insertClients(CLIENTS);

  console.log("Inserting publications...");
  const now = Date.now();
  // Vary the terminal ingestion state across publications so the status cell
  // (clean, complete-with-skips, and failed) is all visible in the demo.
  const publicationRows: PublicationInsert[] = PUBLICATIONS.map((p, i) => {
    const scrapedAt = new Date(now - (i + 1) * 36 * 3_600_000).toISOString();
    const startedAt = new Date(now - (i + 1) * 36 * 3_600_000 - 8 * 60_000).toISOString();
    const last = PUBLICATIONS.length - 1;

    let ingestion: Record<string, unknown>;
    if (i === last) {
      // Most recent refresh failed; the prior scrape's data still stands.
      ingestion = {
        status: "error",
        phase: "Failed: site map returned no author pages",
        processed: 0,
        total: 0,
        journalistsFound: 0,
        articlesFound: 0,
        errors: [],
        mode: "refresh",
        startedAt,
        finishedAt: scrapedAt,
      };
    } else if (i === last - 1) {
      // Completed, but a couple of journalists were skipped on partial failures.
      ingestion = {
        status: "complete",
        phase: "Complete with 2 skipped",
        processed: 12,
        total: 12,
        journalistsFound: 10,
        articlesFound: 40,
        errors: [
          "/author/guest-desk: author page had no name",
          "/author/wire-7: classify failed",
        ],
        mode: "add",
        startedAt,
        finishedAt: scrapedAt,
      };
    } else {
      ingestion = {
        status: "complete",
        phase: "Complete",
        processed: 10,
        total: 10,
        journalistsFound: 10,
        articlesFound: 40,
        errors: [],
        mode: "add",
        startedAt,
        finishedAt: scrapedAt,
      };
    }

    return {
      name: p.name,
      website: p.website,
      vertical: p.vertical,
      tier: p.tier,
      last_scraped_at: scrapedAt,
      scrape_config: { ingestion } as unknown as Json,
    };
  });
  const publications = await insertPublications(publicationRows);

  console.log("Building journalists...");
  const usedNames = new Set<string>();
  const journalistRows: JournalistInsert[] = [];
  const perPublication = 10;

  for (const pub of publications) {
    const host = hostname(pub.website);
    const isFnb = pub.vertical === "fnb";
    const roles = isFnb ? FNB_ROLES : HOSPITALITY_ROLES;
    const beats = isFnb ? FNB_BEATS : HOSPITALITY_BEATS;

    for (let i = 0; i < perPublication; i++) {
      let name = "";
      do {
        name = `${faker.helpers.arrayElement(FIRST_NAMES)} ${faker.helpers.arrayElement(LAST_NAMES)}`;
      } while (usedNames.has(name));
      usedNames.add(name);

      const [first, last] = name.split(" ");
      const role = faker.helpers.arrayElement(roles);
      const beat = faker.helpers.arrayElement(beats);
      const email = `${first}.${last}@${host}`.toLowerCase();
      const status = emailStatusForBucket(faker.number.int({ min: 0, max: 99 }));
      const verifiedAt =
        status === "verified" || status === "bounced"
          ? faker.date.recent({ days: 40 }).toISOString()
          : null;

      journalistRows.push({
        publication_id: pub.id,
        name,
        role,
        email,
        email_status: status,
        email_verified_at: verifiedAt,
        beat_summary: `Covers ${beat} for ${pub.name}, with a focus on Bengaluru and the wider south.`,
        receptivity_notes: faker.helpers.arrayElement(RECEPTIVITY_NOTES),
        quotes_founders: faker.datatype.boolean(0.6),
        uses_data_studies: faker.datatype.boolean(0.45),
        profile_embedding: toVectorLiteral(deterministicVector(`journalist:${name}:${beat}`)),
        last_profiled_at: faker.date.recent({ days: 30 }).toISOString(),
      });
    }
  }

  console.log(`Inserting ${journalistRows.length} journalists...`);
  const journalists = await insertJournalists(journalistRows);

  console.log("Building articles...");
  const pubById = new Map(publications.map((p) => [p.id, p]));
  const articleRows: ArticleInsert[] = [];
  const perJournalist = 4;

  for (const journalist of journalists) {
    const pub = pubById.get(journalist.publication_id);
    if (!pub) continue;
    const host = hostname(pub.website);
    const isFnb = pub.vertical === "fnb";
    const beats = isFnb ? FNB_BEATS : HOSPITALITY_BEATS;

    for (let i = 0; i < perJournalist; i++) {
      const beat = faker.helpers.arrayElement(beats);
      const title = faker.helpers.arrayElement(ARTICLE_TEMPLATES).replace("{beat}", beat);
      const publishedAt = faker.date.recent({ days: 150 }).toISOString();
      const url = `https://${host}/story/${slugify(beat)}-${faker.string.alphanumeric(6).toLowerCase()}`;
      articleRows.push({
        journalist_id: journalist.id,
        title,
        url,
        published_at: publishedAt,
        summary: `A ${isFnb ? "food" : "travel"} feature on ${beat}, drawing on interviews and category data.`,
        embedding: toVectorLiteral(deterministicVector(`article:${title}:${url}`)),
      });
    }
  }

  console.log(`Inserting ${articleRows.length} articles...`);
  // Insert in batches to keep each request small.
  for (let i = 0; i < articleRows.length; i += 100) {
    await insertArticles(articleRows.slice(i, i + 100));
  }

  console.log("Inserting campaign with a live pitch board...");
  const fnbClient = clients.find((c) => c.vertical === "fnb") ?? clients[0];
  const campaign = await insertCampaign({
    client_id: fnbClient.id,
    name: "Monsoon Menu Launch",
    story_angle:
      "Kadai and Co is reviving forgotten monsoon-season coastal recipes, backed by a study of seasonal ordering patterns across Bengaluru delivery data.",
    data_study_title: "How Bengaluru eats through the monsoon",
    data_study_summary:
      "Analysis of three years of seasonal ordering shows a clear shift toward warm, spice-forward coastal dishes between June and September.",
    data_study_url: "https://www.kadaiandco.in/studies/monsoon-menu",
    status: "active",
  });

  // A spread of pitch statuses so the approval queue and board look alive.
  const fnbPublicationIds = new Set(
    publications.filter((p) => p.vertical === "fnb").map((p) => p.id),
  );
  const fnbJournalists = journalists.filter((j) => fnbPublicationIds.has(j.publication_id));
  const pitchPlan: PitchStatus[] = [
    "drafted",
    "drafted",
    "drafted",
    "approved",
    "approved",
    "pushed",
    "replied",
    "replied",
    "placed",
  ];

  const pitchRows: PitchInsert[] = pitchPlan.map((status, i) => {
    const journalist = fnbJournalists[i % fnbJournalists.length];
    const first = journalist.name.split(" ")[0];
    const approved = status !== "drafted";
    const pushed = status === "pushed" || status === "replied" || status === "placed";
    return {
      campaign_id: campaign.id,
      journalist_id: journalist.id,
      subject: pickBy(PITCH_SUBJECTS, journalist.id),
      body: [
        "Monsoon-season orders for warm coastal dishes rose 34 percent over three years across Bengaluru delivery data.",
        "",
        `Hi ${first}, ${fnbClient.name} is reviving forgotten monsoon coastal recipes and the ordering data backs the trend. Happy to share the full study and a founder interview, exclusive to you first.`,
        "",
        "Worth a look?",
        "[sign-off]",
      ].join("\n"),
      status,
      match_score: Math.round((0.9 - i * 0.03) * 100) / 100,
      approved_by: approved ? "tech@strategi.is" : null,
      approved_at: approved ? new Date(now - (i + 2) * 24 * 3_600_000).toISOString() : null,
      pushed_at: pushed ? new Date(now - (i + 1) * 20 * 3_600_000).toISOString() : null,
    };
  });
  const pitches = await insertPitches(pitchRows);

  console.log("Inserting metrics snapshots, monitor wins and coverage...");
  const reporting = await seedReporting(clients, campaign, pitches);

  console.log("");
  console.log("Seed complete:");
  console.log(`  clients:       ${clients.length}`);
  console.log(`  publications:  ${publications.length}`);
  console.log(`  journalists:   ${journalists.length}`);
  console.log(`  articles:      ${articleRows.length}`);
  console.log(`  campaigns:     1 (active)`);
  console.log(`  pitches:       ${pitchRows.length}`);
  console.log(`  snapshots:     ${reporting.snapshots} (6 months x ${clients.length} clients)`);
  console.log(`  monitor wins:  ${reporting.monitorEvents}`);
  console.log(`  placements:    ${reporting.placements}`);
}

// ---------------------------------------------------------------------------
// Module 4 reporting seed: six monthly snapshots per client with an upward AI
// mention trend after campaign start, plus a spread of placements across months
// and types, some from pitches and some from won monitor events.
// ---------------------------------------------------------------------------

// Accelerating AI-mention curve (oldest -> newest); growth steepens from index 3,
// after campaign start. Scaled per client. The per-engine breakdown is derived so
// ai_mentions_count always equals the breakdown sum.
const AI_SHAPE = [12, 18, 27, 52, 98, 174];
const BACKLINKS_SHAPE = [214, 239, 271, 308, 356, 408];
const REFERRING_SHAPE = [66, 73, 82, 94, 108, 124];

type OutletSeed = { name: string; host: string };

const REPORT_OUTLETS: Record<"fnb" | "hospitality", OutletSeed[]> = {
  fnb: [
    { name: "The Hindu", host: "thehindu.com" },
    { name: "Deccan Herald", host: "deccanherald.com" },
    { name: "Mint Lounge", host: "livemint.com" },
    { name: "The Better India", host: "thebetterindia.com" },
    { name: "YourStory", host: "yourstory.com" },
  ],
  hospitality: [
    { name: "Conde Nast Traveller India", host: "cntraveller.in" },
    { name: "Outlook Traveller", host: "outlooktraveller.com" },
    { name: "Travel and Leisure India", host: "travelandleisureindia.in" },
    { name: "Hospitality Biz India", host: "hospitalitybizindia.com" },
  ],
};

type PlacementSpec = { month: number; type: PlacementType; origin: "pitch" | "monitor" | "direct" };

// Spread across the six months and all five types; recent months are weighted so
// the current month's report reads richly.
const PLACEMENT_PLAN: Record<"fnb" | "hospitality", PlacementSpec[]> = {
  fnb: [
    { month: 0, type: "directory", origin: "direct" },
    { month: 1, type: "listicle", origin: "direct" },
    { month: 2, type: "mention", origin: "monitor" },
    { month: 2, type: "quote", origin: "pitch" },
    { month: 3, type: "feature", origin: "pitch" },
    { month: 3, type: "listicle", origin: "direct" },
    { month: 4, type: "quote", origin: "pitch" },
    { month: 4, type: "feature", origin: "pitch" },
    { month: 5, type: "feature", origin: "pitch" },
    { month: 5, type: "quote", origin: "monitor" },
  ],
  hospitality: [
    { month: 1, type: "directory", origin: "direct" },
    { month: 2, type: "listicle", origin: "direct" },
    { month: 3, type: "mention", origin: "monitor" },
    { month: 4, type: "quote", origin: "monitor" },
    { month: 4, type: "feature", origin: "direct" },
    { month: 5, type: "feature", origin: "direct" },
    { month: 5, type: "listicle", origin: "direct" },
  ],
};

function headlineFor(type: PlacementType, client: Client, outlet: OutletSeed): string {
  const city = "Bengaluru";
  switch (type) {
    case "feature":
      return `Inside ${client.name}: the ${city} story behind the numbers`;
    case "quote":
      return `${client.name} on what ${client.vertical === "fnb" ? "diners" : "travellers"} want next`;
    case "listicle":
      return `${city} names to watch, featuring ${client.name}`;
    case "directory":
      return `${client.name} added to ${outlet.name}'s ${city} guide`;
    case "mention":
    default:
      return `${client.name} among ${city}'s fast-rising brands`;
  }
}

/** First-of-month dates for the trailing `count` months, oldest to newest (UTC). */
function monthStarts(count: number): Date[] {
  const nowDate = new Date();
  const starts: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    starts.push(new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth() - i, 1)));
  }
  return starts;
}

/** Split a mention total across engines so the parts always sum back to the total. */
function breakdownFor(total: number): Record<string, number> {
  const chatgpt = Math.round(total * 0.5);
  const perplexity = Math.round(total * 0.24);
  const gemini = Math.round(total * 0.16);
  const claude = Math.max(0, total - chatgpt - perplexity - gemini);
  return { chatgpt, perplexity, gemini, claude };
}

async function seedReporting(
  clients: Client[],
  campaign: { id: string },
  pitches: Pitch[],
): Promise<{ snapshots: number; monitorEvents: number; placements: number }> {
  const months = monthStarts(6);
  const snapshotRows: MetricsSnapshotInsert[] = [];
  const placementRows: PlacementInsert[] = [];
  let monitorCount = 0;

  // Pitches that actually reached a journalist, reused as pitch-origin coverage.
  const sentPitches = pitches.filter((p) => ["pushed", "replied", "placed"].includes(p.status));

  for (const client of clients) {
    const key = client.vertical === "hospitality" ? "hospitality" : "fnb";
    const scale = client.vertical === "fnb" ? 1 : 0.68;
    const outlets = REPORT_OUTLETS[key];

    months.forEach((monthDate, i) => {
      const total = Math.round(AI_SHAPE[i] * scale);
      snapshotRows.push({
        client_id: client.id,
        snapshot_date: monthDate.toISOString().slice(0, 10),
        backlinks_count: Math.round(BACKLINKS_SHAPE[i] * scale),
        referring_domains: Math.round(REFERRING_SHAPE[i] * scale),
        ai_mentions_count: total,
        ai_mentions_breakdown: breakdownFor(total) as unknown as Json,
        source: "mock",
      });
    });

    // A won monitor event per monitor-origin placement, so that origin is real.
    const monitorSpecs = PLACEMENT_PLAN[key].filter((s) => s.origin === "monitor");
    const wonEvents = await insertMonitorEvents(
      monitorSpecs.map((_, idx): MonitorEventInsert => ({
        client_id: client.id,
        source: idx % 2 === 0 ? "expert_platform" : "journo_request",
        title: `${client.name} quoted on ${key === "fnb" ? "monsoon dining" : "slow travel"} demand`,
        url: `https://sandbox.expert-requests.example/won/${client.id}/${idx}`,
        summary: "Placement secured from a reactive expert request.",
        deadline_at: new Date(Date.now() - (idx + 3) * 86_400_000).toISOString(),
        status: "won",
        draft_response: "Response sent and picked up.",
      })),
    );
    monitorCount += wonEvents.length;

    let monitorCursor = 0;
    let pitchCursor = 0;
    PLACEMENT_PLAN[key].forEach((spec, idx) => {
      const monthDate = months[spec.month];
      const outlet = outlets[idx % outlets.length];
      const publishedAt = new Date(
        Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 12, 9 + (idx % 6), 0, 0),
      ).toISOString();

      const isFnb = client.vertical === "fnb";
      let pitchId: string | null = null;
      let monitorEventId: string | null = null;
      if (spec.origin === "pitch" && isFnb && sentPitches.length) {
        pitchId = sentPitches[pitchCursor % sentPitches.length].id;
        pitchCursor += 1;
      } else if (spec.origin === "monitor" && wonEvents.length) {
        monitorEventId = wonEvents[monitorCursor % wonEvents.length].id;
        monitorCursor += 1;
      }

      placementRows.push({
        client_id: client.id,
        campaign_id: isFnb && pitchId ? campaign.id : null,
        pitch_id: pitchId,
        monitor_event_id: monitorEventId,
        publication_name: outlet.name,
        url: `https://${outlet.host}/story/${slugify(client.name)}-${spec.type}-${idx}`,
        headline: headlineFor(spec.type, client, outlet),
        published_at: publishedAt,
        placement_type: spec.type,
      });
    });
  }

  await insertSnapshots(snapshotRows);
  await insertPlacements(placementRows);
  return {
    snapshots: snapshotRows.length,
    monitorEvents: monitorCount,
    placements: placementRows.length,
  };
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
