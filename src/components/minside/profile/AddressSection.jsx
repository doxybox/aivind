import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from "lucide-react";

export default function AddressSection({ form, update, errors }) {
  const [invoiceSame, setInvoiceSame] = useState(true);

  return (
    <div className="bg-[#111115] rounded-xl border border-white/5 p-6">
      <div className="flex items-center gap-3 mb-2">
        <MapPin className="w-5 h-5 text-orange-500" />
        <h3 className="text-[18px] font-bold text-white">Adresse og fakturainfo</h3>
      </div>
      <p className="text-[13px] text-zinc-400 mb-6">
        Adresse er valgfritt for digitale abonnenter. Vi bruker adresse kun til faktura, fysisk levering, premier eller bedriftsabonnement.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p_addr1" className="text-[12px]">Adresse</Label>
          <Input
            id="p_addr1"
            value={form.address_line_1}
            onChange={(e) => update("address_line_1", e.target.value)}
            className="h-10"
            placeholder="Valgfritt"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p_addr2" className="text-[12px]">Adresse linje 2</Label>
          <Input
            id="p_addr2"
            value={form.address_line_2}
            onChange={(e) => update("address_line_2", e.target.value)}
            className="h-10"
            placeholder="Valgfritt"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p_postal" className="text-[12px]">Postnummer</Label>
          <Input
            id="p_postal"
            value={form.postal_code}
            onChange={(e) => update("postal_code", e.target.value)}
            className={`h-10 ${errors.postal_code ? "border-destructive" : ""}`}
            placeholder="Valgfritt"
          />
          {errors.postal_code && <p className="text-[11px] text-destructive">{errors.postal_code}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p_city" className="text-[12px]">Poststed</Label>
          <Input
            id="p_city"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className="h-10"
            placeholder="Valgfritt"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p_country" className="text-[12px]">Land</Label>
          <Input
            id="p_country"
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5">
        <Checkbox
          id="p_invoice_same"
          checked={invoiceSame}
          onCheckedChange={setInvoiceSame}
          className="mt-0.5 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
        />
        <div>
          <Label htmlFor="p_invoice_same" className="text-[12px] cursor-pointer">Fakturaadresse er samme som min adresse</Label>
          {!invoiceSame && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Ved separat fakturaadresse, kontakt kundeservice for registrering.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}