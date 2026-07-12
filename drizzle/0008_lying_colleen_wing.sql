CREATE TABLE "reel_view" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reel_slug" text NOT NULL,
	"actor_key" text NOT NULL,
	"first_viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "reel_view_reel_slug_idx" ON "reel_view" USING btree ("reel_slug");--> statement-breakpoint
CREATE INDEX "reel_view_reel_actor_idx" ON "reel_view" USING btree ("reel_slug","actor_key");