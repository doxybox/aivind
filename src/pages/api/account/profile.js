import { getProfileByUser, upsertProfileForUser } from "@/lib/server/account-service";
import { AuthRequiredError, requireAuth } from "@/lib/server/auth-helpers";
import { assertSameOriginRequest } from "@/lib/server/csrf";

function sendError(res, error) {
  const status = error instanceof AuthRequiredError || error?.status === 401 ? 401 : error?.status || 500;
  res.status(status).json({
    error: status === 500 ? "Internal server error" : error.message,
    errors: error.errors || undefined,
  });
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export default async function handler(req, res) {
  if (!["GET", "PUT"].includes(req.method)) {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (req.method === "PUT") assertSameOriginRequest(req);
    const session = await requireAuth(req);

    if (req.method === "GET") {
      const profile = await getProfileByUser(session.user);
      return res.status(200).json(profile);
    }

    if (!isPlainObject(req.body)) {
      return res.status(400).json({ error: "Invalid profile payload" });
    }

    const profile = await upsertProfileForUser(session.user, req.body || {});
    return res.status(200).json(profile);
  } catch (error) {
    return sendError(res, error);
  }
}
