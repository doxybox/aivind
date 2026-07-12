import React from "react";
import { Switch } from "@/components/ui/switch";
import { Lock, Mail, Tag } from "lucide-react";

export default function ConsentSection({ form, update, profile }) {
  const termsDate = form.terms_accepted_at
    ? new Date(form.terms_accepted_at).toLocaleDateString("nb-NO")
    : null;
  const privacyDate = form.privacy_accepted_at
    ? new Date(form.privacy_accepted_at).toLocaleDateString("nb-NO")
    : null;

  return (
    <div className="bg-[#111115] rounded-xl border border-white/5 p-6">
      <h3 className="text-[18px] font-bold text-white mb-1">Samtykker og kommunikasjon</h3>
      <p className="text-[13px] text-zinc-400 mb-6">
        Du kan når som helst oppdatere nyhetsbrev og markedsføringsvalg.
      </p>

      <div className="space-y-3">
        {/* Terms — locked */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-zinc-500 shrink-0" />
            <div>
              <p className="text-[14px] font-medium text-white">Jeg godtar vilkår</p>
              {termsDate ? (
                <p className="text-[12px] text-zinc-500">Akseptert {termsDate}</p>
              ) : (
                <p className="text-[12px] text-yellow-500">Må godkjennes</p>
              )}
            </div>
          </div>
          <span className="text-[11px] font-bold text-orange-500 px-2.5 py-1 bg-orange-500/10 rounded-full border border-orange-500/20 uppercase tracking-widest">
            Godtatt
          </span>
        </div>

        {/* Privacy — locked */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-zinc-500 shrink-0" />
            <div>
              <p className="text-[14px] font-medium text-white">Jeg godtar personvernerklæring</p>
              {privacyDate ? (
                <p className="text-[12px] text-zinc-500">Akseptert {privacyDate}</p>
              ) : (
                <p className="text-[12px] text-yellow-500">Må godkjennes</p>
              )}
            </div>
          </div>
          <span className="text-[11px] font-bold text-orange-500 px-2.5 py-1 bg-orange-500/10 rounded-full border border-orange-500/20 uppercase tracking-widest">
            Godtatt
          </span>
        </div>

        {/* Marketing — toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5">
          <div className="flex items-start gap-3">
            <Tag className="w-5 h-5 text-zinc-500 shrink-0" />
            <div>
              <p className="text-[14px] font-medium text-white">Jeg ønsker å motta tilbud og abonnementsinformasjon</p>
              <p className="text-[12px] text-zinc-500">Kampanjer, tilbud og informasjon om abonnementet ditt.</p>
            </div>
          </div>
          <Switch
            checked={form.marketing_consent}
            onCheckedChange={(v) => update("marketing_consent", v)}
            className="data-[state=checked]:bg-orange-500"
          />
        </div>

        {/* Newsletter — toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-zinc-500 shrink-0" />
            <div>
              <p className="text-[14px] font-medium text-white">Jeg ønsker å motta nyhetsbrev</p>
              <p className="text-[12px] text-zinc-500">Daglige oppdateringer og ukentlig oppsummering.</p>
            </div>
          </div>
          <Switch
            checked={form.newsletter_consent}
            onCheckedChange={(v) => update("newsletter_consent", v)}
            className="data-[state=checked]:bg-orange-500"
          />
        </div>
      </div>
    </div>
  );
}