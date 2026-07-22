import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/** Adds an editor-managed Stripe Price ID to the existing subscription catalog. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscription_plans"
      ADD COLUMN IF NOT EXISTS "provider_stripe_price_id" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscription_plans"
      DROP COLUMN IF EXISTS "provider_stripe_price_id";
  `);
}
