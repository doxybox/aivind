import { isSubscriptionActive } from "../authz-core.js";

export const BILLING_PROVIDERS = ["manual", "test", "vipps", "stripe"];
export const BILLING_STATUSES = ["pending", "active", "trialing", "past_due", "cancelled", "expired"];
export const CHECKOUT_PATH_ALLOWLIST = ["/abonnement/status", "/abonnement", "/min-side"];

export function normalizeBillingProvider(value = "") {
  const provider = String(value || "").trim().toLowerCase();
  return BILLING_PROVIDERS.includes(provider) ? provider : "";
}

export function normalizeBillingStatus(value = "") {
  const status = String(value || "").trim().toLowerCase();
  return BILLING_STATUSES.includes(status) ? status : "";
}

export async function validateCheckoutInput(input = {}, { resolvePlan } = {}) {
  const planKey = typeof input.planKey === "string" ? input.planKey.trim() : "";
  const plan = typeof resolvePlan === "function" ? await resolvePlan(planKey) : null;

  if (!plan || plan.planKey === "free" || !plan.entitlementKey || plan.checkoutMode !== "checkout") {
    const error = new Error("Invalid planKey");
    error.status = 400;
    throw error;
  }

  return {
    plan,
    returnUrl: cleanCheckoutPath(input.returnUrl, "/abonnement/status"),
    cancelUrl: cleanCheckoutPath(input.cancelUrl, "/abonnement"),
  };
}

export function cleanCheckoutPath(value, fallback = "/abonnement") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const path = value.trim();
  const decodedPath = safelyDecode(path);

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\") ||
    decodedPath.startsWith("//") ||
    decodedPath.startsWith("/\\") ||
    /[\r\n\\]/.test(path) ||
    /^[a-z][a-z0-9+.-]*:/i.test(path)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(path, "https://aivind.local");
    if (parsed.origin !== "https://aivind.local") return fallback;
    return CHECKOUT_PATH_ALLOWLIST.includes(parsed.pathname) ? `${parsed.pathname}${parsed.search}` : fallback;
  } catch {
    return fallback;
  }
}

function safelyDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getSiteOrigin(env = process.env) {
  const value =
    env.BILLING_PUBLIC_ORIGIN ||
    env.NEXT_PUBLIC_SITE_URL ||
    env.BETTER_AUTH_URL ||
    env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://localhost:3000";

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function buildCheckoutUrl(path, env = process.env) {
  return new URL(cleanCheckoutPath(path), getSiteOrigin(env)).toString();
}

export function getBillingCheckoutStatus(env = process.env) {
  const provider = normalizeBillingProvider(env.BILLING_PROVIDER);
  if (!provider) {
    return {
      enabled: false,
      provider: "",
      code: "BILLING_NOT_CONFIGURED",
      message: "Betaling er ikke aktivert i dette miljøet.",
    };
  }

  if (provider === "manual" || provider === "test") {
    return {
      enabled: env.ALLOW_TEST_BILLING_CHECKOUT === "true",
      provider,
      code: env.ALLOW_TEST_BILLING_CHECKOUT === "true" ? "BILLING_READY" : "TEST_BILLING_DISABLED",
      message: env.ALLOW_TEST_BILLING_CHECKOUT === "true"
        ? "Test checkout er aktivert."
        : "Test checkout er ikke aktivert.",
    };
  }

  if (provider === "vipps") {
    const required = [
      "VIPPS_CLIENT_ID",
      "VIPPS_CLIENT_SECRET",
      "VIPPS_SUBSCRIPTION_KEY",
      "VIPPS_MERCHANT_SERIAL_NUMBER",
    ];
    const missing = required.filter((key) => !env[key]);
    return {
      enabled: missing.length === 0,
      provider,
      code: missing.length === 0 ? "BILLING_READY" : "VIPPS_NOT_CONFIGURED",
      message: missing.length === 0 ? "Vipps checkout er konfigurert." : "Betaling er ikke aktivert i dette miljøet.",
      missing,
    };
  }

  return {
    enabled: false,
    provider,
    code: "BILLING_PROVIDER_NOT_IMPLEMENTED",
    message: "Betalingsleverandoren er ikke implementert enna.",
  };
}

export function getSubscriptionPlanKey(row = {}) {
  return row.planKey || row.plan_type || row.planType || "free";
}

export function getSubscriptionEntitlementKey(row = {}) {
  return row.entitlementKey || row.entitlement_key || null;
}

export function isSubscriptionEntitling(row, now = new Date()) {
  return Boolean(isSubscriptionActive(row, now) && getSubscriptionEntitlementKey(row));
}

export function buildEntitlementSource(subscriptionId) {
  return subscriptionId ? `subscription:${subscriptionId}` : "";
}

export function buildProviderEventId({ provider, eventId, providerSubscriptionId, status } = {}) {
  return [provider, eventId, providerSubscriptionId, status].filter(Boolean).join(":");
}
