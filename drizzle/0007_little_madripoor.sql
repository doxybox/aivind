CREATE TABLE "article_reaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_slug" text NOT NULL,
	"actor_key" text NOT NULL,
	"reaction" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "article_reaction_article_slug_idx" ON "article_reaction" USING btree ("article_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "article_reaction_article_actor_idx" ON "article_reaction" USING btree ("article_slug","actor_key");