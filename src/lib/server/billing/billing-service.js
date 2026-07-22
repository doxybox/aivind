import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { billingEvent, entitlement, subscription } from "@/db/schema";
import { getSubscriptionPlan, getSubscriptionPlanByStripePriceId } from "./subscription-plan-catalog.js";
import {
  buildEntitlementSource,
  getSubscriptionEntitlementKey,
  isSubscriptionEntitling,
  normalizeBillingProvider,
  normalizeBillingStatus,
} from "./billing-core.js";

function addInterval(start, interval) {
  const end = new Date(start);
  if (interval === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

async function assertPlan(planKey, { requireCheckout = false } = {}) {
  const plan = await getSubscriptionPlan(planKey);
  if (!plan || plan.planKey === "free" || !plan.entitlementKey || (requireCheckout && plan.checkoutMode !== "checkout")) {
    const error = new Error("Invalid billing plan");
    error.status = 400;
    throw error;
  }
  return plan;
}

function assertProvider(provider) {
  const cleanProvider = normalizeBillingProvider(provider);
  if (!cleanProvider) {
    const error = new Error("Invalid billing provider");
    error.status = 400;
    throw error;
  }
  return cleanProvider;
}

function assertStatus(status) {
  const cleanStatus = normalizeBillingStatus(status);
  if (!cleanStatus) {
    const error = new Error("Invalid subscription status");
    error.status = 400;
    throw error;
  }
  return cleanStatus;
}

export async function getCurrentUserSubscription(userId) {
  if (!userId) return null;

  const rows = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .orderBy(desc(subscription.updatedAt))
    .limit(1);

  return rows[0] || null;
}

export async function findSubscriptionByProviderId(provider, providerSubscriptionId) {
  if (!provider || !providerSubscriptionId) return null;

  const rows = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.provider, provider),
        eq(subscription.providerSubscriptionId, providerSubscriptionId),
      ),
    )
    .limit(1);

  return rows[0] || null;
}

export async function findSubscriptionByProviderCustomerId(provider, providerCustomerId) {
  if (!provider || !providerCustomerId) return null;

  const rows = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.provider, provider),
        eq(subscription.providerCustomerId, providerCustomerId),
      ),
    )
    .orderBy(desc(subscription.updatedAt))
    .limit(1);

  return rows[0] || null;
}

export async function findLatestProviderSubscriptionForUser(userId, provider) {
  if (!userId || !provider) return null;

  const rows = await db
    .select()
    .from(subscription)
    .where(and(eq(subscription.userId, userId), eq(subscription.provider, provider)))
    .orderBy(desc(subscription.updatedAt))
    .limit(1);

  return rows[0] || null;
}

export async function findSubscriptionById(subscriptionId) {
  if (!subscriptionId) return null;

  const rows = await db.select().from(subscription).where(eq(subscription.id, subscriptionId)).limit(1);
  return rows[0] || null;
}

export async function updateSubscriptionProviderReference(subscriptionId, {
  providerSubscriptionId,
  providerCustomerId = null,
  providerChargeId = null,
  metadata = {},
} = {}) {
  const existing = await findSubscriptionById(subscriptionId);
  if (!existing) return null;

  const rows = await db
    .update(subscription)
    .set({
      providerSubscriptionId: providerSubscriptionId || existing.providerSubscriptionId,
      providerCustomerId: providerCustomerId || existing.providerCustomerId,
      providerChargeId: providerChargeId || existing.providerChargeId,
      metadata: {
        ...(existing.metadata || {}),
        ...metadata,
      },
      updatedAt: new Date(),
    })
    .where(eq(subscription.id, subscriptionId))
    .returning();

  return rows[0] || null;
}

