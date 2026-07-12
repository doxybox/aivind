const buckets = new Map();
const CLEANUP_INTERVAL_MS = 60 * 1000;

let lastCleanupAt = 0;

export class RateLimitError extends Error {
  constructor(message = "Too many requests", retryAfterSeconds = 60) {
    super(message);
    this.name = "RateLimitError";
    this.status = 429;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const ip = String(firstForwarded || req.headers["x-real-ip"] || req.socket?.remoteAddress || "")
    .split(",")[0]
    .trim();

  return ip || "unknown";
}

function cleanup(now) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function consume(key, limit, windowMs, now) {
  cleanup(now);

  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : existing;

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(limit - bucket.count, 0),
    resetAt: bucket.resetAt,
    retryAfterSeconds: Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1),
  };
}

export function enforceRateLimit(req, res, {
  scope,
  userId,
  userLimit,
  ipLimit,
  windowMs,
}) {
  const now = Date.now();
  const ip = getClientIp(req);
  const checks = [
    userId ? consume(`${scope}:user:${userId}`, userLimit, windowMs, now) : null,
    consume(`${scope}:ip:${ip}`, ipLimit, windowMs, now),
  ].filter(Boolean);

  const blocked = checks.find((result) => !result.allowed);
  const remaining = Math.min(...checks.map((result) => result.remaining));
  const resetAt = Math.max(...checks.map((result) => result.resetAt));

  res.setHeader("X-RateLimit-Limit", String(Math.min(userLimit || ipLimit, ipLimit)));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(remaining, 0)));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

  if (blocked) {
    res.setHeader("Retry-After", String(blocked.retryAfterSeconds));
    throw new RateLimitError("For mange forsok. Vent litt og prov igjen.", blocked.retryAfterSeconds);
  }

  return { ip, remaining, resetAt };
}
