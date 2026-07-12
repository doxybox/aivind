import { getPayloadClient } from "@/lib/server/payload-client";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";
import { validateTipSubmissionInput } from "@/lib/server/tips-policy";

function sendError(res, error) {
  const status = error instanceof RateLimitError ? error.status : error?.status || 500;
  if (error instanceof RateLimitError) {
    res.setHeader("Retry-After", String(error.retryAfterSeconds));
  }
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await enforceRateLimit(req, res, {
      scope: "tips:create",
      ipLimit: 6,
      windowMs: 10 * 60 * 1000,
    });

    const input = validateTipSubmissionInput(req.body || {});
    const payload = await getPayloadClient();
    const tip = await payload.create({
      collection: "tip-submissions",
      data: {
        title: input.title,
        message: input.message,
        category: input.category,
        status: "new",
        riskLevel: "low",
      },
      overrideAccess: false,
    });

    return res.status(201).json({
      ok: true,
      id: tip.id,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
