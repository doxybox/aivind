import { sql } from "drizzle-orm";
import { user as authUser } from "@/db/auth-schema";
import { db } from "@/db/client";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeLoginIdentifier(identifier) {
  return String(identifier || "").trim();
}

export function isEmailIdentifier(identifier) {
  return emailPattern.test(normalizeLoginIdentifier(identifier));
}

export async function resolveLoginEmail(identifier) {
  const normalized = normalizeLoginIdentifier(identifier);

  if (!normalized) return "";

  if (isEmailIdentifier(normalized)) {
    return normalized.toLowerCase();
  }

  const rows = await db
    .select({ email: authUser.email })
    .from(authUser)
    .where(sql`lower(${authUser.name}) = lower(${normalized})`)
    .limit(2);

  if (rows.length === 1) {
    return rows[0].email;
  }

  return "unknown-user@example.invalid";
}
