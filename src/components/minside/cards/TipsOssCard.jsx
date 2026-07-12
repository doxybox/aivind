import React, { useState } from "react";
import { Megaphone, Send, UploadCloud, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const initialForm = { title: "", category: "Nyhet", description: "" };

export default function TipsOssCard() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast({ title: "Mangler informasjon", description: "Vennligst fyll ut tittel og beskrivelse.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Kunne ikke sende tipset akkurat na.");

      setSubmitted(true);
      toast({ title: "Tips sendt!", description: "Takk for tipset. Redaksjonen vil vurdere saken.", variant: "success" });
    } catch (error) {
      toast({ title: "Kunne ikke sende tips", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Takk for tipset!</h2>
        <p className="text-zinc-400 max-w-md mx-auto mb-8">Vi har mottatt tipset i redaksjonens tipsko. En journalist tar kontakt dersom vi trenger mer informasjon.</p>
        <button onClick={() => { setForm(initialForm); setSubmitted(false); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all">
          Send et nytt tips
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/20 flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-orange-300" />
        </div>
        <div>
          <h2 className="text-[24px] font-bold text-white">Tips redaksjonen</h2>
          <p className="text-[14px] text-zinc-400 mt-1">Har du sett noe vi burde skrive om? Send oss et teksttips.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-300 uppercase tracking-wider">Tittel / Stikkord</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} type="text" placeholder="Hva gjelder tipset?" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-300 uppercase tracking-wider">Kategori</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all appearance-none">
                  {["Nyhet", "Trafikk", "Sport", "Politikk", "Kultur", "Arrangement", "Annet"].map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-[13px] font-bold text-zinc-300 uppercase tracking-wider">Beskrivelse</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Beskriv hva som har skjedd..." className="w-full flex-1 min-h-[200px] bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none" />
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <div className="p-6 border border-dashed border-white/20 rounded-2xl bg-black/10 flex flex-col items-center justify-center text-center flex-1 min-h-[160px] opacity-70">
              <UploadCloud className="w-8 h-8 text-zinc-400 mb-3" />
              <p className="text-[14px] font-medium text-white mb-1">Bilde og video kommer senere</p>
              <p className="text-[12px] text-zinc-500">Mediaopplasting er parkert til Cloudflare-flyten er aktivert.</p>
            </div>

            <button type="submit" disabled={submitting} className="w-full px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-60 disabled:cursor-not-allowed">
              <Send className="w-5 h-5" /> {submitting ? "Sender..." : "Send inn tips"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
