import React, { useEffect, useState } from "react";
import { getNewsletterPreferences, updateNewsletterPreferences } from "@/lib/account-client";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import SectionSkeleton from "./SectionSkeleton";

const PREFERENCES = [
  { key: "daily_newsletter", label: "Daglig nyhetsbrev", desc: "Få dagens viktigste saker rett i innboksen" },
  { key: "weekly_summary", label: "Ukentlig oppsummering", desc: "En ukentlig oppsummering av ukens viktigste tech-nyheter" },
  { key: "breaking_news", label: "Viktige nyheter", desc: "Varsler ved store, oppdaterende nyheter" },
  { key: "ai_tech_news", label: "AI- og teknologinyheter", desc: "Nyheter om kunstig intelligens og teknologi" },
  { key: "gaming_news", label: "Gamingnyheter", desc: "Det siste fra gamingverdenen" },
  { key: "offers_subscription_info", label: "Tilbud og abonnementsinfo", desc: "Spesialtilbud og informasjon om ditt abonnement" },
];

const DEFAULTS = {
  daily_newsletter: false,
  weekly_summary: false,
  breaking_news: false,
  ai_tech_news: false,
  gaming_news: false,
  offers_subscription_info: false,
};

export default function NewsletterSection() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const preferences = await getNewsletterPreferences();
        setPrefs(preferences || DEFAULTS);
        setLoadFailed(false);
      } catch (e) {
        setPrefs(DEFAULTS);
        setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggle = async (key, value) => {
    const oldPrefs = { ...prefs };
    const nextPrefs = { ...prefs, [key]: value };
    setPrefs(nextPrefs);

    try {
      const updated = await updateNewsletterPreferences(nextPrefs);
      setPrefs(updated);
      setLoadFailed(false);
      toast({ title: "Oppdatert", description: "Dine nyhetsbrevinnstillinger er lagret.", variant: "success" });
    } catch (err) {
      setPrefs(oldPrefs);
      toast({ title: "Feil", description: "Kunne ikke lagre innstillingen.", variant: "destructive" });
    }
  };

  if (loading || !prefs) return <SectionSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-[-0.02em]">Nyhetsbrev og varsler</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Velg hvilke e-poster du ønsker å motta.</p>
        {loadFailed && <p className="text-[12px] text-destructive mt-2">Kunne ikke hente nyhetsbrevvalgene dine akkurat nå.</p>}
      </div>

      <div className="bg-card rounded-lg border border-border divide-y divide-border">
        {PREFERENCES.map((preference) => (
          <div key={preference.key} className="flex items-center justify-between p-4">
            <div className="pr-4">
              <p className="text-[14px] font-semibold text-foreground">{preference.label}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{preference.desc}</p>
            </div>
            <Switch checked={!!prefs[preference.key]} onCheckedChange={(value) => handleToggle(preference.key, value)} />
          </div>
        ))}
      </div>
    </div>
  );
}
