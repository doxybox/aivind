import InfoPageLayout, { InfoSection } from "@/components/aivind/InfoPageLayout";

export default function ContactPage() {
  return (
    <InfoPageLayout
      title="Kontakt"
      kicker="Snakk med TEKKNO"
      intro="Velg kontaktpunktet som passer henvendelsen din. Ikke send passord, betalingsinformasjon eller andre sensitive personopplysninger på e-post."
    >
      <InfoSection title="Generelle henvendelser">
        <p><a href="mailto:kontakt@tekkno.no" className="text-orange-500 hover:underline">kontakt@tekkno.no</a></p>
      </InfoSection>
      <InfoSection title="Redaksjon og tips">
        <p>For nyhetstips, rettelser og spørsmål om journalistikken: <a href="mailto:redaksjonen@tekkno.no" className="text-orange-500 hover:underline">redaksjonen@tekkno.no</a>.</p>
      </InfoSection>
      <InfoSection title="Annonsering">
        <p>For kommersielle forespørsler: <a href="mailto:annonsering@tekkno.no" className="text-orange-500 hover:underline">annonsering@tekkno.no</a>.</p>
      </InfoSection>
      <InfoSection title="Personvern">
        <p>For innsyn, retting, sletting eller andre spørsmål om personopplysninger: <a href="mailto:personvern@tekkno.no" className="text-orange-500 hover:underline">personvern@tekkno.no</a>.</p>
      </InfoSection>
    </InfoPageLayout>
  );
}
