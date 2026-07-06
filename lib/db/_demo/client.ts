/**
 * Demo data client. A tiny in-memory stand-in for the Supabase client that
 * serves the baked fixture rows (lib/db/_demo/fixtures.json) so the whole app
 * renders with no database, e.g. on a preview deployment with no Supabase keys.
 *
 * It implements only the query surface that /lib/db actually uses: select with
 * `!inner` embeds and exact counts, eq/in/ilike/or/not filters (including dotted
 * filters on embedded resources), multi-key order, range/limit pagination, the
 * single/maybeSingle terminators, and insert/update/delete. The match_journalists
 * RPC returns nothing so /lib/matching takes its keyword fallback. Writes mutate
 * the in-memory store: they persist within a running instance and reset on a cold
 * start, which is the right behaviour for a throwaway demo.
 *
 * None of the /lib/db functions know this exists; getDb() swaps it in when
 * isDemoMode() is true. Nothing here talks to an external service.
 */
import type { Db } from "../_client";
import fixtures from "./fixtures.json";

type Row = Record<string, unknown>;
type Store = Record<string, Row[]>;

/** Result envelope, matching the shape /lib/db destructures from Supabase. */
type Result = { data: unknown; error: null; count?: number };

/** Deep-cloned once so writes never mutate the imported JSON module. */
const store: Store = structuredClone(fixtures as unknown as Store);

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "1" || process.env.NEXT_PUBLIC_DEMO_MODE === "1") {
    return true;
  }
  // Auto-enable when no service database is configured (preview deployments).
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

let cached: Db | null = null;
export function createDemoClient(): Db {
  if (!cached) cached = new DemoClient() as unknown as Db;
  return cached;
}

// --- helpers ---------------------------------------------------------------

function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return "demo-" + Math.abs(hashString(String(store.pitches?.length ?? 0) + ":" + Date.now())).toString(16);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Singular foreign-key column for an embedded table, e.g. publications -> publication_id. */
function fkColumn(table: string): string {
  return table.replace(/s$/, "") + "_id";
}

function getPath(row: Row, col: string): unknown {
  if (!col.includes(".")) return row[col];
  return col.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Row)[key];
    return undefined;
  }, row);
}

function likeToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^" + escaped.replace(/%/g, ".*").replace(/_/g, ".") + "$", "i");
}

// --- select embeds (PostgREST `alias:table!inner(...)`) --------------------

type Embed = { alias: string; table: string; children: Embed[] };

function splitTopLevel(select: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of select) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseEmbeds(select: string): Embed[] {
  const embeds: Embed[] = [];
  for (const part of splitTopLevel(select)) {
    const open = part.indexOf("(");
    if (open === -1) continue; // scalar column, ignored (full rows are returned)
    const header = part.slice(0, open);
    const inner = part.slice(open + 1, part.lastIndexOf(")"));
    const m = header.match(/^(\w+):(\w+)/);
    if (!m) continue;
    embeds.push({ alias: m[1], table: m[2], children: parseEmbeds(inner) });
  }
  return embeds;
}

/** Attach embedded resources; `!inner` semantics drop rows missing a relation. */
function attachEmbeds(rows: Row[], embeds: Embed[]): Row[] {
  if (embeds.length === 0) return rows;
  const out: Row[] = [];
  for (const row of rows) {
    const shaped: Row = { ...row };
    let keep = true;
    for (const embed of embeds) {
      const related = (store[embed.table] ?? []).find(
        (r) => r.id === shaped[fkColumn(embed.table)],
      );
      if (!related) {
        keep = false;
        break;
      }
      shaped[embed.alias] = attachEmbeds([related], embed.children)[0];
    }
    if (keep) out.push(shaped);
  }
  return out;
}

// --- filters ---------------------------------------------------------------

