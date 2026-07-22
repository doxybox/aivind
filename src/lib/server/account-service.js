import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { newsletterPreference, savedArticle, subscription, userProfile } from "@/db/schema";
import { getUserEntitlements, userHasActiveSubscription } from "@/lib/server/auth-helpers";
import { hasPremiumAccountAccess, stripForbiddenProfileFields } from "@/lib/server/account-policy";
import { isTrustedAvatarUrl } from "@/lib/server/avatar-upload-policy";
import {
  NEWSLETTER_DEFAULTS,
  validateNewsletterPreferencesInput,
} from "@/lib/server/newsletter-preferences-policy";

const DEFAULT_PROFILE = {
  first_name: "",
  last_name: "",
  display_name: "",
  email: "",
  email_verified: false,
  phone: "",
  phone_verified: false,
  address_line_1: "",
  address_line_2: "",
  postal_code: "",
  city: "",
  country: "Norge",
  preferred_language: "no",
  avatar_url: "",
  marketing_consent: false,
  newsletter_consent: false,
  terms_accepted_at: "",
  privacy_accepted_at: "",
  auth_provider: "email",
};

function iso(value) {
  return value instanceof Date ? value.toISOString() : value || "";
}

function splitName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function safeDate(value, fallback = null) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function serializeProfile(row, user) {
  const fallbackName = splitName(user?.name || "");

  if (!row) {
    return {
      ...DEFAULT_PROFILE,
      id: null,
      user_id: user?.id || "",
      first_name: fallbackName.firstName,
      last_name: fallbackName.lastName,
      display_name: user?.name || "",
      email: user?.email || "",
      email_verified: Boolean(user?.emailVerified),
      created_date: iso(user?.createdAt),
      updated_date: iso(user?.updatedAt),
    };
  }

  return {
    id: row.id,
    user_id: row.userId,
    first_name: row.firstName || fallbackName.firstName,
    last_name: row.lastName || fallbackName.lastName,
    display_name: row.displayName || user?.name || "",
    email: row.email || user?.email || "",
    email_verified: row.emailVerified ?? Boolean(user?.emailVerified),
    phone: row.phone || "",
    phone_verified: row.phoneVerified ?? false,
    address_line_1: row.addressLine1 || "",
    address_line_2: row.addressLine2 || "",
    postal_code: row.postalCode || "",
    city: row.city || "",
    country: row.country || "Norge",
    preferred_language: row.preferredLanguage || "no",
    avatar_url: row.avatarUrl || "",
    marketing_consent: row.marketingConsent ?? false,
    newsletter_consent: row.newsletterConsent ?? false,
    terms_accepted_at: iso(row.termsAcceptedAt),
    privacy_accepted_at: iso(row.privacyAcceptedAt),
    auth_provider: row.authProvider || "email",
    created_date: iso(row.createdAt),
    updated_date: iso(row.updatedAt),
  };
}

export function serializeSubscription(row) {
  if (!row) {
    return {
      id: null,
      plan_type: "free",
      plan_key: "free",
      entitlement_key: "",
      provider: "",
      status: "free",
      current_period_start: "",
      current_period_end: "",
      canceled_at: "",
      price: 0,
      billing_period: "monthly",
      payment_method: "",
      cancel_at_period_end: false,
      external_customer_id: "",
      external_subscription_id: "",
    };
  }

  return {
    id: row.id,
    user_id: row.userId,
    plan_type: row.planType || "free",
    plan_key: row.planKey || row.planType || "free",
    plan_name: row.metadata?.planSnapshot?.displayName || row.planType || "",
    entitlement_key: row.entitlementKey || "",
    provider: row.provider,
    status: row.status,
    current_period_start: iso(row.currentPeriodStart),
    current_period_end: iso(row.currentPeriodEnd),
    canceled_at: iso(row.canceledAt),
    price: row.price || 0,
    billing_period: row.billingPeriod || "monthly",
    payment_method: row.paymentMethod || "",
    cancel_at_period_end: row.cancelAtPeriodEnd ?? false,
    external_customer_id: row.providerCustomerId || "",
    external_subscription_id: row.providerSubscriptionId || "",
    provider_charge_id: row.providerChargeId || "",
    stripe_price_id: row.stripePriceId || "",
    created_date: iso(row.createdAt),
    updated_date: iso(row.updatedAt),
  };
}

