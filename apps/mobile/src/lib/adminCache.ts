// In-memory cache & event invalidation manager for admin entities (students, parents, teachers, staff)

type CacheListener = () => void;

class AdminCacheStore {
  // Timestamp when list was last fetched
  private lastFetched = new Map<string, number>();
  // Subscribed listeners for mutations
  private listeners = new Map<string, Set<CacheListener>>();
  // Detail cache maps
  public details = new Map<string, { data: any; timestamp: number }>();

  private TTL_MS = 3 * 60 * 1000; // 3 minutes fresh cache

  public isFresh(entityKey: string): boolean {
    const last = this.lastFetched.get(entityKey);
    if (!last) return false;
    return Date.now() - last < this.TTL_MS;
  }

  public markFetched(entityKey: string): void {
    this.lastFetched.set(entityKey, Date.now());
  }

  public invalidate(entityKey: string, id?: string): void {
    // Invalidate list timestamp so next focus triggers a fresh fetch
    this.lastFetched.delete(entityKey);

    // If specific id is provided, evict it from details cache
    if (id) {
      this.details.delete(`${entityKey}:${id}`);
    }

    // Notify active listeners
    const group = this.listeners.get(entityKey);
    if (group) {
      group.forEach((fn) => {
        try {
          fn();
        } catch (e) {
          console.error(`Error in cache listener for ${entityKey}:`, e);
        }
      });
    }
  }

  public subscribe(entityKey: string, callback: CacheListener): () => void {
    if (!this.listeners.has(entityKey)) {
      this.listeners.set(entityKey, new Set());
    }
    const group = this.listeners.get(entityKey)!;
    group.add(callback);

    return () => {
      group.delete(callback);
    };
  }

  public getDetail<T>(entityKey: string, id: string): T | null {
    const entry = this.details.get(`${entityKey}:${id}`);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.TTL_MS) {
      this.details.delete(`${entityKey}:${id}`);
      return null;
    }
    return entry.data as T;
  }

  public setDetail<T>(entityKey: string, id: string, data: T): void {
    this.details.set(`${entityKey}:${id}`, { data, timestamp: Date.now() });
  }

  public removeDetail(entityKey: string, id: string): void {
    this.details.delete(`${entityKey}:${id}`);
  }
}

export const adminCache = new AdminCacheStore();
