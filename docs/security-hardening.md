# Security Hardening Status

This sprint is a hardening/truthfulness pass, not a feature sprint.

## Headers

`next.config.js` sets baseline headers for all routes:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Strict-Transport-Security` only in production builds

A stricter CSP is intentionally not enabled yet because the existing frontend uses several media, style and script surfaces that need browser QA before a CSP can be enforced safely.

## CSRF

Better Auth owns its own auth endpoints. App-owned state-changing routes should not rely on client guards.

Current minimal protection:

- `POST /api/billing/checkout` checks Origin/Referer against trusted app origins when those headers are present.
- Checkout also refuses client-supplied absolute redirect URLs.

Still recommended before production:

- Apply the same origin/CSRF policy to all authenticated account mutation routes.
- Consider a double-submit CSRF token or signed same-site token for cookie-authenticated app APIs.
- Keep SameSite cookie behavior verified in Better Auth config.

## Parked Services

- Vipps is disabled unless billing provider configuration is complete.
- Cloudflare media upload is disabled unless `CLOUDFLARE_MEDIA_ENABLED=true` is set.
- 2FA is not presented as available until it exists in Better Auth/backend.
