import React, { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Camera, Trash2 } from "lucide-react";

export default function AvatarSection({ form, update, onPersistAvatar }) {
  const [imgError, setImgError] = useState(false);

  const initials = `${form.first_name?.[0] || ""}${form.last_name?.[0] || ""}`.toUpperCase() || "?";

  const handleUploadUnavailable = () => {
    toast({
      title: "Opplasting ikke konfigurert",
      description: "Profilbildeopplasting er koblet fra Base44 og ma kobles til Cloudflare/Payload for bruk.",
      variant: "warning",
    });
  };

  const handleRemove = async () => {
    update("avatar_url", "");
    setImgError(false);
    if (onPersistAvatar) {
      try {
        await onPersistAvatar("");
      } catch {}
    }
    toast({ title: "Fjernet", description: "Profilbilde er fjernet.", variant: "info" });
  };

  const showImg = form.avatar_url && !imgError;

  return (
    <div className="bg-[#111115] rounded-xl border border-white/5 p-6 h-full flex flex-col justify-center">
      <h3 className="text-[18px] font-bold text-white mb-1">Profilbilde</h3>
      <p className="text-[13px] text-zinc-400 mb-6">Last opp eller fjern ditt profilbilde.</p>

      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-orange-500/10 border-4 border-orange-500/20 flex items-center justify-center overflow-hidden shadow-xl shadow-orange-500/10">
            {showImg ? (
              <img
                src={form.avatar_url}
                alt="Profilbilde"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-orange-500 font-bold text-3xl">{initials || "?"}</span>
            )}
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-[200px] flex-col">
          <button
            onClick={handleUploadUnavailable}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[13px] font-bold transition-colors shadow-lg shadow-orange-500/20"
          >
            <Camera className="w-4 h-4" /> Endre bilde
          </button>
          {form.avatar_url && (
            <button
              onClick={handleRemove}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border border-white/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 rounded-lg text-[13px] font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Fjern bilde
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
