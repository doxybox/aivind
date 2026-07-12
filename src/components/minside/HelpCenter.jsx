import React, { useState } from "react";
import { ChevronRight, Headphones, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function HelpCenter() {
  const [view, setView] = useState("oversikt");
  const [form, setForm] = useState({ emne: "", kategori: "Abonnement", beskrivelse: "", prioritet: "Normal" });

  const faqs = [
    "Hvordan endrer jeg betalingskort?",
    "Får ikke logget inn på e-avisen",
    "Hvordan stopper jeg abonnementet?",
    "Manglende papiravis",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.emne || !form.beskrivelse) {
      toast({ title: "Mangler informasjon", description: "Fyll ut emne og beskrivelse.", variant: "destructive" });
      return;
    }
    toast({ title: "Sak opprettet lokalt", description: "Kundeservice-lagring må kobles til database før saken blir permanent.", variant: "success" });
    setView("oversikt");
    setForm({ emne: "", kategori: "Abonnement", beskrivelse: "", prioritet: "Normal" });
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-h-[600px]">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/20 flex items-center justify-center">
          <Headphones className="w-5 h-5 text-orange-400" />
        </div>
        <h2 className="text-[24px] font-bold text-white">Kundeservice</h2>
      </div>

      {view === "oversikt" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div>
              <h3 className="text-[18px] font-bold text-white mb-4">Ofte stilte spørsmål</h3>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <button key={faq} className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/[0.02] text-left transition-all group">
                    <span className="text-[14px] font-medium text-white">{faq}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
              <button className="mt-4 text-orange-400 hover:text-white text-[14px] font-medium">Se alle spørsmål og svar &rarr;</button>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-900/20 to-black/20 border border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-[16px] font-bold text-white mb-1">Trenger du hjelp?</h4>
                <p className="text-[13px] text-zinc-400">Våre kundebehandlere er klare til å hjelpe deg.</p>
              </div>
              <button onClick={() => setView("ny-sak")} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-all flex items-center gap-2 text-[14px]">
                <Plus className="w-4 h-4" /> Ny sak
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[18px] font-bold text-white mb-4">Mine saker</h3>
            <div className="p-5 rounded-xl border border-white/5 bg-black/20">
              <p className="text-[15px] font-bold text-white mb-2">Ingen saker registrert</p>
              <p className="text-[13px] text-zinc-400">Kundeservicesaker vises her når de lagres i databasen.</p>
            </div>
          </div>
        </div>
      )}

      {view === "ny-sak" && (
        <div className="max-w-2xl">
          <button onClick={() => setView("oversikt")} className="text-[14px] text-zinc-400 hover:text-white flex items-center gap-2 mb-6 transition-colors">
            &larr; Tilbake til oversikt
          </button>
          <h3 className="text-[20px] font-bold text-white mb-6">Opprett ny sak</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-300 uppercase tracking-wider">Kategori</label>
                <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all appearance-none">
                  <option className="bg-zinc-900">Abonnement</option>
                  <option className="bg-zinc-900">Faktura & Betaling</option>
                  <option className="bg-zinc-900">Teknisk problem / App</option>
                  <option className="bg-zinc-900">Papiravis levering</option>
                  <option className="bg-zinc-900">Annet</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-300 uppercase tracking-wider">Prioritet</label>
                <select value={form.prioritet} onChange={(e) => setForm({ ...form, prioritet: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all appearance-none">
                  <option className="bg-zinc-900">Lav</option>
                  <option className="bg-zinc-900">Normal</option>
                  <option className="bg-zinc-900">Høy</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-zinc-300 uppercase tracking-wider">Emne</label>
              <input value={form.emne} onChange={(e) => setForm({ ...form, emne: e.target.value })} type="text" placeholder="Kort oppsummering av problemet" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-zinc-300 uppercase tracking-wider">Beskrivelse</label>
              <textarea value={form.beskrivelse} onChange={(e) => setForm({ ...form, beskrivelse: e.target.value })} placeholder="Beskriv problemet i detalj..." rows={6} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none" />
            </div>

            <button type="submit" className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              Send inn sak
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
