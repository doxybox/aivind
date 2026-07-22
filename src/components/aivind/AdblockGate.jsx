import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { useCookieConsent } from "@/components/aivind/ConsentProvider";

const isGateEnabled = () => process.env.NEXT_PUBLIC_ADBLOCK_GATE_ENABLED !== "false";

function detectBaitBlock() {
  return new Promise((resolve) => {
    const bait = document.createElement("div");
    bait.className = "adsbox ad-banner ad-unit ad-container ad-placement";
    bait.setAttribute("aria-hidden", "true");
    bait.style.cssText = "position:absolute!important;left:-10000px!important;top:-10000px!important;width:1px!important;height:1px!important;pointer-events:none!important;";
    document.body.appendChild(bait);

    window.setTimeout(() => {
      const computedStyle = window.getComputedStyle(bait);
      const isBlocked = bait.offsetParent === null
        || bait.offsetHeight === 0
        || bait.offsetWidth === 0
        || computedStyle.display === "none"
        || computedStyle.visibility === "hidden";

      bait.remove();
      resolve(isBlocked);
    }, 150);
  });
}

async function detectNetworkBlock() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 1800);

  try {
    await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return false;
  } catch (error) {
    return error?.name !== "AbortError";
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function detectAdblock() {
  const [baitBlocked, networkBlocked] = await Promise.all([
    detectBaitBlock(),
    detectNetworkBlock(),
  ]);

  return baitBlocked || networkBlocked;
}

export default function AdblockGate() {
  const { consent, consentReady } = useCookieConsent();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const retryButtonRef = useRef(null);

  const checkForAdblock = useCallback(async () => {
    if (!isGateEnabled() || !consentReady || !consent.advertising) {
      setIsBlocked(false);
      setHasChecked(true);
      return;
    }

    setIsChecking(true);
    try {
      setIsBlocked(await detectAdblock());
    } finally {
      setIsChecking(false);
      setHasChecked(true);
    }
  }, [consent.advertising, consentReady]);

  useEffect(() => {
    checkForAdblock();
  }, [checkForAdblock]);

  useEffect(() => {
    if (!isBlocked) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    retryButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isBlocked]);

  if (!hasChecked || !isBlocked) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xl" role="alertdialog" aria-modal="true" aria-labelledby="adblock-gate-title">
      <section className="w-full max-w-md rounded-lg border border-orange-500/35 bg-card p-7 text-center shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-9">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-orange-500">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-orange-500">Annonseblokkering oppdaget</p>
        <h2 id="adblock-gate-title" className="mt-3 text-2xl font-black tracking-normal text-foreground">Slå av annonseblokkereren for å fortsette</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Annonser bidrar til at TEKKNO kan lage og publisere journalistikk. Slå av annonseblokkereren for dette nettstedet, og prøv igjen.
        </p>
        <button
          ref={retryButtonRef}
          type="button"
          onClick={checkForAdblock}
          disabled={isChecking}
          className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-orange-500 px-4 text-sm font-extrabold text-white transition-colors hover:bg-orange-600 disabled:cursor-wait disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} aria-hidden="true" />
          {isChecking ? "Kontrollerer..." : "Jeg har slått den av"}
        </button>
      </section>
    </div>
  );
}
