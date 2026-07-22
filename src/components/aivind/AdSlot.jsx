import React, { useEffect, useRef, useState } from "react";
import { useCookieConsent } from "@/components/aivind/ConsentProvider";

const SLOT_BY_PLACEMENT = {
  "home-primary": "",
  "home-secondary": "",
  "category-bottom": "",
  "article-sidebar-top": "",
  "article-sidebar-bottom": "",
};

const disabledSettings = {
  enabled: false,
  client: "",
  slots: SLOT_BY_PLACEMENT,
};

let payloadSettingsPromise;

function getPayloadSettings() {
  if (!payloadSettingsPromise) {
    payloadSettingsPromise = fetch("/api/adsense/config")
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
  }

  return payloadSettingsPromise;
}

function useAdSenseSettings() {
  const [settings, setSettings] = useState(disabledSettings);

  useEffect(() => {
    let active = true;

    getPayloadSettings().then((payloadSettings) => {
      if (active && payloadSettings) setSettings(payloadSettings);
    });

    return () => {
      active = false;
    };
  }, []);

  return settings;
}

function getAdSenseScript() {
  return document.querySelector('script[data-tekkno-adsense="true"]');
}

export default function AdSlot({
  placement,
  className = "",
  fallbackDescription = "Annonseplassering",
}) {
  const adRef = useRef(null);
  const requestedRef = useRef(false);
  const settings = useAdSenseSettings();
  const { consent, consentReady } = useCookieConsent();
  const client = settings?.client || "";
  const slot = settings?.slots?.[placement];
  const canServeAds = Boolean(consentReady && consent.advertising && settings?.enabled && client && slot);

  useEffect(() => {
    if (!canServeAds || requestedRef.current || !adRef.current) return undefined;

    const requestAd = () => {
      if (requestedRef.current || !adRef.current || adRef.current.dataset.adsbygoogleStatus) return;

      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        requestedRef.current = true;
      } catch {
        // Keep the reserved space when an ad blocker or Google rejects a request.
      }
    };

    let script = getAdSenseScript();
    if (!script) {
      script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
      script.crossOrigin = "anonymous";
      script.dataset.tekknoAdsense = "true";
      script.addEventListener("load", requestAd, { once: true });
      document.head.appendChild(script);
      return undefined;
    }

    if (window.adsbygoogle) {
      requestAd();
      return undefined;
    }

    script.addEventListener("load", requestAd, { once: true });
    return () => script.removeEventListener("load", requestAd);
  }, [canServeAds, client]);

  return (
    <section className={`relative overflow-hidden rounded-xl border border-[#ff6a00]/40 bg-[#161a22] shadow-[0_0_15px_rgba(255,106,0,0.1)] ${className}`} aria-label="Annonse">
      {canServeAds ? (
        <ins
          ref={adRef}
          className="adsbygoogle block h-full w-full"
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-48 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #ff6a00 1.5px, transparent 0)", backgroundSize: "16px 16px", WebkitMaskImage: "linear-gradient(to right, black, transparent)", maskImage: "linear-gradient(to right, black, transparent)" }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-48 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #ff6a00 1.5px, transparent 0)", backgroundSize: "16px 16px", WebkitMaskImage: "linear-gradient(to left, black, transparent)", maskImage: "linear-gradient(to left, black, transparent)" }} />
          <div className="relative z-10 flex h-full items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#ff6a00] text-xl font-black text-[#ff6a00]">A</div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6a00]">Annonse</p>
              <p className="mt-1 text-sm font-medium text-zinc-400">{consent.advertising ? fallbackDescription : "Annonser vises etter samtykke"}</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
