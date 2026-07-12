import React, { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const sessionState = authClient.useSession();
  const session = sessionState.data;
  const user = session?.user || null;
  const isLoadingAuth = Boolean(sessionState.isPending);
  const authError = sessionState.error
    ? {
        type: "auth_error",
        message: sessionState.error.message || "Authentication failed",
      }
    : null;

  const logout = async (shouldRedirect = true) => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          if (shouldRedirect && typeof window !== "undefined") {
            window.location.href = "/login";
          }
        },
      },
    });
  };

  const navigateToLogin = () => {
    if (typeof window !== "undefined") {
      window.location.href = `/login?callbackURL=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
  };

  const checkUserAuth = async () => {
    if (typeof sessionState.refetch === "function") {
      await sessionState.refetch();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: Boolean(user),
        isLoadingAuth,
        isLoadingPublicSettings: false,
        authError,
        appPublicSettings: null,
        authChecked: !isLoadingAuth,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState: checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
