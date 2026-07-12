import { sql } from "@/db/client";

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

async function consume(key, limit, windowMs, now) {
  const nextResetAt = new Date(now + windowMs);
  const [bucket] = await sql`
    insert into rate_limit_bucket (key, count, reset_at, updated_at)
    values (${key}, 1, ${nextResetAt}, now())
    on conflict (key) do update set
      count = case
        when rate_limit_bucket.reset_at <= now() then 1
        else rate_limit_bucket.count + 1
      end,
      reset_at = case
        when rate_limit_bucket.reset_at <= now() then excluded.reset_at
        else rate_limit_bucket.reset_at
      end,
      updated_at = now()
    returning count, reset_at
  `;

  const count = Number(bucket.count);
  const resetAt = new Date(bucket.reset_at).getTime();

  return {
    allowed: count <= limit,
    remaining: Math.max(limit - count, 0),
    resetAt,
    retryAfterSeconds: Math.max(Math.ceil((resetAt - now) / 1000), 1),
  };
}

export async function enforceRateLimit(req, res, {
  scope,
  userId,
  userLimit,
  ipLimit,
  windowMs,
}) {
  const now = Date.now();
  const ip = getClientIp(req);
  const pendingChecks = [
    userId ? consume(`${scope}:user:${userId}`, userLimit, windowMs, now) : null,
    consume(`${scope}:ip:${ip}`, ipLimit, windowMs, now),
  ].filter(Boolean);
  const checks = await Promise.all(pendingChecks);

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
