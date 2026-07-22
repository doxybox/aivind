import { AuthRequiredError, requireAuth } from "@/lib/server/auth-helpers";
import { getBillingCheckoutStatus, validateCheckoutInput } from "@/lib/server/billing/billing-core";
import {
  createPendingSubscription,
  updateSubscriptionProviderReference,
} from "@/lib/server/billing/billing-service";
import {
  createVippsRecurringAgreement,
  getVippsRecurringConfig,
  VippsRecurringNotConfiguredError,
} from "@/lib/server/billing/providers/vipps-recurring";
import { assertSameOriginRequest } from "@/lib/server/csrf";
import { getSubscriptionPlan } from "@/lib/server/billing/subscription-plan-catalog";
import { createStripeCheckoutSession } from "@/lib/server/billing/stripe-checkout";

function sendError(res, error) {
  const status = error instanceof AuthRequiredError ? 401 : error?.status || 500;
  res.status(status).json({
    error: status === 500 ? "Internal server error" : error.message,
    ...(error?.code ? { code: error.code } : {}),
    ...(error instanceof VippsRecurringNotConfiguredError ? { missing: error.missing || [] } : {}),
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
    const checkoutStatus = getBillingCheckoutStatus();
    const provider = checkoutStatus.provider;

    if (!checkoutStatus.enabled) {
      return res.status(503).json({
        error: checkoutStatus.message,
        code: checkoutStatus.code,
        provider,
        ...(checkoutStatus.missing?.length ? { missing: checkoutStatus.missing } : {}),
      });
    }

    if (provider === "manual" || provider === "test") {
      const subscription = await createPendingSubscription({
        userId: session.user.id,
        planKey: plan.planKey,
        provider,
        returnUrl,
        cancelUrl,
        metadata: {
          checkoutMode: "test",
        },
      });

      return res.status(201).json({
        provider,
        status: "pending",
        subscriptionId: subscription.id,
        checkoutUrl: returnUrl,
      });
    }

    if (provider === "vipps") {
      getVippsRecurringConfig();
      const subscription = await createPendingSubscription({
        userId: session.user.id,
        planKey: plan.planKey,
        provider,
        returnUrl,
        cancelUrl,
        metadata: {
          checkoutMode: "vipps_recurring_test",
        },
      });
      const agreement = await createVippsRecurringAgreement({
        user: session.user,
        plan,
        subscription,
        returnUrl,
        cancelUrl,
      });

      const updatedSubscription = await updateSubscriptionProviderReference(subscription.id, {
        providerSubscriptionId: agreement.agreementId,
        metadata: {
          vippsAgreementId: agreement.agreementId,
          vippsAgreementCreatedAt: new Date().toISOString(),
        },
      });

      return res.status(201).json({
        provider,
        status: "pending",
        subscriptionId: updatedSubscription?.id || subscription.id,
        vippsAgreementId: agreement.agreementId,
        checkoutUrl: agreement.confirmationUrl,
        vippsConfirmationUrl: agreement.confirmationUrl,
      });
    }

    if (provider === "stripe") {
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
    }

    return res.status(501).json({
      error: "Billing provider is not implemented",
      provider,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
