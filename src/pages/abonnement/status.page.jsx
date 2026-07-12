import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function AbonnementStatusPage() {
  const [state, setState] = useState({
    loading: true,
    status: "",
    message: "Sjekker betalingsstatus...",
  });

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      try {
        const response = await fetch("/api/billing/subscription/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Kunne ikke hente betalingsstatus.");

        if (!active) return;
        if (data.status === "active") {
          setState({
            loading: false,
            status: "active",
            message: "Abonnementet er aktivt. Premiumtilgang er oppdatert.",
          });
          return;
        }

        setState({
          loading: false,
          status: data.status || "pending",
          message: "Betalingen er ikke bekreftet ennå. Prøv igjen om litt.",
        });
      } catch (error) {
        if (!active) return;
        setState({
          loading: false,
          status: "error",
          message: error.message,
        });
      }
    }

    checkStatus();
    return () => {
      active = false;
    };
  }, []);

  const isActive = state.status === "active";
  const isError = state.status === "error";

  return (
    <main className="min-h-screen bg-[#11161d] px-6 py-10 text-white">
      <Head>
        <title>Betalingsstatus | AIVIND</title>
        <meta name="description" content="Sjekker betalingsstatus for abonnement." />
      </Head>

      <section className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-2xl border border-white/10 bg-[#0b1016] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 text-orange-400">
            {state.loading && <Loader2 className="h-7 w-7 animate-spin" />}
            {isActive && <CheckCircle2 className="h-7 w-7" />}
            {isError && <XCircle className="h-7 w-7" />}
            {!state.loading && !isActive && !isError && <Loader2 className="h-7 w-7" />}
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-orange-500">
            Abonnement
          </p>
          <h1 className="mt-2 text-2xl font-black">Betalingsstatus</h1>
          <p className="mt-3 text-sm text-zinc-300">{state.message}</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600"
            >
              Sjekk igjen
            </button>
            <Link
              href="/min-side"
              className="rounded-lg border border-white/10 px-5 py-3 text-sm font-black text-zinc-200 transition hover:border-orange-500/60 hover:text-white"
            >
              Gå til min side
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
