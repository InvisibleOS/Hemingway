/**
 * Demo seed. After one run the app tells a two-client story:
 *
 *  - Client A (Kadai and Co, F&B): the flagship, mid-flight. A rich shared media
 *    database, an active campaign with pitches in every status, a monitor feed of
 *    open requests including one due today, and six months of reporting with a
 *    clear AI-mentions uplift.
 *  - Client B (Verandah Stays, hospitality): earlier-stage, for contrast. A
 *    campaign still being pitched with nothing sent yet, a warming sending domain,
 *    a couple of fresh monitor requests, and three months of modest early metrics.
 *
 * Deterministic (fixed faker seed) so the demo path is identical on every run.
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
  Campaign,
  Client,
  ClientInsert,
  EmailStatus,
  Journalist,
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

const FNB_PITCH_SUBJECTS = [
  "Monsoon menus are quietly outselling summer specials",
  "The data behind Bengaluru's monsoon food shift",
  "Why coastal comfort food spikes every June",
  "Bengaluru is ordering warmer and spicier in the rain",
  "A three-year read on how the city eats through the monsoon",
];

const HOSPITALITY_PITCH_SUBJECTS = [
  "Where Bengaluru goes when it wants the city to slow down",
  "The quiet return of the Western Ghats heritage stay",
  "Slow-travel demand near Bengaluru is outpacing the resorts",
  "A read on why short heritage stays are rising after the monsoon",
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

/** ISO timestamp `hours` from `now` (negative for the past). */
function hoursFrom(now: number, hours: number): string {
  return new Date(now + hours * 3_600_000).toISOString();
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
  const now = Date.now();

  console.log("Clearing existing demo data...");
  await wipe();

  console.log("Inserting clients...");
  const clients = await insertClients(CLIENTS);
  const fnbClient = clients.find((c) => c.vertical === "fnb") ?? clients[0];
  const hospitalityClient = clients.find((c) => c.vertical === "hospitality") ?? clients[1];

  console.log("Inserting publications...");
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

  const pubVerticalById = new Map(publications.map((p) => [p.id, p.vertical]));
  const fnbJournalists = journalists.filter((j) => pubVerticalById.get(j.publication_id) === "fnb");
  const hospitalityJournalists = journalists.filter(
    (j) => pubVerticalById.get(j.publication_id) === "hospitality",
  );

  // ---------------------------------------------------------------------------
  // Client A: the flagship campaign, mid-flight, with a pitch in every status.
  // ---------------------------------------------------------------------------
  console.log("Inserting Client A campaign with a full-lifecycle pitch board...");
  const campaignA = await insertCampaign({
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

  const pitchesA = await insertPitches(
    buildPitchRows({
      campaignId: campaignA.id,
      clientName: fnbClient.name,
      journalists: fnbJournalists,
      subjects: FNB_PITCH_SUBJECTS,
      now,
      // Every status represented so the board and approval queue show the full
      // lifecycle: fresh drafts, an edited draft, approvals, sent, replies, a
      // placement, and the two negative terminal states.
      plan: [
        "drafted", "drafted", "drafted", "edited", "approved", "approved",
        "pushed", "replied", "replied", "placed", "declined", "bounced",
      ],
      bodyFor: (first) =>
        [
          "Monsoon-season orders for warm coastal dishes rose 34 percent over three years across Bengaluru delivery data.",
          "",
          `Hi ${first}, ${fnbClient.name} is reviving forgotten monsoon coastal recipes and the ordering data backs the trend. Happy to share the full study and a founder interview, exclusive to you first.`,
          "",
          "Worth a look?",
          "[sign-off]",
        ].join("\n"),
    }),
  );

  // ---------------------------------------------------------------------------
  // Client B: earlier-stage. A campaign still being pitched, nothing sent yet.
  // ---------------------------------------------------------------------------
  console.log("Inserting Client B campaign (earlier stage, still pitching)...");
  const campaignB = await insertCampaign({
    client_id: hospitalityClient.id,
    name: "Heritage Stays Winter Preview",
    story_angle:
      "Verandah Stays is opening two restored Western Ghats homestays for the winter season, framed by post-monsoon slow-travel demand near Bengaluru.",
    data_study_title: "Where Bengaluru travels when the city slows down",
    data_study_summary:
      "Early booking data points to a post-monsoon rise in short heritage stays within a four-hour drive of the city.",
    data_study_url: "https://www.verandahstays.com/studies/winter-slow-travel",
    status: "pitching",
  });

  const pitchesB = await insertPitches(
    buildPitchRows({
      campaignId: campaignB.id,
      clientName: hospitalityClient.name,
      journalists: hospitalityJournalists,
      subjects: HOSPITALITY_PITCH_SUBJECTS,
      now,
      // Earlier stage: drafts under review, one edited, one approved, none sent.
      plan: ["drafted", "drafted", "drafted", "edited", "approved"],
      bodyFor: (first) =>
        [
          "Short heritage stays within a four-hour drive of Bengaluru are booking out earlier each post-monsoon season.",
          "",
          `Hi ${first}, ${hospitalityClient.name} is opening two restored Western Ghats homestays this winter and the early booking data backs the slow-travel shift. Happy to share the numbers and arrange a stay.`,
          "",
          "Would this fit an upcoming travel feature?",
          "[sign-off]",
        ].join("\n"),
    }),
  );

  console.log("Inserting open monitor events (including one due today)...");
  const openMonitor = await seedOpenMonitorEvents(fnbClient, hospitalityClient, now);

  console.log("Inserting metrics snapshots, monitor wins and coverage...");
  const reporting = await seedReporting([fnbClient, hospitalityClient], campaignA, pitchesA, now);

  console.log("");
  console.log("Seed complete:");
  console.log(`  clients:       ${clients.length}`);
  console.log(`  publications:  ${publications.length}`);
  console.log(`  journalists:   ${journalists.length}`);
  console.log(`  articles:      ${articleRows.length}`);
  console.log(`  campaigns:     2 (A active, B pitching)`);
  console.log(`  pitches:       ${pitchesA.length} (A, every status) + ${pitchesB.length} (B, early)`);
  console.log(`  open events:   ${openMonitor} (actionable, one due today)`);
  console.log(`  snapshots:     ${reporting.snapshots}`);
  console.log(`  monitor wins:  ${reporting.monitorEvents}`);
  console.log(`  placements:    ${reporting.placements}`);
}

// ---------------------------------------------------------------------------
// Pitches: build a spread of statuses for one campaign. Approval and push
// timestamps stay causally ordered (approved before pushed), and negative
// terminal states (declined, bounced) are treated as sent-then-lost so they
// carry a push time too.
// ---------------------------------------------------------------------------

const APPROVED_STATUSES = new Set<PitchStatus>([
  "approved", "pushed", "replied", "placed", "declined", "bounced",
]);
const PUSHED_STATUSES = new Set<PitchStatus>([
  "pushed", "replied", "placed", "declined", "bounced",
]);

function buildPitchRows(opts: {
  campaignId: string;
  clientName: string;
  journalists: Journalist[];
  subjects: string[];
  plan: PitchStatus[];
  now: number;
  bodyFor: (firstName: string) => string;
}): PitchInsert[] {
  const { campaignId, journalists, subjects, plan, now, bodyFor } = opts;
  return plan.map((status, i) => {
    const journalist = journalists[i % journalists.length];
    const first = journalist.name.split(" ")[0];
    const approved = APPROVED_STATUSES.has(status);
    const pushed = PUSHED_STATUSES.has(status);
    return {
      campaign_id: campaignId,
      journalist_id: journalist.id,
      subject: pickBy(subjects, journalist.id),
      body: bodyFor(first),
      status,
      match_score: Math.round((0.9 - i * 0.03) * 100) / 100,
      approved_by: approved ? "tech@strategi.is" : null,
      approved_at: approved ? new Date(now - (i + 2) * 24 * 3_600_000).toISOString() : null,
      pushed_at: pushed ? new Date(now - (i + 1) * 20 * 3_600_000).toISOString() : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Open monitor events: the live digest. Client A (flagship) gets a full set,
// with one request due today so the countdown reads urgent; Client B gets a
// couple of fresh requests to match its earlier stage. created_at is spread
// across the last few days so the feed groups into arrival days.
// ---------------------------------------------------------------------------

async function seedOpenMonitorEvents(
  fnb: Client,
  hospitality: Client,
  now: number,
): Promise<number> {
  const rows: MonitorEventInsert[] = [
    {
      client_id: fnb.id,
      source: "expert_platform",
      status: "new",
      title: "Seeking a Bengaluru operator on cloud-kitchen unit economics",
      url: "https://sandbox.expert-requests.example/fnb/live/cloud-kitchen",
      summary:
        "A business desk is preparing a piece on delivery-first kitchen margins and wants a founder or operator quote today.",
      deadline_at: hoursFrom(now, 5), // due today: urgent countdown
      created_at: hoursFrom(now, -1),
    },
    {
      client_id: fnb.id,
      source: "journo_request",
      status: "new",
      title: "Reporter needs a source on monsoon dining demand",
      url: "https://sandbox.expert-requests.example/fnb/live/monsoon-demand",
      summary:
        "Feature on how the rains change what Bengaluru orders. Looking for seasonal ordering data and a chef view.",
      deadline_at: hoursFrom(now, 46),
      created_at: hoursFrom(now, -4),
    },
    {
      client_id: fnb.id,
      source: "expert_platform",
      status: "drafted",
      title: "Panel source wanted on QSR delivery margins",
      url: "https://sandbox.expert-requests.example/fnb/live/qsr-margins",
      summary:
        "Trade panel needs an operator to speak to delivery commissions and menu engineering.",
      deadline_at: hoursFrom(now, 30),
      draft_response:
        "Kadai and Co has held delivery margins steady by keeping a tight, high-velocity menu and pricing for the format rather than the dining room. Happy to share specifics on the record.",
      created_at: hoursFrom(now, -27), // yesterday
    },
    {
      client_id: fnb.id,
      source: "brand_mention",
      status: "new",
      title: "Kadai and Co named in a Bengaluru monsoon-menu roundup",
      url: "https://sandbox.expert-requests.example/fnb/live/mention-roundup",
      summary:
        "A city guide listed the ghee-roast set among monsoon picks. An amplify-and-thank opportunity.",
      deadline_at: null,
      created_at: hoursFrom(now, -50), // about two days ago
    },
    {
      client_id: hospitality.id,
      source: "journo_request",
      status: "new",
      title: "Travel reporter seeking heritage-stay operators near Bengaluru",
      url: "https://sandbox.expert-requests.example/hospitality/live/heritage-operators",
      summary:
        "Weekend feature on restored homestays in the Western Ghats. Wants an operator and a guest anecdote.",
      deadline_at: hoursFrom(now, 70),
      created_at: hoursFrom(now, -2),
    },
    {
      client_id: hospitality.id,
      source: "expert_platform",
      status: "new",
      title: "Comment wanted on slow-travel demand near Bengaluru",
      url: "https://sandbox.expert-requests.example/hospitality/live/slow-travel",
      summary:
        "Requesting an operator view on why short heritage stays are rising after the monsoon.",
      deadline_at: hoursFrom(now, 44),
      created_at: hoursFrom(now, -26),
    },
  ];
  const inserted = await insertMonitorEvents(rows);
  return inserted.length;
}

// ---------------------------------------------------------------------------
// Module 4 reporting seed. Per-client plans so the two clients read differently:
// Client A (F&B) has six months with an accelerating AI-mention curve; Client B
// (hospitality) is earlier-stage, with three months of modest, early metrics.
// The per-engine breakdown is derived so ai_mentions_count always equals its sum.
// ---------------------------------------------------------------------------

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

type ReportingPlan = {
  /** Trailing calendar months of data, oldest to newest. */
  months: number;
  ai: number[];
  backlinks: number[];
  referring: number[];
  /** `month` indexes into this plan's own trailing-month window. */
  placements: PlacementSpec[];
};

const REPORTING: Record<"fnb" | "hospitality", ReportingPlan> = {
  // Six months, growth steepening from index 3 (after campaign start): a clear uplift.
  fnb: {
    months: 6,
    ai: [12, 18, 27, 52, 98, 174],
    backlinks: [214, 239, 271, 308, 356, 408],
    referring: [66, 73, 82, 94, 108, 124],
    placements: [
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
  },
  // Three months, modest and early: small numbers rising, a couple of placements.
  hospitality: {
    months: 3,
    ai: [9, 15, 24],
    backlinks: [58, 74, 96],
    referring: [21, 27, 34],
    placements: [
      { month: 0, type: "directory", origin: "direct" },
      { month: 1, type: "mention", origin: "monitor" },
      { month: 2, type: "listicle", origin: "direct" },
      { month: 2, type: "quote", origin: "direct" },
    ],
  },
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
  campaignA: Campaign,
  pitchesA: Pitch[],
  now: number,
): Promise<{ snapshots: number; monitorEvents: number; placements: number }> {
  const snapshotRows: MetricsSnapshotInsert[] = [];
  const placementRows: PlacementInsert[] = [];
  let monitorCount = 0;

  // Pitches that actually reached a journalist, reused as pitch-origin coverage.
  const sentPitches = pitchesA.filter((p) => ["pushed", "replied", "placed"].includes(p.status));

  for (const client of clients) {
    const key = client.vertical === "hospitality" ? "hospitality" : "fnb";
    const plan = REPORTING[key];
    const months = monthStarts(plan.months);
    const outlets = REPORT_OUTLETS[key];

    months.forEach((monthDate, i) => {
      const total = plan.ai[i];
      snapshotRows.push({
        client_id: client.id,
        snapshot_date: monthDate.toISOString().slice(0, 10),
        backlinks_count: plan.backlinks[i],
        referring_domains: plan.referring[i],
        ai_mentions_count: total,
        ai_mentions_breakdown: breakdownFor(total) as unknown as Json,
        source: "mock",
      });
    });

    // A won monitor event per monitor-origin placement, so that origin is real.
    // Dated a few days back so it sits below the live requests in the feed.
    const monitorSpecs = plan.placements.filter((s) => s.origin === "monitor");
    const wonEvents = await insertMonitorEvents(
      monitorSpecs.map((_, idx): MonitorEventInsert => {
        const at = new Date(now - (idx + 3) * 86_400_000).toISOString();
        return {
          client_id: client.id,
          source: idx % 2 === 0 ? "expert_platform" : "journo_request",
          title: `${client.name} quoted on ${key === "fnb" ? "monsoon dining" : "slow travel"} demand`,
          url: `https://sandbox.expert-requests.example/won/${client.id}/${idx}`,
          summary: "Placement secured from a reactive expert request.",
          deadline_at: at,
          created_at: at,
          status: "won",
          draft_response: "Response sent and picked up.",
        };
      }),
    );
    monitorCount += wonEvents.length;

    let monitorCursor = 0;
    let pitchCursor = 0;
    plan.placements.forEach((spec, idx) => {
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
        campaign_id: isFnb && pitchId ? campaignA.id : null,
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
