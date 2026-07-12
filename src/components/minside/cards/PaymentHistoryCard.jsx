import React, { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { getSubscription } from "@/lib/account-client";
import { formatAccountDate, isActivePaidSubscription } from "@/lib/account-display";

export default function PaymentHistoryCard() {
  const [sub, setSub] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

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

    return () => {
      ignore = true;
    };
  }, []);

  const hasPaidSubscription = isActivePaidSubscription(sub);
  const nextPayment = sub?.current_period_end ? formatAccountDate(sub.current_period_end) : "";
  const priceLabel = sub?.price > 0 ? `${sub.price} kr` : "Ingen betaling";

  return (
    <div className="bg-[#111115] rounded-xl border border-white/5 p-6 font-sans h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-white" />
          <h3 className="text-[18px] font-bold text-white">Betaling</h3>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-medium text-white">{loadFailed ? "Kunne ikke hente betalingsstatus" : hasPaidSubscription ? "Aktivt abonnement" : "Ingen betalingsmetode registrert"}</span>
          </div>
          <p className="text-[12px] text-[#888888]">
            {loadFailed ? "Prøv igjen senere" : nextPayment ? `Neste trekk: ${nextPayment}` : "Ingen kommende betaling"}
          </p>
        </div>
        <div className="text-[14px] font-bold text-white">{loadFailed ? "-" : priceLabel}</div>
      </div>

      <div className="rounded-xl border border-white/5 bg-black/20 p-5">
        <h4 className="text-[14px] font-semibold text-white mb-2">Siste fakturaer</h4>
        <p className="text-[13px] text-[#888888]">
          Fakturaer vises her når betalingssystemet har registrert faktiske betalinger.
        </p>
      </div>
    </div>
  );
}
