import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_payload_users_roles" ADD VALUE IF NOT EXISTS 'desk';
    ALTER TYPE "public"."enum_payload_users_roles" ADD VALUE IF NOT EXISTS 'moderator';
    ALTER TYPE "public"."enum_payload_users_roles" ADD VALUE IF NOT EXISTS 'ad_manager';

    ALTER TYPE "public"."enum_media_assets_provider" ADD VALUE IF NOT EXISTS 'cloudflare_images';
    ALTER TYPE "public"."enum_media_assets_provider" ADD VALUE IF NOT EXISTS 'cloudflare_stream';
    ALTER TYPE "public"."enum_media_assets_provider" ADD VALUE IF NOT EXISTS 'r2';

    ALTER TYPE "public"."enum_articles_status" ADD VALUE IF NOT EXISTS 'review';
    ALTER TYPE "public"."enum_articles_status" ADD VALUE IF NOT EXISTS 'scheduled';
    ALTER TYPE "public"."enum_articles_status" ADD VALUE IF NOT EXISTS 'archived';
    ALTER TYPE "public"."enum__articles_v_version_status" ADD VALUE IF NOT EXISTS 'review';
    ALTER TYPE "public"."enum__articles_v_version_status" ADD VALUE IF NOT EXISTS 'scheduled';
    ALTER TYPE "public"."enum__articles_v_version_status" ADD VALUE IF NOT EXISTS 'archived';

    DO $$ BEGIN
      CREATE TYPE "public"."enum_articles_access_level" AS ENUM('public', 'members', 'paid');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__articles_v_version_access_level" AS ENUM('public', 'members', 'paid');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_media_assets_type" AS ENUM('image', 'video', 'file');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_media_assets_status" AS ENUM('draft', 'uploading', 'processing', 'ready', 'failed');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_frontpage_slots_placement" AS ENUM('hero', 'top_story', 'section_feature', 'opinion', 'video', 'ad');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_tip_submissions_status" AS ENUM('new', 'reviewing', 'contacted', 'rejected', 'converted_to_story');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_tip_submissions_risk_level" AS ENUM('low', 'medium', 'high');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      IF to_regclass('public.articles') IS NULL AND to_regclass('public.ghost_post_references') IS NOT NULL THEN
        ALTER TABLE "ghost_post_references" RENAME TO "articles";
      END IF;
      IF to_regclass('public.categories') IS NULL AND to_regclass('public.ghost_tag_references') IS NOT NULL THEN
        ALTER TABLE "ghost_tag_references" RENAME TO "categories";
      END IF;
      IF to_regclass('public.authors') IS NULL AND to_regclass('public.ghost_author_references') IS NOT NULL THEN
        ALTER TABLE "ghost_author_references" RENAME TO "authors";
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "categories" (
      "id" serial PRIMARY KEY,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "description" varchar,
      "parent_id" integer,
      "existing_route" "public"."enum_categories_existing_route",
      "seo_title" varchar,
      "seo_description" varchar,
      "sort_order" numeric DEFAULT 0,
      "is_active" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "authors" (
      "id" serial PRIMARY KEY,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "bio" varchar,
      "profile_image_id" integer,
      "email" varchar,
      "title" varchar,
      "is_active" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "articles" (
      "id" serial PRIMARY KEY,
      "title" varchar,
      "slug" varchar,
      "excerpt" varchar,
      "content" varchar,
      "status" "public"."enum_articles_status" DEFAULT 'draft',
      "published_at" timestamp(3) with time zone,
      "scheduled_at" timestamp(3) with time zone,
      "hero_media_id" integer,
      "seo_title" varchar,
      "seo_description" varchar,
      "seo_image_id" integer,
      "canonical_url" varchar,
      "is_breaking" boolean DEFAULT false,
      "is_featured" boolean DEFAULT false,
      "access_level" "public"."enum_articles_access_level" DEFAULT 'public' NOT NULL,
      "newsletter_eligible" boolean DEFAULT false,
      "paywall_enabled" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "articles_rels" (
      "id" serial PRIMARY KEY,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "authors_id" integer,
      "categories_id" integer
    );

    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parent_id" integer;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "sort_order" numeric DEFAULT 0;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

    ALTER TABLE "authors" ADD COLUMN IF NOT EXISTS "profile_image_id" integer;
    ALTER TABLE "authors" ADD COLUMN IF NOT EXISTS "title" varchar;
    ALTER TABLE "authors" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'authors' AND column_name = 'avatar_id'
      ) THEN
        EXECUTE 'UPDATE "authors" SET "profile_image_id" = COALESCE("profile_image_id", "avatar_id")';
      END IF;
    END $$;

    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "content" varchar;
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp(3) with time zone;
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "canonical_url" varchar;
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "is_breaking" boolean DEFAULT false;
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false;
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "access_level" "public"."enum_articles_access_level" DEFAULT 'public' NOT NULL;
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "newsletter_eligible" boolean DEFAULT false;
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "paywall_enabled" boolean DEFAULT false;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'body'
      ) THEN
        EXECUTE 'UPDATE "articles" SET "content" = COALESCE("content", "body")';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'featured'
      ) THEN
        EXECUTE 'UPDATE "articles" SET "is_featured" = COALESCE("is_featured", "featured", false)';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'is_premium'
      ) THEN
        EXECUTE 'UPDATE "articles" SET "access_level" = CASE WHEN COALESCE("is_premium", false) THEN ''paid''::"public"."enum_articles_access_level" ELSE COALESCE("access_level", ''public''::"public"."enum_articles_access_level") END, "paywall_enabled" = COALESCE("paywall_enabled", "is_premium", false)';
      END IF;
    END $$;

    ALTER TABLE "articles_rels" ADD COLUMN IF NOT EXISTS "categories_id" integer;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'category_id'
      ) THEN
        EXECUTE 'INSERT INTO "articles_rels" ("order", "parent_id", "path", "categories_id")
          SELECT 0, "id", ''categories'', "category_id"
          FROM "articles"
          WHERE "category_id" IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM "articles_rels"
              WHERE "articles_rels"."parent_id" = "articles"."id"
                AND "articles_rels"."path" = ''categories''
                AND "articles_rels"."categories_id" = "articles"."category_id"
            )';
      END IF;
    END $$;

    DO $$ BEGIN
      IF to_regclass('public.ghost_tag_references') IS NOT NULL THEN
        EXECUTE 'INSERT INTO "categories" ("name", "slug", "description", "existing_route", "created_at", "updated_at")
          SELECT
            COALESCE("ghost_name_snapshot", "ghost_slug"),
            "ghost_slug",
            "ghost_description_snapshot",
            "existing_route"::text::"public"."enum_categories_existing_route",
            COALESCE("created_at", now()),
            COALESCE("updated_at", now())
          FROM "ghost_tag_references"
          WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "categories"."slug" = "ghost_tag_references"."ghost_slug")';
      END IF;

      IF to_regclass('public.ghost_author_references') IS NOT NULL THEN
        EXECUTE 'INSERT INTO "authors" ("name", "slug", "bio", "created_at", "updated_at")
          SELECT
            COALESCE("ghost_name_snapshot", "ghost_slug"),
            "ghost_slug",
            "ghost_bio_snapshot",
            COALESCE("created_at", now()),
            COALESCE("updated_at", now())
          FROM "ghost_author_references"
          WHERE NOT EXISTS (SELECT 1 FROM "authors" WHERE "authors"."slug" = "ghost_author_references"."ghost_slug")';
      END IF;

      IF to_regclass('public.ghost_post_references') IS NOT NULL THEN
        EXECUTE 'INSERT INTO "articles" ("title", "slug", "excerpt", "status", "published_at", "created_at", "updated_at")
          SELECT
            COALESCE("ghost_title_snapshot", "ghost_slug"),
            "ghost_slug",
            "ghost_excerpt_snapshot",
            CASE WHEN "ghost_published_at_snapshot" IS NULL THEN ''draft''::"public"."enum_articles_status" ELSE ''published''::"public"."enum_articles_status" END,
            "ghost_published_at_snapshot",
            COALESCE("created_at", now()),
            COALESCE("updated_at", now())
          FROM "ghost_post_references"
          WHERE NOT EXISTS (SELECT 1 FROM "articles" WHERE "articles"."slug" = "ghost_post_references"."ghost_slug")';
      END IF;
    END $$;

    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "slot_name" varchar DEFAULT 'Frontpage slot' NOT NULL;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "placement" "public"."enum_frontpage_slots_placement" DEFAULT 'section_feature' NOT NULL;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "article_id" integer;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "media_asset_id" integer;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "manual_title_override" varchar;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "manual_excerpt_override" varchar;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "priority" numeric DEFAULT 1 NOT NULL;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "expires_at" timestamp(3) with time zone;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'frontpage_slots' AND column_name = 'label'
      ) THEN
        EXECUTE 'UPDATE "frontpage_slots" SET "slot_name" = COALESCE(NULLIF("slot_name", ''Frontpage slot''), "label", ''Frontpage slot'')';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'frontpage_slots' AND column_name = 'position'
      ) THEN
        EXECUTE 'UPDATE "frontpage_slots" SET "priority" = COALESCE("priority", "position", 1)';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'frontpage_slots' AND column_name = 'active'
      ) THEN
        EXECUTE 'UPDATE "frontpage_slots" SET "is_active" = COALESCE("is_active", "active", true)';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'frontpage_slots' AND column_name = 'ends_at'
      ) THEN
        EXECUTE 'UPDATE "frontpage_slots" SET "expires_at" = COALESCE("expires_at", "ends_at")';
      END IF;

      IF to_regclass('public.ghost_post_references') IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'frontpage_slots' AND column_name = 'ghost_post_id'
      ) THEN
        EXECUTE 'UPDATE "frontpage_slots"
          SET "article_id" = COALESCE("article_id", legacy_article."id")
          FROM (
            SELECT gps."id" AS ghost_ref_id, a."id"
            FROM "ghost_post_references" gps
            JOIN "articles" a ON a."slug" = gps."ghost_slug"
          ) legacy_article
          WHERE "frontpage_slots"."ghost_post_id" = legacy_article."ghost_ref_id"';
      END IF;
    END $$;

    ALTER TABLE "reels" ADD COLUMN IF NOT EXISTS "media_asset_id" integer;
    ALTER TABLE "reels" ADD COLUMN IF NOT EXISTS "article_id" integer;
    ALTER TABLE "reels" ADD COLUMN IF NOT EXISTS "cloudflare_stream_uid" varchar;
    ALTER TABLE "reels" ADD COLUMN IF NOT EXISTS "description" varchar;
    ALTER TABLE "reels" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT false;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'reels' AND column_name = 'video_id'
      ) THEN
        EXECUTE 'UPDATE "reels" SET "media_asset_id" = COALESCE("media_asset_id", "video_id")';
      END IF;

      EXECUTE 'UPDATE "reels" SET "is_active" = COALESCE("is_active", CASE WHEN "status" = ''published'' THEN true ELSE false END)';
    END $$;

    ALTER TABLE "tip_submissions" ALTER COLUMN "category" DROP NOT NULL;
    ALTER TABLE "tip_submissions" ADD COLUMN IF NOT EXISTS "related_article_id" integer;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "categories_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "authors_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "articles_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "tip_submissions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "ad_campaigns_id" integer;

    CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");
    CREATE INDEX IF NOT EXISTS "categories_parent_idx" ON "categories" ("parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "authors_slug_idx" ON "authors" ("slug");
    CREATE INDEX IF NOT EXISTS "authors_profile_image_idx" ON "authors" ("profile_image_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles" ("slug");
    CREATE INDEX IF NOT EXISTS "articles_status_idx" ON "articles" ("status");
    CREATE INDEX IF NOT EXISTS "articles_hero_media_idx" ON "articles" ("hero_media_id");
    CREATE INDEX IF NOT EXISTS "articles_seo_image_idx" ON "articles" ("seo_image_id");
    CREATE INDEX IF NOT EXISTS "articles_rels_categories_id_idx" ON "articles_rels" ("categories_id");
    CREATE INDEX IF NOT EXISTS "frontpage_slots_article_idx" ON "frontpage_slots" ("article_id");
    CREATE INDEX IF NOT EXISTS "frontpage_slots_media_asset_idx" ON "frontpage_slots" ("media_asset_id");
    CREATE INDEX IF NOT EXISTS "reels_article_idx" ON "reels" ("article_id");
    CREATE INDEX IF NOT EXISTS "reels_media_asset_idx" ON "reels" ("media_asset_id");
    CREATE INDEX IF NOT EXISTS "tip_submissions_related_article_idx" ON "tip_submissions" ("related_article_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Non-destructive Payload-only sync. Down migration intentionally left empty.
}
