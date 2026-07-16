import * as migration_20260627_223455 from './20260627_223455';
import * as migration_20260628_184500_add_payload_user_roles from './20260628_184500_add_payload_user_roles';
import * as migration_20260628_190700_sync_payload_current_schema from './20260628_190700_sync_payload_current_schema';
import * as migration_20260628_193000_payload_only_cms from './20260628_193000_payload_only_cms';
import * as migration_20260629_034500_make_media_assets_legacy_kind_nullable from './20260629_034500_make_media_assets_legacy_kind_nullable';
import * as migration_20260716_040000_article_comments_moderation from './20260716_040000_article_comments_moderation';

export const migrations = [
  {
    up: migration_20260627_223455.up,
    down: migration_20260627_223455.down,
    name: '20260627_223455'
  },
  {
    up: migration_20260628_184500_add_payload_user_roles.up,
    down: migration_20260628_184500_add_payload_user_roles.down,
    name: '20260628_184500_add_payload_user_roles'
  },
  {
    up: migration_20260628_190700_sync_payload_current_schema.up,
    down: migration_20260628_190700_sync_payload_current_schema.down,
    name: '20260628_190700_sync_payload_current_schema'
  },
  {
    up: migration_20260628_193000_payload_only_cms.up,
    down: migration_20260628_193000_payload_only_cms.down,
    name: '20260628_193000_payload_only_cms'
  },
  {
    up: migration_20260629_034500_make_media_assets_legacy_kind_nullable.up,
    down: migration_20260629_034500_make_media_assets_legacy_kind_nullable.down,
    name: '20260629_034500_make_media_assets_legacy_kind_nullable'
  },
  {
    up: migration_20260716_040000_article_comments_moderation.up,
    down: migration_20260716_040000_article_comments_moderation.down,
    name: '20260716_040000_article_comments_moderation'
  },
];
