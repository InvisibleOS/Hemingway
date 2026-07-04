import { getDb, type Db } from "./_client";
import type { Client, ClientInsert } from "./types";

export async function listClients(db: Db = getDb()): Promise<Client[]> {
  const { data, error } = await db.from("clients").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listActiveClients(db: Db = getDb()): Promise<Client[]> {
  const { data, error } = await db
    .from("clients")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getClient(id: string, db: Db = getDb()): Promise<Client | null> {
  const { data, error } = await db.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertClients(
  rows: ClientInsert[],
  db: Db = getDb(),
): Promise<Client[]> {
  const { data, error } = await db.from("clients").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}
