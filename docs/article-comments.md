# Artikkelkommentarer

Artikkelreaksjoner er fjernet fra alle ordinære artikkelflater. Leserkommentarer
lagres i appdatabasen, og er ikke koblet til Base44 eller Payload.

## Tilgang og API

- `GET /api/articles/[slug]/comments` returnerer publiserte kommentarer for en
  artikkel leseren har tilgang til.
- `POST /api/articles/[slug]/comments` krever en Better Auth-sesjon. Bruker-ID
  og visningsnavn hentes utelukkende fra sesjonen på serveren.
- Premium- og medlemsartikler følger samme server-side tilgangskontroll som
  artikkelsiden.
- Kommentarer er begrenset til 2--2000 tegn. Innsending har en per-bruker- og
  per-IP-rate limit.

## Migrasjon

Migrasjon `drizzle/0010_fresh_karen_page.sql` oppretter kun
`article_comment` og nødvendige indekser. Den er ikke kjørt automatisk.

Kjør den mot ønsket database først etter normal backup og miljøkontroll:

```powershell
npm run db:migrate
```

Etter migrasjonen kan innloggede lesere kommentere artikler de har full
lesetilgang til. Kommentarinnhold rendres som vanlig React-tekst, ikke HTML.
