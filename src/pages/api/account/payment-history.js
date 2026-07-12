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
    await requireAuth(req);
    return res.status(200).json({
      payments: [],
      configured: false,
      message: "Payment history is not connected to a payment provider yet.",
    });
  } catch (error) {
    return sendError(res, error);
  }
}
