import { allArticles } from "@/lib/articles";
import { slugifyArticleTitle, withArticleHref } from "@/lib/article-slugs";

export const ARTICLE_TEMPLATE_PREVIEW_SLUG = "artikkelmal-forhandsvisning";

const articleTemplatePreview = {
  id: "local-article-template-preview",
  slug: ARTICLE_TEMPLATE_PREVIEW_SLUG,
  title: "Når teknologien blir stille, blir den ofte mest nyttig",
  excerpt: "Vi fyller denne lokale forhåndsvisningen med tilfeldig redaksjonelt innhold for å kontrollere at hele artikkelmalen fungerer fra ingress til relaterte saker.",
  author: "Ingrid Løken",
  time: "Akkurat nå",
  readTime: "6 min",
  comments: 12,
  category: "Teknologi",
  categorySlug: "gadgets",
  type: "standard",
  image: "/images/placeholders/article-placeholder.svg",
  publishedAt: "2026-07-14T08:30:00.000Z",
  isTemplatePreview: true,
  content: `De mest interessante teknologiene er ikke alltid de som roper høyest. Noen ganger er det de små forbedringene som fjerner friksjon fra en vanlig arbeidsdag, og som først blir synlige når de plutselig mangler.

I denne forhåndsvisningen tester vi hele leseflyten med en vanlig ingress, flere avsnitt, mellomtitler og et sitat. Innholdet er lokalt og er ikke med i forsiden, kategorisidene eller Payload.

## Fra funksjon til vane

De siste årene har vi fått stadig flere verktøy som lover å spare tid. Det avgjørende er likevel ikke hvor mange knapper et produkt har, men om det gjør en konkret oppgave enklere uten at brukeren må tenke over det.

Et godt eksempel er når et system kan foreslå riktig informasjon i rett øyeblikk, uten å kreve at du først må bygge en ny rutine rundt funksjonen. Da blir teknologien en del av arbeidsflyten i stedet for enda en ting som skal administreres.

> "Den beste teknologien forsvinner nesten i bakgrunnen. Du merker den ikke for den sparer deg for tid, men for den lar deg bruke tiden på noe viktigere."

## Små valg kan gi stor effekt

Det er lett å overvurdere enkeltlanseringer og undervurdere summen av små forbedringer. Bedre søk, ryddigere varslinger og raskere oppstart kan virke beskjedent hver for seg, men samlet endrer de hvordan et produkt oppleves fra dag til dag.

For redaksjoner og lesere handler det om det samme: Informasjon skal være enkel å finne, god å lese og mulig å stole på. En tydelig struktur og en rolig leseopplevelse er minst like viktig som den neste store funksjonen.

## Hva ser vi etter videre?

Vi kommer til å se nærmere på hvordan nye verktøy faktisk brukes over tid. Det er først når en funksjon fungerer i en travel hverdag at den fortjener en fast plass i rutinen.

Denne teksten finnes kun for å kvalitetssikre artikkelmalen lokalt. Når malen er godkjent, kan den trygt fjernes uten å påvirke publisert innhold.`,
};

export function getLegacyArticles() {
  return allArticles.map(withArticleHref);
}

export function getLegacyArticleBySlug(slug) {
  if (!slug) return null;

  if (process.env.NODE_ENV !== "production" && slug === ARTICLE_TEMPLATE_PREVIEW_SLUG) {
    return withArticleHref(articleTemplatePreview);
  }

  return getLegacyArticles().find((article) => {
    return article.slug === slug || slugifyArticleTitle(article.title) === slug;
  }) || null;
}
