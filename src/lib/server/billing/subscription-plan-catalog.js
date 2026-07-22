import { getPayloadClient } from "../payload-client.js";

function toInteger(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeInterval(value) {
  return ["free", "monthly", "yearly"].includes(value) ? value : "";
}

function normalizeCheckoutMode(value) {
  return ["checkout", "contact", "unavailable"].includes(value) ? value : "unavailable";
}

export function serializeSubscriptionPlan(doc = {}) {
  return {
    id: doc.id || "",
    planKey: String(doc.planKey || "").trim(),
    displayGroup: String(doc.displayGroup || "").trim(),
    displayName: String(doc.displayName || "").trim(),
    description: String(doc.description || "").trim(),
    price: toInteger(doc.price),
    currency: doc.currency === "NOK" ? "NOK" : "NOK",
    interval: normalizeInterval(doc.interval),
    entitlementKey: String(doc.entitlementKey || "").trim() || null,
    checkoutMode: normalizeCheckoutMode(doc.checkoutMode),
    features: Array.isArray(doc.features)
      ? doc.features.map((item) => String(item?.feature || "").trim()).filter(Boolean)
      : [],
    ctaText: String(doc.ctaText || "").trim(),
    isPopular: Boolean(doc.isPopular),
    isActive: Boolean(doc.isActive),
    sortOrder: Number.isFinite(Number(doc.sortOrder)) ? Number(doc.sortOrder) : 0,
    vipps: {
      productId: String(doc.provider?.vippsProductId || "").trim() || null,
      agreementProductName: String(doc.provider?.vippsAgreementProductName || "").trim() || null,
    },
    stripe: {
      priceId: String(doc.provider?.stripePriceId || "").trim() || null,
    },
  };
}

function isUsablePlan(plan, { includeInactive = false } = {}) {
  return Boolean(
    plan.planKey
      && plan.displayGroup
      && plan.displayName
      && plan.interval
      && (includeInactive || plan.isActive),
  );
}

export async function getSubscriptionPlan(planKey, { includeInactive = false } = {}) {
  const cleanPlanKey = String(planKey || "").trim();
  if (!cleanPlanKey) return null;

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "subscription-plans",
    where: {
      planKey: { equals: cleanPlanKey },
    },
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  const plan = serializeSubscriptionPlan(result.docs?.[0]);
  return isUsablePlan(plan, { includeInactive }) ? plan : null;
}

export async function getSubscriptionPlanByStripePriceId(stripePriceId, { includeInactive = true } = {}) {
  const cleanPriceId = String(stripePriceId || "").trim();
  if (!cleanPriceId) return null;

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "subscription-plans",
    where: {
      "provider.stripePriceId": { equals: cleanPriceId },
    },
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  const plan = serializeSubscriptionPlan(result.docs?.[0]);
  if (isUsablePlan(plan, { includeInactive })) return plan;

  // The interval-specific environment Price IDs are safe server-side fallbacks for
  // legacy plans and Stripe Dashboard-created subscriptions without app metadata.
  const fallbackPlans = await getActiveSubscriptionPlans();
  return fallbackPlans.find((candidate) => (
    (candidate.interval === "monthly" && process.env.STRIPE_MONTHLY_PRICE_ID === cleanPriceId)
    || (candidate.interval === "yearly" && process.env.STRIPE_YEARLY_PRICE_ID === cleanPriceId)
  )) || null;
}

export async function getActiveSubscriptionPlans() {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "subscription-plans",
    where: {
      isActive: { equals: true },
    },
    sort: "sortOrder",
    limit: 100,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });

  return (result.docs || [])
    .map(serializeSubscriptionPlan)
    .filter((plan) => isUsablePlan(plan));
}

export function buildSubscriptionPlanCards(plans = []) {
  const groups = new Map();

  for (const plan of plans) {
    if (!isUsablePlan(plan)) continue;
    const group = groups.get(plan.displayGroup) || {
      id: plan.displayGroup,
      slug: plan.displayGroup,
      name: plan.displayName,
      description: plan.description,
      currency: plan.currency,
      monthlyPrice: 0,
      yearlyPrice: 0,
      monthlyPlanKey: "",
      yearlyPlanKey: "",
      planKey: "",
      features: plan.features,
      ctaText: plan.ctaText,
      isPopular: false,
      isActive: true,
      sortOrder: plan.sortOrder,
      checkoutMode: plan.checkoutMode,
      isContactRequired: plan.checkoutMode === "contact",
    };

    if (plan.interval === "monthly") {
      group.monthlyPrice = plan.price;
      group.monthlyPlanKey = plan.planKey;
      group.planKey = plan.planKey;
    } else if (plan.interval === "yearly") {
      group.yearlyPrice = plan.price;
      group.yearlyPlanKey = plan.planKey;
      if (!group.planKey) group.planKey = plan.planKey;
    } else if (plan.interval === "free") {
      group.monthlyPrice = plan.price;
      group.yearlyPrice = plan.price;
      group.planKey = plan.planKey;
    }

    group.currency = plan.currency || group.currency;
    group.features = plan.features.length ? plan.features : group.features;
    group.ctaText = plan.ctaText || group.ctaText;
    group.isPopular = Boolean(group.isPopular || plan.isPopular);
    group.sortOrder = Math.min(group.sortOrder, plan.sortOrder);
    if (plan.checkoutMode === "contact") {
      group.checkoutMode = "contact";
      group.isContactRequired = true;
    }
    groups.set(plan.displayGroup, group);
  }

  return [...groups.values()]
    .filter((plan) => plan.planKey)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}
