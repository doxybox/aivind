import { getPayloadClient } from "../../lib/server/payload-client.js";

const cards = [
  { key: "drafts", label: "Kladder", collection: "articles", where: { status: { equals: "draft" } }, href: "/admin/collections/articles?where[status][equals]=draft" },
  { key: "review", label: "Til vurdering", collection: "articles", where: { status: { equals: "review" } }, href: "/admin/collections/articles?where[status][equals]=review" },
  { key: "scheduled", label: "Planlagt", collection: "articles", where: { status: { equals: "scheduled" } }, href: "/admin/collections/articles?where[status][equals]=scheduled" },
  { key: "comments", label: "Kommentarer", collection: "article-comments", where: { status: { equals: "pending" } }, href: "/admin/collections/article-comments?where[status][equals]=pending" },
  { key: "tips", label: "Nye tips", collection: "tip-submissions", where: { status: { equals: "new" } }, href: "/admin/collections/tip-submissions?where[status][equals]=new" },
];

export default async function EditorialDashboard() {
  const payload = await getPayloadClient();
  const results = await Promise.all(
    cards.map(async (card) => {
      try {
        const { totalDocs } = await payload.count({ collection: card.collection, where: card.where, overrideAccess: true });
        return { ...card, totalDocs };
      } catch {
        return { ...card, totalDocs: 0 };
      }
    }),
  );

  return (
    <section style={{ marginBottom: "2rem" }}>
      <h1 style={{ marginBottom: ".4rem" }}>Redaksjonsoversikt</h1>
      <p style={{ marginTop: 0, opacity: 0.72 }}>Følg opp innhold som trenger en redaksjonell beslutning.</p>
      <div style={{ display: "grid", gap: ".75rem", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {results.map((card) => (
          <a key={card.key} href={card.href} style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: "8px", color: "inherit", padding: "1rem", textDecoration: "none" }}>
            <strong style={{ display: "block", fontSize: "1.65rem", lineHeight: 1 }}>{card.totalDocs}</strong>
            <span style={{ display: "block", marginTop: ".45rem", opacity: 0.72 }}>{card.label}</span>
          </a>
        ))}
      </div>
      <p style={{ marginBottom: 0, marginTop: "1rem", fontSize: ".9rem", opacity: 0.72 }}>
        Nye artikler lagres som kladder. Bruk «Live Preview» i en artikkel for å kontrollere visningen før publisering.
      </p>
    </section>
  );
}
