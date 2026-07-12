import React from "react";
import { ChevronRight, Newspaper } from "lucide-react";

export default function EavisCard() {
  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-h-[500px]">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/20 flex items-center justify-center">
          <Newspaper className="w-5 h-5 text-purple-300" />
        </div>
        <h2 className="text-[24px] font-bold text-white">E-avis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h3 className="text-[18px] font-bold text-white mb-4">Dagens utgave</h3>
          <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden group relative">
            <div className="aspect-[3/4] bg-white/5 relative flex items-center justify-center">
              <Newspaper className="w-20 h-20 text-white/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                <p className="text-orange-400 font-bold text-sm mb-1">Ikke koblet</p>
                <h4 className="text-xl font-bold text-white mb-4">Ingen e-avis registrert</h4>
                <button disabled className="w-full bg-white/10 text-white/50 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-not-allowed">
                  Åpne e-avis <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[18px] font-bold text-white mb-4">Tidligere utgaver</h3>
          <div className="rounded-xl bg-black/20 border border-white/5 p-5">
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              E-avisarkiv vises her når utgaver er lagret i databasen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
