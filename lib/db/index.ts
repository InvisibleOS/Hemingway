/**
 * /lib/db is the only place the app reads or writes the database. Components and
 * scripts import these functions; they never issue inline Supabase queries.
 */
export * from "./types";
export { getDb, type Db } from "./_client";
export * from "./clients";
export * from "./publications";
export * from "./journalists";
export * from "./articles";
export * from "./campaigns";
export * from "./pitches";
export * from "./monitor-events";
export * from "./placements";
export * from "./metrics-snapshots";
