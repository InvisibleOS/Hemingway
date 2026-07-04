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
import type {
  ArticleInsert,
  ClientInsert,
  EmailStatus,
  JournalistInsert,
  Json,
  PitchInsert,
  PitchStatus,
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
  await insertPitches(pitchRows);

  console.log("");
  console.log("Seed complete:");
  console.log(`  clients:       ${clients.length}`);
  console.log(`  publications:  ${publications.length}`);
  console.log(`  journalists:   ${journalists.length}`);
  console.log(`  articles:      ${articleRows.length}`);
  console.log(`  campaigns:     1 (active)`);
  console.log(`  pitches:       ${pitchRows.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
