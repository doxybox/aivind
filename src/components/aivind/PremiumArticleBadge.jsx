import { Plus } from "lucide-react";

export function isPremiumArticle(article = {}) {
  if (article.type === "video") return false;

  return Boolean(
    article.type === "premium" ||
      article.accessLevel === "paid" ||
      article.paywallEnabled,
  );
}

export default function PremiumArticleBadge({ article, compact = false, corner = false }) {
  if (!isPremiumArticle(article)) return null;

  return (
    <span
      aria-label="Tekkno plussartikkel - krever abonnement"
      title="Tekkno+ - krever abonnement"
      className={`inline-flex w-fit shrink-0 items-center rounded bg-[#ff6a00] font-black uppercase text-white shadow-sm ${
        corner ? "absolute right-3 top-3 z-20" : ""
      } ${
        compact
          ? "gap-0.5 px-1.5 py-0.5 text-[9px] tracking-[0.08em]"
          : "gap-1 px-2 py-1 text-[10px] tracking-[0.1em]"
      }`}
    >
      <span>TEKKNO</span>
      <Plus aria-hidden="true" className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={3} />
    </span>
  );
}
