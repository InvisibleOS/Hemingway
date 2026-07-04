import { getDb, type Db } from "./_client";
import type { Article, ArticleInsert } from "./types";

export async function listArticlesByJournalist(
  journalistId: string,
  db: Db = getDb(),
): Promise<Article[]> {
  const { data, error } = await db
    .from("articles")
    .select("*")
    .eq("journalist_id", journalistId)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertArticles(
  rows: ArticleInsert[],
  db: Db = getDb(),
): Promise<Article[]> {
  const { data, error } = await db.from("articles").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

/** Remove a journalist's articles before re-inserting fresh ones (refresh path). */
export async function deleteArticlesByJournalist(
  journalistId: string,
  db: Db = getDb(),
): Promise<void> {
  const { error } = await db.from("articles").delete().eq("journalist_id", journalistId);
  if (error) throw error;
}
