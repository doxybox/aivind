import InfoPageLayout, { InfoSection } from "@/components/aivind/InfoPageLayout";

export default function AdvertisingPage() {
  return (
    <InfoPageLayout
      title="Annonsering"
      kicker="Nå teknologiinteresserte lesere"
      intro="TEKKNO tilbyr tydelig merkede annonseflater for virksomheter som vil nå lesere med interesse for teknologi, AI, gaming, elbil og digitale produkter."
    >
      <InfoSection title="Mulige annonseflater">
        <p>Aktuelle formater kan omfatte displayannonser, sponsorater og kommersielt innhold. Tilgjengelighet, formatkrav og publiseringsplan avklares før bestilling.</p>
      </InfoSection>
      <InfoSection title="Tydelig skille">
        <p>Annonsører kjøper synlighet, ikke redaksjonell omtale eller innflytelse. Kommersielt innhold merkes slik at det ikke kan forveksles med uavhengig journalistikk.</p>
      </InfoSection>
      <InfoSection title="Forespørsel">
        <p>Send informasjon om virksomhet, ønsket periode, mål og format til <a href="mailto:annonsering@tekkno.no" className="text-orange-500 hover:underline">annonsering@tekkno.no</a>. Vi gir et konkret svar på muligheter og vilkår før noe avtales.</p>
      </InfoSection>
    </InfoPageLayout>
  );
}
