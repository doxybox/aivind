import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_payload_users_roles" ADD VALUE IF NOT EXISTS 'desk';
    ALTER TYPE "public"."enum_payload_users_roles" ADD VALUE IF NOT EXISTS 'moderator';
    ALTER TYPE "public"."enum_payload_users_roles" ADD VALUE IF NOT EXISTS 'ad_manager';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // PostgreSQL does not support removing enum values safely without rebuilding the type.
}
