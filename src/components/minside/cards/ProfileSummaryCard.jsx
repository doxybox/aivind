import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getAccountOverview } from "@/lib/account-client";
import { Crown, ShieldCheck, Mail, Star } from "lucide-react";
import { formatAccountDate } from "@/lib/account-display";

export default function ProfileSummaryCard({ user, onEdit }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [premiumAccess, setPremiumAccess] = useState(false);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const overview = await getAccountOverview();
        if (!ignore) {
          setProfile(overview.profile);
          setPremiumAccess(Boolean(overview.premiumAccess));
        }
      } catch {
        if (!ignore) {
          setProfile(null);
          setPremiumAccess(false);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    
    return () => { ignore = true; };
  }, []);

  const userName = user?.name || user?.full_name || "";
  const firstName = profile?.first_name || userName.split(" ")[0] || "";
  const lastName = profile?.last_name || userName.split(" ").slice(1).join(" ") || "";
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";
  
  const isPremium = premiumAccess;
  const memberSince = formatAccountDate(profile?.created_date);

  if (loading) {
    return (
      <div className="bg-[#111115] rounded-xl border border-white/5 p-6 animate-pulse w-full">
        <div className="h-16 bg-white/10 rounded mb-4" />
      </div>
    );
  }

  return (
    <div className="bg-[#111115] rounded-xl border border-white/5 p-6 font-sans relative w-full overflow-hidden">
      <div className="absolute right-0 top-0 w-64 h-64 bg-[#ff6a00]/5 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#1A1A24] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={64} height={64} unoptimized className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#888888] font-bold text-xl">{initials}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[24px] font-bold text-white tracking-tight">{firstName} {lastName}</h2>
              {isPremium && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/30 text-[#ff6a00] text-[11px] font-bold uppercase tracking-wider">
                  <Crown className="w-3.5 h-3.5" />
                  Premium-medlem
                </div>
              )}
            </div>
            <p className="text-[13px] text-[#888888] mt-1">{memberSince ? `Medlem siden ${memberSince}` : "Medlemsdato hentes fra profilen"}</p>
          </div>
        </div>
        
        <button
          onClick={onEdit}
          className="px-4 py-2 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 text-white text-[13px] font-medium transition-colors whitespace-nowrap"
        >
          Rediger profil
        </button>
      </div>

      {isPremium ? (
        <div className="flex flex-wrap gap-x-8 gap-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 text-[12px] text-white/80">
            <Crown className="w-4 h-4 text-[#888888]" />
            Premiumtilgang aktiv
          </div>
          <div className="flex items-center gap-2 text-[12px] text-white/80">
            <ShieldCheck className="w-4 h-4 text-[#888888]" />
            Tilgang hentes fra abonnementet ditt
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-x-8 gap-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 text-[12px] text-white/80">
            <Mail className="w-4 h-4 text-[#888888]" />
            Gratis konto
          </div>
          <div className="flex items-center gap-2 text-[12px] text-white/80">
            <Star className="w-4 h-4 text-[#888888]" />
            Ingen aktiv premiumtilgang registrert
          </div>
        </div>
      )}
    </div>
  );
}
