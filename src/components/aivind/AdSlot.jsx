import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
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
const ADSENSE_READY_EVENT = "tekkno:adsense-ready";

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

export default function AdSlot({
  placement,
  className = "",
}) {
  const adRef = useRef(null);
  const requestedRef = useRef(false);
  const settings = useAdSenseSettings();
  const { consent, consentReady } = useCookieConsent();
  const client = settings?.client || "";
  const slot = settings?.slots?.[placement];
  const canServeAds = Boolean(consentReady && consent.advertising && settings?.enabled && client && slot);
  const reservedHeight = placement.includes("sidebar") ? "min-h-[250px]" : "min-h-[120px] sm:min-h-[150px]";

  useEffect(() => {
    requestedRef.current = false;
    if (!canServeAds || !adRef.current) return undefined;

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

    requestAd();
    window.addEventListener(ADSENSE_READY_EVENT, requestAd);
    return () => window.removeEventListener(ADSENSE_READY_EVENT, requestAd);
  }, [canServeAds, client, slot]);

  if (!canServeAds) return null;

  return (
    <>
      <Script
        id="tekkno-adsense-script"
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`}
        crossOrigin="anonymous"
        onReady={() => window.dispatchEvent(new Event(ADSENSE_READY_EVENT))}
      />
      <section className={`overflow-hidden ${reservedHeight} ${className}`} aria-label="Annonse">
        <ins
          ref={adRef}
          className="adsbygoogle block h-full w-full"
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </section>
    </>
  );
}
