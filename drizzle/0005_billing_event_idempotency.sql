CREATE TABLE IF NOT EXISTS "billing_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"provider_subscription_id" text,
	"event_type" text,
	"status" text,
	"payload_hash" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "billing_event_provider_event_id_idx" ON "billing_event" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "billing_event_provider_subscription_id_idx" ON "billing_event" USING btree ("provider_subscription_id");
