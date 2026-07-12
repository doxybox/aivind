# Newsletter Preferences

Newsletter preferences are owned by the app database, not Base44.

## Data ownership

- Better Auth supplies the authenticated session.
- Supabase Postgres stores preference rows through Drizzle.
- The frontend never sends or controls `userId`.
- No email provider is integrated in this step.

## Database

The app table is `newsletter_preference`:

- `id`
- `user_id`
- `daily_digest`
- `breaking_news`
- `weekly_summary`
- `ai_tech_news`
- `gaming_news`
- `marketing`
- `created_at`
- `updated_at`

Rows are unique per `user_id`.

Run the generated Drizzle migration with:

```bash
npm run db:migrate
```

Make sure `DATABASE_URI` or `DATABASE_URL` is set locally before running the migration.

## API

- `GET /api/account/newsletter-preferences` returns the current user's preferences.
- `POST /api/account/newsletter-preferences` upserts the current user's preferences.

Both methods require a Better Auth session server-side. Requests with client-supplied `userId` are rejected. Preference values must be booleans.

## Manual test

1. Log in.
2. Open `/min-side`.
3. Go to `Nyhetsbrev`.
4. Toggle one or more preferences.
5. Reload the page and confirm the choices persist.

## Limitations

- Preferences are persisted, but no email sending/provider sync is implemented yet.
- Profile consent fields remain separate profile data and are not the source of truth for `/min-side` newsletter preferences.
