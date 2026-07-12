import { resolveLoginEmail } from "@/lib/server/login-identifier";
import { cleanInternalRedirectPath } from "@/lib/safe-redirect";

function getRequestBaseUrl(req) {
  const host = req.headers.host || "localhost:3000";
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${proto}://${host}`;
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
  const baseUrl = getRequestBaseUrl(req);

  const authResponse = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: req.headers.cookie || "",
      Origin: req.headers.origin || baseUrl,
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
}
