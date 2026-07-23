# Dependency and build warnings

Last reviewed: 2026-07-23

## Current status

- Public app: Next.js 15.5.21, Payload 3.86.0.
- Payload Admin: Next.js 16.2.11, Payload 3.86.0.
- Both applications install deterministically with their own `package-lock.json`.
- Root production audit: 0 critical, 0 high, 5 moderate, 0 low.
- Payload Admin production audit: 0 critical, 0 high, 5 moderate, 0 low.

No audit force-fix was used.

## Dependency hardening

The public app was moved from Next.js 14.2.35 to 15.5.21 and Payload packages
were aligned on 3.86.0. Narrow overrides pin patched releases of Axios,
fast-uri, flatted, form-data, minimatch, socket.io-parser, ws, and Sharp
without forcing unrelated major versions.

`react-quill` was removed because no source, test, or script imported it. The
application's existing editor and Payload collection behavior are unchanged.

Payload Admin was aligned on Payload 3.86.0 and Next.js 16.2.11. Its overrides
also pin DOMPurify 3.4.12 and PostCSS 8.5.22, removing the prior Monaco/
DOMPurify and Next/PostCSS audit findings. The public app and admin app
intentionally retain separate lockfiles because Vercel installs them from
different project roots.

## Build warning cleanup

- `outputFileTracingRoot` pins the public build to the repository root.
- Payload Admin sets `turbopack.root` to the shared repository root because it
  imports the root Payload configuration.
- Tailwind's root config now uses ESM, matching `"type": "module"`.
- The official Next ESLint plugin and Core Web Vitals rules are active.

## Accepted warnings

The public build reports existing unused-variable warnings and native `<img>`
optimization recommendations. They are non-blocking and were not changed in
this dependency-only task. Converting images to `next/image` can alter delivery,
remote-host requirements, and layout, so it requires separate browser QA.

The remaining five moderate findings in both applications are a single upstream
chain: `@payloadcms/db-postgres` includes `drizzle-kit`, which includes the
deprecated `@esbuild-kit/esm-loader` and its old `esbuild` copy. The advisory
applies to a local development server exposed to a hostile web page; the
affected package is used for schema/build tooling and is not part of the public
request path. npm reports no non-breaking fix. Do not force an esbuild override:
the loader depends on the old esbuild API and could break migrations or Payload
builds. Revisit when Payload/Drizzle removes this chain.

The prior Sharp high findings are resolved through the narrowed `next.sharp`
override to `sharp@0.35.3`. Do not remove that override without rerunning both
audits and builds.

The install also reports deprecated `@esbuild-kit` packages and npm's
`allow-scripts` review notice. These are upstream/tooling notices; approving or
changing install scripts should be handled as a separate supply-chain review.

## Verification

Run from the repository root:

```bash
npm ci
npm --prefix payload-admin ci
npm run test:auth
npm run typecheck
npm run lint
npm run build
npm run payload-admin:build
npm audit
npm --prefix payload-admin audit
```

Re-run this matrix after future Next.js, Payload, Drizzle, or Monaco upgrades.
