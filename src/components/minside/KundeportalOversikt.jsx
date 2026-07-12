import React, { useEffect, useState } from "react";
import { Bookmark, ChevronRight, Mail, Newspaper, PenTool, Search } from "lucide-react";
import { getAccountOverview } from "@/lib/account-client";
import { formatAccountDate, getAccountPlanLabel, getDisplayName } from "@/lib/account-display";
import { getNorwegianGreeting } from "@/lib/norwegian-time";

export default function KundeportalOversikt({ user, accountOverview, accountOverviewError = false, onNavigate }) {
  const [overview, setOverview] = useState(accountOverview || null);
  const [sub, setSub] = useState(accountOverview?.subscription || null);
  const [subscriptionError, setSubscriptionError] = useState(accountOverviewError);

  useEffect(() => {
    if (accountOverview || accountOverviewError) {
      setOverview(accountOverview || null);
      setSub(accountOverview?.subscription || null);
      setSubscriptionError(accountOverviewError);
      return undefined;
    }

    let ignore = false;

    (async () => {
      try {
        const data = await getAccountOverview();
        if (!ignore) {
          setOverview(data);
          setSub(data.subscription);
          setSubscriptionError(false);
        }
      } catch {
        if (!ignore) {
          setOverview(null);
          setSub(null);
          setSubscriptionError(true);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [accountOverview, accountOverviewError]);

  const planLabel = getAccountPlanLabel({
    subscription: sub,
    premiumAccess: Boolean(overview?.premiumAccess),
    loadFailed: subscriptionError,
  });
  const isActive = ["active", "trialing"].includes(sub?.status);
  const nextPayment = subscriptionError
    ? "Kunne ikke hente abonnement"
    : sub?.current_period_end
      ? formatAccountDate(sub.current_period_end)
      : "-";
  const displayName = getDisplayName(user, overview?.profile);
  const firstName = displayName.split(" ")[0] || displayName;
  const savedArticlesCount = overview?.savedArticlesCount || 0;
  const greeting = getNorwegianGreeting();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 flex flex-col justify-center min-h-[220px] relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-500/30 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-orange-600/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-4 mb-2 relative z-10">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-400">
                <path d="M12 4V2M12 22V20M4 12H2M22 12H20M5.636 5.636L4.222 4.222M19.778 19.778L18.364 18.364M5.636 18.364L4.222 19.778M19.778 5.636L18.364 4.222" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="2" />
                <path d="M12 16V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div>
                <p className="text-[14px] text-orange-300/70 font-medium">{greeting}, {firstName}!</p>
                <h2 className="text-[32px] font-extrabold text-white mt-1 leading-tight tracking-tight">Hva vil du lese i dag?</h2>
              </div>
            </div>

            <div className="mt-6 relative z-10">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Søk i artikler, e-avis, abonnement og kundeservice"
                className="w-full h-14 pl-14 pr-6 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-[15px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/50 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-white/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
              </div>
              <h3 className="text-[20px] font-bold text-white">Utforsk innhold</h3>
            </div>
            <p className="text-[14px] text-zinc-400 mb-8 pl-13 relative z-10">Få rask tilgang til dine mest brukte funksjoner</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              <button onClick={() => onNavigate("lagrede")} className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                <Bookmark className="w-8 h-8 text-zinc-400 group-hover:text-orange-400 transition-colors" />
                <span className="text-[14px] font-medium text-white">Lagrede artikler</span>
              </button>
              <button onClick={() => onNavigate("eavis")} className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                <Newspaper className="w-8 h-8 text-zinc-400 group-hover:text-orange-400 transition-colors" />
                <span className="text-[14px] font-medium text-white">E-avis</span>
              </button>
              <button onClick={() => onNavigate("nyhetsbrev")} className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                <Mail className="w-8 h-8 text-zinc-400 group-hover:text-orange-400 transition-colors" />
                <span className="text-[14px] font-medium text-white">Nyhetsbrev</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/30 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-2 mb-8 text-orange-300/70 font-medium text-[14px] relative z-10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><rect width="18" height="18" x="3" y="3" rx="2" /></svg>
              Mitt abonnement
            </div>

            <div className="flex items-start justify-between mb-6 relative z-10">
              <div>
                <h3 className="text-[26px] font-extrabold text-white leading-none mb-3">{planLabel}</h3>
                <p className="text-[13px] text-zinc-400">Neste betaling: {nextPayment}</p>
              </div>
              <span className={`px-3 py-1.5 border text-[12px] font-bold rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)] ${isActive ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 text-zinc-400"}`}>
                {isActive ? "Aktiv" : "Ikke aktiv"}
              </span>
            </div>

            <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/10 relative z-10">
              <span className="text-[14px] text-zinc-300 font-medium">{displayName}</span>
              <button onClick={() => onNavigate("abonnement")} className="text-[14px] text-orange-400 hover:text-white flex items-center gap-1 font-medium transition-colors">
                Administrer <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button onClick={() => onNavigate("lagrede")} className="w-full flex items-center justify-between p-6 bg-black/20 backdrop-blur-xl rounded-3xl border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group text-left shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Newspaper className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h4 className="text-[16px] font-bold text-white mb-1">Lagrede artikler</h4>
                <p className="text-[14px] text-zinc-300 font-medium line-clamp-1 mb-1.5">{savedArticlesCount} lagret</p>
                <p className="text-[12px] text-zinc-500">Hentet fra kontoen din</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
          </button>

          <button onClick={() => onNavigate("tips")} className="w-full flex items-center justify-between p-6 bg-black/20 backdrop-blur-xl rounded-3xl border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group text-left shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <PenTool className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h4 className="text-[16px] font-bold text-white mb-1">Tips redaksjonen</h4>
                <p className="text-[13px] text-zinc-400 line-clamp-2 leading-relaxed">Send inn nyhetstips, bilder eller video til redaksjonen.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
