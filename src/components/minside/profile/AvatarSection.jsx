import React, { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import { createAvatarDirectUpload } from "@/lib/account-client";
import { Camera, Loader2, Trash2 } from "lucide-react";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export default function AvatarSection({ form, update, onPersistAvatar }) {
  const [imgError, setImgError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const initials = `${form.first_name?.[0] || ""}${form.last_name?.[0] || ""}`.toUpperCase() || "?";

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast({ title: "Ugyldig fil", description: "Velg JPG, PNG, WebP eller AVIF.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast({ title: "Bildet er for stort", description: "Profilbildet kan være maksimalt 2 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { uploadURL, avatarUrl } = await createAvatarDirectUpload({
        fileMimeType: file.type,
        fileSizeBytes: file.size,
        originalFilename: file.name,
      });
      const upload = new FormData();
      upload.append("file", file);
      const response = await fetch(uploadURL, { method: "POST", body: upload });
      if (!response.ok) throw new Error("Cloudflare upload failed");

      update("avatar_url", avatarUrl);
      setImgError(false);
      await onPersistAvatar?.(avatarUrl);
      toast({ title: "Profilbilde oppdatert", description: "Bildet er lagret på profilen din.", variant: "success" });
    } catch (error) {
      toast({ title: "Kunne ikke laste opp bildet", description: error?.message || "Prøv igjen senere.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
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
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={handleFileChange} />
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-orange-500/10 border-4 border-orange-500/20 flex items-center justify-center overflow-hidden shadow-xl shadow-orange-500/10">
            {showImg ? (
              <Image src={form.avatar_url} alt="Profilbilde" width={128} height={128} unoptimized className="w-full h-full object-cover" onError={() => setImgError(true)} />
            ) : (
              <span className="text-orange-500 font-bold text-3xl">{initials || "?"}</span>
            )}
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-[200px] flex-col">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[13px] font-bold transition-colors shadow-lg shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Laster opp...</> : <><Camera className="w-4 h-4" /> Endre bilde</>}
          </button>
          {form.avatar_url && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border border-white/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 rounded-lg text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" /> Fjern bilde
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
