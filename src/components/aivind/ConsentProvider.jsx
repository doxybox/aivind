import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_CONSENT_MANAGE_EVENT,
  defaultCookieConsent,
  readCookieConsent,
  saveCookieConsent,
} from "@/lib/cookie-consent";
import { applyGoogleConsent } from "@/lib/google-consent";

const ConsentContext = createContext(null);

export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(defaultCookieConsent);
  const [consentReady, setConsentReady] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  useEffect(() => {
    const stored = readCookieConsent();
    setConsent(stored);
    setConsentReady(true);
    setShowConsentDialog(!stored.decided);

    const handleChange = (event) => {
      const next = event?.detail || readCookieConsent();
      setConsent(next);
      setConsentReady(true);
    };
    const handleManage = () => setShowConsentDialog(true);
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, handleChange);
    window.addEventListener(COOKIE_CONSENT_MANAGE_EVENT, handleManage);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, handleChange);
      window.removeEventListener(COOKIE_CONSENT_MANAGE_EVENT, handleManage);
    };
  }, []);

  useEffect(() => {
    if (consentReady) applyGoogleConsent(consent);
  }, [consent, consentReady]);

  const saveConsent = (values) => {
    const next = saveCookieConsent(values);
    setConsent(next);
    setShowConsentDialog(false);
  };

  const value = useMemo(() => ({
    consent,
    consentReady,
    hasConsentChoice: consent.decided,
    showConsentDialog,
    acceptAll: () => saveConsent({ analytics: true, advertising: true, personalization: true }),
    rejectAll: () => saveConsent({ analytics: false, advertising: false, personalization: false }),
    saveCustomConsent: saveConsent,
    openConsentSettings: () => setShowConsentDialog(true),
    closeConsentSettings: () => {
      if (consent.decided) setShowConsentDialog(false);
    },
  }), [consent, consentReady, showConsentDialog]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useCookieConsent() {
  const context = useContext(ConsentContext);
  if (!context) throw new Error("useCookieConsent must be used within ConsentProvider");
  return context;
}
