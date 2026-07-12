ALTER TABLE "subscription" ADD COLUMN "plan_type" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "billing_period" text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "phone_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "address_line_1" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "address_line_2" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "country" text DEFAULT 'Norge' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "preferred_language" text DEFAULT 'no' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "marketing_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "newsletter_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "privacy_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "auth_provider" text DEFAULT 'email' NOT NULL;