export async function syncStripeSubscription({
  stripeSubscription,
  userId = null,
  planKey = null,
  metadata = {},
} = {}) {
  const providerSubscriptionId = typeof stripeSubscription?.id === "string" ? stripeSubscription.id : "";
  if (!providerSubscriptionId) {
    const error = new Error("Stripe subscription id is required");
    error.status = 400;
    throw error;
  }

  const existing = await findSubscriptionByProviderId("stripe", providerSubscriptionId);
  const stripePriceId = String(stripeSubscription?.items?.data?.[0]?.price?.id || "").trim() || null;
  const resolvedPlan = planKey
    ? await getSubscriptionPlan(planKey, { includeInactive: true })
    : stripePriceId
      ? await getSubscriptionPlanByStripePriceId(stripePriceId, { includeInactive: true })
      : null;
  const effectiveUserId = userId || existing?.userId || null;

  if (!effectiveUserId) {
    const error = new Error("Stripe subscription is not linked to an application user");
    error.status = 422;
    error.code = "STRIPE_USER_LINK_MISSING";
    throw error;
  }

  const now = new Date();
  const currentPeriodStart = stripeSubscription.current_period_start
    ? new Date(stripeSubscription.current_period_start * 1000)
    : existing?.currentPeriodStart || null;
  const currentPeriodEnd = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000)
    : existing?.currentPeriodEnd || null;
  const canceledAt = stripeSubscription.canceled_at
    ? new Date(stripeSubscription.canceled_at * 1000)
    : existing?.canceledAt || null;
  const plan = resolvedPlan || {
    planKey: existing?.planKey || existing?.planType || "",
    entitlementKey: existing?.entitlementKey || null,
    price: existing?.price || 0,
    interval: existing?.billingPeriod || "monthly",
    currency: existing?.metadata?.planSnapshot?.currency || "NOK",
    displayName: existing?.metadata?.planSnapshot?.displayName || existing?.planKey || "",
    description: existing?.metadata?.planSnapshot?.description || "",
    features: existing?.metadata?.planSnapshot?.features || [],
  };

  if (!plan.planKey || !plan.entitlementKey) {
    const error = new Error("Stripe price is not mapped to a subscription plan");
    error.status = 422;
    error.code = "STRIPE_PLAN_MAPPING_MISSING";
    throw error;
  }

  const data = {
    userId: effectiveUserId,
    planType: plan.planKey,
    planKey: plan.planKey,
    entitlementKey: plan.entitlementKey,
    provider: "stripe",
    providerCustomerId: typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer?.id || existing?.providerCustomerId || null,
    providerSubscriptionId,
    providerChargeId: typeof stripeSubscription.latest_invoice?.charge === "string"
      ? stripeSubscription.latest_invoice.charge
      : existing?.providerChargeId || null,
    stripePriceId,
    status: String(stripeSubscription.status || "pending").toLowerCase(),
    price: plan.price,
    billingPeriod: plan.interval,
    paymentMethod: "stripe",
    cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
    currentPeriodStart,
    currentPeriodEnd,
    canceledAt,
    metadata: {
      ...(existing?.metadata || {}),
      ...metadata,
      stripeStatus: stripeSubscription.status || "pending",
      stripePriceId,
      planSnapshot: {
        displayName: plan.displayName,
        description: plan.description,
        features: plan.features,
        currency: plan.currency,
        price: plan.price,
        interval: plan.interval,
      },
    },
    updatedAt: now,
  };

  const rows = existing
    ? await db.update(subscription).set(data).where(eq(subscription.id, existing.id)).returning()
    : await db.insert(subscription).values({ ...data, createdAt: now }).returning();

  await syncEntitlementFromSubscription(rows[0], now);
  return rows[0];
}

