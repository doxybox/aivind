import React, { useState, useEffect } from "react";
import { getSubscription } from "@/lib/account-client";
import { CalendarDays, RefreshCw, LogIn, CreditCard } from "lucide-react";

export default function AccountStatusSection({ profile, user }) {
  const [sub, setSub] = useState(null);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const data = await getSubscription();
        if (!ignore) setSub(data.subscription);
      } catch { /* ignore */ }
    })();
    
    return () => { ignore = true; };
  }, []);

  const planLabel = sub?.plan_type === "pluss" ? "TEKKNO Pluss"
    : sub?.plan_type === "premium" ? "TEKKNO Premium"
    : sub?.plan_type === "familie" ? "TEKKNO Familie"
    : sub?.plan_type === "bedrift" ? "TEKKNO Bedrift"
    : "Gratis";

  const createdDate = (profile?.created_date || user?.created_date)
    ? new Date(profile?.created_date || user?.created_date).toLocaleDateString("nb-NO")
    : "—";
  const updatedDate = profile?.updated_date
    ? new Date(profile.updated_date).toLocaleDateString("nb-NO")
    : "—";
  const authProvider = profile?.auth_provider
    ? profile.auth_provider.charAt(0).toUpperCase() + profile.auth_provider.slice(1)
    : "E-post";

  const rows = [
    { icon: CalendarDays, label: "Konto opprettet", value: createdDate },
    { icon: RefreshCw, label: "Sist oppdatert", value: updatedDate },
    { icon: LogIn, label: "Innloggingsmetode", value: authProvider },
    { icon: CreditCard, label: "Medlemsstatus", value: planLabel, highlight: planLabel !== "Gratis" },
  ];

  return (
    <div className="bg-[#111115] rounded-xl border border-white/5 p-6">
      <h3 className="text-[18px] font-bold text-white mb-1">Kontostatus</h3>
      <p className="text-[13px] text-zinc-400 mb-6">Oversikt over din konto. Disse feltene kan ikke redigeres.</p>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <dt className="text-[12px] text-zinc-500">{row.label}</dt>
                <dd className={`text-[14px] font-medium truncate ${row.highlight ? "text-orange-500" : "text-white"}`}>
                  {row.value}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
