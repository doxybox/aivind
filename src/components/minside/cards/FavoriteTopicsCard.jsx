import React from "react";
import { Heart } from "lucide-react";

export default function FavoriteTopicsCard() {
  const topics = ["AI", "Gaming", "Elbil", "Gadgets", "Tester", "Guider"];
  
  return (
    <div className="bg-[#111115] rounded-xl border border-white/5 p-6 font-sans h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heart className="w-5 h-5 text-white" />
          <h3 className="text-[18px] font-bold text-white">Favoritttemaer</h3>
        </div>
        <button className="px-3 py-1.5 rounded-lg border border-white/10 text-[12px] font-medium text-white hover:bg-white/5 transition-colors">
          Rediger
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <span key={t} className={`px-4 py-1.5 rounded-full text-[13px] font-medium border ${t === "AI" ? "bg-[#ff6a00] border-[#ff6a00] text-white shadow-[0_0_15px_rgba(255,106,0,0.3)]" : "bg-white/5 border-white/10 text-white"}`}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}