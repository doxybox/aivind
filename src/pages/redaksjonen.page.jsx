import InfoPageLayout, { InfoSection } from "@/components/aivind/InfoPageLayout";

export default function EditorialPage() {
  return (
    <InfoPageLayout
      title="Redaksjonen"
      kicker="Uavhengig journalistikk"
      intro="TEKKNO arbeider etter grunnleggende presseetiske prinsipper om kildekritikk, åpenhet, samtidig imøtegåelse og et tydelig skille mellom journalistikk og reklame."
    >
      <InfoSection title="Slik arbeider vi">
        <p>Opplysninger skal kontrolleres mot relevante kilder før publisering. Ved tester beskriver vi metode, forutsetninger og eventuelle bindinger som kan være relevante for vurderingen.</p>
        <p>Produkter som er lånt eller mottatt til test gir ikke leverandøren innflytelse over konklusjonen. Sponsede saker og annonser merkes tydelig.</p>
      </InfoSection>
      <InfoSection title="Rettelser og tilsvar">
        <p>Finner du en mulig feil, send en presis beskrivelse og lenke til saken til <a href="mailto:redaksjonen@tekkno.no" className="text-orange-500 hover:underline">redaksjonen@tekkno.no</a>. Vesentlige rettelser skal fremgå av artikkelen.</p>
        <p>Personer og virksomheter som utsettes for sterke faktiske beskyldninger skal få rimelig anledning til å svare.</p>
      </InfoSection>
      <InfoSection title="Tips og kildevern">
        <p>Ikke send sensitive opplysninger i vanlig e-post. Ta først kontakt med redaksjonen for å avtale en egnet kanal dersom tipset krever særskilt konfidensialitet.</p>
      </InfoSection>
    </InfoPageLayout>
  );
}
