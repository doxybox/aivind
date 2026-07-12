import React from "react";
import { LayoutDashboard, User, CreditCard, Receipt, Mail, Bookmark, Shield, Lock } from "lucide-react";

const tabs = [
  { id: "oversikt", label: "Oversikt", icon: LayoutDashboard },
  { id: "profil", label: "Profil", icon: User },
  { id: "abonnement", label: "Abonnement", icon: CreditCard },
  { id: "betaling", label: "Betaling", icon: Receipt },
  { id: "nyhetsbrev", label: "Nyhetsbrev", icon: Mail },
  { id: "lagrede", label: "Lagrede artikler", icon: Bookmark },
  { id: "sikkerhet", label: "Sikkerhet", icon: Shield },
  { id: "personvern", label: "Personvern", icon: Lock },
];

export default function MinsideSidebar({ activeTab, onSelect }) {
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:block w-56 shrink-0">
        <ul className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <li key={tab.id}>
                <button
                  onClick={() => onSelect(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile horizontal tabs */}
      <div className="lg:hidden -mx-4 px-4 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-min">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-orange-500 text-white"
                    : "bg-secondary text-muted-foreground border border-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}