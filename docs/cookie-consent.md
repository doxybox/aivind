# Cookie Consent

TEKKNO lagrer samtykke for valgfrie tjenester i en førsteparts-cookie, `tekkno_consent`.
Samtykket inneholder kun kategoriinnstillinger, versjon og tidspunkt. Det inneholder aldri navn,
e-post, IP-adresse eller bruker-ID.

## Lagring og levetid

- Cookie: `tekkno_consent`
- Levetid: 180 dager
- Attributter: `Path=/`, `SameSite=Lax`, `Max-Age=15552000` og `Secure` på HTTPS
- Versjon: `CONSENT_VERSION` i `src/lib/cookie-consent.js`

Verdien er URL-kodet JSON med `necessary`, `analytics`, `advertising`, `personalization`,
`savedAt` og `version`. Ugyldige, utløpte eller versjonsutdaterte verdier behandles som manglende
samtykke. Da vises dialogen igjen uten at applikasjonen kaster en feil.

Øk bare `CONSENT_VERSION` når formål, kategorier eller leverandører endres på en måte som krever
nytt samtykke.

## Hva valgene styrer

- **Nødvendige**: innlogging, sikkerhet og selve samtykkevalget. Alltid aktivt.
- **Analyse**: analyseverktøy når slike er konfigurert.
- **Annonser**: AdSense og adblock-kontrollen. AdSense-scriptet lastes ikke før dette er gitt.
- **Personalisering**: Google-signal for annonsepersonalisering når annonseløsningen støtter det.

Før Google-script kan lastes setter appen Google Consent Mode til `denied`. Når valget lagres,
sender `applyGoogleConsent` en `consent update`. Det finnes ingen statisk Analytics-, GTM- eller
AdSense-loader i appen. `AdSlot` har også en egen guard som hindrer duplikate AdSense-scripts.

Når et samtykke trekkes tilbake stopper appen nye analyse- og annonsehandlinger uten reload. Et
tredjepartsscript som allerede er lastet kan kreve en sideoppdatering for å fjernes helt fra den
aktuelle siden.

## Google AdSense og CMP

Denne dialogen styrer TEKKNOS egne integrasjoner, men er **ikke** en Google-sertifisert CMP.
Før AdSense aktiveres for trafikk i Norge/EØS må virksomheten velge, konfigurere og juridisk
godkjenne en passende Google-sertifisert CMP. Ikke vis både CMP-banneret og denne dialogen uten
en integrasjonsplan; da må footer-lenken kobles til CMP-ens personverninnstillinger i stedet.

Se også [adsense-setup.md](adsense-setup.md).

## Manuell testplan

1. Åpne nettstedet i inkognito. Dialogen skal vises, og ingen kall skal gå til Google AdSense.
2. Velg **Avvis alle**, last inn siden på nytt og naviger til en annen side. Dialogen skal ikke
   komme tilbake, og annonser skal fortsatt være deaktivert.
3. Slett `tekkno_consent`, velg **Godta alle**, last inn på nytt og bekreft at dialogen er skjult.
4. Slett cookien, velg **Tilpass valg**, aktiver analyse uten annonser og lagre. Bekreft etter
   reload at bare analyseverdien er aktiv.
5. Åpne **Personvernvalg** i footeren, endre til avslag og lagre. Bekreft at valget varer etter
   reload.
6. Test med tastatur: Tab skal holdes i dialogen, og Escape/lukk fungerer bare når innstillinger
   åpnes på nytt etter et eksisterende valg.
7. Øk `CONSENT_VERSION` lokalt, reload og bekreft at dialogen vises. Tilbakestill versjonen før
   deploy med mindre nytt samtykke faktisk er nødvendig.
