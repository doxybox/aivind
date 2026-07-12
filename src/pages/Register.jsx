import React, { useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { authClient } from "@/lib/auth-client";
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

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError("Du må godta vilkårene før du kan registrere deg");
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: username || email,
        email,
        password,
        callbackURL: "/min-side",
      });

      if (signUpError) {
        setError(signUpError.message || "Registrering mislyktes");
      } else {
        setRegistered(true);
      }
    } catch (err) {
      setError(err.message || "Registrering mislyktes");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: "/min-side",
      errorCallbackURL: "/register",
    });
  };

  const handleApple = () => {
    authClient.signIn.social({
      provider: "apple",
      callbackURL: "/min-side",
      errorCallbackURL: "/register",
    });
  };

  if (registered) {
    return (
      <AuthPage ssoLabel="Sign up with SSO">
        <AuthCard title="Check your email">
          <p className="mb-6 text-[15px] font-medium text-zinc-600">
            Vi har sendt en bekreftelseslenke til <span className="font-bold text-black">{email}</span>. Bekreft e-posten din før du logger inn.
          </p>

          <p className="mt-5 text-center text-[15px] text-zinc-600">
            Ferdig?{" "}
            <Link href="/login" className="underline underline-offset-2 hover:text-black">
              Logg inn
            </Link>
          </p>
        </AuthCard>
      </AuthPage>
    );
  }

  return (
    <AuthPage ssoLabel="Sign up with SSO">
      <AuthCard title="Signup">
        <ProviderButtons mode="signup" onGoogle={handleGoogle} onApple={handleApple} />
        <Divider>Sign up with Email</Divider>

        <AuthError>{error}</AuthError>

        <form onSubmit={handleSubmit}>
          <div className="space-y-7">
            <AuthField
              id="username"
              label={
                <span className="inline-flex items-center gap-1">
                  TEKKNO Username <Info className="h-4 w-4" />
                </span>
              }
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="name"
              autoFocus
            />
            <AuthField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <AuthField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <label className="mt-7 flex items-start gap-2 text-[15px] leading-6 text-black">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-[18px] w-[18px] shrink-0 rounded border border-black accent-black"
            />
            <span>
              I agree to TEKKNO&apos;s{" "}
              <Link href="/vilkar" className="text-blue-600 underline underline-offset-2">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/personvern" className="text-blue-600 underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <PrimaryAuthButton loading={loading} loadingText="Oppretter...">
            Sign up
          </PrimaryAuthButton>
        </form>

        <AuthSwitch href="/login" linkText="Log in">
          Already have an account?
        </AuthSwitch>
      </AuthCard>
    </AuthPage>
  );
}
