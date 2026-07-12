import React, { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, LogOut } from "lucide-react";

export default function TwoFactorStep({ email, onCancel }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const handleChange = (idx, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    setError("");
    if (digit && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
    if (e.key === "Enter") handleSubmit();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const next = pasted.split("");
      while (next.length < 6) next.push("");
      setCode(next);
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("2FA er ikke koblet til Better Auth enna. Logg inn uten denne Base44-flyten.");
    setLoading(false);
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.15)]">
          <ShieldCheck className="w-8 h-8 text-[#00ff88]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">Sikkerhetsklarering</h2>
          <p className="text-[13px] text-[#888888] font-mono tracking-tight mt-2">
            Tofaktor er ikke aktivert i Better Auth enna.
          </p>
          <p className="text-[11px] text-[#ff6a00] font-mono mt-1">{email}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono text-center">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {code.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (refs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            disabled={loading}
            className="w-12 h-14 text-center text-2xl font-bold font-mono bg-[#060608] border border-white/10 rounded-lg text-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#ff6a00] focus:border-[#ff6a00] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 h-14 bg-[#ff6a00] hover:bg-[#ff8c33] text-white rounded-lg text-[13px] font-bold uppercase tracking-widest transition-all disabled:opacity-60 shadow-[0_0_15px_rgba(255,106,0,0.3)] hover:shadow-[0_0_25px_rgba(255,106,0,0.5)]"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> ...</>
          ) : (
            "Bekreft"
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 h-14 border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-lg text-[13px] font-bold text-white transition-all uppercase tracking-widest"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
