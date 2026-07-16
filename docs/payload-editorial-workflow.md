# Payload Editorial Workflow

## What is enabled

- **Drafts and autosave:** Articles save draft progress every 1.5 seconds. Payload retains up to 50 versions per article.
- **Versions:** Editors can compare and restore prior versions in Payload Admin. The `20260716_053000_sync_article_versions_editorial_workflow` migration aligns the historical version table with the current article fields before this workflow is used in a deployed environment.
- **Live Preview:** The `Live Preview` control on an article opens a signed, ten-minute preview of its draft on the public site. It is available only when `NEXT_PUBLIC_SITE_URL` and `PAYLOAD_SECRET` (or `PAYLOAD_PREVIEW_SECRET`) are configured.
- **Publishing checks:** A first-time publish requires title, slug, ingress, article body, author, category, SEO title, and SEO description. Existing published articles can still be edited without being blocked by historical missing metadata.
- **Editorial dashboard:** The Payload dashboard shows counts for drafts, review items, scheduled articles, pending comments, and new tips.

## Editorial flow

1. Create an article. It starts as a draft.
2. Write and review the draft. Autosave keeps the working version safe.
3. Add author, category, ingress, SEO title, and SEO description.
4. Use **Live Preview** to check desktop, tablet, and mobile rendering.
5. Set the article to `Review` when another editor should inspect it.
6. Publish from Payload when the checks are complete. En automatisert planleggingsjobb kommer når Vercel Cron er konfigurert.

## Scheduled work and email

Payload's job queue and automatisert planlagt publisering er ikke konfigurert ennå. Begge skal aktiveres sammen med en autentisert Vercel Cron-runner. E-postjobber skal i tillegg vente til en e-postleverandør er testet end-to-end.

## Security notes

- Preview links use an HMAC signature and expire after ten minutes.
- The preview endpoint only sets a short-lived, HttpOnly preview cookie after validating the signature.
- Drafts are never returned by the normal public article loader.
