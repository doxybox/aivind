import React, { useState, useEffect } from "react";
import { getPaymentHistory } from "@/lib/account-client";
import { Download, Receipt } from "lucide-react";
import SectionSkeleton from "./SectionSkeleton";

export default function PaymentSection() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPaymentHistory();
        setPayments(data.payments || []);
      } catch (e) {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <SectionSkeleton />;

  const statusBadge = (status) => {
    const map = {
      paid: "bg-green-500/10 text-green-500",
      pending: "bg-yellow-500/10 text-yellow-500",
      failed: "bg-destructive/10 text-destructive",
      refunded: "bg-blue-500/10 text-blue-500",
    };
    const label = { paid: "Betalt", pending: "Venter", failed: "Feilet", refunded: "Refundert" };
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[status] || map.pending}`}>{label[status] || status}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-[-0.02em]">Faktura og betaling</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Se dine betalinger og fakturaer.</p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-card rounded-lg border border-border border-dashed p-10 text-center">
          <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-muted-foreground">Ingen betalinger ennå</p>
          <p className="text-[12px] text-muted-foreground/70 mt-1">Når du gjennomfører et abonnement, vil fakturaer vises her.</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-[13px] min-w-[500px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Dato</th>
                <th className="px-4 py-3 font-medium">Beskrivelse</th>
                <th className="px-4 py-3 font-medium">Beløp</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Metode</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{p.date ? new Date(p.date).toLocaleDateString("nb-NO") : "—"}</td>
                  <td className="px-4 py-3 text-foreground">{p.description || "—"}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{p.amount} kr</td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.payment_method || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {p.invoice_url && <a href={p.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-orange-500 hover:underline text-[12px]"><Download className="w-3.5 h-3.5" /> Kvittering</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
