import { getDb, type Db } from "./_client";
import type { Publication, PublicationInsert, Vertical } from "./types";

export async function listPublications(
  filters: { vertical?: Vertical } = {},
  db: Db = getDb(),
): Promise<Publication[]> {
  let query = db.from("publications").select("*").order("name");
  if (filters.vertical) query = query.eq("vertical", filters.vertical);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getPublication(
  id: string,
  db: Db = getDb(),
): Promise<Publication | null> {
  const { data, error } = await db
    .from("publications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertPublication(
  row: PublicationInsert,
  db: Db = getDb(),
): Promise<Publication> {
  const { data, error } = await db
    .from("publications")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertPublications(
  rows: PublicationInsert[],
  db: Db = getDb(),
): Promise<Publication[]> {
  const { data, error } = await db.from("publications").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

export async function updatePublication(
  id: string,
  patch: Partial<PublicationInsert>,
  db: Db = getDb(),
): Promise<Publication | null> {
  const { data, error } = await db
    .from("publications")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}
