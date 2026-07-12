import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_media_assets_provider" ADD VALUE IF NOT EXISTS 'cloudflare_images';
    ALTER TYPE "public"."enum_media_assets_provider" ADD VALUE IF NOT EXISTS 'cloudflare_stream';
    ALTER TYPE "public"."enum_media_assets_provider" ADD VALUE IF NOT EXISTS 'r2';

    DO $$ BEGIN
      CREATE TYPE "public"."enum_media_assets_type" AS ENUM('image', 'video', 'file');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_media_assets_status" AS ENUM('draft', 'uploading', 'processing', 'ready', 'failed');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_ghost_tag_references_existing_route" AS ENUM('/ai', '/gaming', '/elbil', '/gadgets', '/tester', '/guider', '/video');
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

    CREATE TABLE IF NOT EXISTS "ghost_tag_references" (
      "id" serial PRIMARY KEY,
      "ghost_tag_id" varchar NOT NULL,
      "ghost_slug" varchar NOT NULL,
      "ghost_name_snapshot" varchar,
      "ghost_description_snapshot" varchar,
      "existing_route" "public"."enum_ghost_tag_references_existing_route",
      "last_synced_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "ghost_author_references" (
      "id" serial PRIMARY KEY,
      "ghost_author_id" varchar NOT NULL,
      "ghost_slug" varchar NOT NULL,
      "ghost_name_snapshot" varchar,
      "ghost_bio_snapshot" varchar,
      "ghost_profile_image_snapshot" varchar,
      "last_synced_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "ghost_post_references" (
      "id" serial PRIMARY KEY,
      "ghost_post_id" varchar NOT NULL,
      "ghost_slug" varchar NOT NULL,
      "ghost_title_snapshot" varchar,
      "ghost_excerpt_snapshot" varchar,
      "ghost_feature_image_snapshot" varchar,
      "ghost_published_at_snapshot" timestamp(3) with time zone,
      "last_synced_at" timestamp(3) with time zone,
      "curation_notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "tip_submissions" (
      "id" serial PRIMARY KEY,
      "title" varchar NOT NULL,
      "message" varchar NOT NULL,
      "category" varchar NOT NULL,
      "submitted_by_name" varchar,
      "submitted_by_email" varchar,
      "phone" varchar,
      "status" "public"."enum_tip_submissions_status" DEFAULT 'new' NOT NULL,
      "assigned_to_id" integer,
      "internal_notes" varchar,
      "risk_level" "public"."enum_tip_submissions_risk_level" DEFAULT 'low' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "ad_campaigns" (
      "id" serial PRIMARY KEY,
      "title" varchar NOT NULL,
      "placement" varchar NOT NULL,
      "media_asset_id" integer,
      "target_url" varchar NOT NULL,
      "starts_at" timestamp(3) with time zone,
      "ends_at" timestamp(3) with time zone,
      "is_active" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "type" "public"."enum_media_assets_type" DEFAULT 'image' NOT NULL;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "cloudflare_image_id" varchar;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "cloudflare_stream_uid" varchar;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "delivery_url" varchar;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "thumbnail_url" varchar;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "original_filename" varchar;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "width" numeric;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "height" numeric;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "duration" numeric;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "credit" varchar;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "status" "public"."enum_media_assets_status" DEFAULT 'draft' NOT NULL;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "usage_rights" varchar;
    ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "uploaded_by_id" integer;

    UPDATE "media_assets"
    SET
      "cloudflare_image_id" = COALESCE("cloudflare_image_id", "cloudflare_id"),
      "delivery_url" = COALESCE("delivery_url", "external_url")
    WHERE "cloudflare_id" IS NOT NULL OR "external_url" IS NOT NULL;

    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "slot_name" varchar DEFAULT 'Frontpage slot' NOT NULL;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "placement" "public"."enum_frontpage_slots_placement" DEFAULT 'section_feature' NOT NULL;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "ghost_post_id" integer;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "ghost_post_external_id" varchar;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "ghost_title_snapshot" varchar;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "ghost_excerpt_snapshot" varchar;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "ghost_published_at_snapshot" timestamp(3) with time zone;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "media_asset_id" integer;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "manual_title_override" varchar;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "manual_excerpt_override" varchar;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "priority" numeric DEFAULT 1 NOT NULL;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "expires_at" timestamp(3) with time zone;
    ALTER TABLE "frontpage_slots" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

    UPDATE "frontpage_slots"
    SET
      "slot_name" = COALESCE(NULLIF("slot_name", 'Frontpage slot'), "label", 'Frontpage slot'),
      "priority" = COALESCE("priority", "position", 1),
      "is_active" = COALESCE("is_active", "active", true),
      "expires_at" = COALESCE("expires_at", "ends_at"),
      "placement" = CASE "slot"::text
        WHEN 'hero-main' THEN 'hero'::"public"."enum_frontpage_slots_placement"
        WHEN 'hero-secondary' THEN 'top_story'::"public"."enum_frontpage_slots_placement"
        WHEN 'reels' THEN 'video'::"public"."enum_frontpage_slots_placement"
        ELSE COALESCE("placement", 'section_feature'::"public"."enum_frontpage_slots_placement")
      END;

    ALTER TABLE "reels" ADD COLUMN IF NOT EXISTS "media_asset_id" integer;
    ALTER TABLE "reels" ADD COLUMN IF NOT EXISTS "cloudflare_stream_uid" varchar;
    ALTER TABLE "reels" ADD COLUMN IF NOT EXISTS "description" varchar;
    ALTER TABLE "reels" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT false;

    UPDATE "reels"
    SET
      "media_asset_id" = COALESCE("media_asset_id", "video_id"),
      "is_active" = COALESCE("is_active", CASE WHEN "status" = 'published' THEN true ELSE false END);

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "ghost_tag_references_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "ghost_author_references_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "ghost_post_references_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "tip_submissions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "ad_campaigns_id" integer;

    CREATE UNIQUE INDEX IF NOT EXISTS "ghost_tag_references_ghost_tag_id_idx" ON "ghost_tag_references" ("ghost_tag_id");
    CREATE INDEX IF NOT EXISTS "ghost_tag_references_ghost_slug_idx" ON "ghost_tag_references" ("ghost_slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "ghost_author_references_ghost_author_id_idx" ON "ghost_author_references" ("ghost_author_id");
    CREATE INDEX IF NOT EXISTS "ghost_author_references_ghost_slug_idx" ON "ghost_author_references" ("ghost_slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "ghost_post_references_ghost_post_id_idx" ON "ghost_post_references" ("ghost_post_id");
    CREATE INDEX IF NOT EXISTS "ghost_post_references_ghost_slug_idx" ON "ghost_post_references" ("ghost_slug");
    CREATE INDEX IF NOT EXISTS "frontpage_slots_ghost_post_idx" ON "frontpage_slots" ("ghost_post_id");
    CREATE INDEX IF NOT EXISTS "frontpage_slots_media_asset_idx" ON "frontpage_slots" ("media_asset_id");
    CREATE INDEX IF NOT EXISTS "reels_media_asset_idx" ON "reels" ("media_asset_id");
    CREATE INDEX IF NOT EXISTS "reels_cloudflare_stream_uid_idx" ON "reels" ("cloudflare_stream_uid");
    CREATE INDEX IF NOT EXISTS "tip_submissions_assigned_to_idx" ON "tip_submissions" ("assigned_to_id");
    CREATE INDEX IF NOT EXISTS "ad_campaigns_media_asset_idx" ON "ad_campaigns" ("media_asset_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Non-destructive schema sync. Down migration intentionally left empty.
}
