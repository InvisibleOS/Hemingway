/**
 * Deterministic helpers for mock providers: the same input always yields the
 * same output, with no external dependencies (faker is dev-only and must not
 * enter the app bundle). Used for hashing emails, seeding fake data, and
 * producing stable pseudo-embeddings.
 */

export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Small seeded PRNG (mulberry32). Returns a function producing floats in [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministically pick an item from a list by a string key. */
export function pickBy<T>(arr: readonly T[], key: string): T {
  return arr[fnv1a(key) % arr.length];
}

/** A stable unit-length pseudo-embedding for a string. Cosine-similarity-safe. */
export function deterministicVector(seed: string, dim = 1024): number[] {
  const rand = mulberry32(fnv1a(seed));
  const v = Array.from({ length: dim }, () => rand() * 2 - 1);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}
