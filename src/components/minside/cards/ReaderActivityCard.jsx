import React, { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { getAccountOverview } from "@/lib/account-client";
import { formatAccountDate } from "@/lib/account-display";

const NEWSLETTER_KEYS = [
  "daily_newsletter",
  "weekly_summary",
  "breaking_news",
  "ai_tech_news",
  "gaming_news",
  "offers_subscription_info",
];

export default function ReaderActivityCard() {
  const [overview, setOverview] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const data = await getAccountOverview();
        if (!ignore) {
          setOverview(data);
          setLoadFailed(false);
        }
      } catch {
        if (!ignore) {
          setOverview(null);
          setLoadFailed(true);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  const savedCount = overview?.savedArticlesCount || 0;
  const newsletterCount = overview?.newsletterPreferences
    ? NEWSLETTER_KEYS.filter((key) => overview.newsletterPreferences?.[key]).length
    : 0;
  const memberSince = formatAccountDate(overview?.profile?.created_date);

  return (
    <div className="bg-[#111115] rounded-xl border border-white/5 p-6 font-sans h-full">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-5 h-5 text-white" />
        <h3 className="text-[18px] font-bold text-white">Leseraktivitet</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[12px] text-[#888888]">Leste artikler denne uken</p>
          <p className="text-[28px] font-bold text-white">0</p>
          <p className="text-[11px] text-[#555]">Lesestatistikk er ikke koblet til ennå</p>
        </div>
        <div className="space-y-1">
          <p className="text-[12px] text-[#888888]">Lagrede artikler</p>
          <p className="text-[28px] font-bold text-white">{loadFailed ? "-" : savedCount}</p>
          <p className="text-[11px] text-[#555]">Hentet fra kontoen din</p>
        </div>
        <div className="space-y-1 pt-4 border-t border-white/5 mt-2">
          <p className="text-[12px] text-[#888888]">Varsler aktive</p>
          <p className="text-[20px] font-bold text-white">{loadFailed ? "-" : newsletterCount}</p>
          <p className="text-[11px] text-[#555]">Basert på nyhetsbrevvalg</p>
        </div>
        <div className="space-y-1 pt-4 border-t border-white/5 mt-2">
          <p className="text-[12px] text-[#888888]">Medlem siden</p>
          <p className="text-[18px] font-bold text-white tracking-tight">{memberSince || "-"}</p>
          <p className="text-[11px] text-[#555]">Hentet fra profilen</p>
        </div>
      </div>
    </div>
  );
}
