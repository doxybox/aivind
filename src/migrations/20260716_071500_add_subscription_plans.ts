import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/** Adds the Payload-managed catalog used for prices and benefits of new subscriptions. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_subscription_plans_display_group" AS ENUM('free', 'pluss', 'premium', 'familie', 'bedrift');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_subscription_plans_currency" AS ENUM('NOK');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_subscription_plans_interval" AS ENUM('free', 'monthly', 'yearly');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_subscription_plans_checkout_mode" AS ENUM('checkout', 'contact', 'unavailable');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "subscription_plans" (
      "id" serial PRIMARY KEY NOT NULL,
      "plan_key" varchar NOT NULL,
      "display_group" "public"."enum_subscription_plans_display_group" NOT NULL,
      "display_name" varchar NOT NULL,
      "description" varchar,
      "price" numeric NOT NULL,
      "currency" "public"."enum_subscription_plans_currency" DEFAULT 'NOK' NOT NULL,
      "interval" "public"."enum_subscription_plans_interval" NOT NULL,
      "entitlement_key" varchar,
      "checkout_mode" "public"."enum_subscription_plans_checkout_mode" DEFAULT 'unavailable' NOT NULL,
      "cta_text" varchar,
      "is_popular" boolean DEFAULT false,
      "is_active" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "provider_vipps_product_id" varchar,
      "provider_vipps_agreement_product_name" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "subscription_plans_features" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "feature" varchar NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_plan_key_idx" ON "subscription_plans" USING btree ("plan_key");
    CREATE INDEX IF NOT EXISTS "subscription_plans_is_active_sort_order_idx" ON "subscription_plans" USING btree ("is_active", "sort_order");
    CREATE INDEX IF NOT EXISTS "subscription_plans_features_parent_id_idx" ON "subscription_plans_features" USING btree ("_parent_id");

    ALTER TABLE "subscription_plans_features"
      DROP CONSTRAINT IF EXISTS "subscription_plans_features_parent_id_subscription_plans_id_fk";
    ALTER TABLE "subscription_plans_features"
      ADD CONSTRAINT "subscription_plans_features_parent_id_subscription_plans_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "subscription_plans_id" integer;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subscription_plans_id_idx"
      ON "payload_locked_documents_rels" USING btree ("subscription_plans_id");
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_subscription_plans_fk";
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_subscription_plans_fk"
      FOREIGN KEY ("subscription_plans_id") REFERENCES "public"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_subscription_plans_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_subscription_plans_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "subscription_plans_id";

    DROP TABLE IF EXISTS "subscription_plans_features";
    DROP TABLE IF EXISTS "subscription_plans";
    DROP TYPE IF EXISTS "public"."enum_subscription_plans_checkout_mode";
    DROP TYPE IF EXISTS "public"."enum_subscription_plans_interval";
    DROP TYPE IF EXISTS "public"."enum_subscription_plans_currency";
    DROP TYPE IF EXISTS "public"."enum_subscription_plans_display_group";
  `);
}
