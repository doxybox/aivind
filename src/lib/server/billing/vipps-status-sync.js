import {
  activateSubscriptionFromProviderEvent,
  cancelSubscriptionFromProviderEvent,
  expireSubscription,
  markSubscriptionPastDue,
} from "@/lib/server/billing/billing-service";

function addInterval(start, interval) {
  const end = new Date(start);
  if (interval === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

function resolvePeriod(subscription, plan) {
  const now = new Date();
  const currentEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const currentStart = subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart) : now;

  if (currentEnd && currentEnd > now) {
    return {
      currentPeriodStart: currentStart,
      currentPeriodEnd: currentEnd,
    };
  }

  return {
    currentPeriodStart: now,
    currentPeriodEnd: addInterval(now, plan.interval),
  };
}

export async function syncVippsAgreementStatusToSubscription(subscription, agreementStatus) {
  if (!subscription?.id) {
    const error = new Error("Subscription not found");
    error.status = 404;
    throw error;
  }

  const plan = {
    planKey: subscription.planKey || subscription.planType,
    interval: subscription.billingPeriod || "monthly",
  };
  if (!plan.planKey) {
    const error = new Error("Invalid subscription plan");
    error.status = 400;
    throw error;
  }

  const providerSubscriptionId = agreementStatus.agreementId || subscription.providerSubscriptionId;
  const metadata = {
    ...(subscription.metadata || {}),
    vippsStatus: agreementStatus.vippsStatus || agreementStatus.internalStatus,
    vippsStatusCheckedAt: new Date().toISOString(),
  };

  if (agreementStatus.internalStatus === "active") {
    const period = resolvePeriod(subscription, plan);
    return activateSubscriptionFromProviderEvent({
      userId: subscription.userId,
      planKey: plan.planKey,
      provider: "vipps",
      providerSubscriptionId,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      metadata,
    });
  }

  if (agreementStatus.internalStatus === "cancelled") {
    return cancelSubscriptionFromProviderEvent({
      provider: "vipps",
      providerSubscriptionId,
      cancelAtPeriodEnd: false,
      metadata,
    });
  }

  if (agreementStatus.internalStatus === "expired") {
    return expireSubscription(subscription.id);
  }

  if (agreementStatus.internalStatus === "past_due") {
    return markSubscriptionPastDue("vipps", providerSubscriptionId, metadata);
  }

  return subscription;
}
