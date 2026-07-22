# Dependency and build warnings

Last reviewed: 2026-07-22

## Current status

- Public app: Next.js 15.5.21, Payload 3.86.0.
- Payload Admin: Next.js 16.2.11, Payload 3.86.0.
- Both applications install deterministically with their own `package-lock.json`.
- Root production audit: 0 critical, 2 high, 5 moderate.
- Payload Admin production audit: 0 critical, 2 high, 7 moderate, 1 low.

No audit force-fix was used.

## Dependency hardening

The public app was moved from Next.js 14.2.35 to 15.5.21 and Payload packages
were aligned on 3.86.0. Lodash and PostCSS were updated. Narrow overrides pin
patched releases of Axios, DOMPurify, fast-uri, flatted, form-data, minimatch,
socket.io-parser, and ws without forcing unrelated major versions.

`react-quill` was removed because no source, test, or script imported it. The
application's existing editor and Payload collection behavior are unchanged.

Payload Admin was aligned on Payload 3.86.0 and Next.js 16.2.11. The public app
and admin app intentionally retain separate lockfiles because Vercel installs
them from different project roots.

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

The remaining root moderate findings are inherited from ESLint, Payload,
Drizzle, and schema/build tooling (`ajv`, `brace-expansion`, legacy esbuild, and
`js-yaml`). Payload Admin additionally inherits moderate/low DOMPurify, Monaco,
PostCSS, and Drizzle tooling findings.

Both applications also retain two high findings from Next.js' optional nested
`sharp@0.34.x` dependency. The direct `sharp@0.35.3` dependency is patched, but
Next.js 15.5.21 and 16.2.11 still declare `sharp@0.34.x` internally. Forcing
that nested dependency outside Next's supported range is not an acceptable
production fix. Track the next compatible upstream Next.js release, then
upgrade and rerun the full verification matrix. Do not use `npm audit fix
--force`.

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
