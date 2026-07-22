import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { getSubscriptionPlans } from "@/lib/account-client";
import VippsCheckout from "@/components/minside/VippsCheckout";

export default function UpgradeModal({ open, onClose, currentPlanSlug, billingInterval, onSelect }) {
  const [interval, setIntervalState] = useState(billingInterval || "monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    if (billingInterval) setIntervalState(billingInterval);
  }, [billingInterval]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let ignore = false;
    setPlansLoading(true);
    setPlansError("");

    getSubscriptionPlans()
      .then((data) => {
        if (!ignore) setPlans(Array.isArray(data?.plans) ? data.plans : []);
      })
      .catch(() => {
        if (!ignore) {
          setPlans([]);
          setPlansError("Kunne ikke hente abonnementsplanene akkurat na.");
        }
      })
      .finally(() => {
        if (!ignore) setPlansLoading(false);
      });

    return () => { ignore = true; };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const handleSelect = (plan) => {
    const isCurrent = [plan.planKey, plan.monthlyPlanKey, plan.yearlyPlanKey].includes(currentPlanSlug);
    if (isCurrent || plan.slug === "free" || plan.checkoutMode === "unavailable") return;
    if (plan.checkoutMode === "contact") {
      window.location.href = `mailto:salg@tekkno.no?subject=${encodeURIComponent(`Foresporsel om ${plan.name}`)}`;
      return;
    }
    if (typeof onSelect === "function") {
      onSelect(plan, interval);
      return;
    }
    setSelectedPlan(plan);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-6 lg:py-28"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-6xl max-h-[calc(100vh-3rem)] lg:max-h-[calc(100vh-14rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0d12] shadow-[0_30px_90px_rgba(0,0,0,0.65)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0d12]/95 p-6 pb-4 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.02em] text-white">
                Oppgrader abonnement
              </h2>
              <p className="mt-1 text-[13px] text-zinc-400">
                Velg abonnementet som passer deg best.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Lukk"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="relative inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
              <span
                className={`absolute bottom-1 left-1 top-1 w-24 rounded-lg bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.35)] transition-transform duration-300 ease-out ${
                  interval === "yearly" ? "translate-x-24" : "translate-x-0"
                }`}
              />
              <button
                onClick={() => setIntervalState("monthly")}
                className={`relative z-10 w-24 rounded-lg py-1.5 text-[13px] font-semibold transition-colors duration-300 ${
                  interval === "monthly" ? "text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Månedlig
              </button>
              <button
                onClick={() => setIntervalState("yearly")}
                className={`relative z-10 w-24 rounded-lg py-1.5 text-[13px] font-semibold transition-colors duration-300 ${
                  interval === "yearly" ? "text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Årlig
              </button>
            </div>
            {interval === "yearly" && (
              <span className="ml-1 text-[11px] font-semibold text-orange-500 animate-fade-in">
                Spar opptil 2 måneder
              </span>
            )}
          </div>
        </div>

        <div className="p-6 pt-6">
          {selectedPlan ? (
            <VippsCheckout
              plan={selectedPlan}
              interval={interval}
              onBack={() => setSelectedPlan(null)}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                  const isCurrent = [plan.planKey, plan.monthlyPlanKey, plan.yearlyPlanKey].includes(currentPlanSlug);
                  const isBedrift = plan.slug === "bedrift";
                  const price = interval === "yearly"
                    ? plan.yearlyPrice || plan.monthlyPrice
                    : plan.monthlyPrice || plan.yearlyPrice;
                  const canSelect = !isCurrent && plan.slug !== "free" && plan.checkoutMode !== "unavailable";

                  return (
                    <div
                      key={plan.slug}
                      className={`relative flex flex-col rounded-xl border p-5 ${
                        plan.isPopular
                          ? "border-orange-500/50 bg-orange-500/[0.08] shadow-[0_0_30px_rgba(249,115,22,0.08)]"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      {plan.isPopular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-3 py-0.5 text-[11px] font-bold text-white">
                          Mest populær
                        </span>
                      )}
                      {isCurrent && (
                        <span className="absolute -top-3 right-3 whitespace-nowrap rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300">
                          Din plan
                        </span>
                      )}

                      <h3 className="text-base font-bold text-white">{plan.name}</h3>
                      <p className="mt-0.5 text-[12px] text-zinc-400">{plan.description}</p>

                      <div className="mb-4 mt-3 transition-all duration-300">
                        {isBedrift ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-[13px] text-zinc-400">Fra</span>
                            <span className="text-2xl font-extrabold text-white transition-all duration-300">
                              {price}
                            </span>
                            <span className="text-[13px] text-zinc-400">kr / mnd</span>
                          </div>
                        ) : price === 0 ? (
                          <span className="text-2xl font-extrabold text-white">0 kr</span>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-extrabold text-white transition-all duration-300">
                              {price}
                            </span>
                            <span className="text-[13px] text-zinc-400 transition-all duration-300">
                              kr / {interval === "monthly" ? "mnd" : "år"}
                            </span>
                          </div>
                        )}
                      </div>

                      <ul className="mb-5 flex-1 space-y-2">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2 text-[12px] text-zinc-300"
                          >
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button
                        disabled={!canSelect}
                        onClick={() => handleSelect(plan)}
                        className={`w-full rounded-lg py-2.5 text-[13px] font-semibold transition-all duration-300 ${
                          !canSelect
                            ? "cursor-not-allowed bg-white/10 text-zinc-400"
                            : plan.isPopular
                              ? "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-[0_0_24px_rgba(249,115,22,0.45)]"
                              : "border border-white/10 text-white hover:border-orange-500/60 hover:bg-orange-500 hover:shadow-[0_0_24px_rgba(249,115,22,0.35)]"
                        }`}
                      >
                        {isCurrent ? "Nåværende plan" : plan.checkoutMode === "unavailable" ? "Ikke tilgjengelig" : plan.ctaText}
                      </button>
                    </div>
                  );
                })}
              </div>

              {plansLoading && (
                <p className="py-8 text-center text-sm text-zinc-400">Henter abonnementsplaner...</p>
              )}
              {!plansLoading && plansError && (
                <p className="py-8 text-center text-sm text-rose-300">{plansError}</p>
              )}
              {!plansLoading && !plansError && plans.length === 0 && (
                <p className="py-8 text-center text-sm text-zinc-400">Ingen abonnementsplaner er publisert ennå.</p>
              )}

              <p className="mt-5 text-center text-[11px] text-zinc-500">
                Abonnement oppdateres først etter bekreftet betalingsstatus.
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
