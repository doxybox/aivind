function headerValue(req, name) {
  const value = req?.headers?.[name.toLowerCase()] || req?.headers?.[name];
  return Array.isArray(value) ? value[0] : value || "";
}

function allowedOriginsFromEnv(env = process.env) {
  return [
    env.BILLING_PUBLIC_ORIGIN,
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_BETTER_AUTH_URL,
    env.NEXT_PUBLIC_SITE_URL,
    ...(env.BETTER_AUTH_TRUSTED_ORIGINS || "").split(","),
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
  ]
    .map((origin) => String(origin || "").trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

export function assertSameOriginRequest(req, { env = process.env, requireSource = true } = {}) {
  const method = String(req?.method || "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;

  const source = headerValue(req, "origin") || headerValue(req, "referer");
  if (!source) {
    if (!requireSource) return true;

    const error = new Error("Missing request origin");
    error.status = 403;
    throw error;
  }

  let origin = "";
  try {
    origin = new URL(source).origin;
  } catch {
    const error = new Error("Invalid request origin");
    error.status = 403;
    throw error;
  }

  if (!allowedOriginsFromEnv(env).includes(origin)) {
    const error = new Error("Invalid request origin");
    error.status = 403;
    throw error;
  }

  return true;
}
