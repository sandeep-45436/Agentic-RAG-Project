import crypto from "crypto";

interface CacheRecord {
  value: unknown;
  expiresAt: number;
}

export class CacheService {
  private static memoryStore = new Map<string, CacheRecord>();
  private static redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  private static redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  /**
   * Helper to hash chunk text for embedding cache keys
   */
  static hashKey(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
  }

  /**
   * Gets a value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    // If Redis is configured, use it
    if (this.redisUrl && this.redisToken) {
      try {
        const res = await fetch(`${this.redisUrl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(["GET", key]),
        });
        
        if (res.ok) {
          const json = await res.json();
          if (json.result) {
            return JSON.parse(json.result) as T;
          }
        }
      } catch (err) {
        console.warn("[CacheService] Redis GET failed, fallback to memory", err);
      }
    }

    // In-memory fallback
    const record = this.memoryStore.get(key);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }

    return record.value as T;
  }

  /**
   * Sets a value in cache
   */
  static async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const valueString = JSON.stringify(value);

    // If Redis is configured, use it
    if (this.redisUrl && this.redisToken) {
      try {
        const res = await fetch(`${this.redisUrl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(["SET", key, valueString, "EX", ttlSeconds]),
        });
        if (res.ok) return;
      } catch (err) {
        console.warn("[CacheService] Redis SET failed, fallback to memory", err);
      }
    }

    // In-memory fallback
    this.memoryStore.set(key, { value, expiresAt });
  }

  /**
   * Deletes a value from cache
   */
  static async delete(key: string): Promise<void> {
    if (this.redisUrl && this.redisToken) {
      try {
        await fetch(`${this.redisUrl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(["DEL", key]),
        });
      } catch (err) {
        console.warn("[CacheService] Redis DEL failed", err);
      }
    }

    this.memoryStore.delete(key);
  }

  /**
   * Cleans expired keys from the in-memory fallback store
   */
  static cleanExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.memoryStore.entries()) {
      if (now > record.expiresAt) {
        this.memoryStore.delete(key);
      }
    }
  }
}

// Set interval to clean expired in-memory keys every 5 minutes
if (typeof window === "undefined") {
  setInterval(() => CacheService.cleanExpired(), 5 * 60 * 1000).unref?.();
}
