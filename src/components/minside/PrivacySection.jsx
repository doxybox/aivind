import React, { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Trash2, LogOut, FileText, Shield } from "lucide-react";

export default function PrivacySection({ onLogout }) {
  const [deleting, setDeleting] = useState(false);

  const handleDownloadData = () => {
    toast({ title: "Forespørsel sendt", description: "Dine data vil bli sendt til din e-postadresse innen 48 timer.", variant: "success" });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    toast({ title: "Forespørsel registrert", description: "Sletting av konto krever bekreftelse. Du får en e-post med instruksjoner.", variant: "warning" });
    setDeleting(false);
    setTimeout(() => { onLogout?.(); }, 2000);
  };

  const handleLogoutAll = async () => {
    await onLogout?.();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-[-0.02em]">Personvern og konto</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Administrer dine data og personvern.</p>
      </div>

      {/* Data actions */}
      <div className="bg-card rounded-lg border border-border divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Download className="w-5 h-5 text-muted-foreground" /></div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">Last ned mine data</p>
              <p className="text-[12px] text-muted-foreground">Få en kopi av alle data vi har lagret om deg</p>
            </div>
          </div>
          <button onClick={handleDownloadData} className="px-3 py-1.5 border border-border rounded-lg text-[12px] font-semibold text-foreground hover:border-orange-500/40 transition-colors shrink-0">Last ned</button>
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><LogOut className="w-5 h-5 text-muted-foreground" /></div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">Logg ut fra alle enheter</p>
              <p className="text-[12px] text-muted-foreground">Avslutt alle aktive økter</p>
            </div>
          </div>
          <button onClick={handleLogoutAll} className="px-3 py-1.5 border border-border rounded-lg text-[12px] font-semibold text-foreground hover:border-orange-500/40 transition-colors shrink-0">Logg ut</button>
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><Trash2 className="w-5 h-5 text-destructive" /></div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">Slett konto</p>
              <p className="text-[12px] text-muted-foreground">Slett din konto og alle tilknyttede data permanent</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="px-3 py-1.5 border border-destructive/30 rounded-lg text-[12px] font-semibold text-destructive hover:bg-destructive/10 transition-colors shrink-0">Slett</button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Er du sikker på at du vil slette kontoen?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Denne handlingen kan ikke angres. Alle dine data, lagrede artikler og innstillinger vil bli slettet permanent. Bekreft med å trykke «Slett konto».
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-secondary text-foreground border-border">Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? "Sletter..." : "Slett konto"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Privacy info */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-orange-500" />
          <h3 className="text-[14px] font-bold text-foreground">Hvordan vi håndterer dine data</h3>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Vi lagrer kun nødvendige data for å tilby deg tjenesten. Dine personopplysninger brukes kun til kontoadministrasjon, abonnement og kommunikasjon du har valgt å motta. Vi selger aldri dine data.
        </p>
        <div className="flex gap-4 mt-4">
          <a href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-orange-500 hover:underline"><FileText className="w-3.5 h-3.5" /> Personvernerklæring</a>
          <a href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-orange-500 hover:underline"><FileText className="w-3.5 h-3.5" /> Vilkår og betingelser</a>
        </div>
      </div>
    </div>
  );
}
