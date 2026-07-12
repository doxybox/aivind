import crypto from "node:crypto";
import { buildCheckoutUrl } from "../billing-core.js";

const REQUIRED_ENV = [
  "VIPPS_CLIENT_ID",
  "VIPPS_CLIENT_SECRET",
  "VIPPS_SUBSCRIPTION_KEY",
  "VIPPS_MERCHANT_SERIAL_NUMBER",
];

const TEST_BASE_URL = "https://apitest.vipps.no";
const TOKEN_SKEW_MS = 60 * 1000;

let cachedToken = null;

export function resetVippsAccessTokenCacheForTests() {
  cachedToken = null;
}

export class VippsRecurringNotConfiguredError extends Error {
  constructor(message = "Vipps Recurring is not configured") {
    super(message);
    this.name = "VippsRecurringNotConfiguredError";
    this.status = 501;
  }
}

export class VippsRecurringApiError extends Error {
  constructor(message = "Vipps Recurring API request failed", status = 502, data = null) {
    super(message);
    this.name = "VippsRecurringApiError";
    this.status = status;
    this.data = data;
  }
}

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function safeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getHeader(req, name) {
  const value = req?.headers?.[name.toLowerCase()] || req?.headers?.[name];
  return Array.isArray(value) ? value[0] : value || "";
}

export function getVippsRecurringConfig(env = process.env) {
  const vippsEnv = (env.VIPPS_ENV || "test").toLowerCase();
  if (vippsEnv !== "test") {
    const error = new VippsRecurringNotConfiguredError("Only Vipps test environment is enabled in this implementation");
    error.missing = ["VIPPS_ENV=test"];
    throw error;
  }

  const missing = REQUIRED_ENV.filter((key) => !env[key]);
  if (missing.length > 0) {
    const error = new VippsRecurringNotConfiguredError("Vipps Recurring credentials are missing");
    error.missing = missing;
    throw error;
  }

  return {
    env: vippsEnv,
    baseUrl: env.VIPPS_BASE_URL || env.VIPPS_RECURRING_BASE_URL || TEST_BASE_URL,
    clientId: env.VIPPS_CLIENT_ID,
    clientSecret: env.VIPPS_CLIENT_SECRET,
    subscriptionKey: env.VIPPS_SUBSCRIPTION_KEY,
    merchantSerialNumber: env.VIPPS_MERCHANT_SERIAL_NUMBER,
    webhookSecret: env.VIPPS_WEBHOOK_SECRET || "",
    returnUrl: env.VIPPS_RETURN_URL || "http://localhost:3000/abonnement/status",
    cancelUrl: env.VIPPS_CANCEL_URL || "http://localhost:3000/abonnement",
    webhookUrl: env.VIPPS_WEBHOOK_URL || "",
  };
}

export function buildVippsAuthHeaders(config) {
  return {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    "Merchant-Serial-Number": config.merchantSerialNumber,
  };
}

export function buildVippsApiHeaders(config, accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    "Merchant-Serial-Number": config.merchantSerialNumber,
  };
}

