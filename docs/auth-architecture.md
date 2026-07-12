# Auth Architecture

## Overview

TEKKNO uses Better Auth as the only authentication system. Supabase is used only as PostgreSQL database infrastructure. Supabase Auth is intentionally not used, and the app must not rely on `auth.uid()`, Supabase Auth JWTs, or Supabase session state.

The phase 1 implementation keeps the existing Next.js Pages Router and JavaScript/JSX frontend. Base44 is treated as a temporary prototype/mock layer while auth and database concerns move to Better Auth, Drizzle, and Supabase Postgres.

## Auth

Better Auth is mounted at:

```txt
/api/auth/*
```

The Pages Router handler lives in:

```txt
src/pages/api/auth/[...all].js
```

Client-side auth calls use:

```txt
src/lib/auth-client.js
```

Server-side auth config lives in:

```txt
src/lib/auth.js
```

Phase 1 supports:

- Email/password registration and login
- Email verification
- Password reset
- Sessions
- Social provider configuration placeholders for Google and Apple
- Built-in Better Auth rate limiting

Magic link, OTP, 2FA, and CAPTCHA are documented/scaffolded for later phases but are not required for phase 1.

## Database

Drizzle connects to Supabase Postgres through `DATABASE_URL`.

Better Auth tables must be generated from the Better Auth config using the official CLI:

```bash
npm run auth:generate-schema
```

Then Drizzle migrations can be generated and applied:

```bash
npm run db:generate
npm run db:migrate
```

App-specific tables are defined in:

```txt
src/db/schema.js
```

Phase 1 app tables:

- `user_profile`
- `user_role`
- `subscription`
- `entitlement`

Later tables can include `article`. Current app-owned account tables include `saved_article` and `newsletter_preference`.

## Roles

Roles are stored in `user_role`.

Supported roles:

- `reader`
- `subscriber`
- `journalist`
- `editor`
- `admin`

New users get a `reader` role through a server-side Better Auth database hook. Users must never be able to self-assign `subscriber`, `journalist`, `editor`, or `admin`. Elevated roles are assigned server-side by admin tooling or a local seed script.

For local development:

```bash
npm run auth:assign-role -- user@example.com admin
```

The script refuses to run when `NODE_ENV=production`.

## Entitlements And Subscriptions

Authentication answers who the user is. Entitlements and subscriptions answer what the user can access.

Premium access is checked server-side against `subscription` and `entitlement`. It must not be trusted solely from session metadata.

Helpers live in:

```txt
src/lib/server/auth-helpers.js
```

Important helpers:

- `getCurrentUser(req)`
- `getCurrentSession(req)`
- `requireAuth(req)`
- `requireRole(req, role)`
- `requireAnyRole(req, roles)`
- `requireAdmin(req)`
- `getUserEntitlements(userId)`
- `userHasActiveSubscription(userId)`
- `canAccessPremiumArticle(userId, articleId)`

Phase 2A account data helpers live in:

```txt
src/lib/server/account-service.js
src/lib/server/account-policy.js
```

The `/min-side` account surfaces use these Pages Router API routes:

- `GET /api/account/overview`
- `GET /api/account/profile`
- `PUT /api/account/profile`
- `GET /api/account/subscription`

All account API routes require a Better Auth session with `requireAuth(req)`. The frontend must not send `userId` for profile, subscription, or entitlement data. Server-side helpers resolve the user from the session and use `subscription` and `entitlement` as the source of truth for premium access.

## Protected Routes

Protected Pages Router examples:

- `/admin-only`
- `/subscriber-only`
- `/account`

These use `getServerSideProps` and server-side database checks. Client-side guards may still be used for UX, but they are not the security boundary.

## Environment Variables

Required for auth/database:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_BETTER_AUTH_URL`
- `EMAIL_FROM`
- `RESEND_API_KEY`

Optional/scaffolded:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`
- `APPLE_CLIENT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `BETTER_AUTH_SECRET` to the browser.

## Production Notes

- Use a strong `BETTER_AUTH_SECRET` with at least 32 high-entropy characters.
- Configure `BETTER_AUTH_URL` to the canonical production URL.
- Configure email sending before enabling production registration.
- Add CAPTCHA or another abuse-protection layer before opening public registration at scale.
- Add 2FA for `journalist`, `editor`, and `admin` roles in a later phase.
- Keep Supabase Auth disabled/unreferenced for this application.