export async function createPendingSubscription({
  userId,
  planKey,
  provider = "manual",
  providerCustomerId = null,
  providerSubscriptionId = null,
  providerChargeId = null,
  returnUrl = "",
  cancelUrl = "",
  metadata = {},
} = {}) {
  if (!userId) {
    const error = new Error("Authentication required");
    error.status = 401;
    throw error;
  }

  const plan = await assertPlan(planKey, { requireCheckout: true });
  const cleanProvider = assertProvider(provider);
  const existing = await findSubscriptionByProviderId(cleanProvider, providerSubscriptionId);
  if (existing) return existing;

  const now = new Date();
  const rows = await db
    .insert(subscription)
    .values({
      userId,
      planType: plan.planKey,
      planKey: plan.planKey,
      entitlementKey: plan.entitlementKey,
      provider: cleanProvider,
      providerCustomerId,
      providerSubscriptionId,
      providerChargeId,
      status: "pending",
      price: plan.price,
      billingPeriod: plan.interval,
      paymentMethod: cleanProvider,
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      metadata: {
        ...metadata,
        planSnapshot: {
          displayName: plan.displayName,
          description: plan.description,
          features: plan.features,
          currency: plan.currency,
          price: plan.price,
          interval: plan.interval,
        },
        returnUrl,
        cancelUrl,
      },
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return rows[0];
}

export async function syncEntitlementFromSubscription(row, now = new Date()) {
  if (!row?.id || !row.userId) return null;

  const entitlementKey = getSubscriptionEntitlementKey(row);
  if (!entitlementKey) return null;

  const source = buildEntitlementSource(row.id);
  const active = isSubscriptionEntitling(row, now);
  const existing = await db
    .select()
    .from(entitlement)
    .where(
      and(
        eq(entitlement.userId, row.userId),
        eq(entitlement.type, entitlementKey),
        eq(entitlement.source, source),
      ),
    )
    .limit(1);

  const data = {
    active,
    startsAt: active ? row.currentPeriodStart || now : row.currentPeriodStart || now,
    endsAt: active ? row.currentPeriodEnd || null : now,
    updatedAt: now,
  };

  if (existing.length > 0) {
    const rows = await db
      .update(entitlement)
      .set(data)
      .where(eq(entitlement.id, existing[0].id))
      .returning();
    return rows[0];
  }

  const rows = await db
    .insert(entitlement)
    .values({
      userId: row.userId,
      type: entitlementKey,
      source,
      ...data,
      createdAt: now,
    })
    .returning();

  return rows[0];
}

export async function activateSubscriptionFromProviderEvent({
  userId,
  planKey,
  provider,
  providerCustomerId = null,
  providerSubscriptionId,
  providerChargeId = null,
  currentPeriodStart = new Date(),
  currentPeriodEnd = null,
  metadata = {},
} = {}) {
  const cleanProvider = assertProvider(provider);
  const existing = await findSubscriptionByProviderId(cleanProvider, providerSubscriptionId);
  const plan = existing
    ? {
        planKey: existing.planKey || existing.planType,
        entitlementKey: existing.entitlementKey,
        price: existing.price,
        interval: existing.billingPeriod || "monthly",
        currency: existing.metadata?.planSnapshot?.currency || "NOK",
        displayName: existing.metadata?.planSnapshot?.displayName || existing.planKey || existing.planType,
        description: existing.metadata?.planSnapshot?.description || "",
        features: existing.metadata?.planSnapshot?.features || [],
      }
    : await assertPlan(planKey, { requireCheckout: true });
  const periodStart = currentPeriodStart instanceof Date ? currentPeriodStart : new Date(currentPeriodStart);
  const periodEnd = currentPeriodEnd
    ? currentPeriodEnd instanceof Date ? currentPeriodEnd : new Date(currentPeriodEnd)
    : addInterval(periodStart, plan.interval);
  if (!existing && !userId) {
    const error = new Error("userId is required for new subscription activation");
    error.status = 400;
    throw error;
  }
  const now = new Date();
  const data = {
    ...(userId ? { userId } : {}),
    planType: plan.planKey,
    planKey: plan.planKey,
    entitlementKey: plan.entitlementKey,
    provider: cleanProvider,
    providerCustomerId,
    providerSubscriptionId,
    providerChargeId,
    status: "active",
    price: plan.price,
    billingPeriod: plan.interval,
    paymentMethod: cleanProvider,
    cancelAtPeriodEnd: false,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    metadata: {
      ...(existing?.metadata || {}),
      ...metadata,
      planSnapshot: {
        displayName: plan.displayName,
        description: plan.description,
        features: plan.features,
        currency: plan.currency,
        price: plan.price,
        interval: plan.interval,
      },
    },
    updatedAt: now,
  };

  const rows = existing
    ? await db.update(subscription).set(data).where(eq(subscription.id, existing.id)).returning()
    : await db.insert(subscription).values({ ...data, userId, createdAt: now }).returning();

  await syncEntitlementFromSubscription(rows[0], now);
  return rows[0];
}

export async function cancelSubscriptionFromProviderEvent({
  provider,
  providerSubscriptionId,
  cancelAtPeriodEnd = true,
  metadata = {},
} = {}) {
  const cleanProvider = assertProvider(provider);
  const existing = await findSubscriptionByProviderId(cleanProvider, providerSubscriptionId);
  if (!existing) return null;

  const now = new Date();
  const rows = await db
    .update(subscription)
    .set({
      status: "cancelled",
      cancelAtPeriodEnd,
      metadata: {
        ...(existing.metadata || {}),
        ...metadata,
      },
      updatedAt: now,
    })
    .where(eq(subscription.id, existing.id))
    .returning();

  await syncEntitlementFromSubscription(rows[0], now);
  return rows[0];
}

export async function expireSubscription(subscriptionId, now = new Date()) {
  if (!subscriptionId) return null;

  const rows = await db
    .update(subscription)
    .set({
      status: assertStatus("expired"),
      cancelAtPeriodEnd: false,
      currentPeriodEnd: now,
      updatedAt: now,
    })
    .where(eq(subscription.id, subscriptionId))
    .returning();

  if (rows[0]) await syncEntitlementFromSubscription(rows[0], now);
  return rows[0] || null;
}

export async function markSubscriptionPastDue(provider, providerSubscriptionId, metadata = {}) {
  const cleanProvider = assertProvider(provider);
  const existing = await findSubscriptionByProviderId(cleanProvider, providerSubscriptionId);
  if (!existing) return null;

  const now = new Date();
  const rows = await db
    .update(subscription)
    .set({
      status: "past_due",
      metadata: {
        ...(existing.metadata || {}),
        ...metadata,
      },
      updatedAt: now,
    })
    .where(eq(subscription.id, existing.id))
    .returning();

  await syncEntitlementFromSubscription(rows[0], now);
  return rows[0];
}

export async function recordBillingEvent({
  provider,
  eventId,
  providerSubscriptionId = null,
  eventType = "",
  status = "",
  payloadHash = "",
} = {}) {
  if (!provider || !eventId) {
    const error = new Error("Invalid billing event");
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const rows = await db
    .insert(billingEvent)
    .values({
      provider,
      eventId,
      providerSubscriptionId,
      eventType,
      status,
      payloadHash,
      processedAt: now,
      createdAt: now,
    })
    .onConflictDoNothing()
    .returning();

  return {
    inserted: rows.length > 0,
    event: rows[0] || null,
  };
}

export async function claimBillingEvent({
  provider,
  eventId,
  providerSubscriptionId = null,
  eventType = "",
  status = "received",
  payloadHash = "",
  eventCreatedAt = null,
} = {}) {
  if (!provider || !eventId) {
    const error = new Error("Invalid billing event");
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const rows = await db
    .insert(billingEvent)
    .values({
      provider,
      eventId,
      providerSubscriptionId,
      eventType,
      status,
      payloadHash,
      eventCreatedAt: eventCreatedAt ? new Date(eventCreatedAt) : null,
      processedAt: null,
      createdAt: now,
    })
    .onConflictDoNothing()
    .returning();

  if (rows.length === 0) {
    const existingRows = await db
      .select()
      .from(billingEvent)
      .where(and(eq(billingEvent.provider, provider), eq(billingEvent.eventId, eventId)))
      .limit(1);
    const existing = existingRows[0];

    // A failed delivery has no processedAt timestamp. Stripe may retry it safely.
    if (existing && !existing.processedAt && existing.status === "failed") {
      const reclaimed = await db
        .update(billingEvent)
        .set({ status: "received", failureCode: null })
        .where(eq(billingEvent.id, existing.id))
        .returning();
      return { claimed: reclaimed.length > 0, event: reclaimed[0] || existing };
    }
  }

  return {
    claimed: rows.length > 0,
    event: rows[0] || null,
  };
}

export async function completeBillingEvent(provider, eventId, status = "processed") {
  if (!provider || !eventId) return null;

  const rows = await db
    .update(billingEvent)
    .set({ status, processedAt: new Date(), failureCode: null })
    .where(and(eq(billingEvent.provider, provider), eq(billingEvent.eventId, eventId)))
    .returning();
  return rows[0] || null;
}

export async function failBillingEvent(provider, eventId, failureCode = "processing_failed") {
  if (!provider || !eventId) return null;

  const rows = await db
    .update(billingEvent)
    .set({ status: "failed", failureCode: String(failureCode || "processing_failed").slice(0, 120) })
    .where(and(eq(billingEvent.provider, provider), eq(billingEvent.eventId, eventId)))
    .returning();
  return rows[0] || null;
}