export async function getVippsAccessToken({ env = process.env, fetchFn = fetch } = {}) {
  const config = getVippsRecurringConfig(env);
  const now = Date.now();
  if (cachedToken?.accessToken && cachedToken.expiresAt > now + TOKEN_SKEW_MS) {
    return cachedToken.accessToken;
  }

  const response = await fetchFn(joinUrl(config.baseUrl, "/accesstoken/get"), {
    method: "POST",
    headers: buildVippsAuthHeaders(config),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    throw new VippsRecurringApiError("Vipps access token request failed", response.status, data);
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + Number(data.expires_in || 3600) * 1000,
  };

  return cachedToken.accessToken;
}

export function buildVippsAgreementPayload({ user, plan, subscription, returnUrl, cancelUrl, config }) {
  const amountOre = Math.round(Number(plan.price || 0) * 100);
  const interval = plan.interval === "yearly"
    ? { unit: "YEAR", count: 1 }
    : { unit: "MONTH", count: 1 };

  return {
    externalId: subscription.id,
    productName: plan.vipps?.agreementProductName || plan.displayName,
    productDescription: plan.description || plan.displayName,
    pricing: {
      type: "LEGACY",
      amount: amountOre,
      currency: plan.currency || "NOK",
    },
    interval,
    merchantRedirectUrl: returnUrl ? buildCheckoutUrl(returnUrl) : config.returnUrl,
    merchantAgreementUrl: cancelUrl ? buildCheckoutUrl(cancelUrl) : config.cancelUrl,
    merchantWebhookUrl: config.webhookUrl || undefined,
    customer: user?.email ? { email: user.email } : undefined,
  };
}

function parseAgreementResponse(data = {}) {
  const agreementId = data.agreementId || data.id || data.agreement?.id || data.agreement?.agreementId || "";
  const confirmationUrl =
    data.vippsConfirmationUrl ||
    data.confirmationUrl ||
    data.redirectUrl ||
    data.url ||
    data.agreement?.vippsConfirmationUrl ||
    "";

  return { agreementId, confirmationUrl };
}

export async function createAgreement({
  user,
  plan,
  subscription,
  returnUrl,
  cancelUrl,
  env = process.env,
  fetchFn = fetch,
} = {}) {
  const config = getVippsRecurringConfig(env);
  const accessToken = await getVippsAccessToken({ env, fetchFn });
  const payload = buildVippsAgreementPayload({ user, plan, subscription, returnUrl, cancelUrl, config });
  const response = await fetchFn(joinUrl(config.baseUrl, "/recurring/v3/agreements"), {
    method: "POST",
    headers: {
      ...buildVippsApiHeaders(config, accessToken),
      "Idempotency-Key": subscription.id,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new VippsRecurringApiError("Vipps agreement creation failed", response.status, data);
  }

  const parsed = parseAgreementResponse(data || {});
  if (!parsed.agreementId || !parsed.confirmationUrl) {
    throw new VippsRecurringApiError("Vipps agreement response was missing agreement id or confirmation URL", 502, data);
  }

  return {
    ...parsed,
    raw: data,
  };
}

export const createVippsRecurringAgreement = createAgreement;

export function normalizeVippsAgreementStatus(value = "") {
  const status = String(value || "").trim().toUpperCase();
  if (["ACTIVE", "ACCEPTED"].includes(status)) return "active";
  if (["PENDING", "CREATED"].includes(status)) return "pending";
  if (["STOPPED", "CANCELLED", "CANCELED"].includes(status)) return "cancelled";
  if (["EXPIRED"].includes(status)) return "expired";
  if (["FAILED", "REJECTED"].includes(status)) return "past_due";
  return "unknown";
}

export function parseAgreementStatus(data = {}) {
  const status = data.status || data.state || data.agreement?.status || data.agreement?.state || "";
  const agreementId = data.agreementId || data.id || data.agreement?.id || data.agreement?.agreementId || "";
  return {
    agreementId,
    vippsStatus: status,
    internalStatus: normalizeVippsAgreementStatus(status),
    raw: data,
  };
}

export async function fetchAgreement(agreementId, { env = process.env, fetchFn = fetch } = {}) {
  if (!agreementId) {
    const error = new Error("agreementId is required");
    error.status = 400;
    throw error;
  }

  const config = getVippsRecurringConfig(env);
  const accessToken = await getVippsAccessToken({ env, fetchFn });
  const response = await fetchFn(joinUrl(config.baseUrl, `/recurring/v3/agreements/${encodeURIComponent(agreementId)}`), {
    method: "GET",
    headers: buildVippsApiHeaders(config, accessToken),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new VippsRecurringApiError("Vipps agreement status request failed", response.status, data);
  }

  return parseAgreementStatus(data || {});
}

export const fetchVippsRecurringAgreement = fetchAgreement;

export async function cancelAgreement(agreementId, { env = process.env, fetchFn = fetch } = {}) {
  if (!agreementId) {
    const error = new Error("agreementId is required");
    error.status = 400;
    throw error;
  }

  const config = getVippsRecurringConfig(env);
  const accessToken = await getVippsAccessToken({ env, fetchFn });
  const response = await fetchFn(joinUrl(config.baseUrl, `/recurring/v3/agreements/${encodeURIComponent(agreementId)}`), {
    method: "DELETE",
    headers: buildVippsApiHeaders(config, accessToken),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new VippsRecurringApiError("Vipps agreement cancellation failed", response.status, data);
  }

  return { agreementId, cancelled: true };
}

export const cancelVippsRecurringAgreement = cancelAgreement;

export function hashRawBody(rawBody = "") {
  return crypto.createHash("sha256").update(rawBody, "utf8").digest("base64");
}

function timingSafeEqualText(a = "", b = "") {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function buildVippsWebhookSignature({ method, pathAndQuery, host, xMsDate, contentSha256, secret }) {
  const stringToSign = [
    method.toUpperCase(),
    pathAndQuery,
    xMsDate,
    host,
    contentSha256,
  ].join("\n");
  return crypto.createHmac("sha256", secret).update(stringToSign, "utf8").digest("base64");
}

export function parseVippsAuthorizationSignature(value = "") {
  const signatureMatch = String(value).match(/Signature=([^,&\s]+)/i) || String(value).match(/signature=([^,&\s]+)/i);
  if (signatureMatch) return signatureMatch[1];

  const bearerMatch = String(value).match(/HMAC-SHA256\s+(.+)/i);
  if (bearerMatch) return bearerMatch[1].trim();

  return String(value).trim();
}

export function validateVippsWebhookRequest(req, rawBody = "") {
  const config = getVippsRecurringConfig();
  if (!config.webhookSecret) {
    const error = new VippsRecurringNotConfiguredError("Vipps webhook secret is missing");
    error.missing = ["VIPPS_WEBHOOK_SECRET"];
    throw error;
  }

  const contentSha256 = getHeader(req, "x-ms-content-sha256");
  const expectedContentSha256 = hashRawBody(rawBody);
  if (!contentSha256 || !timingSafeEqualText(contentSha256, expectedContentSha256)) {
    const error = new Error("Invalid Vipps webhook content hash");
    error.status = 401;
    throw error;
  }

  const authorization = getHeader(req, "authorization");
  const host = getHeader(req, "host");
  const xMsDate = getHeader(req, "x-ms-date");
  if (!authorization || !host || !xMsDate) {
    const error = new Error("Missing Vipps webhook signature headers");
    error.status = 401;
    throw error;
  }

  const pathAndQuery = req.url || "/api/billing/webhooks/vipps";
  const expectedSignature = buildVippsWebhookSignature({
    method: req.method || "POST",
    pathAndQuery,
    host,
    xMsDate,
    contentSha256,
    secret: config.webhookSecret,
  });
  const providedSignature = parseVippsAuthorizationSignature(authorization);

  if (!timingSafeEqualText(providedSignature, expectedSignature)) {
    const error = new Error("Invalid Vipps webhook signature");
    error.status = 401;
    throw error;
  }

  const body = safeJson(rawBody);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("Invalid Vipps webhook payload");
    error.status = 400;
    throw error;
  }

  return body;
}

export function extractVippsWebhookEvent(body = {}, rawBody = "") {
  const agreementId =
    body.agreementId ||
    body.agreement_id ||
    body.reference ||
    body.agreement?.id ||
    body.agreement?.agreementId ||
    body.data?.agreementId ||
    "";
  const eventType = body.eventType || body.type || body.name || body.event || "vipps_webhook";
  const status = body.status || body.state || body.agreement?.status || body.data?.status || "";
  const eventId =
    body.eventId ||
    body.id ||
    body.event_id ||
    [agreementId, eventType, status, body.timestamp || hashRawBody(rawBody)].filter(Boolean).join(":");

  return {
    eventId,
    agreementId,
    eventType,
    status,
    payloadHash: hashRawBody(rawBody),
  };
}
