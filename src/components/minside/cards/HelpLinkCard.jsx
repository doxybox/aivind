import React from "react";
import { ChevronRight, HelpCircle, MessageSquare, ShieldCheck, Mail } from "lucide-react";

export default function HelpLinkCard({ onNavigate }) {
  return (
    <div className="bg-[#111115] rounded-xl border border-white/5 p-6 font-sans h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-[18px] font-bold text-white">Trenger du hjelp?</h3>
      </div>
      <p className="text-[13px] text-[#888888] mb-4">Vi er her for å hjelpe deg.</p>

      <div className="space-y-1">
        <button onClick={onNavigate} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
          <div className="flex items-center gap-3 text-left">
            <HelpCircle className="w-4 h-4 text-[#888888] group-hover:text-white" />
            <div>
              <p className="text-[14px] font-semibold text-white">Hjelpesenter</p>
              <p className="text-[12px] text-[#888888]">Finn svar på vanlige spørsmål</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#555]" />
        </button>

        <button onClick={onNavigate} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
          <div className="flex items-center gap-3 text-left">
            <MessageSquare className="w-4 h-4 text-[#888888] group-hover:text-white" />
            <div>
              <p className="text-[14px] font-semibold text-white">Kontakt kundeservice</p>
              <p className="text-[12px] text-[#888888]">Vi svarer som regel innen 24 timer</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#555]" />
        </button>
        
        <button onClick={onNavigate} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
          <div className="flex items-center gap-3 text-left">
            <Mail className="w-4 h-4 text-[#888888] group-hover:text-white" />
            <div>
              <p className="text-[14px] font-semibold text-white">Send tilbakemelding</p>
              <p className="text-[12px] text-[#888888]">Hjelp oss å bli bedre</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#555]" />
        </button>

        <button onClick={onNavigate} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
          <div className="flex items-center gap-3 text-left">
            <ShieldCheck className="w-4 h-4 text-[#888888] group-hover:text-white" />
            <div>
              <p className="text-[14px] font-semibold text-white">Personvern og vilkår</p>
              <p className="text-[12px] text-[#888888]">Les våre retningslinjer</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#555]" />
        </button>
      </div>
    </div>
  );
}