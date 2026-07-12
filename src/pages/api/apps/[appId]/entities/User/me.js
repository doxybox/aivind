import { getCurrentUser } from "@/lib/server/auth-helpers";
import { setLegacyShimHeaders, validateLegacyAppId } from "@/lib/server/legacy-app-shim";

// Deprecated Base44 compatibility shim.
// Returns only safe Better Auth user fields for old Base44-shaped callers.
// TODO: add shared API rate limiting before exposing these shims outside trusted environments.
export default async function handler(req, res) {
  setLegacyShimHeaders(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!validateLegacyAppId(req, res)) return;

  const user = await getCurrentUser(req);

  if (!user) {
    return res.status(200).json(null);
  }

  return res.status(200).json({
    id: user.id,
    email: user.email,
    name: user.name,
    full_name: user.name,
  });
}
