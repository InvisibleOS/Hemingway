import { fnv1a, mulberry32, pickBy } from "../_hash";
import type {
  AuthorPage,
  MappedSite,
  ScrapedArticle,
  ScraperProvider,
} from "./types";

const FIRST = ["Ananya", "Rohan", "Devika", "Farhan", "Sneha", "Karthik", "Meera", "Arjun"];
const LAST = ["Rao", "Mehta", "Nair", "Qureshi", "Iyer", "Menon", "Bose", "Kapoor"];
const ROLES = ["Staff Writer", "Features Editor", "Correspondent", "Contributing Editor"];
const BEATS = ["restaurant openings", "coastal cuisine", "boutique hospitality", "QSR and delivery"];

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

export const mockScraper: ScraperProvider = {
  async mapSite(url) {
    const seed = fnv1a(url);
    const rand = mulberry32(seed);
    const count = 6 + Math.floor(rand() * 6);
    const base = url.replace(/\/$/, "");
    const urls: MappedSite["urls"] = Array.from(
      { length: count },
      (_, i) => `${base}/author/${pickBy(LAST, `${url}${i}`).toLowerCase()}-${i}`,
    );
    return { urls };
  },

  async scrapeAuthorPage(url) {
    const first = pickBy(FIRST, `${url}f`);
    const last = pickBy(LAST, `${url}l`);
    const rand = mulberry32(fnv1a(url));
    const articleCount = 10 + Math.floor(rand() * 6);
    const article: AuthorPage = {
      name: `${first} ${last}`,
      role: pickBy(ROLES, url),
      profileUrl: url,
      email: `${first}.${last}@${host(url)}`.toLowerCase(),
      articleUrls: Array.from(
        { length: articleCount },
        (_, i) => `${url.replace(/\/author\/.*/, "")}/story/${fnv1a(`${url}${i}`)}`,
      ),
    };
    return article;
  },

  async scrapeArticle(url) {
    const beat = pickBy(BEATS, url);
    const daysAgo = fnv1a(url) % 120;
    const published = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
    const article: ScrapedArticle = {
      title: `A closer look at Bengaluru ${beat}`,
      url,
      publishedAt: published,
      content: `An in-depth report on ${beat} across Bengaluru, drawing on interviews and category data.`,
      summary: `Report on ${beat} in Bengaluru.`,
    };
    return article;
  },
};
