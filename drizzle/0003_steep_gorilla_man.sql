CREATE TABLE "newsletter_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"daily_digest" boolean DEFAULT false NOT NULL,
	"breaking_news" boolean DEFAULT false NOT NULL,
	"weekly_summary" boolean DEFAULT false NOT NULL,
	"ai_tech_news" boolean DEFAULT false NOT NULL,
	"gaming_news" boolean DEFAULT false NOT NULL,
	"marketing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_preference_user_id_idx" ON "newsletter_preference" USING btree ("user_id");