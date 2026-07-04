export type MappedSite = {
  urls: string[];
};

export type AuthorPage = {
  name: string;
  role?: string;
  profileUrl: string;
  email?: string;
  articleUrls: string[];
};

export type ScrapedArticle = {
  title: string;
  url: string;
  publishedAt?: string;
  content: string;
  summary?: string;
};

export interface ScraperProvider {
  mapSite(url: string): Promise<MappedSite>;
  scrapeAuthorPage(url: string): Promise<AuthorPage>;
  scrapeArticle(url: string): Promise<ScrapedArticle>;
}