export function serializeEntitlement(row) {
  return {
    id: row.id,
    user_id: row.userId,
    type: row.type,
    active: row.active,
    source: row.source,
    starts_at: iso(row.startsAt),
    ends_at: iso(row.endsAt),
    created_date: iso(row.createdAt),
    updated_date: iso(row.updatedAt),
  };
}

export async function getProfileByUser(user) {
  const rows = await db.select().from(userProfile).where(eq(userProfile.userId, user.id)).limit(1);
  return serializeProfile(rows[0], user);
}

export async function getLatestSubscription(userId) {
  const rows = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  return serializeSubscription(rows[0]);
}

export async function getOverviewForUser(user) {
  const [profile, latestSubscription, activeEntitlements, hasPremiumAccess, savedArticleRows, newsletterPreferences] = await Promise.all([
    getProfileByUser(user),
    getLatestSubscription(user.id),
    getUserEntitlements(user.id),
    userHasActiveSubscription(user.id),
    db.select({ value: count() }).from(savedArticle).where(eq(savedArticle.userId, user.id)),
    getNewsletterPreferencesForUser(user),
  ]);

  return {
    profile,
    subscription: latestSubscription,
    entitlements: activeEntitlements.map(serializeEntitlement),
    newsletterPreferences,
    savedArticlesCount: Number(savedArticleRows[0]?.value || 0),
    premiumAccess: hasPremiumAccountAccess({
      hasActiveSubscription: hasPremiumAccess,
      entitlements: activeEntitlements,
    }),
  };
}

export function serializeNewsletterPreferences(row = null) {
  return {
    ...NEWSLETTER_DEFAULTS,
    id: row?.id || null,
    daily_newsletter: row?.dailyDigest ?? NEWSLETTER_DEFAULTS.daily_newsletter,
    weekly_summary: row?.weeklySummary ?? NEWSLETTER_DEFAULTS.weekly_summary,
    breaking_news: row?.breakingNews ?? NEWSLETTER_DEFAULTS.breaking_news,
    ai_tech_news: row?.aiTechNews ?? NEWSLETTER_DEFAULTS.ai_tech_news,
    gaming_news: row?.gamingNews ?? NEWSLETTER_DEFAULTS.gaming_news,
    offers_subscription_info: row?.marketing ?? NEWSLETTER_DEFAULTS.offers_subscription_info,
    newsletter_consent: Boolean(row?.dailyDigest || row?.weeklySummary || row?.breakingNews || row?.aiTechNews || row?.gamingNews),
    marketing_consent: row?.marketing ?? NEWSLETTER_DEFAULTS.offers_subscription_info,
    updated_date: iso(row?.updatedAt),
  };
}

export async function getNewsletterPreferencesForUser(user) {
  const rows = await db
    .select()
    .from(newsletterPreference)
    .where(eq(newsletterPreference.userId, user.id))
    .limit(1);

  return serializeNewsletterPreferences(rows[0]);
}

export async function updateNewsletterPreferencesForUser(user, input = {}) {
  const clean = validateNewsletterPreferencesInput(input);
  const now = new Date();
  const existing = await db
    .select()
    .from(newsletterPreference)
    .where(eq(newsletterPreference.userId, user.id))
    .limit(1);

  const next = {
    ...serializeNewsletterPreferences(existing[0]),
    ...clean,
  };

  const data = {
    dailyDigest: next.daily_newsletter,
    weeklySummary: next.weekly_summary,
    breakingNews: next.breaking_news,
    aiTechNews: next.ai_tech_news,
    gamingNews: next.gaming_news,
    marketing: next.offers_subscription_info,
    updatedAt: now,
  };

  if (existing.length > 0) {
    const rows = await db
      .update(newsletterPreference)
      .set(data)
      .where(eq(newsletterPreference.userId, user.id))
      .returning();

    return serializeNewsletterPreferences(rows[0]);
  }

  const rows = await db
    .insert(newsletterPreference)
    .values({
      userId: user.id,
      ...data,
      createdAt: now,
    })
    .returning();

  return serializeNewsletterPreferences(rows[0]);
}

