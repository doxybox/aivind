import React from "react";

export default function AdSlot({ fallbackLabel }) {
  const label = fallbackLabel || "Annonseplass";

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="bg-card border border-border rounded-lg border-dashed flex items-center justify-center py-6 px-4">
        <div className="flex items-center gap-3 text-center">
          <div className="w-9 h-9 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-muted-foreground">{label}</p>
            <p className="text-[11px] text-muted-foreground/70">Ledig plass - konfigurer via Payload admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
