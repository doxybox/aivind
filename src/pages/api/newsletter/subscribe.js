import { db } from "@/db/client";
import { newsletterSubscriber } from "@/db/schema";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";
import {
  NewsletterSignupValidationError,
  validateNewsletterSignupInput,
} from "@/lib/server/newsletter-signup-policy";

function sendError(res, error) {
  const isKnownError = error instanceof NewsletterSignupValidationError || error instanceof RateLimitError;
  const status = isKnownError ? error.status : 500;

  if (error instanceof RateLimitError) {
    res.setHeader("Retry-After", String(error.retryAfterSeconds));
  }

  return res.status(status).json({
    error: isKnownError ? error.message : "Kunne ikke lagre pameldingen akkurat na",
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    enforceRateLimit(req, res, {
      scope: "newsletter:subscribe",
      ipLimit: 8,
      windowMs: 15 * 60 * 1000,
    });

    const input = validateNewsletterSignupInput(req.body);
    const now = new Date();

    await db
      .insert(newsletterSubscriber)
      .values({
        email: input.email,
        active: true,
        source: "footer",
        consentAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: newsletterSubscriber.email,
        set: {
          active: true,
          source: "footer",
          consentAt: now,
          updatedAt: now,
        },
      });

    return res.status(201).json({ ok: true });
  } catch (error) {
    return sendError(res, error);
  }
}