export function validateProfileInput(input = {}) {
  const errors = {};
  const clean = {};
  const safeInput = stripForbiddenProfileFields(input);

  const textFields = [
    "first_name",
    "last_name",
    "display_name",
    "phone",
    "address_line_1",
    "address_line_2",
    "postal_code",
    "city",
    "country",
    "preferred_language",
    "avatar_url",
  ];

  for (const field of textFields) {
    if (safeInput[field] !== undefined && safeInput[field] !== null) {
      clean[field] = String(safeInput[field]).trim();
    }
  }

  if (!clean.first_name) errors.first_name = "Fornavn kan ikke være tomt";
  if (!clean.last_name) errors.last_name = "Etternavn kan ikke være tomt";
  if (clean.phone && !/^\+?[\d\s]{8,15}$/.test(clean.phone)) errors.phone = "Ugyldig telefonnummer";
  if ((clean.country || "Norge") === "Norge" && clean.postal_code && !/^\d{4}$/.test(clean.postal_code)) {
    errors.postal_code = "Postnummer må være 4 siffer";
  }
  if (clean.preferred_language && !["no", "en"].includes(clean.preferred_language)) {
    errors.preferred_language = "Ugyldig språk";
  }
  if (clean.avatar_url && !isTrustedAvatarUrl(clean.avatar_url)) {
    errors.avatar_url = "Profilbildet må komme fra den godkjente bildeopplastingen";
  }

  clean.country = clean.country || "Norge";
  clean.preferred_language = clean.preferred_language || "no";
  clean.marketing_consent = Boolean(safeInput.marketing_consent);
  clean.newsletter_consent = Boolean(safeInput.newsletter_consent);
  clean.terms_accepted_at = safeDate(safeInput.terms_accepted_at);
  clean.privacy_accepted_at = safeDate(safeInput.privacy_accepted_at);

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    clean,
  };
}

export async function upsertProfileForUser(user, input) {
  const validation = validateProfileInput(input);
  if (!validation.ok) {
    const error = new Error("Invalid profile input");
    error.status = 400;
    error.errors = validation.errors;
    throw error;
  }

  const now = new Date();
  const data = {
    userId: user.id,
    firstName: validation.clean.first_name,
    lastName: validation.clean.last_name,
    displayName: validation.clean.display_name || `${validation.clean.first_name} ${validation.clean.last_name}`.trim(),
    email: user.email || "",
    emailVerified: Boolean(user.emailVerified),
    phone: validation.clean.phone || null,
    addressLine1: validation.clean.address_line_1 || null,
    addressLine2: validation.clean.address_line_2 || null,
    postalCode: validation.clean.postal_code || null,
    city: validation.clean.city || null,
    country: validation.clean.country,
    preferredLanguage: validation.clean.preferred_language,
    avatarUrl: validation.clean.avatar_url || null,
    marketingConsent: validation.clean.marketing_consent,
    newsletterConsent: validation.clean.newsletter_consent,
    termsAcceptedAt: validation.clean.terms_accepted_at || now,
    privacyAcceptedAt: validation.clean.privacy_accepted_at || now,
    authProvider: "email",
    updatedAt: now,
  };

  const existing = await db.select({ id: userProfile.id }).from(userProfile).where(eq(userProfile.userId, user.id)).limit(1);

  if (existing.length > 0) {
    const rows = await db.update(userProfile).set(data).where(eq(userProfile.userId, user.id)).returning();
    return serializeProfile(rows[0], user);
  }

  const rows = await db.insert(userProfile).values({ ...data, createdAt: now }).returning();
  return serializeProfile(rows[0], user);
}

export async function getSubscriptionAndEntitlements(userId) {
  const [latestSubscription, activeEntitlements, hasPremiumAccess] = await Promise.all([
    getLatestSubscription(userId),
    getUserEntitlements(userId),
    userHasActiveSubscription(userId),
  ]);

  return {
    subscription: latestSubscription,
    entitlements: activeEntitlements.map(serializeEntitlement),
    premiumAccess: hasPremiumAccountAccess({
      hasActiveSubscription: hasPremiumAccess,
      entitlements: activeEntitlements,
    }),
  };
}
