# Supabase Integration

Supabase is installed for infrastructure/database helpers. Better Auth remains the only authentication source for the app.

Installed packages:

- `@supabase/supabase-js`
- `@supabase/ssr`

Helpers:

- `src/utils/supabase/client.js`
- `src/utils/supabase/server.js`
- `src/utils/supabase/middleware.js`

Current boundary:

- No App Router `page.tsx` was added.
- No root `middleware.js` was added.
- Supabase Auth session refresh is not active because this app uses Better Auth, not Supabase Auth.
- Existing Pages Router pages, category routes, frontend layout, and data flow are unchanged.

Use `src/utils/supabase/server.js` only for server-side Supabase queries where the user identity still comes from Better Auth.
