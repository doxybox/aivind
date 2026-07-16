# Artikkelkommentarer

Leserkommentarer lagres og modereres i Payload. Better Auth eier fortsatt
leserens sesjon og identitet.

## Tilgang og API

- `GET /api/articles/[slug]/comments` returnerer bare publiserte kommentarer
  for en artikkel leseren har tilgang til.
- `POST /api/articles/[slug]/comments` krever en Better Auth-sesjon. Bruker-ID
  og visningsnavn hentes utelukkende fra sesjonen på serveren.
- Nye kommentarer opprettes med status `pending` og vises ikke offentlig før
  redaksjonen publiserer dem.
- Premium- og medlemsartikler følger samme server-side tilgangskontroll som
  artikkelsiden.
- Kommentarer er begrenset til 2--2000 tegn. Innsending har en per-bruker- og
  per-IP-rate limit.

## Moderering i Payload

- Åpne **Article Comments** i Payload Admin for å moderere innsendte kommentarer.
- Bruk status **Publisert**, **Skjult** eller **Avvist**. Bare publiserte
  kommentarer vises på nettsiden.
- For å svare som redaksjonen, opprett en ny kommentar, velg **Svar på kommentar**,
  merk **Redaksjonssvar**, og sett status til **Publisert**.
- På hver Payload-artikkel kan feltet **Tillat kommentarer** slås av. Da skjules
  kommentarfeltet og nye innsendinger avvises.

## Migrasjon

Payload-migrasjon `20260716_040000_article_comments_moderation` oppretter
`article_comments`, nødvendige indekser og kopierer eventuelle eksisterende
kommentarer fra den gamle app-tabellen `article_comment`.

Kjør Payload-migrasjonen mot ønsket database først etter normal backup og
miljøkontroll:

```powershell
npx payload migrate
```

Etter migrasjonen kan innloggede lesere sende kommentarer til moderering.
Kommentarinnhold rendres som vanlig React-tekst, ikke HTML.
