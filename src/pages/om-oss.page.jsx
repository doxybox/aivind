import InfoPageLayout, { InfoSection } from "@/components/aivind/InfoPageLayout";

export default function AboutPage() {
  return (
    <InfoPageLayout
      title="Om oss"
      kicker="Dette er TEKKNO"
      intro="TEKKNO er en norsk nettavis for teknologi, kunstig intelligens, gaming, elbil og digitale produkter. Vi skal gjøre teknologien forståelig, nyttig og relevant."
    >
      <InfoSection title="Vårt oppdrag">
        <p>Vi dekker teknologi som påvirker hverdagen, arbeidslivet og samfunnet. Målet er å forklare hva som skjer, hvorfor det betyr noe og hvilke konsekvenser nye produkter og tjenester kan få.</p>
        <p>Journalistikken skal være tydelig, kritisk og uavhengig. Kommersielle samarbeid skal alltid merkes og holdes adskilt fra redaksjonelle vurderinger.</p>
      </InfoSection>
      <InfoSection title="Dette dekker vi">
        <p>Redaksjonen arbeider med nyheter, tester, guider, analyser og video innen AI, gaming, elbil, gadgets og forbrukerteknologi.</p>
        <p>Vi prioriterer saker som gir leserne innsikt eller praktisk verdi, og vi retter feil åpent når vi oppdager dem.</p>
      </InfoSection>
      <InfoSection title="Kontakt oss">
        <p>Har du tips, spørsmål eller tilbakemeldinger, finner du riktig kontaktpunkt på <a href="/kontakt" className="text-orange-500 hover:underline">kontaktsiden vår</a>.</p>
      </InfoSection>
    </InfoPageLayout>
  );
}
