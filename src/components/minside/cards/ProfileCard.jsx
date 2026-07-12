import React, { useState, useEffect, useCallback } from "react";
import { getProfile, updateProfile } from "@/lib/account-client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, X } from "lucide-react";
import BasicProfileSection from "@/components/minside/profile/BasicProfileSection";
import AddressSection from "@/components/minside/profile/AddressSection";
import ConsentSection from "@/components/minside/profile/ConsentSection";
import AvatarSection from "@/components/minside/profile/AvatarSection";
import AccountStatusSection from "@/components/minside/profile/AccountStatusSection";

const EMPTY_FORM = {
  first_name: "", last_name: "", display_name: "", email: "",
  phone: "", address_line_1: "", address_line_2: "", postal_code: "",
  city: "", country: "Norge", preferred_language: "no",
  avatar_url: "", marketing_consent: false, newsletter_consent: false,
  terms_accepted_at: "", privacy_accepted_at: "",
};

export default function ProfileCard({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);

  const profileToForm = useCallback((p) => ({
    first_name: p.first_name || "",
    last_name: p.last_name || "",
    display_name: p.display_name || "",
    email: p.email || user?.email || "",
    phone: p.phone || "",
    address_line_1: p.address_line_1 || "",
    address_line_2: p.address_line_2 || "",
    postal_code: p.postal_code || "",
    city: p.city || "",
    country: p.country || "Norge",
    preferred_language: p.preferred_language || "no",
    avatar_url: p.avatar_url || "",
    marketing_consent: p.marketing_consent ?? false,
    newsletter_consent: p.newsletter_consent ?? false,
    terms_accepted_at: p.terms_accepted_at || "",
    privacy_accepted_at: p.privacy_accepted_at || "",
  }), [user]);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const p = await getProfile();
        if (!ignore) {
          setProfile(p);
          setForm(profileToForm(p));
        }
      } catch {
        if (!ignore) {
          const parts = (user?.name || user?.full_name || "").split(" ");
          const now = new Date().toISOString();
          setForm({
            ...EMPTY_FORM,
            first_name: parts[0] || "",
            last_name: parts.slice(1).join(" ") || "",
            display_name: user?.name || user?.full_name || "",
            email: user?.email || "",
            terms_accepted_at: now,
            privacy_accepted_at: now,
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    
    return () => { ignore = true; };
  }, [user, profileToForm]);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Fornavn kan ikke være tomt";
    if (!form.last_name.trim()) e.last_name = "Etternavn kan ikke være tomt";
    if (form.phone && !/^\+?[\d\s]{8,15}$/.test(form.phone.trim()))
      e.phone = "Ugyldig telefonnummer";
    if (form.country === "Norge" && form.postal_code && !/^\d{4}$/.test(form.postal_code))
      e.postal_code = "Postnummer må være 4 siffer";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast({ title: "Feil", description: "Vennligst rett feilene i skjemaet.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        display_name: form.display_name.trim() || undefined,
        email: form.email,
        phone: form.phone.trim() || undefined,
        address_line_1: form.address_line_1.trim() || undefined,
        address_line_2: form.address_line_2.trim() || undefined,
        postal_code: form.postal_code.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country || "Norge",
        preferred_language: form.preferred_language,
        avatar_url: form.avatar_url || undefined,
        marketing_consent: form.marketing_consent,
        newsletter_consent: form.newsletter_consent,
        terms_accepted_at: form.terms_accepted_at || now,
        privacy_accepted_at: form.privacy_accepted_at || now,
        email_verified: profile?.email_verified ?? true,
        phone_verified: profile?.phone_verified ?? false,
        auth_provider: profile?.auth_provider || "email",
      };
      const updated = await updateProfile(payload);
      setProfile(updated);
      setForm(profileToForm(updated));
      toast({ title: "Lagret", description: "Profilen din er oppdatert.", variant: "success" });
    } catch {
      toast({ title: "Feil", description: "Kunne ikke lagre endringene. Prøv igjen.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (profile) setForm(profileToForm(profile));
    setErrors({});
  };

  const handlePersistAvatar = async (avatar_url) => {
    const now = new Date().toISOString();
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      display_name: form.display_name.trim() || undefined,
      email: form.email,
      phone: form.phone.trim() || undefined,
      address_line_1: form.address_line_1.trim() || undefined,
      address_line_2: form.address_line_2.trim() || undefined,
      postal_code: form.postal_code.trim() || undefined,
      city: form.city.trim() || undefined,
      country: form.country || "Norge",
      preferred_language: form.preferred_language,
      avatar_url: avatar_url || undefined,
      marketing_consent: form.marketing_consent,
      newsletter_consent: form.newsletter_consent,
      terms_accepted_at: form.terms_accepted_at || now,
      privacy_accepted_at: form.privacy_accepted_at || now,
      email_verified: profile?.email_verified ?? true,
      phone_verified: profile?.phone_verified ?? false,
      auth_provider: profile?.auth_provider || "email",
    };
    const updated = await updateProfile(payload);
    setProfile(updated);
    setForm(profileToForm(updated));
  };

  if (loading) {
    return (
      <div className="bg-[#111115] rounded-xl border border-white/5 p-6 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-white/10 rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-white/5 rounded" /><div className="h-10 bg-white/5 rounded" />
          <div className="h-10 bg-white/5 rounded" /><div className="h-10 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-[28px] font-extrabold text-white tracking-tight">Rediger profil</h1>
        <p className="text-[14px] text-zinc-400 mt-1">Oppdater din personlige informasjon og kontodetaljer.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <BasicProfileSection form={form} update={update} errors={errors} user={user} profile={profile} />
          <AddressSection form={form} update={update} errors={errors} />
          <ConsentSection form={form} update={update} profile={profile} />
          <AccountStatusSection profile={profile} user={user} />
        </div>
        <div className="lg:col-span-4">
          <div className="flex flex-col gap-6">
            <AvatarSection form={form} update={update} profile={profile} onPersistAvatar={handlePersistAvatar} />
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[14px] font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
              >
                {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Lagrer...</> : <><Save className="w-5 h-5" /> Lagre endringer</>}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-transparent border border-white/10 rounded-xl text-[14px] font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-all disabled:opacity-60"
              >
                <X className="w-5 h-5" /> Forkast endringer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
