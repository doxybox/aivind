import {
  getNewsletterPreferencesForUser,
  updateNewsletterPreferencesForUser,
} from "@/lib/server/account-service";
import { AuthRequiredError, requireAuth } from "@/lib/server/auth-helpers";
import { assertSameOriginRequest } from "@/lib/server/csrf";

function sendError(res, error) {
  const status = error instanceof AuthRequiredError || error?.status === 401 ? 401 : error?.status || 500;
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (req.method === "POST") assertSameOriginRequest(req);
    const session = await requireAuth(req);

    if (req.method === "GET") {
      const preferences = await getNewsletterPreferencesForUser(session.user);
      return res.status(200).json(preferences);
    }

    if (!isPlainObject(req.body)) {
      return res.status(400).json({ error: "Invalid newsletter preferences payload" });
    }

    const preferences = await updateNewsletterPreferencesForUser(session.user, req.body || {});
    return res.status(200).json(preferences);
  } catch (error) {
    return sendError(res, error);
  }
}
