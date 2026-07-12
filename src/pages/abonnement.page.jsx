import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { getActiveBillingPlans } from "@/lib/billing-plans";
import { getBillingCheckoutStatus } from "@/lib/server/billing/billing-core";

export default function AbonnementPage({ plans, checkoutStatus }) {
  const [busyPlan, setBusyPlan] = useState("");
  const [message, setMessage] = useState(checkoutStatus?.enabled ? "" : checkoutStatus?.message || "");
  const checkoutEnabled = checkoutStatus?.enabled === true;
  const disabledBillingMessage = checkoutStatus?.message || "Betaling er ikke aktivert i dette miljøet.";

  async function startCheckout(planKey) {
    if (!checkoutEnabled) {
      setMessage(disabledBillingMessage);
      return;
    }

    setBusyPlan(planKey);
    setMessage("");
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
      if (!response.ok) throw new Error(data.error || "Checkout er ikke tilgjengelig ennå.");
      const checkoutUrl = data.checkoutUrl || data.vippsConfirmationUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      setMessage("Checkout er opprettet, men betalingsleverandør er ikke aktivert ennå.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyPlan("");
    }
  }

  return (
    <main className="min-h-screen bg-[#11161d] px-6 py-10 text-white">
      <Head>
        <title>Abonnement | AIVIND</title>
        <meta name="description" content="Velg abonnement for AIVIND." />
      </Head>

      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-bold text-orange-400 hover:text-orange-300">
          Til forsiden
        </Link>

        <header className="mt-8 border-b border-white/10 pb-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">Abonnement</p>
          <h1 className="mt-2 text-3xl font-black">Velg tilgang</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            {checkoutEnabled
              ? "Velg abonnementet som passer deg best."
              : "Betaling er parkert i dette miljøet. Planene kan vurderes, men checkout kan ikke startes her."}
          </p>
        </header>

        {message && (
          <div className="mt-6 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-100">
            {message}
          </div>
        )}

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {plans.filter((plan) => plan.planKey !== "free").map((plan) => (
            <article key={plan.planKey} className="rounded-2xl border border-white/10 bg-[#0b1016] p-6">
              <h2 className="text-xl font-black">{plan.displayName}</h2>
              <p className="mt-1 text-sm text-zinc-400">{plan.description}</p>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="pb-1 text-sm text-zinc-400">
                  {plan.currency} / {plan.interval === "yearly" ? "år" : "mnd"}
                </span>
              </div>
              <ul className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => startCheckout(plan.planKey)}
                disabled={Boolean(busyPlan) || !checkoutEnabled}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                {busyPlan === plan.planKey && <Loader2 className="h-4 w-4 animate-spin" />}
                {checkoutEnabled ? "Start checkout" : "Betaling ikke aktivert"}
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

export function getServerSideProps() {
  return {
    props: {
      plans: getActiveBillingPlans(),
      checkoutStatus: getBillingCheckoutStatus(),
    },
  };
}
