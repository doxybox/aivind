import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const router = useRouter();
  const resetToken = typeof router.query.token === "string" ? router.query.token : "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        token: resetToken,
        newPassword,
      });

      if (resetError) {
        setError(resetError.message || "Failed to reset password");
        return;
      }

      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Ugyldig Referanse"
        subtitle="Denne sikkerhetslenken er mangelfull eller utløpt"
        footer={
          <Link href="/forgot-password" className="text-[#ff6a00] font-bold uppercase tracking-widest hover:text-[#ff8c33] transition-colors">
            Be om ny lenke
          </Link>
        }
      >
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-lg text-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <p className="text-[13px] text-red-500 font-mono leading-relaxed">
            Sikkerhetsnøkkelen du forsøkte å benytte er ugyldig. Vennligst initier ny gjenoppretting.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Ny Nøkkel"
      subtitle="Definer din nye sikkerhetsnøkkel"
    >
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono text-center">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[11px] text-[#888888] font-bold uppercase tracking-widest">Ny Nøkkel</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-12 h-14 bg-[#060608] border-white/10 text-white focus-visible:ring-[#ff6a00]/30 focus-visible:border-[#ff6a00]/50 placeholder-[#888888]/50 font-mono tracking-widest"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-[11px] text-[#888888] font-bold uppercase tracking-widest">Bekreft Nøkkel</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-12 h-14 bg-[#060608] border-white/10 text-white focus-visible:ring-[#ff6a00]/30 focus-visible:border-[#ff6a00]/50 placeholder-[#888888]/50 font-mono tracking-widest"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-14 bg-[#ff6a00] hover:bg-[#ff8c33] text-white font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255,106,0,0.3)] transition-all mt-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Oppdaterer...
            </>
          ) : (
            "Lagre Ny Nøkkel"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
