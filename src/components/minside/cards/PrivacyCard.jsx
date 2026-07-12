import React, { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Trash2, Shield } from "lucide-react";

export default function PrivacyCard({ onLogout }) {
  const [deleting, setDeleting] = useState(false);

  const handleDownloadData = () => {
    toast({ title: "Forespørsel sendt", description: "Dine data vil bli sendt til din e-post innen 48 timer.", variant: "success" });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    toast({ title: "Forespørsel registrert", description: "Du får en e-post med instruksjoner.", variant: "warning" });
    setDeleting(false);
    setTimeout(() => { onLogout?.(); }, 2000);
  };

  return (
    <div className="bg-[#111115] rounded-xl border border-white/10 p-6 shadow-xl relative overflow-hidden font-sans">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-[#ff6a00]" />
        <h3 className="text-[18px] font-bold text-white uppercase tracking-wider">Personvern</h3>
      </div>
      <p className="text-[13px] text-[#888888] font-mono tracking-tight leading-relaxed mb-6">
        Full kontroll over dine data. Last ned eller slett kontoen når som helst.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownloadData}
          className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-lg text-[13px] font-bold text-white transition-all uppercase tracking-widest"
        >
          <Download className="w-4 h-4" /> Eksporter data
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 rounded-lg text-[13px] font-bold text-red-500 transition-all uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <Trash2 className="w-4 h-4" /> Slett konto
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#111115] border border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">BEKREFT SLETTING</AlertDialogTitle>
              <AlertDialogDescription className="text-[#888888] font-mono">
                Denne handlingen er irreversibel. Systemet vil slette alle registrerte data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-red-500 text-white hover:bg-red-600 font-bold uppercase tracking-widest">
                {deleting ? "Sletter..." : "Bekreft sletting"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
