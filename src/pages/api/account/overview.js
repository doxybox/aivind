import { getOverviewForUser } from "@/lib/server/account-service";
import { AuthRequiredError, requireAuth } from "@/lib/server/auth-helpers";

function sendError(res, error) {
  const status = error instanceof AuthRequiredError || error?.status === 401 ? 401 : error?.status || 500;
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await requireAuth(req);
    const overview = await getOverviewForUser(session.user);
    return res.status(200).json(overview);
  } catch (error) {
    return sendError(res, error);
  }
}
