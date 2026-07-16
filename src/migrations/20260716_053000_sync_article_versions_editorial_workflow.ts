import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * The initial CMS migration created article versions before the article model
 * gained multi-category relations, access control, and editorial metadata.
 * Keep historical version rows intact while bringing that table up to date.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_articles_v"
      ADD COLUMN IF NOT EXISTS "version_content" varchar,
      ADD COLUMN IF NOT EXISTS "version_scheduled_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "version_canonical_url" varchar,
      ADD COLUMN IF NOT EXISTS "version_is_breaking" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "version_is_featured" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "version_access_level" "public"."enum__articles_v_version_access_level" DEFAULT 'public',
      ADD COLUMN IF NOT EXISTS "version_comments_enabled" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "version_newsletter_eligible" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "version_paywall_enabled" boolean DEFAULT false;

    UPDATE "_articles_v"
    SET
      "version_content" = COALESCE("version_content", "version_body"),
      "version_is_featured" = COALESCE("version_is_featured", "version_featured", false),
      "version_paywall_enabled" = COALESCE("version_paywall_enabled", "version_is_premium", false),
      "version_access_level" = CASE
        WHEN COALESCE("version_is_premium", false) THEN 'paid'::"public"."enum__articles_v_version_access_level"
        ELSE COALESCE("version_access_level", 'public'::"public"."enum__articles_v_version_access_level")
      END;

    ALTER TABLE "_articles_v_rels"
      ADD COLUMN IF NOT EXISTS "categories_id" integer;

    INSERT INTO "_articles_v_rels" ("order", "parent_id", "path", "categories_id")
    SELECT 0, versions."id", 'categories', versions."version_category_id"
    FROM "_articles_v" AS versions
    WHERE versions."version_category_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "_articles_v_rels" AS rels
        WHERE rels."parent_id" = versions."id"
          AND rels."path" = 'categories'
          AND rels."categories_id" = versions."version_category_id"
      );

    CREATE INDEX IF NOT EXISTS "_articles_v_rels_categories_id_idx"
      ON "_articles_v_rels" USING btree ("categories_id");

    DO $$ BEGIN
      ALTER TABLE "_articles_v_rels"
        ADD CONSTRAINT "_articles_v_rels_categories_fk"
        FOREIGN KEY ("categories_id") REFERENCES "categories"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // This migration preserves historical editorial versions. Reversing it is intentionally non-destructive.
}