type Filter =
  | { type: "eq"; col: string; val: unknown }
  | { type: "in"; col: string; vals: unknown[] }
  | { type: "ilike"; col: string; pattern: string }
  | { type: "or"; conds: { col: string; pattern: string }[] }
  | { type: "not"; col: string; op: string; val: unknown };

function parseOr(expr: string): { col: string; pattern: string }[] {
  return splitTopLevel(expr).map((cond) => {
    const first = cond.indexOf(".");
    const second = cond.indexOf(".", first + 1);
    return { col: cond.slice(0, first), pattern: cond.slice(second + 1) };
  });
}

function matches(row: Row, f: Filter): boolean {
  switch (f.type) {
    case "eq":
      return getPath(row, f.col) === f.val;
    case "in":
      return f.vals.includes(getPath(row, f.col));
    case "ilike":
      return likeToRegExp(f.pattern).test(String(getPath(row, f.col) ?? ""));
    case "or":
      return f.conds.some((c) => likeToRegExp(c.pattern).test(String(getPath(row, c.col) ?? "")));
    case "not":
      if (f.op === "is" && f.val === null) return getPath(row, f.col) != null;
      return true;
  }
}

// --- order -----------------------------------------------------------------

type Order = { col: string; ascending: boolean; nullsFirst: boolean };

function orderRows(rows: Row[], orders: Order[]): Row[] {
  if (orders.length === 0) return rows;
  return [...rows].sort((r1, r2) => {
    for (const o of orders) {
      const a = getPath(r1, o.col);
      const b = getPath(r2, o.col);
      const an = a == null;
      const bn = b == null;
      if (an || bn) {
        if (an && bn) continue;
        const rank = o.nullsFirst ? -1 : 1;
        return an ? rank : -rank;
      }
      let cmp: number;
      if (typeof a === "number" && typeof b === "number") cmp = a - b;
      else cmp = String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
      if (cmp !== 0) return o.ascending ? cmp : -cmp;
    }
    return 0;
  });
}

// --- query builder ---------------------------------------------------------

type Op = "select" | "insert" | "update" | "delete";

class Query implements PromiseLike<Result> {
  private op: Op = "select";
  private selectStr = "*";
  private wantCount = false;
  private headOnly = false;
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private rangeFromTo: [number, number] | null = null;
  private limitN: number | null = null;
  private singleRow = false;
  private maybe = false;
  private insertRows: Row[] = [];
  private patch: Row = {};

  constructor(private readonly table: string) {}

