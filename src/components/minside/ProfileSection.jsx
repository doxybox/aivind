import React, { useState, useEffect } from "react";
import { getProfile, updateProfile } from "@/lib/account-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Check, X, Loader2 } from "lucide-react";
import SectionSkeleton from "./SectionSkeleton";

export default function ProfileSection({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", display_name: "", phone: "", preferred_language: "no" });

  useEffect(() => {
    (async () => {
      try {
        const p = await getProfile();
        setProfile(p);
        setForm({
          first_name: p.first_name || "",
          last_name: p.last_name || "",
          display_name: p.display_name || "",
          phone: p.phone || "",
          preferred_language: p.preferred_language || "no",
        });
      } catch {
        const parts = (user.full_name || "").split(" ");
        setForm({
          first_name: parts[0] || "",
          last_name: parts.slice(1).join(" ") || "",
          display_name: user.full_name || "",
          phone: "",
          preferred_language: "no",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const validate = () => {
    if (!form.first_name.trim()) return "Fornavn kan ikke være tomt";
    if (!form.last_name.trim()) return "Etternavn kan ikke være tomt";
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast({ title: "Feil", description: error, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({ ...profile, ...form });
      setProfile(updated);
      toast({ title: "Lagret", description: "Profilen din er oppdatert.", variant: "success" });
    } catch (err) {
      toast({ title: "Feil", description: err.message || "Kunne ikke lagre profilen", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <SectionSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-[-0.02em]">Profil og brukerdata</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Oppdater dine personopplysninger.</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Fornavn *</Label>
            <Input id="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Etternavn *</Label>
            <Input id="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="h-11" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="display_name">Visningsnavn</Label>
          <Input id="display_name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-postadresse</Label>
          <Input id="email" type="email" value={user.email || ""} disabled className="h-11 opacity-60 cursor-not-allowed" />
          <p className="text-[11px] text-muted-foreground">E-post kan ikke endres direkte. Kontakt support for å endre.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefonnummer</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11" placeholder="Valgfritt" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Foretrukket språk</Label>
          <select
            id="language"
            value={form.preferred_language}
            onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
            className="w-full h-11 rounded-md border border-input bg-background px-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="no">Norsk</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
            {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Lagrer...</>) : (<><Check className="w-4 h-4 mr-2" /> Lagre</>)}
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="text-muted-foreground">
            <X className="w-4 h-4 mr-2" /> Avbryt
          </Button>
        </div>
      </div>
    </div>
  );
}
