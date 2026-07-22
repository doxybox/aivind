import "@/index.css";
import { useEffect } from "react";
import Head from "next/head";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClientInstance } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import ScrollToTop from "@/components/ScrollToTop";
import AdblockGate from "@/components/aivind/AdblockGate";
import CookieConsentManager from "@/components/aivind/CookieConsentManager";
import { ConsentProvider } from "@/components/aivind/ConsentProvider";
import { GOOGLE_CONSENT_DEFAULT_SCRIPT } from "@/lib/google-consent";

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

function AuthGate({ children }) {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  useEffect(() => {
    if (authError?.type === "auth_required") {
      navigateToLogin();
    }
  }, [authError, navigateToLogin]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  if (authError?.type === "auth_required") {
    return null;
  }

  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <script id="tekkno-google-consent-default" dangerouslySetInnerHTML={{ __html: GOOGLE_CONSENT_DEFAULT_SCRIPT }} />
      </Head>
      <ConsentProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <ScrollToTop />
            <AuthGate>
              <Component {...pageProps} />
            </AuthGate>
            <AdblockGate />
            <CookieConsentManager />
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </ConsentProvider>
    </>
  );
}
