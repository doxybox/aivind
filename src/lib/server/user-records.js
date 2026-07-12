import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userProfile, userRole } from "@/db/schema";

export async function ensureReaderRoleAndProfile(user) {
  if (!user?.id) return;

  const existingProfile = await db
    .select({ id: userProfile.id })
    .from(userProfile)
    .where(eq(userProfile.userId, user.id))
    .limit(1);

  if (existingProfile.length === 0) {
    await db.insert(userProfile).values({
      userId: user.id,
      displayName: user.name || user.email || null,
    });
  }

  const existingReaderRole = await db
    .select({ id: userRole.id })
    .from(userRole)
    .where(and(eq(userRole.userId, user.id), eq(userRole.role, "reader")))
    .limit(1);

  if (existingReaderRole.length === 0) {
    await db.insert(userRole).values({
      userId: user.id,
      role: "reader",
    });
  }
}
