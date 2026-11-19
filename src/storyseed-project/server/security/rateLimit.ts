/*
 * [F001][S031] In-memory rate limiting for login and AI endpoints.
 * Input: a bucket key (action + identity), a maximum count and a window.
 * Process: count attempts per key, resetting when the window expires; evict
 *          expired buckets when the map grows large.
 * Output: throws TOO_MANY_REQUESTS (HTTP 429) once the limit is exceeded, so
 *         throttling never shows up as a 500 in production logs.
 */
import { TRPCError } from "@trpc/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 5000;

export function rateLimitKey(scope: string, action: string) {
  return `${action}:${scope}`;
}

function evictExpired(now: number) {
  buckets.forEach((bucket, key) => {
    if (now >= bucket.resetAt) buckets.delete(key);
  });
}

export function assertRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) evictExpired(now);
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > max) {
    const waitMinutes = Math.max(1, Math.ceil((bucket.resetAt - now) / 60_000));
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `請求過於頻繁，請約 ${waitMinutes} 分鐘後再試。`,
    });
  }
}

export function clientIp(req: { headers: Record<string, unknown>; ip?: string }) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return req.ip ?? "unknown";
}
