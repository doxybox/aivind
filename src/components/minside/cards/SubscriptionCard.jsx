import React, { useEffect, useState } from "react";
import { getSubscription } from "@/lib/account-client";
import { getAccountPlanLabel } from "@/lib/account-display";
import { CreditCard, FileText } from "lucide-react";
import UpgradeModal from "@/components/minside/UpgradeModal";

export default function SubscriptionCard({ upgradeOpen = false, onCloseUpgrade = () => {} }) {
  const [sub, setSub] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [modalOpen, setModalOpen] = useState(Boolean(upgradeOpen));

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const data = await getSubscription();
        if (!ignore) {
          setSub(data.subscription);
          setLoadFailed(false);
        }
      } catch {
        if (!ignore) {
          setSub(null);
          setLoadFailed(true);
        }
      }
    })();

    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (upgradeOpen) setModalOpen(true);
  }, [upgradeOpen]);

  const closeModal = () => {
    setModalOpen(false);
    onCloseUpgrade();
  };

  const planLabel = getAccountPlanLabel({
    subscription: sub,
    loadFailed,
  });
  const planSlug = sub?.plan_type || "free";
  const billingInterval = sub?.billing_period || "monthly";
  const isActive = ["active", "trialing"].includes(sub?.status);
  const priceLabel = sub?.price > 0
    ? `${sub.price} kr / ${sub.billing_period === "yearly" ? "år" : "mnd"}`
    : "Ingen betaling";
  const nextPayment = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })
    : "-";
  const paymentMethod = sub?.payment_method || "Ikke registrert";

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
    } catch {
      setModalOpen(true);
    }
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-h-[600px] flex flex-col lg:flex-row gap-12">
      
      <div className="flex-1 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-orange-400" />
          </div>
          <h2 className="text-[24px] font-bold text-white">Abonnement</h2>
        </div>

        <div className="p-6 rounded-2xl bg-black/20 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div>
              <h3 className="text-[24px] font-bold text-white mb-1">{planLabel}</h3>
              <p className="text-[14px] text-zinc-400">{priceLabel}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-bold rounded-full uppercase tracking-wider">{isActive ? "Aktiv" : "Ikke aktiv"}</span>
          </div>
          <div className="pt-4 border-t border-white/10 mt-4 relative z-10">
            <p className="text-[13px] text-zinc-400">Neste betaling: <span className="text-white font-medium">{loadFailed ? "Kunne ikke hente abonnement" : nextPayment}</span></p>
            <p className="text-[13px] text-zinc-400 mt-1">Betalingsmetode: <span className="text-white font-medium">{paymentMethod}</span></p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={openBillingPortal}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)]"
          >
            Administrer abonnement
          </button>
          <button type="button" onClick={openBillingPortal} className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all">
            Endre betalingsmetode
          </button>
        </div>
      </div>

      <div className="w-full lg:w-[400px] space-y-6">
        <h3 className="text-[18px] font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-zinc-400" /> Fakturaoversikt
        </h3>
        
        <div className="rounded-xl bg-black/20 border border-white/5 p-5">
          <p className="text-[13px] text-zinc-400 leading-relaxed">
            Fakturaer vises her når betalingssystemet har registrert faktiske betalinger.
          </p>
        </div>
      </div>

      <UpgradeModal
        open={modalOpen}
        onClose={closeModal}
        currentPlanSlug={planSlug}
        billingInterval={billingInterval}
      />
    </div>
  );
}
