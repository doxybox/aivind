import React from "react";
import { ShieldCheck } from "lucide-react";

export default function SecurityCard({ user, onLogout }) {
  return (
    <div className="bg-[#111115] rounded-xl border border-white/5 p-6 font-sans h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-5 h-5 text-white" />
        <h3 className="text-[18px] font-bold text-white">Sikkerhet og konto</h3>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <p className="text-[13px] font-medium text-white mb-0.5">E-postadresse</p>
            <p className="text-[12px] text-[#888888]">{user?.email || "Ikke tilgjengelig"}</p>
          </div>
          <button disabled className="px-3 py-1.5 rounded-lg border border-white/10 text-[12px] font-medium text-white/50 transition-colors cursor-not-allowed">
            Kommer senere
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <p className="text-[13px] font-medium text-white mb-0.5">Passord</p>
            <p className="text-[12px] text-[#888888]">Sist endret er ikke tilgjengelig enna</p>
          </div>
          <button disabled className="px-3 py-1.5 rounded-lg border border-white/10 text-[12px] font-medium text-white/50 transition-colors cursor-not-allowed">
            Kommer senere
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <p className="text-[13px] font-medium text-white mb-0.5">To-faktor autentisering</p>
            <p className="text-[12px] text-yellow-500 font-medium">Ikke tilgjengelig enna</p>
          </div>
          <button disabled className="px-3 py-1.5 rounded-lg border border-white/10 text-[12px] font-medium text-white/50 transition-colors cursor-not-allowed">
            Parkert
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-white mb-0.5">Innloggede enheter</p>
            <p className="text-[12px] text-[#888888]">Enhetsliste er ikke tilgjengelig enna</p>
          </div>
          <button disabled className="px-3 py-1.5 rounded-lg border border-white/10 text-[12px] font-medium text-white/50 transition-colors cursor-not-allowed">
            Kommer senere
          </button>
        </div>
      </div>

      <div className="flex-1" />
      <button
        onClick={onLogout}
        className="w-full py-2.5 bg-transparent border border-white/10 hover:bg-white/5 text-[#ff4444] rounded-lg text-[13px] font-medium transition-colors"
      >
        Logg ut
      </button>
    </div>
  );
}
