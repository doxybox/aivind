import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060608] px-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#ff6a00] mb-6 shadow-[0_0_30px_rgba(255,106,0,0.3)] border border-[#ff6a00]/50">
            <Icon className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-white mb-2">{title}</h1>
          {subtitle && <p className="text-[#888888] font-mono tracking-tight">{subtitle}</p>}
        </div>
        <div className="bg-[#111115] rounded-xl shadow-2xl border border-white/10 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff6a00] to-transparent opacity-50" />
          {children}
        </div>
        {footer && (
          <div className="text-center mt-8 font-mono tracking-tight text-[13px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}