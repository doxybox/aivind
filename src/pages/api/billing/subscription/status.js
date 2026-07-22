import { AuthRequiredError, requireAuth } from "@/lib/server/auth-helpers";
import { getCurrentUserSubscription } from "@/lib/server/billing/billing-service";
import {
  fetchVippsRecurringAgreement,
  VippsRecurringNotConfiguredError,
} from "@/lib/server/billing/providers/vipps-recurring";
import { syncVippsAgreementStatusToSubscription } from "@/lib/server/billing/vipps-status-sync";
import { assertSameOriginRequest } from "@/lib/server/csrf";

function serializeSubscription(row) {
  if (!row) return null;
  return {
    id: row.id,
    provider: row.provider,
    status: row.status,
    planKey: row.planKey,
    entitlementKey: row.entitlementKey,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
  };
}

function sendError(res, error) {
  const status = error instanceof AuthRequiredError ? 401 : error?.status || 500;
  res.status(status).json({
    error: status === 500 ? "Internal server error" : error.message,
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
    const subscription = await getCurrentUserSubscription(session.user.id);

    if (!subscription) {
      return res.status(200).json({
        provider: null,
        status: "none",
        subscription: null,
      });
    }

    if (subscription.provider !== "vipps" || !subscription.providerSubscriptionId) {
      return res.status(200).json({
        provider: subscription.provider,
        status: subscription.status,
        subscription: serializeSubscription(subscription),
      });
    }

    const agreementStatus = await fetchVippsRecurringAgreement(subscription.providerSubscriptionId);
    const syncedSubscription = await syncVippsAgreementStatusToSubscription(subscription, agreementStatus);

    return res.status(200).json({
      provider: "vipps",
      status: syncedSubscription?.status || subscription.status,
      vippsStatus: agreementStatus.vippsStatus,
      subscription: serializeSubscription(syncedSubscription || subscription),
    });
  } catch (error) {
    return sendError(res, error);
  }
}
