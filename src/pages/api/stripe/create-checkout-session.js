import { AuthRequiredError, requireAuth } from "@/lib/server/auth-helpers";
import { assertSameOriginRequest } from "@/lib/server/csrf";
import { validateCheckoutInput } from "@/lib/server/billing/billing-core";
import { getSubscriptionPlan } from "@/lib/server/billing/subscription-plan-catalog";
import { createStripeCheckoutSession } from "@/lib/server/billing/stripe-checkout";
import { StripeBillingNotConfiguredError } from "@/lib/server/billing/providers/stripe";

function sendError(res, error) {
  const status = error instanceof AuthRequiredError ? 401 : error?.status || 500;
  return res.status(status).json({
    error: status >= 500 ? "Unable to start checkout." : error.message,
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
    const { plan, returnUrl, cancelUrl } = await validateCheckoutInput(req.body || {}, {
      resolvePlan: (planKey) => getSubscriptionPlan(planKey),
    });
    const checkout = await createStripeCheckoutSession({
      user: session.user,
      plan,
      returnUrl,
      cancelUrl,
    });

    return res.status(201).json({
      provider: "stripe",
      status: "pending",
      subscriptionId: checkout.subscription.id,
      checkoutSessionId: checkout.sessionId,
      checkoutUrl: checkout.checkoutUrl,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
