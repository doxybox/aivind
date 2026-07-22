import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_CONSENT_MANAGE_EVENT,
  defaultCookieConsent,
  readCookieConsent,
  saveCookieConsent,
} from "@/lib/cookie-consent";

export function useCookieConsent() {
  const [consent, setConsent] = useState(defaultCookieConsent);

  useEffect(() => {
    const sync = (event) => setConsent(event?.detail || readCookieConsent());
    sync();
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, sync);
  }, []);

  return consent;
}

export default function CookieConsentManager() {
  const consent = useCookieConsent();
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  useEffect(() => {
    const open = () => {
      const latest = readCookieConsent();
      setAdvertising(latest.advertising);
      setIsCustomizing(true);
      setIsOpen(true);
    };

    window.addEventListener(COOKIE_CONSENT_MANAGE_EVENT, open);
    return () => window.removeEventListener(COOKIE_CONSENT_MANAGE_EVENT, open);
  }, []);

  useEffect(() => {
    if (!consent.decided) {
      setAdvertising(false);
      setIsOpen(true);
    }
  }, [consent.decided]);

  const save = (nextAdvertising) => {
    saveCookieConsent({ advertising: nextAdvertising });
    setAdvertising(nextAdvertising);
    setIsOpen(false);
    setIsCustomizing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[400] p-3 sm:p-5" role="region" aria-label="Informasjonskapsler">
      <section className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-5 shadow-[0_-18px_60px_rgba(0,0,0,0.25)] sm:p-6">
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Ditt personvernvalg</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Vi bruker nødvendige informasjonskapsler for innlogging, sikkerhet og grunnleggende funksjoner. Google AdSense og annen annonseteknologi lastes bare etter at du har samtykket.
            </p>
            <Link href="/informasjonskapsler" className="mt-3 inline-flex text-sm font-semibold text-orange-500 hover:underline">
              Les cookie-erklæringen
            </Link>
          </div>

          {isCustomizing && (
            <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="font-semibold text-foreground">Nødvendige</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Brukes for sikkerhet, innlogging og lagring av dette valget. Alltid på.</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Alltid på</span>
              </div>
              <label className="flex cursor-pointer items-start justify-between gap-5 border-t border-border pt-3">
                <span>
                  <span className="block font-semibold text-foreground">Annonser og måling</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">Tillater Google AdSense. Ingen Google-annonser eller adblock-sjekk kjøres uten dette valget.</span>
                </span>
                <input
                  type="checkbox"
                  checked={advertising}
                  onChange={(event) => setAdvertising(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-orange-500"
                />
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => save(true)} className="min-h-11 rounded-md bg-orange-500 px-4 text-sm font-bold text-white transition-colors hover:bg-orange-600">
              Godta alle
            </button>
            <button type="button" onClick={() => save(false)} className="min-h-11 rounded-md border border-border bg-background px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted">
              Avvis alle
            </button>
            {isCustomizing ? (
              <button type="button" onClick={() => save(advertising)} className="min-h-11 rounded-md border border-border bg-background px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted">
                Lagre valg
              </button>
            ) : (
              <button type="button" onClick={() => setIsCustomizing(true)} className="min-h-11 rounded-md border border-border bg-background px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted">
                Tilpass valg
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
