import React, { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function VippsCheckout({ plan, interval, onBack }) {
  const [loading, setLoading] = useState(false);
  const price = interval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const billingPeriod = interval === "yearly" ? "ar" : "maned";
  const planKey = interval === "yearly" ? plan.yearlyPlanKey || plan.planKey : plan.planKey;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey,
          returnUrl: "/abonnement/status",
          cancelUrl: "/min-side?payment=cancelled",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Betaling er ikke aktivert enna.");
      }

      const checkoutUrl = data.checkoutUrl || data.vippsConfirmationUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      toast({
        title: "Checkout opprettet",
        description: "Abonnementet er opprettet som ventende og venter på betalingsbekreftelse.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Betaling er ikke aktivert enna",
        description: error.message,
        variant: "warning",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        disabled={loading}
        className="inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" />
        Tilbake
      </button>

      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        <div>
          <h3 className="text-[16px] font-bold text-foreground mb-1">{plan.name}</h3>
          <p className="text-[13px] text-muted-foreground">{plan.description}</p>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[13px] text-muted-foreground">Pris</span>
            <span className="text-[24px] font-bold text-foreground">{price} kr</span>
          </div>
          <p className="text-[11px] text-muted-foreground">per {billingPeriod}</p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-[12px] text-muted-foreground mb-4">
            Betaling er parkert til valgt leverandor er ferdig konfigurert. Premiumtilgang gis forst etter bekreftet betalingsstatus.
          </p>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-[13px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Sjekker..." : "Sjekk betaling"}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/70 text-center">
        Premiumtilgang gis ikke fra redirect alene, kun etter bekreftet betaling.
      </p>
    </div>
  );
}
