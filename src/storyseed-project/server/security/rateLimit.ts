type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimitKey(ip: string, action: string) {
  return `${action}:${ip}`;
}

export function assertRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > max) {
    throw new Error("請求過於頻繁，請稍後再試。");
  }
}

export function clientIp(req: { headers: Record<string, unknown>; ip?: string }) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return req.ip ?? "unknown";
}
