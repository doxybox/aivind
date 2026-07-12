ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "plan_key" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "entitlement_key" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "provider_charge_id" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "metadata" jsonb;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_provider_charge_id_idx" ON "subscription" USING btree ("provider_charge_id");--> statement-breakpoint
UPDATE "subscription"
SET
  "plan_key" = COALESCE("plan_key", "plan_type"),
  "entitlement_key" = COALESCE("entitlement_key", CASE WHEN "plan_type" = 'free' THEN NULL ELSE 'premium' END)
WHERE "plan_key" IS NULL OR "entitlement_key" IS NULL;
