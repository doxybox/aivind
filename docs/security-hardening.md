# Security Hardening Status

This sprint is a hardening/truthfulness pass, not a feature sprint.

## Headers

`next.config.js` sets baseline headers for all routes:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Strict-Transport-Security` only in production builds
- A baseline Content Security Policy which restricts scripts, frames, forms and
  plugin content to the site and explicitly listed providers.

The CSP deliberately permits inline styles/scripts required by the current
Next.js/Payload rendering model. Any new third-party script, analytics provider,
payment widget or media provider must be added deliberately and browser-QA'd
before deployment.

## CSRF

Better Auth owns its own auth endpoints. App-owned state-changing routes should not rely on client guards.

Current protection:

- Cookie-authenticated mutations reject requests without a trusted Origin or
  Referer. This includes profile, saved articles, newsletter preferences,
  comments, subscription status and staff Cloudflare upload/delete routes.
- Checkout also refuses client-supplied absolute redirect URLs.

Still recommended before production:

- Consider a double-submit CSRF token or signed same-site token for
  cookie-authenticated app APIs if the product later needs cross-origin clients.
- Keep SameSite cookie behavior verified in Better Auth config.

## Payload API boundary

Raw Payload REST/GraphQL access is staff-only for editorial collections. The
public frontend reads through server-side loaders using `overrideAccess: true`
and explicit publish-date and paywall checks. Do not make `articles`,
`media-assets`, `authors`, `categories` or `reels` publicly readable without a
separate, field-limited public API contract.

## Parked Services

- Vipps is disabled unless billing provider configuration is complete.
- Cloudflare media upload is disabled unless `CLOUDFLARE_MEDIA_ENABLED=true` is set.
- 2FA is not presented as available until it exists in Better Auth/backend.
