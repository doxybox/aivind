import React from "react";
import Link from "next/link";
import {
  Home, CreditCard, Bookmark, Newspaper, Mail, Megaphone,
  Headphones, LogOut
} from "lucide-react";
import BrandLogo from "@/components/aivind/BrandLogo";

const sections = [
  { id: "oversikt", label: "Hjem", icon: Home },
  { id: "abonnement", label: "Abonnement", icon: CreditCard },
  { id: "lagrede", label: "Lagrede artikler", icon: Bookmark },
  { id: "eavis", label: "E-avis", icon: Newspaper },
  { id: "nyhetsbrev", label: "Nyhetsbrev", icon: Mail },
  { id: "tips", label: "Tips oss", icon: Megaphone },
  { id: "hjelp", label: "Kundeservice", icon: Headphones },
];

export default function DashboardSidebar({ activeSection, onSelect, onLogout }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] shrink-0 h-screen fixed left-0 top-0 border-r border-white/10 z-40 font-sans overflow-hidden">
        {/* Glass background image */}
        <div 
          className="absolute inset-0 z-[-2] bg-cover bg-center bg-no-repeat opacity-60" 
          style={{ backgroundImage: 'url("/images/placeholders/account-background.svg")' }}
        />
        <div className="absolute inset-0 z-[-1] bg-black/70 backdrop-blur-2xl" />

        <div className="h-24 flex items-center px-8 shrink-0 relative z-10">
          <Link href="/" className="shrink-0" aria-label="TEKKNO forside">
            <BrandLogo className="h-10 max-w-[190px]" priority />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar relative z-10">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-5 px-5">MIN SIDE</div>
          <ul className="space-y-2">
            {sections.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => onSelect(s.id)}
                    className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-full text-[14px] font-medium transition-all duration-300 relative group overflow-hidden ${
                      active
                        ? "text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {!active && (
                      <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    {active && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-transparent rounded-full" />
                        <div className="absolute inset-0 rounded-full border border-white/20 shadow-[inset_0_0_12px_rgba(255,255,255,0.1)]" />
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500/30 blur-xl rounded-full" />
                      </>
                    )}
                    <Icon className={`w-5 h-5 shrink-0 relative z-10 transition-colors ${active ? "text-orange-300" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                    <span className="relative z-10 tracking-wide">{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile section removed from sidebar per request */}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-black/40 backdrop-blur-2xl border-b border-white/10 font-sans">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/" className="shrink-0" aria-label="TEKKNO forside">
            <BrandLogo className="h-9 max-w-[154px]" priority />
          </Link>
          <button
            onClick={onLogout}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 pb-3 overflow-x-auto custom-scrollbar">
          <div className="flex gap-2 min-w-min">
            {sections.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all relative overflow-hidden ${
                    active 
                      ? "text-white border border-white/20" 
                      : "bg-white/5 text-zinc-400 border border-white/10 hover:text-white"
                  }`}
                >
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-transparent" />
                  )}
                  <Icon className={`w-4 h-4 shrink-0 relative z-10 ${active ? "text-orange-300" : ""}`} />
                  <span className="relative z-10">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
