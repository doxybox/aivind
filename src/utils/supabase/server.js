import { createServerClient } from "@supabase/ssr";
import { getSupabaseServerConfig } from "./config";

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);

  return parts.join("; ");
}

function appendSetCookie(res, cookie) {
  if (!res?.getHeader || !res?.setHeader) return;

  const current = res.getHeader("Set-Cookie");
  const next = Array.isArray(current)
    ? [...current, cookie]
    : current
      ? [current, cookie]
      : [cookie];

  res.setHeader("Set-Cookie", next);
}

function getAllRequestCookies(req) {
  return Object.entries(req?.cookies || {}).map(([name, value]) => ({
    name,
    value: String(value),
  }));
}

export function createClient({ req, res } = {}) {
  const { supabaseUrl, supabaseKey } = getSupabaseServerConfig();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return getAllRequestCookies(req);
      },
      setAll(cookiesToSet) {
        if (!res) return;

        cookiesToSet.forEach(({ name, value, options }) => {
          appendSetCookie(res, serializeCookie(name, value, options));
        });
      },
    },
  });
}
