import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useCookieConsent } from "@/components/aivind/ConsentProvider";

function getFocusableElements(dialog) {
  return dialog ? [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')] : [];
}

function PreferenceRow({ title, description, checked = false, disabled = false, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <span>
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      {disabled ? (
        <span className="mt-1 text-xs font-semibold text-muted-foreground">Alltid på</span>
      ) : (
        <input type="checkbox" checked={checked} onChange={onChange} className="mt-1 h-4 w-4 accent-orange-500" aria-label={`Tillat ${title.toLowerCase()}`} />
      )}
    </label>
  );
}

export default function CookieConsentManager() {
  const {
    consent,
    consentReady,
    hasConsentChoice,
    showConsentDialog,
    acceptAll,
    rejectAll,
    saveCustomConsent,
    closeConsentSettings,
  } = useCookieConsent();
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [preferences, setPreferences] = useState({ analytics: false, advertising: false, personalization: false });

  useEffect(() => {
    if (!showConsentDialog) return undefined;

    openerRef.current = document.activeElement;
    setIsCustomizing(hasConsentChoice);
    setPreferences({
      analytics: consent.analytics,
      advertising: consent.advertising,
      personalization: consent.personalization,
    });
    const focusId = window.requestAnimationFrame(() => getFocusableElements(dialogRef.current)[0]?.focus());
    return () => window.cancelAnimationFrame(focusId);
  }, [showConsentDialog, hasConsentChoice, consent]);

  const close = () => {
    if (!hasConsentChoice) return;
    closeConsentSettings();
    window.setTimeout(() => openerRef.current?.focus?.(), 0);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = getFocusableElements(dialogRef.current);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const updatePreference = (key) => (event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }));

  if (!consentReady || !showConsentDialog) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-end bg-black/50 p-3 sm:items-center sm:p-5">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        onKeyDown={handleKeyDown}
        className="mx-auto max-h-[calc(100vh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:max-h-[calc(100vh-2.5rem)] sm:p-6"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="cookie-consent-title" className="text-lg font-bold text-foreground">Ditt personvernvalg</h2>
              <p id="cookie-consent-description" className="mt-2 text-sm leading-6 text-muted-foreground">
                Vi bruker nødvendige informasjonskapsler for innlogging, sikkerhet og grunnleggende funksjoner. Valgfrie tjenester for analyse og annonser lastes bare etter valget ditt.
              </p>
              <Link href="/informasjonskapsler" className="mt-3 inline-flex text-sm font-semibold text-orange-500 hover:underline">Les cookie-erklæringen</Link>
            </div>
            {hasConsentChoice && (
              <button type="button" onClick={close} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Lukk personvernvalg">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {isCustomizing && (
            <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
              <PreferenceRow title="Nødvendige" description="Brukes for sikkerhet, innlogging og lagring av dette valget. Alltid på." disabled />
              <PreferenceRow title="Analyse" description="Hjelper oss å forstå hvordan nettstedet brukes." checked={preferences.analytics} onChange={updatePreference("analytics")} />
              <PreferenceRow title="Annonser" description="Tillater Google AdSense når annonser er aktivert av TEKKNO." checked={preferences.advertising} onChange={updatePreference("advertising")} />
              <PreferenceRow title="Personalisering" description="Tillater annonsepersonalisering når annonseløsningen støtter det." checked={preferences.personalization} onChange={updatePreference("personalization")} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button type="button" onClick={acceptAll} className="min-h-11 rounded-md border border-orange-500 bg-background px-4 text-sm font-bold text-orange-500 transition-colors hover:bg-orange-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">Godta alle</button>
            <button type="button" onClick={rejectAll} className="min-h-11 rounded-md border border-orange-500 px-4 text-sm font-bold text-orange-500 transition-colors hover:bg-orange-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">Avvis alle</button>
            {isCustomizing ? (
              <button type="button" onClick={() => saveCustomConsent(preferences)} className="min-h-11 rounded-md border border-border bg-background px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">Lagre valg</button>
            ) : (
              <button type="button" onClick={() => setIsCustomizing(true)} className="min-h-11 rounded-md border border-border bg-background px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">Tilpass valg</button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
