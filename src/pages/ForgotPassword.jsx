import React, { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Gjenopprett Nøkkel"
      subtitle="Vi sender en instruks for gjenoppretting"
      footer={
        <Link href="/login" className="text-[#ff6a00] font-bold uppercase tracking-widest hover:text-[#ff8c33] transition-colors flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 inline mr-2" />Tilbake til Systemtilgang
        </Link>
      }
    >
      {sent ? (
        <div className="bg-[#00ff88]/10 border border-[#00ff88]/20 p-6 rounded-lg text-center shadow-[0_0_15px_rgba(0,255,136,0.1)]">
          <p className="text-[13px] text-[#00ff88] font-mono leading-relaxed">
            Dersom identifikatoren finnes i våre systemer, vil en sikkerhetsoverføring initieres snarlig.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[11px] text-[#888888] font-bold uppercase tracking-widest">Identifikator</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="bruker@system.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 bg-[#060608] border-white/10 text-white focus-visible:ring-[#ff6a00]/30 focus-visible:border-[#ff6a00]/50 placeholder-[#888888]/50 font-mono"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-14 bg-[#ff6a00] hover:bg-[#ff8c33] text-white font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255,106,0,0.3)] transition-all" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Sender protokoll...
              </>
            ) : (
              "Initier Gjenoppretting"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
