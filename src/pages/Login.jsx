import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  AuthCard,
  AuthError,
  AuthField,
  AuthPage,
  AuthSwitch,
  Divider,
  PrimaryAuthButton,
  ProviderButtons,
} from "@/components/auth/CleanAuthLayout";
import { authClient } from "@/lib/auth-client";
import { cleanInternalRedirectPath } from "@/lib/safe-redirect";

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackURL = cleanInternalRedirectPath(
    typeof router.query.callbackURL === "string" ? router.query.callbackURL : "",
    "/min-side",
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/sign-in/identifier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
          callbackURL,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 403) {
          setError("Du må bekrefte e-posten din før du kan logge inn");
        } else {
          setError(result.message || "Feil username/e-post eller passord");
        }
      } else {
        window.location.href = callbackURL;
      }
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("password") || msg.includes("email")) {
        setError("Feil username/e-post eller passord");
      } else if (msg.includes("not found") || msg.includes("no user") || msg.includes("does not exist")) {
        setError("Ingen bruker funnet med denne username/e-posten");
      } else if (msg.includes("network") || msg.includes("connection") || msg.includes("fetch")) {
        setError("Nettverksfeil - sjekk internettforbindelsen din");
      } else if (msg.includes("too many") || msg.includes("rate limit") || msg.includes("attempts")) {
        setError("For mange innloggingsforsøk - prøv igjen senere");
      } else {
        setError("Feil username/e-post eller passord");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL,
      errorCallbackURL: "/login",
    });
  };

  const handleApple = () => {
    authClient.signIn.social({
      provider: "apple",
      callbackURL,
      errorCallbackURL: "/login",
    });
  };

  return (
    <AuthPage ssoLabel="Log in with SSO">
      <AuthCard title="Login">
        <ProviderButtons mode="login" onGoogle={handleGoogle} onApple={handleApple} />
        <Divider>Log in with Email</Divider>

        <AuthError>{error}</AuthError>

        <form onSubmit={handleSubmit}>
          <div className="space-y-7">
            <AuthField
              id="identifier"
              label="Username or email"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
            />
            <AuthField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Link href="/forgot-password" className="mt-4 inline-block text-[16px] text-black underline underline-offset-2 hover:text-zinc-700">
            Forgot password?
          </Link>

          <PrimaryAuthButton loading={loading} loadingText="Logger inn...">
            Log in
          </PrimaryAuthButton>
        </form>

        <AuthSwitch href="/register" linkText="Sign Up">
          New to AIVIND?
        </AuthSwitch>
      </AuthCard>
    </AuthPage>
  );
}
