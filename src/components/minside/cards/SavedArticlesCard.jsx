import React, { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { getAccountOverview } from "@/lib/account-client";

export default function SavedArticlesCard() {
  const [savedCount, setSavedCount] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const overview = await getAccountOverview();
        if (!ignore) {
          setSavedCount(overview.savedArticlesCount || 0);
          setLoadFailed(false);
        }
      } catch {
        if (!ignore) {
          setSavedCount(0);
          setLoadFailed(true);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-h-[500px]">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/20 flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-orange-400" />
        </div>
        <h2 className="text-[24px] font-bold text-white">Lagrede artikler</h2>
      </div>

      <div className="bg-black/20 border border-white/5 rounded-2xl p-8 text-center">
        <p className="text-[34px] font-black text-white mb-2">{loadFailed ? "-" : savedCount}</p>
        <p className="text-[15px] font-bold text-white mb-2">
          {loadFailed ? "Kunne ikke hente lagrede artikler" : savedCount === 0 ? "Ingen lagrede artikler ennå" : "Lagrede artikler"}
        </p>
        <p className="text-[13px] text-zinc-400 max-w-md mx-auto">
          {loadFailed
            ? "Prøv å laste siden på nytt."
            : "Når lagrede artikler blir koblet til artikkeldatabasen, vises listen din her."}
        </p>
      </div>
    </div>
  );
}
