import InfoPageLayout, { InfoSection } from "@/components/aivind/InfoPageLayout";

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      title="Personvern"
      kicker="Sist oppdatert 12. juli 2026"
      intro="Denne erklæringen forklarer hvilke personopplysninger TEKKNO behandler, hvorfor vi gjør det og hvilke rettigheter du har."
    >
      <InfoSection title="Behandlingsansvarlig">
        <p>TEKKNO Media AS er behandlingsansvarlig for personopplysninger som behandles gjennom nettstedet. Personvernhenvendelser kan sendes til <a href="mailto:personvern@tekkno.no" className="text-orange-500 hover:underline">personvern@tekkno.no</a>.</p>
      </InfoSection>
      <InfoSection title="Opplysninger vi behandler">
        <p>Vi kan behandle kontoopplysninger som navn og e-post, innstillinger du lagrer, lagrede artikler, abonnementsstatus og tekniske opplysninger som er nødvendige for sikker drift.</p>
        <p>Når du melder deg på nyhetsbrevet, lagrer vi e-postadressen, tidspunktet for samtykket og hvor påmeldingen kom fra.</p>
      </InfoSection>
      <InfoSection title="Reaksjoner og reel-visninger">
        <p>Artikkelreaksjoner lagres med en pseudonym identifikator slik at samme nettleser kan huske reaksjonen. For reel-visninger lager serveren en enveishash av begrensede tekniske signaler, eller bruker konto-ID når du er innlogget. Rå IP-adresse lagres ikke i reel-tabellen, og reel-målingen setter ingen egen sporingscookie.</p>
        <p>Disse opplysningene brukes til aggregert statistikk, misbruksvern og forbedring av innhold. Reel-visninger slettes etter den dokumenterte lagringsperioden gjennom det planlagte vedlikeholdsjobbet.</p>
      </InfoSection>
      <InfoSection title="Formål og behandlingsgrunnlag">
        <p>Opplysninger brukes for å levere konto- og innholdstjenester, ivareta sikkerhet, svare på henvendelser og sende kommunikasjon du uttrykkelig har bedt om. Behandlingen bygger på avtale, samtykke, rettslig plikt eller vår berettigede interesse i trygg og stabil drift.</p>
      </InfoSection>
      <InfoSection title="Lagring og deling">
        <p>Vi lagrer opplysninger så lenge det er nødvendig for formålet eller lovpålagt. Data kan behandles av leverandører for database, hosting, autentisering og publisering under databehandleravtaler. Vi selger ikke personopplysninger.</p>
      </InfoSection>
      <InfoSection title="Dine rettigheter">
        <p>Du kan be om innsyn, retting, sletting, begrensning, dataportabilitet eller protestere mot behandling. Samtykke kan trekkes tilbake. Du kan også klage til Datatilsynet.</p>
      </InfoSection>
      <InfoSection title="Sikkerhet og endringer">
        <p>Vi bruker tekniske og organisatoriske tiltak for å beskytte opplysninger. Erklæringen kan oppdateres når tjenester eller regelverk endres; datoen øverst viser siste vesentlige revisjon.</p>
      </InfoSection>
    </InfoPageLayout>
  );
}
