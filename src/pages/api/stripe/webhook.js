import { StripeBillingNotConfiguredError } from "@/lib/server/billing/providers/stripe";
import { constructVerifiedStripeEvent, handleVerifiedStripeEvent } from "@/lib/server/billing/stripe-webhook";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function sendError(res, error) {
  const signatureError = error?.type === "StripeSignatureVerificationError";
  const status = signatureError ? 400 : error instanceof StripeBillingNotConfiguredError ? error.status : error?.status || 500;
  return res.status(status).json({
    error: status >= 500 ? "Webhook processing failed." : error.message,
    ...(error?.code ? { code: error.code } : {}),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await readRawBody(req);
    const event = constructVerifiedStripeEvent(rawBody, req.headers["stripe-signature"]);
    const result = await handleVerifiedStripeEvent(event, rawBody);
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    return sendError(res, error);
  }
}
