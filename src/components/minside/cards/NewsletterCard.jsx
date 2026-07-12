import React, { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { getNewsletterPreferences, updateNewsletterPreferences } from "@/lib/account-client";
import { toast } from "@/components/ui/use-toast";

const toggles = [
  { id: "daily_newsletter", label: "Morgenbrief", desc: "Dagens viktigste nyheter oppsummert hver morgen." },
  { id: "breaking_news", label: "Breaking news", desc: "Fa e-post nar det skjer store og viktige hendelser." },
  { id: "ai_tech_news", label: "AI og teknologi", desc: "Nyheter og guider om AI, teknologi og digitale tjenester." },
  { id: "gaming_news", label: "Gaming", desc: "Spillnyheter, tester og guider." },
  { id: "weekly_summary", label: "Ukentlig oppsummering", desc: "Ukens viktigste saker samlet i en e-post." },
  { id: "offers_subscription_info", label: "Tilbud og abonnement", desc: "Spesialtilbud og informasjon om abonnementet ditt." },
];

export default function NewsletterCard() {
  const [prefs, setPrefs] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [savingKey, setSavingKey] = useState("");

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const preferences = await getNewsletterPreferences();
        if (!ignore) {
          setPrefs(preferences || {});
          setLoadFailed(false);
        }
      } catch {
        if (!ignore) {
          setPrefs(null);
          setLoadFailed(true);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleToggle(key, value) {
    const previous = { ...(prefs || {}) };
    const next = { ...previous, [key]: value };
    setPrefs(next);
    setSavingKey(key);

    try {
      const updated = await updateNewsletterPreferences(next);
      setPrefs(updated);
      setLoadFailed(false);
      toast({ title: "Oppdatert", description: "Nyhetsbrevvalget er lagret.", variant: "success" });
    } catch (error) {
      setPrefs(previous);
      toast({ title: "Kunne ikke lagre", description: error.message, variant: "destructive" });
    } finally {
      setSavingKey("");
    }
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
          <Mail className="w-5 h-5 text-emerald-300" />
        </div>
        <div>
          <h2 className="text-[24px] font-bold text-white">Nyhetsbrev</h2>
          <p className="text-[14px] text-zinc-400 mt-1">Skreddersy hvilke e-poster du onsker a motta fra oss.</p>
        </div>
      </div>

      {!prefs ? (
        <div className="rounded-2xl border border-white/5 bg-black/20 p-6">
          <p className="text-[15px] font-bold text-white mb-2">
            {loadFailed ? "Kunne ikke hente nyhetsbrevvalg" : "Laster nyhetsbrevvalg"}
          </p>
          <p className="text-[13px] text-zinc-400">Ingen valg lagres uten bekreftet API-svar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {toggles.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/[0.02] transition-colors">
              <div className="pr-8">
                <p className="text-[16px] font-bold text-white mb-1">{t.label}</p>
                <p className="text-[13px] text-zinc-400 leading-relaxed">{t.desc}</p>
              </div>
              <Switch
                checked={Boolean(prefs[t.id])}
                disabled={savingKey === t.id}
                onCheckedChange={(value) => handleToggle(t.id, value)}
                className="data-[state=checked]:bg-orange-500 shrink-0"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
