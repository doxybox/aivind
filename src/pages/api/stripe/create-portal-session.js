import { AuthRequiredError, requireAuth } from "@/lib/server/auth-helpers";
import { assertSameOriginRequest } from "@/lib/server/csrf";
import { findLatestProviderSubscriptionForUser } from "@/lib/server/billing/billing-service";
import { getStripeBillingConfig, getStripeClient, StripeBillingNotConfiguredError } from "@/lib/server/billing/providers/stripe";

function sendError(res, error) {
  const status = error instanceof AuthRequiredError ? 401 : error?.status || 500;
  return res.status(status).json({
    error: status >= 500 ? "Unable to open the subscription portal." : error.message,
    ...(error?.code ? { code: error.code } : {}),
    ...(error instanceof StripeBillingNotConfiguredError ? { missing: error.missing } : {}),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertSameOriginRequest(req);
    const session = await requireAuth(req);
    const subscription = await findLatestProviderSubscriptionForUser(session.user.id, "stripe");
    if (!subscription?.providerCustomerId) {
      return res.status(404).json({ error: "No Stripe subscription was found for this account." });
    }

    const { customerPortalReturnUrl } = getStripeBillingConfig();
    const portal = await getStripeClient().billingPortal.sessions.create({
      customer: subscription.providerCustomerId,
      return_url: customerPortalReturnUrl,
    });

    return res.status(201).json({ url: portal.url });
  } catch (error) {
    return sendError(res, error);
  }
}
