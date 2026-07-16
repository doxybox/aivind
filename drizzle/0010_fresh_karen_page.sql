CREATE TABLE "article_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_slug" text NOT NULL,
	"user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "article_comment_article_slug_created_at_idx" ON "article_comment" USING btree ("article_slug","created_at");--> statement-breakpoint
CREATE INDEX "article_comment_user_id_idx" ON "article_comment" USING btree ("user_id");