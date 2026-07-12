import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const appRole = pgEnum("app_role", ["reader", "subscriber", "journalist", "editor", "admin"]);

export const userProfile = pgTable(
  "user_profile",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    displayName: text("display_name"),
    email: text("email"),
    emailVerified: boolean("email_verified").notNull().default(false),
    phone: text("phone"),
    phoneVerified: boolean("phone_verified").notNull().default(false),
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    postalCode: text("postal_code"),
    city: text("city"),
    country: text("country").notNull().default("Norge"),
    preferredLanguage: text("preferred_language").notNull().default("no"),
    avatarUrl: text("avatar_url"),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    newsletterConsent: boolean("newsletter_consent").notNull().default(false),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }),
    authProvider: text("auth_provider").notNull().default("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("user_profile_user_id_idx").on(table.userId),
  }),
);

export const userRole = pgTable(
  "user_role",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    role: appRole("role").notNull().default("reader"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdRoleIdx: uniqueIndex("user_role_user_id_role_idx").on(table.userId, table.role),
    userIdIdx: index("user_role_user_id_idx").on(table.userId),
  }),
);

export const subscription = pgTable(
  "subscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    planType: text("plan_type").notNull().default("free"),
    planKey: text("plan_key"),
    entitlementKey: text("entitlement_key"),
    provider: text("provider").notNull(),
    providerCustomerId: text("provider_customer_id"),
    providerSubscriptionId: text("provider_subscription_id"),
    providerChargeId: text("provider_charge_id"),
    status: text("status").notNull(),
    price: integer("price").notNull().default(0),
    billingPeriod: text("billing_period").notNull().default("monthly"),
    paymentMethod: text("payment_method"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("subscription_user_id_idx").on(table.userId),
    providerSubIdx: index("subscription_provider_subscription_id_idx").on(table.providerSubscriptionId),
  }),
);

export const entitlement = pgTable(
  "entitlement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    type: text("type").notNull(),
    active: boolean("active").notNull().default(true),
    source: text("source").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("entitlement_user_id_idx").on(table.userId),
    userIdTypeIdx: index("entitlement_user_id_type_idx").on(table.userId, table.type),
  }),
);

export const billingEvent = pgTable(
  "billing_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    providerSubscriptionId: text("provider_subscription_id"),
    eventType: text("event_type"),
    status: text("status"),
    payloadHash: text("payload_hash"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerEventIdx: uniqueIndex("billing_event_provider_event_id_idx").on(table.provider, table.eventId),
    providerSubIdx: index("billing_event_provider_subscription_id_idx").on(table.providerSubscriptionId),
  }),
);

export const savedArticle = pgTable(
  "saved_article",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    articleId: text("article_id"),
    articleSlug: text("article_slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("saved_article_user_id_idx").on(table.userId),
    articleSlugIdx: index("saved_article_article_slug_idx").on(table.articleSlug),
    userIdArticleSlugIdx: uniqueIndex("saved_article_user_id_article_slug_idx").on(table.userId, table.articleSlug),
  }),
);

export const articleReaction = pgTable(
  "article_reaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    articleSlug: text("article_slug").notNull(),
    actorKey: text("actor_key").notNull(),
    reaction: text("reaction").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    articleSlugIdx: index("article_reaction_article_slug_idx").on(table.articleSlug),
    articleActorIdx: uniqueIndex("article_reaction_article_actor_idx").on(table.articleSlug, table.actorKey),
  }),
);

export const reelView = pgTable(
  "reel_view",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reelSlug: text("reel_slug").notNull(),
    actorKey: text("actor_key").notNull(),
    firstViewedAt: timestamp("first_viewed_at", { withTimezone: true }).notNull().defaultNow(),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    reelSlugIdx: index("reel_view_reel_slug_idx").on(table.reelSlug),
    reelActorIdx: index("reel_view_reel_actor_idx").on(table.reelSlug, table.actorKey),
  }),
);

export const newsletterPreference = pgTable(
  "newsletter_preference",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    dailyDigest: boolean("daily_digest").notNull().default(false),
    breakingNews: boolean("breaking_news").notNull().default(false),
    weeklySummary: boolean("weekly_summary").notNull().default(false),
    aiTechNews: boolean("ai_tech_news").notNull().default(false),
    gamingNews: boolean("gaming_news").notNull().default(false),
    marketing: boolean("marketing").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("newsletter_preference_user_id_idx").on(table.userId),
  }),
);

export const newsletterSubscriber = pgTable(
  "newsletter_subscriber",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    active: boolean("active").notNull().default(true),
    source: text("source").notNull().default("footer"),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("newsletter_subscriber_email_idx").on(table.email),
  }),
);
