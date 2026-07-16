import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_article_comments_status" AS ENUM('pending', 'published', 'hidden', 'rejected');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "articles"
      ADD COLUMN IF NOT EXISTS "comments_enabled" boolean DEFAULT true;

    CREATE TABLE IF NOT EXISTS "article_comments" (
      "id" serial PRIMARY KEY NOT NULL,
      "article_id" integer REFERENCES "articles"("id") ON DELETE SET NULL,
      "article_slug" varchar NOT NULL,
      "user_id" varchar,
      "author_name" varchar NOT NULL,
      "body" varchar NOT NULL,
      "status" "enum_article_comments_status" DEFAULT 'pending' NOT NULL,
      "parent_comment_id" integer REFERENCES "article_comments"("id") ON DELETE SET NULL,
      "is_editorial_reply" boolean DEFAULT false,
      "moderation_note" varchar,
      "moderated_by" varchar,
      "moderated_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "article_comments_article_idx" ON "article_comments" USING btree ("article_id");
    CREATE INDEX IF NOT EXISTS "article_comments_article_slug_idx" ON "article_comments" USING btree ("article_slug");
    CREATE INDEX IF NOT EXISTS "article_comments_user_id_idx" ON "article_comments" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "article_comments_parent_comment_idx" ON "article_comments" USING btree ("parent_comment_id");
    CREATE INDEX IF NOT EXISTS "article_comments_updated_at_idx" ON "article_comments" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "article_comments_created_at_idx" ON "article_comments" USING btree ("created_at");

    -- Preserve comments created before Payload moderation was introduced.
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'article_comment'
      ) THEN
        INSERT INTO "article_comments" (
          "article_id", "article_slug", "user_id", "author_name", "body", "status", "created_at", "updated_at"
        )
        SELECT
          (SELECT "id" FROM "articles" WHERE "slug" = legacy."article_slug" LIMIT 1),
          legacy."article_slug",
          legacy."user_id",
          legacy."author_name",
          legacy."body",
          CASE WHEN legacy."status" = 'published' THEN 'published'::"enum_article_comments_status" ELSE 'pending'::"enum_article_comments_status" END,
          legacy."created_at",
          legacy."updated_at"
        FROM "article_comment" AS legacy;
      END IF;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "article_comments_id" integer;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_article_comments_id_idx"
      ON "payload_locked_documents_rels" USING btree ("article_comments_id");
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_article_comments_fk"
        FOREIGN KEY ("article_comments_id") REFERENCES "article_comments"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_article_comments_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_article_comments_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "article_comments_id";
    DROP TABLE IF EXISTS "article_comments";
    ALTER TABLE "articles"
      DROP COLUMN IF EXISTS "comments_enabled";
    DROP TYPE IF EXISTS "enum_article_comments_status";
  `);
}
