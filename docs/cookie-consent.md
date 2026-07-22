# Cookie Consent

TEKKNO bruker en lokal samtykkemekanisme for valg knyttet til annonser og maaling.

## Hva mekanismen styrer

- Nodvendige cookies og nettleserlagring for innlogging, sikkerhet, redaksjonell forhandsvisning og brukergrensesnitt er alltid aktive.
- Google AdSense lastes ikke for brukeren har valgt `Godta alle` eller aktivert `Annonser og maaling` under `Tilpass valg`.
- Adblock-kontrollen kjores heller ikke for annonse-samtykke er gitt, slik at den ikke kontakter Googles annonse-endepunkt for samtykke.
- Et avslag betyr at annonser og den tilhorende tredjepartslastingen forblir deaktivert.

Samtykket lagres lokalt i nettleseren under `tekkno-cookie-consent`. Det inneholder bare versjon, tidspunkt og om annonser er tillatt. Det inneholder ikke konto-ID, e-post eller andre personopplysninger.

## Brukergrensesnitt

- Banneret viser `Godta alle`, `Avvis alle` og `Tilpass valg` med like tilgjengelige valg.
- `/informasjonskapsler` inneholder oversikten over teknologiene som brukes.
- `Administrer cookies` er synlig i footeren og lar brukeren endre eller trekke tilbake valget.

## Ved nye tjenester

Før en ny analyse-, markedsforings- eller sporingsleverandor tas i bruk skal dere:

1. Legge tjenesten til i cookie-erklaringen med leverandor, formal og varighet.
2. Legge den bak et eget eller eksisterende samtykkevalg.
3. Bekrefte at script, pixel eller nettverkskall ikke lastes for samtykke.
4. Oppdatere personvernerklaringen og innhente juridisk vurdering ved behov.

## Manuell lanseringssjekk

1. Start et nytt privat nettleservindu og apne forsiden.
2. Velg `Avvis alle`; bekreft i nettverkspanelet at ingen kall gar til `googlesyndication.com`.
3. Apne `Administrer cookies`, velg annonser, oppdater siden og bekreft at AdSense bare da kan lastes nar annonser er aktivert i Payload.
4. Endre valget tilbake til avslag og bekreft at Google-scriptet ikke lastes ved neste sidevisning.
5. Fyll inn full foretaksinformasjon, kontaktadresse og eventuelle databehandlerdetaljer i de juridiske sidene etter virksomhetens godkjenning.
