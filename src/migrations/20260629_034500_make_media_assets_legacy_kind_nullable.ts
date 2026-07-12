import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'media_assets'
          AND column_name = 'kind'
      ) THEN
        ALTER TABLE "media_assets" ALTER COLUMN "kind" DROP NOT NULL;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Non-destructive compatibility migration. Re-applying NOT NULL could break
  // rows created by the current Payload media-assets schema.
}
