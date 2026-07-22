import React, { useState, useEffect } from "react";
import { getSubscription } from "@/lib/account-client";
import { toast } from "@/components/ui/use-toast";
import { CreditCard, ArrowUpCircle, XCircle, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import SectionSkeleton from "./SectionSkeleton";
import UpgradeModal from "./UpgradeModal";

export default function SubscriptionSection({ paymentStatus, upgradeOpen, onCloseUpgrade }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSubscription();
        setSub(data.subscription);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (upgradeOpen) setModalOpen(true);
  }, [upgradeOpen]);

  useEffect(() => {
    if (paymentStatus === "success") {
      toast({
        title: "Betaling fullført",
        description: "Betalingen ble fullført. Abonnementet ditt oppdateres nå.",
        variant: "success",
      });
    } else if (paymentStatus === "cancelled") {
      toast({
        title: "Betaling avbrutt",
        description: "Betalingen ble avbrutt. Ingen endringer ble gjort.",
        variant: "warning",
      });
    }
  }, [paymentStatus]);

  const planSlug = sub?.plan_type || "free";
  const planLabel = sub?.plan_name || (planSlug === "free" ? "Gratis" : planSlug);
  const isFree = !sub || sub.status === "free" || sub.plan_type === "free";
  const isCancelled = ["cancelled", "canceled"].includes(sub?.status) && !isFree;
  const isActive = ["active", "trialing"].includes(sub?.status) && !isFree;
  const billingInterval = sub?.billing_period || "monthly";

  const handleCheckout = async (plan, _interval) => {
    if (plan.isContactRequired) {
      toast({
        title: "Kontakt oss",
        description: "For bedriftsabonnement, kontakt salg@tekkno.no for skreddersydd tilbud.",
        variant: "info",
      });
      setModalOpen(false);
      onCloseUpgrade?.();
      return;
    }
    const planKey = _interval === "yearly" ? plan.yearlyPlanKey || plan.planKey : plan.monthlyPlanKey || plan.planKey;
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, returnUrl: "/abonnement/status", cancelUrl: "/min-side?payment=cancelled" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Kunne ikke starte betaling.");
      if (data.checkoutUrl) return window.location.assign(data.checkoutUrl);
      throw new Error("Betalingsleverandoren returnerte ingen checkout-lenke.");
    } catch (error) {
      toast({ title: "Kunne ikke starte betaling", description: error.message, variant: "warning" });
    }
  };

  const openBillingPortal = async () => {
    if (sub?.provider !== "stripe") {
      setModalOpen(true);
      return;
    }

    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || "Kunne ikke åpne betalingsportalen.");
      window.location.assign(data.url);
    } catch (error) {
      toast({ title: "Kunne ikke åpne betalingsportalen", description: error.message, variant: "warning" });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    onCloseUpgrade?.();
  };

  if (loading) return <SectionSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-[-0.02em]">Abonnement</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Administrer ditt abonnement.</p>
      </div>

      {/* Status message banner */}
      {paymentStatus === "success" && (
        <div className="flex items-start gap-3 rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
          <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-foreground">
            Betalingen ble fullført. Abonnementet ditt oppdateres nå.
          </p>
        </div>
      )}
      {paymentStatus === "cancelled" && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-foreground">
            Betalingen ble avbrutt. Ingen endringer ble gjort.
          </p>
        </div>
      )}
      {isActive && !isCancelled && (
        <div className="flex items-start gap-3 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
          <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-foreground">Abonnementet ditt er aktivt.</p>
        </div>
      )}
      {isCancelled && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-foreground">
            Abonnementet ditt er kansellert, men aktivt frem til{" "}
            {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("nb-NO") : "periodens slutt"}.
          </p>
        </div>
      )}
      {isFree && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
          <CheckCircle2 className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[13px] text-foreground">Du bruker gratisversjonen.</p>
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[12px] text-muted-foreground uppercase tracking-wide">Nåværende plan</p>
            <p className="text-xl font-bold text-foreground mt-1">{planLabel}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[12px] font-semibold ${
              isActive
                ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                : isCancelled
                ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {isFree ? "Gratis" : isCancelled ? "Kansellert" : isActive ? "Aktiv" : sub?.status === "expired" ? "Utløpt" : "Gratis"}
          </span>
        </div>

        {sub && !isFree ? (
          <dl className="space-y-2 text-[13px] border-t border-border pt-4">
            {sub.current_period_start && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Startdato</dt>
                <dd className="text-foreground font-medium">
                  {new Date(sub.current_period_start).toLocaleDateString("nb-NO")}
                </dd>
              </div>
            )}
            {sub.current_period_end && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Neste fornyelse</dt>
                <dd className="text-foreground font-medium">
                  {new Date(sub.current_period_end).toLocaleDateString("nb-NO")}
                </dd>
              </div>
            )}
            {sub.price > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pris</dt>
                <dd className="text-foreground font-medium">
                  {sub.price} kr / {sub.billing_period === "monthly" ? "måned" : "år"}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Faktureringsperiode</dt>
              <dd className="text-foreground font-medium">
                {sub.billing_period === "monthly" ? "Månedlig" : "Årlig"}
              </dd>
            </div>
            {sub.payment_method && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Betalingsmetode</dt>
                <dd className="text-foreground font-medium">{sub.payment_method}</dd>
              </div>
            )}
            {sub.cancel_at_period_end && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Avsluttes</dt>
                <dd className="text-yellow-500 font-medium">Ved periodens slutt</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-[13px] text-muted-foreground border-t border-border pt-4">
            Du bruker gratisversjonen. Oppgrader til Pluss eller Premium for tilgang til plussaker,
            annonsefri opplevelse og mer.
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[13px] font-semibold transition-colors"
        >
          <ArrowUpCircle className="w-4 h-4" /> Oppgrader abonnement
        </button>
        {!isFree && !isCancelled && (
          <button
            onClick={openBillingPortal}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-[13px] font-semibold text-foreground hover:border-orange-500/40 transition-colors"
          >
            <CreditCard className="w-4 h-4" /> Endre abonnement
          </button>
        )}
        {!isFree && !isCancelled && (
          <button
            onClick={openBillingPortal}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-[13px] font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <XCircle className="w-4 h-4" /> Kanseller abonnement
          </button>
        )}
        {isCancelled && (
          <button
            onClick={openBillingPortal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[13px] font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Gjenoppta abonnement
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/70">
        Abonnementsendringer går alltid via sikker betalingsflyt og kan ikke endres direkte fra frontend.
      </p>

      {/* Upgrade modal */}
      <UpgradeModal
        open={modalOpen}
        onClose={closeModal}
        currentPlanSlug={planSlug}
        billingInterval={billingInterval}
        onSelect={handleCheckout}
      />
    </div>
  );
}
