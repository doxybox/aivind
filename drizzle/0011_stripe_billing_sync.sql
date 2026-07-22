ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "stripe_price_id" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "canceled_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_provider_customer_id_idx" ON "subscription" USING btree ("provider_customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_stripe_price_id_idx" ON "subscription" USING btree ("stripe_price_id");--> statement-breakpoint
ALTER TABLE "billing_event" ADD COLUMN IF NOT EXISTS "event_created_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "billing_event" ADD COLUMN IF NOT EXISTS "failure_code" text;
