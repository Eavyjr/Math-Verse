/**
 * @fileOverview A tiny in-memory TTL + LRU cache for server actions.
 *
 * Caches deterministic, idempotent results (e.g. WolframAlpha queries) so repeated
 * identical requests avoid redundant external API calls and AI preprocessing.
 * This lives in the Node.js server process; it is best-effort and resets on redeploy.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly ttlMs: number = 1000 * 60 * 10, // 10 minutes
    private readonly maxEntries: number = 200
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh recency for simple LRU behavior.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxEntries) {
      // Evict the oldest (least recently used) entry.
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
