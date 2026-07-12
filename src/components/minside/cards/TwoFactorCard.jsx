import React from "react";
import { toast } from "@/components/ui/use-toast";
import { ShieldOff, QrCode } from "lucide-react";

export default function TwoFactorCard() {
  const handleUnavailable = () => {
    toast({
      title: "2FA ikke tilgjengelig enna",
      description: "Base44-2FA er fjernet. Produksjonsklar 2FA ma bygges mot Better Auth for den kan aktiveres.",
      variant: "warning",
    });
  };

  return (
    <div className="bg-[#111115] rounded-xl border border-white/10 p-6 shadow-xl relative overflow-hidden font-sans">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border bg-white/5 border-white/10">
          <ShieldOff className="w-6 h-6 text-[#888888]" />
        </div>
        <div>
          <p className="text-[13px] text-[#888888] font-mono tracking-tight">Tofaktorautentisering</p>
          <p className="text-[16px] font-bold text-white uppercase tracking-wider mt-0.5">Ikke konfigurert</p>
        </div>
      </div>

      <p className="text-[13px] text-[#888888] mb-6 font-mono tracking-tight leading-relaxed">
        Base44 sin 2FA-flyt er koblet fra. Denne kan ikke aktiveres for den er implementert og handhevet via Better Auth.
      </p>

      <button
        onClick={handleUnavailable}
        className="inline-flex justify-center items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[13px] font-bold transition-all w-full sm:w-auto uppercase tracking-widest"
      >
        <QrCode className="w-4 h-4" />
        Aktiver 2FA
      </button>
    </div>
  );
}
