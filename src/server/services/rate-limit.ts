interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // UTC timestamp when the window resets
}

export class RateLimiter {
  private static store = new Map<string, { count: number; expiresAt: number }>();
  private static redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  private static redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  /**
   * Enforces rate limits per tenant/endpoint.
   * Leverages Upstash Redis in serverless production, and falls back to in-memory in local dev.
   */
  static async checkLimit(
    orgId: string,
    endpoint: string,
    limit: number,
    windowSecs: number
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${orgId}:${endpoint}`;
    const now = Date.now();

    // Redis Multi-Tenant Rate Limiting
    if (this.redisUrl && this.redisToken) {
      try {
        // Increment key atomically
        const incrRes = await fetch(`${this.redisUrl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(["INCR", key]),
        });

        if (incrRes.ok) {
          const incrJson = await incrRes.json();
          const count = Number(incrJson.result);

          // If it's a new key, set its TTL expiry window
          if (count === 1) {
            await fetch(`${this.redisUrl}`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${this.redisToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(["EXPIRE", key, windowSecs]),
            });
          }

          // Fetch TTL to calculate reset time
          const ttlRes = await fetch(`${this.redisUrl}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.redisToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(["TTL", key]),
          });
          const ttlJson = await ttlRes.json();
          const ttl = Math.max(0, Number(ttlJson.result));
          const reset = now + ttl * 1000;

          const success = count <= limit;
          const remaining = Math.max(0, limit - count);

          return {
            success,
            limit,
            remaining,
            reset,
          };
        }
      } catch (err) {
        console.warn("[RateLimiter] Redis check failed, fallback to in-memory", err);
      }
    }

    // In-Memory Fallback
    const record = this.store.get(key);
    const expiresAt = now + windowSecs * 1000;

    if (!record) {
      this.store.set(key, { count: 1, expiresAt });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: expiresAt,
      };
    }

    if (now > record.expiresAt) {
      // Reset window
      this.store.set(key, { count: 1, expiresAt });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: expiresAt,
      };
    }

    // Increment
    record.count += 1;
    const isSuccess = record.count <= limit;
    const remainingCount = Math.max(0, limit - record.count);

    return {
      success: isSuccess,
      limit,
      remaining: remainingCount,
      reset: record.expiresAt,
    };
  }
}
