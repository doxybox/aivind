import React, { useState, useEffect } from "react";
import { getAccountOverview } from "@/lib/account-client";
import { Crown, Calendar, Bookmark, Mail } from "lucide-react";

const NEWSLETTER_KEYS = [
  "daily_newsletter",
  "weekly_summary",
  "breaking_news",
  "ai_tech_news",
  "gaming_news",
  "offers_subscription_info",
];

export default function StatsRow() {
   const [sub, setSub] = useState(null);
   const [savedCount, setSavedCount] = useState(0);
   const [newsletterCount, setNewsletterCount] = useState(0);
   const [loadFailed, setLoadFailed] = useState(false);

   useEffect(() => {
     let ignore = false;

     (async () => {
       try {
         const overview = await getAccountOverview();
         if (ignore) return;
         setSub(overview.subscription);
         setSavedCount(overview.savedArticlesCount || 0);
         setNewsletterCount(NEWSLETTER_KEYS.filter((key) => overview.newsletterPreferences?.[key]).length);
         setLoadFailed(false);
       } catch {
         if (ignore) return;
         setSub(null);
         setSavedCount(0);
         setNewsletterCount(0);
         setLoadFailed(true);
       }
     })();
     
     return () => { ignore = true; };
   }, []);

  const planLabel = loadFailed ? "Kunne ikke hente abonnement"
    : sub?.plan_type === "pluss" ? "TEKKNO Pluss"
    : sub?.plan_type === "premium" ? "TEKKNO Premium"
    : sub?.plan_type === "familie" ? "TEKKNO Familie"
    : sub?.plan_type === "bedrift" ? "TEKKNO Bedrift"
    : "Gratis";
  const isActive = sub?.status === "active";
  const nextPayment = sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const price = sub?.price || 0;

  const cards = [
    {
      label: "Medlemsstatus",
      icon: Crown,
      value: planLabel,
      subtitle: isActive ? "Aktivt abonnement" : "Gratisversjon",
      dot: isActive ? "bg-green-500" : "bg-muted-foreground",
    },
    {
      label: "Neste betaling",
      icon: Calendar,
      value: nextPayment,
      subtitle: price > 0 ? `${price} kr,-` : "Ingen betaling",
    },
    {
      label: "Lagrede artikler",
      icon: Bookmark,
      value: String(savedCount),
      subtitle: "artikler lagret",
    },
    {
      label: "Nyhetsbrev",
      icon: Mail,
      value: `${newsletterCount} aktivert`,
      subtitle: "Se dine preferanser",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="bg-[#111115] rounded-xl border border-white/10 p-5 shadow-xl font-sans relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff6a00]/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-4 h-4 text-[#ff6a00]" />
              <span className="text-[12px] font-semibold text-white uppercase tracking-wider">{card.label}</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {card.dot && <span className={`w-2 h-2 rounded-full ${card.dot === "bg-green-500" ? "bg-[#00ff88] shadow-[0_0_8px_#00ff88]" : "bg-white/20"}`} />}
                <p className="text-[20px] font-medium text-white truncate font-mono tracking-tight">{card.value}</p>
              </div>
              <p className="text-[12px] text-[#888888] font-mono tracking-tight">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
