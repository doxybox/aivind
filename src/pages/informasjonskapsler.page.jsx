import InfoPageLayout, { InfoSection } from "@/components/aivind/InfoPageLayout";
import { openCookiePreferences } from "@/lib/cookie-consent";

const rows = [
  ["Better Auth-sesjon", "TEKKNO / Better Auth", "Nødvendig", "Holder innloggede brukere innlogget og beskytter kontoer.", "Sesjonsvarighet"],
  ["payload_editorial_preview", "TEKKNO / Payload", "Nødvendig", "Gir redaksjonen en kortvarig forhåndsvisning av innhold.", "Kortvarig"],
  ["sidebar_state", "TEKKNO", "Nødvendig", "Husker valgt visning i interne brukerflater.", "7 dager"],
  ["tekkno_consent", "TEKKNO", "Nødvendig", "Lagrer valget ditt for analyse, annonser og personalisering i nettleseren.", "180 dager"],
  ["Google AdSense", "Google", "Annonser og måling", "Viser og måler annonser. Lastes kun ved samtykke og bare når annonser er aktivert av TEKKNO.", "Se Googles dokumentasjon"],
];

export default function CookiePage() {
  return (
    <InfoPageLayout
      title="Informasjonskapsler"
      kicker="Sist oppdatert 22. juli 2026"
      intro="Her forklarer vi hvilke informasjonskapsler og tilsvarende nettleserlagring TEKKNO bruker, og hvordan du kan endre valget ditt."
    >
      <InfoSection title="Dine valg">
        <p>Du kan når som helst endre eller trekke tilbake samtykket ditt. Nødvendige funksjoner kan ikke slås av fordi de trengs for sikkerhet, innlogging og grunnleggende drift.</p>
        <button type="button" onClick={openCookiePreferences} className="rounded-md bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
          Administrer cookies
        </button>
      </InfoSection>

      <InfoSection title="Oversikt">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-muted/30 text-foreground">
              <tr>
                <th className="p-3 font-semibold">Navn</th>
                <th className="p-3 font-semibold">Leverandør</th>
                <th className="p-3 font-semibold">Kategori</th>
                <th className="p-3 font-semibold">Formål</th>
                <th className="p-3 font-semibold">Varighet</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-t border-border align-top">
                  {row.map((cell) => <td key={cell} className="p-3 text-muted-foreground">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoSection>

      <InfoSection title="Tredjepartstjenester">
        <p>Google AdSense kan bare lastes etter samtykke. Når annonser er deaktivert i TEKKNOS annonseinnstillinger, lastes ingen AdSense-ressurser. For informasjon om Googles behandling av personopplysninger, se Googles egne retningslinjer.</p>
      </InfoSection>

      <InfoSection title="Sletting i nettleseren">
        <p>Du kan slette informasjonskapsler og lokal lagring i nettleserens personverninnstillinger. Vær oppmerksom på at dette kan logge deg ut eller nullstille enkelte valg.</p>
      </InfoSection>
    </InfoPageLayout>
  );
}
