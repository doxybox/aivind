import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import * as authSchema from "@/db/auth-schema";
import { db } from "@/db/client";
import { ensureReaderRoleAndProfile } from "@/lib/server/user-records";
import { sendAuthEmail } from "@/lib/email";
import { isEmailDeliveryConfigured } from "@/lib/auth-launch-mode";

const appUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const localTrustedOrigins =
  process.env.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
      ];

const configuredTrustedOrigins = [
  appUrl,
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const trustedOrigins = Array.from(
  new Set([...configuredTrustedOrigins, ...localTrustedOrigins].filter(Boolean)),
);

const socialProviders = {};
const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
const emailDeliveryEnabled = isEmailDeliveryConfigured();

if (process.env.NODE_ENV === "production" && !betterAuthSecret) {
  throw new Error("BETTER_AUTH_SECRET must be set in production.");
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  secret: betterAuthSecret || "development-only-change-me-development-only",
  baseURL: appUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Tilbakestill passordet ditt hos TEKKNO",
        text: `Trykk på lenken for å sette nytt passord: ${url}`,
        html: `<p>Trykk på lenken for å sette nytt passord:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: emailDeliveryEnabled,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Bekreft e-posten din hos TEKKNO",
        text: `Trykk på lenken for å bekrefte e-posten din: ${url}`,
        html: `<p>Trykk på lenken for å bekrefte e-posten din:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  socialProviders,
  rateLimit: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await ensureReaderRoleAndProfile(user);
        },
      },
    },
  },
});