  select(str = "*", opts?: { count?: string; head?: boolean }): this {
    this.selectStr = str;
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }
  insert(rows: Row | Row[]): this {
    this.op = "insert";
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }
  update(patch: Row): this {
    this.op = "update";
    this.patch = patch;
    return this;
  }
  delete(): this {
    this.op = "delete";
    return this;
  }
  eq(col: string, val: unknown): this {
    this.filters.push({ type: "eq", col, val });
    return this;
  }
  in(col: string, vals: unknown[]): this {
    this.filters.push({ type: "in", col, vals });
    return this;
  }
  ilike(col: string, pattern: string): this {
    this.filters.push({ type: "ilike", col, pattern });
    return this;
  }
  or(expr: string): this {
    this.filters.push({ type: "or", conds: parseOr(expr) });
    return this;
  }
  not(col: string, op: string, val: unknown): this {
    this.filters.push({ type: "not", col, op, val });
    return this;
  }
  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }): this {
    this.orders.push({
      col,
      ascending: opts?.ascending !== false,
      nullsFirst: opts?.nullsFirst === true,
    });
    return this;
  }
  range(from: number, to: number): this {
    this.rangeFromTo = [from, to];
    return this;
  }
  limit(n: number): this {
    this.limitN = n;
    return this;
  }
  maybeSingle(): this {
    this.maybe = true;
    return this;
  }
  single(): this {
    this.singleRow = true;
    return this;
  }

  then<T = Result, E = never>(
    onfulfilled?: ((value: Result) => T | PromiseLike<T>) | null,
    onrejected?: ((reason: unknown) => E | PromiseLike<E>) | null,
  ): PromiseLike<T | E> {
    return Promise.resolve(this.exec()).then(onfulfilled, onrejected);
  }

  private table_(): Row[] {
    return (store[this.table] ??= []);
  }

  private applyFilters(rows: Row[]): Row[] {
    return rows.filter((row) => this.filters.every((f) => matches(row, f)));
  }

  private shape(rows: Row[]): Result {
    if (this.singleRow || this.maybe) {
      const first = rows[0] ?? null;
      return { data: first, error: null };
    }
    return { data: rows, error: null };
  }

  private exec(): Result {
    if (this.op === "insert") {
      const now = new Date().toISOString();
      const inserted = this.insertRows.map((r) => {
        const base: Row = { ...r };
        if (base.id == null) base.id = newId();
        if (base.created_at == null) base.created_at = now;
        return base;
      });
      this.table_().push(...inserted);
      return this.shape(inserted);
    }

    if (this.op === "update") {
      const targets = this.applyFilters(this.table_());
      for (const row of targets) Object.assign(row, this.patch);
      return this.shape(targets);
    }

    if (this.op === "delete") {
      const table = this.table_();
      const survivors = table.filter((row) => !this.filters.every((f) => matches(row, f)));
      store[this.table] = survivors;
      return this.shape([]);
    }

    // select
    let rows = attachEmbeds([...this.table_()], parseEmbeds(this.selectStr));
    rows = this.applyFilters(rows);
    const count = rows.length;
    rows = orderRows(rows, this.orders);
    if (this.headOnly) return { data: null, error: null, count };
    if (this.rangeFromTo) rows = rows.slice(this.rangeFromTo[0], this.rangeFromTo[1] + 1);
    if (this.limitN != null) rows = rows.slice(0, this.limitN);
    const result = this.shape(rows);
    if (this.wantCount) result.count = count;
    return result;
  }
}

/**
 * Stand-in for the match_journalists RPC. The real function cosine-ranks profile
 * and article embeddings; those are stripped from the fixtures, so this
 * synthesises stable, plausible similarity scores (in the same 0.55-0.97 band and
 * the same profile_weight blend the SQL uses) over the vertical's journalists.
 * The result shape matches the RPC so /lib/matching takes its primary vector path
 * and the Match panel looks exactly as it does against a real database.
 */
function demoMatchJournalists(params: Record<string, unknown>): Row[] {
  const vertical = (params.filter_vertical as string | null) ?? null;
  const matchCount = (params.match_count as number) ?? 25;
  const minScore = (params.min_score as number) ?? 0;
  const profileWeight = (params.profile_weight as number) ?? 0.6;

  const pubById = new Map((store.publications ?? []).map((p) => [p.id, p]));

  return (store.journalists ?? [])
    .filter((j) => !vertical || pubById.get(j.publication_id as string)?.vertical === vertical)
    .map((j) => {
      const id = String(j.id);
      const h1 = (hashString(id) >>> 0) / 0xffffffff;
      const h2 = (hashString(id + ":a") >>> 0) / 0xffffffff;
      let profile = 0.58 + h1 * 0.34;
      if (j.uses_data_studies) profile += 0.03;
      if (j.quotes_founders) profile += 0.02;
      profile = Math.min(0.97, profile);
      const article = Math.min(0.97, 0.55 + h2 * 0.34);
      const score = profileWeight * profile + (1 - profileWeight) * article;
      return { journalist_id: id, score, profile_similarity: profile, article_similarity: article };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, matchCount);
}

class DemoClient {
  from(table: string): Query {
    return new Query(table);
  }
  rpc(name: string, params?: Record<string, unknown>): Promise<Result> {
    if (name === "match_journalists" && params) {
      return Promise.resolve({ data: demoMatchJournalists(params), error: null });
    }
    return Promise.resolve({ data: [], error: null });
  }
}
