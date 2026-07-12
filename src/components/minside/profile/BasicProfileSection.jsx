import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadgeCheck, AlertCircle, Phone } from "lucide-react";

export default function BasicProfileSection({ form, update, errors, user, profile }) {
  const emailVerified = profile?.email_verified ?? true;
  const phoneVerified = profile?.phone_verified ?? false;

  return (
    <div className="bg-[#111115] rounded-xl border border-white/5 p-6">
      <h3 className="text-[18px] font-bold text-white mb-1">Grunnleggende profil</h3>
      <p className="text-[13px] text-zinc-400 mb-6">Dine grunnleggende kontodetaljer.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="p_first" className="text-[12px]">Fornavn *</Label>
          <Input
            id="p_first"
            value={form.first_name}
            onChange={(e) => update("first_name", e.target.value)}
            className={`h-10 ${errors.first_name ? "border-destructive" : ""}`}
          />
          {errors.first_name && <p className="text-[11px] text-destructive">{errors.first_name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p_last" className="text-[12px]">Etternavn *</Label>
          <Input
            id="p_last"
            value={form.last_name}
            onChange={(e) => update("last_name", e.target.value)}
            className={`h-10 ${errors.last_name ? "border-destructive" : ""}`}
          />
          {errors.last_name && <p className="text-[11px] text-destructive">{errors.last_name}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p_display" className="text-[12px]">Visningsnavn</Label>
          <Input
            id="p_display"
            value={form.display_name}
            onChange={(e) => update("display_name", e.target.value)}
            className="h-10"
            placeholder="Valgfritt"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="p_email" className="text-[12px]">E-postadresse</Label>
            {emailVerified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-500">
                <BadgeCheck className="w-3.5 h-3.5" /> Verifisert
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-500">
                <AlertCircle className="w-3.5 h-3.5" /> Ikke verifisert
              </span>
            )}
          </div>
          <Input
            id="p_email"
            type="email"
            value={form.email || user?.email || ""}
            disabled
            className="h-10 opacity-60 cursor-not-allowed"
          />
          <p className="text-[11px] text-muted-foreground">Kontakt support for å endre e-postadresse.</p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="p_phone" className="text-[12px]">Telefonnummer</Label>
            {form.phone && phoneVerified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-500">
                <BadgeCheck className="w-3.5 h-3.5" /> Verifisert
              </span>
            )}
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              id="p_phone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={`h-10 pl-8 ${errors.phone ? "border-destructive" : ""}`}
              placeholder="Valgfritt"
            />
          </div>
          {errors.phone && <p className="text-[11px] text-destructive">{errors.phone}</p>}
          <p className="text-[11px] text-muted-foreground">Brukes kun til konto, support eller betalingsrelatert kommunikasjon.</p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-[12px]">Foretrukket språk</Label>
          <Select value={form.preferred_language} onValueChange={(v) => update("preferred_language", v)}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no">Norsk</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}