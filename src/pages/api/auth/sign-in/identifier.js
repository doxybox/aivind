import { resolveLoginEmail } from "@/lib/server/login-identifier";
import { cleanInternalRedirectPath } from "@/lib/safe-redirect";
import { assertSameOriginRequest } from "@/lib/server/csrf";

function getConfiguredAuthOrigin(env = process.env) {
  const configured = env.BETTER_AUTH_URL || env.NEXT_PUBLIC_BETTER_AUTH_URL || env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    return new URL(configured).origin;
  } catch {
    throw new Error("Invalid Better Auth origin configuration");
  }
}

function getSetCookieHeaders(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const cookie = headers.get("set-cookie");
  return cookie ? [cookie] : [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertSameOriginRequest(req);

    const identifier = String(req.body?.identifier || req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    const callbackURL = cleanInternalRedirectPath(
      typeof req.body?.callbackURL === "string" ? req.body.callbackURL : "",
      "/min-side",
    );

    if (!identifier || !password) {
      return res.status(400).json({ message: "Username/e-post og passord må fylles ut" });
    }

    const email = await resolveLoginEmail(identifier);
    const baseUrl = getConfiguredAuthOrigin();
    const authResponse = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
      },
      body: JSON.stringify({
        email,
        password,
        callbackURL,
      }),
    });

    const setCookieHeaders = getSetCookieHeaders(authResponse.headers);
    if (setCookieHeaders.length > 0) {
      res.setHeader("Set-Cookie", setCookieHeaders);
    }

    const contentType = authResponse.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const body = await authResponse.text();
    return res.status(authResponse.status).send(body);
  } catch (error) {
    const status = error?.status || 500;
    if (status >= 500) console.error("[auth:sign-in-identifier] request failed", { message: error?.message });
    return res.status(status).json({ message: status === 500 ? "Kunne ikke logge inn akkurat nå" : error.message });
  }
}
