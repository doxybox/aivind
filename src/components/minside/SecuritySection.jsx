import React from "react";
import Link from "next/link";
import { Shield, KeyRound, Lock } from "lucide-react";

export default function SecuritySection({ user }) {
  const loginMethod = user.email ? "E-post og passord" : "Ukjent";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-[-0.02em]">Sikkerhet</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Administrer din kontosikkerhet.</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"><Shield className="w-5 h-5 text-orange-500" /></div>
          <div>
            <p className="text-[12px] text-muted-foreground">Innloggingsmetode</p>
            <p className="text-[14px] font-semibold text-foreground">{loginMethod}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><KeyRound className="w-5 h-5 text-muted-foreground" /></div>
          <div className="flex-1">
            <p className="text-[12px] text-muted-foreground">Passord</p>
            <p className="text-[14px] font-semibold text-foreground">Endre passord</p>
          </div>
          <Link href="/forgot-password" className="px-3 py-1.5 border border-border rounded-lg text-[12px] font-semibold text-foreground hover:border-orange-500/40 transition-colors">Endre</Link>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Lock className="w-5 h-5 text-muted-foreground" /></div>
          <div className="flex-1">
            <p className="text-[12px] text-muted-foreground">Glemt passord?</p>
            <p className="text-[14px] font-semibold text-foreground">Tilbakestill passord</p>
          </div>
          <Link href="/forgot-password" className="px-3 py-1.5 border border-border rounded-lg text-[12px] font-semibold text-foreground hover:border-orange-500/40 transition-colors">Tilbakestill</Link>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <p className="text-[12px] text-muted-foreground">Konto opprettet: {user.created_date ? new Date(user.created_date).toLocaleDateString("nb-NO") : "Ukjent"}</p>
      </div>
    </div>
  );
}
