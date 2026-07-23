import InfoPageLayout, { InfoSection } from "@/components/aivind/InfoPageLayout";

export default function TermsPage() {
  return (
    <InfoPageLayout
      title="Vilkår"
      kicker="Sist oppdatert 12. juli 2026"
      intro="Disse vilkårene gjelder bruk av TEKKNOS nettsted, brukerkontoer og digitale innholdstjenester."
    >
      <InfoSection title="Bruk av tjenesten">
        <p>Du kan bruke åpne deler av nettstedet uten konto. Enkelte funksjoner og artikler kan kreve innlogging eller gyldig tilgang. Du må bruke tjenesten lovlig og ikke forsøke å omgå tilgangskontroller eller forstyrre driften.</p>
      </InfoSection>
      <InfoSection title="Konto og sikkerhet">
        <p>Du er ansvarlig for korrekte kontoopplysninger og for å beskytte innloggingsinformasjonen din. Varsle oss dersom du mistenker misbruk. Vi kan begrense kontoer som brukes i strid med vilkårene eller loven.</p>
      </InfoSection>
      <InfoSection title="Abonnement og betaling">
        <p>Betalte abonnementer er ikke tilgjengelige før de uttrykkelig aktiveres i tjenesten. Når betaling lanseres, skal pris, periode, fornyelse, oppsigelse og angrerett fremgå før kjøpet bekreftes.</p>
      </InfoSection>
      <InfoSection title="Opphavsrett">
        <p>Artikler, bilder, video, grafikk og annet materiale tilhører TEKKNO eller navngitte rettighetshavere. Innhold kan deles som lenke, men kan ikke kopieres, republiseres eller brukes kommersielt uten tillatelse.</p>
      </InfoSection>
      <InfoSection title="Ansvar og tilgjengelighet">
        <p>Vi arbeider for korrekte opplysninger og stabil drift, men kan ikke garantere at tjenesten alltid er feilfri eller tilgjengelig. Journalistisk innhold er generell informasjon og erstatter ikke individuell juridisk, medisinsk eller økonomisk rådgivning.</p>
      </InfoSection>
      <InfoSection title="Kontakt og endringer">
        <p>Spørsmål om vilkårene kan sendes til <a href="mailto:redaksjon@tekkno.no" className="text-orange-500 hover:underline">redaksjon@tekkno.no</a>. Vesentlige endringer publiseres her og får ny oppdateringsdato.</p>
      </InfoSection>
    </InfoPageLayout>
  );
}
