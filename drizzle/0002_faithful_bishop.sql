CREATE TABLE "saved_article" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"article_id" text,
	"article_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "saved_article_user_id_idx" ON "saved_article" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_article_article_slug_idx" ON "saved_article" USING btree ("article_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_article_user_id_article_slug_idx" ON "saved_article" USING btree ("user_id","article_slug");