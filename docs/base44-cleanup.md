# Base44 cleanup status

This project is moving Base44 out of core application flows while preserving the existing Pages Router frontend, routes, layout, and Better Auth/Supabase/Payload architecture.

## Removed from direct frontend usage

- `src/components/minside/ProfileSection.jsx` now reads/writes profile data through `/api/account/profile`.
- `src/components/minside/SubscriptionSection.jsx` now reads subscription data through `/api/account/subscription`.
- `src/components/minside/NewsletterSection.jsx` now reads/writes real newsletter choices through `/api/account/newsletter-preferences`.
- `src/components/minside/cards/NewsletterCard.jsx` now writes newsletter choices through `/api/account/newsletter-preferences` instead of showing read-only mock switches.
- `src/components/minside/PaymentSection.jsx` now reads an authenticated placeholder from `/api/account/payment-history`.
- `src/components/minside/SavedArticlesSection.jsx` now reads real saved articles from `/api/account/saved-articles`.
- `src/components/minside/profile/AvatarSection.jsx` no longer uploads through Base44. Upload is disabled until Cloudflare/Payload media persistence is completed.
- `src/components/minside/VippsCheckout.jsx` no longer calls the Base44 Vipps function. It now starts the provider-neutral Vipps Recurring test checkout when Vipps test credentials are configured.
- `src/components/minside/cards/TwoFactorCard.jsx` and `src/components/auth/TwoFactorStep.jsx` no longer call Base44 2FA. They show that 2FA is not available until Better Auth-backed 2FA is implemented.
- `src/components/minside/cards/TipsOssCard.jsx` now sends text tips through `/api/tips` and only shows success after Payload accepts the submission.
- `src/components/minside/cards/SecurityCard.jsx` no longer shows fake password-change dates or device counts.
- `src/components/aivind/AdSlot.jsx` no longer reads Base44 ads. It renders the existing placeholder for Payload-configured ads.
- `src/pages/NyFrontside1.jsx` no longer calls Base44 for market data. It reads normalized NOK quotes from the first-party `/api/market-data` route.

## New account APIs

- `POST /api/tips`
- `GET /api/market-data`
- `GET /api/account/newsletter-preferences`
- `POST /api/account/newsletter-preferences`
- `GET /api/account/payment-history`
- `GET /api/account/saved-articles`
- `POST /api/account/saved-articles`
- `DELETE /api/account/saved-articles?id=...`

All account APIs require a Better Auth session server-side. The frontend never sends `userId`.

## Data model notes

Newsletter preferences are stored in the app database through the `newsletter_preference` table. Saved articles are stored through the `saved_article` table and reference Payload articles by slug and optional article id. Payment history does not yet have a final app table and returns a safe authenticated placeholder instead of using Base44 data.

## Compatibility shims kept temporarily

These routes remain so old runtime calls do not 404 while Base44 is being removed:

- `/api/apps/[appId]/entities/User/me`
- `/api/apps/[appId]/analytics/track/batch`
- `/api/apps/[appId]/functions/getMarketData`

They are marked as deprecated compatibility shims in code and should not be treated as final architecture.

Current hardening on the shims:

- strict method checks
- `appId` validation
- no-store/noindex response headers
- basic body validation for POST endpoints
- safe error messages
- rate-limit TODOs until a shared rate-limit utility exists

## Remaining Base44 references

- `src/api/base44Client.js` remains isolated as a legacy SDK wrapper/fallback.
- `@base44/sdk` remains in `package.json` for now because the cleanup is staged.
- Active account backgrounds no longer use `media.base44.com`; local owned placeholders replaced them on 2026-07-12.
- `src/lib/app-params.js` still clears old Base44 local-storage keys.

No active frontend component/page imports `@/api/base44Client` directly.

## Not changed intentionally

- No frontend redesign.
- No route changes.
- No App Router migration.
- No TypeScript migration.
- No Supabase Auth.
- No Ghost reintroduction.
- No payment checkout rebuild.
- No Cloudflare/Payload avatar upload rebuild.
- No Payload frontend rendering changes.

## Hardening status

- Billing checkout redirects are internal path-only and server-origin based.
- Vipps remains parked unless provider config is explicit and complete.
- Cloudflare media upload remains parked unless `CLOUDFLARE_MEDIA_ENABLED=true` is set.
- Basic security headers are configured in `next.config.js`.
- Minimal same-origin CSRF protection is applied to billing checkout; broader CSRF rollout is still a production hardening task.

## Next cleanup step

Create real app tables/API helpers for payment history/customer portal and a Better Auth-backed 2FA implementation. After that, remove the isolated SDK wrapper, the deprecated `/api/apps/*` shims, and the `@base44/sdk` dependency.
