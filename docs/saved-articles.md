# Saved Articles

Saved articles are owned by the app database, not Base44.

## Data ownership

- Better Auth supplies the authenticated session.
- Supabase Postgres stores saved article rows through Drizzle.
- Payload remains the source of truth for article title, slug, category, image and publish state.
- The frontend never sends or controls `userId`.

## Database

The app table is `saved_article`:

- `id`
- `user_id`
- `article_id`
- `article_slug`
- `created_at`

Rows are unique per `user_id` and `article_slug`. The table stores references only, not duplicated article body/content.

Run the generated Drizzle migration with:

```bash
npm run db:migrate
```

Make sure `DATABASE_URI` or `DATABASE_URL` is set locally before running the migration.

## API

- `GET /api/account/saved-articles` lists the current user's saved articles.
- `POST /api/account/saved-articles` saves a published Payload article by `slug`, `articleSlug` or `articleId`.
- `DELETE /api/account/saved-articles?id=...` removes one saved row by saved row id.
- `DELETE /api/account/saved-articles?slug=...` removes one saved article by article slug.

All methods require a Better Auth session server-side. Requests with client-supplied `userId` are rejected.

## Limitations

- Public article/card save buttons are not wired broadly yet.
- If Payload cannot find a saved article, the account page shows a safe unavailable item instead of failing the whole list.
- This does not change public article/category/homepage rendering or the `CONTENT_SOURCE` flag.
