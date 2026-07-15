import React from "react";
import Link from "next/link";
import { Apple, Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";

export function AuthPage({ children }) {
  return (
    <main className="min-h-screen bg-[#f7f7f7] px-5 py-12 font-sans text-black">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[526px] flex-col items-center justify-center">
        {children}
      </div>
    </main>
  );
}

export function AuthCard({ title, children }) {
  return (
    <section className="w-full rounded-[18px] bg-white px-10 py-7 shadow-[0_18px_45px_rgba(0,0,0,0.06)] sm:px-10">
      <h1 className="mb-6 text-[24px] font-bold tracking-[-0.02em] text-black">{title}</h1>
      {children}
    </section>
  );
}

export function ProviderButtons({ mode, onGoogle, onApple }) {
  const verb = mode === "signup" ? "Sign up" : "Log in";
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
  const appleEnabled = process.env.NEXT_PUBLIC_APPLE_AUTH_ENABLED === "true";

  if (!googleEnabled && !appleEnabled) return null;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {googleEnabled && (
        <button
          type="button"
          onClick={onGoogle}
          className="flex h-8 items-center justify-center gap-2 rounded-full border border-black/70 bg-white px-4 text-[15px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <GoogleIcon className="h-4 w-4" />
          {verb} with Google
        </button>
      )}
      {appleEnabled && (
        <button
          type="button"
          onClick={onApple}
          className="flex h-8 items-center justify-center gap-2 rounded-full border border-black/70 bg-white px-4 text-[15px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <Apple className="h-4 w-4 fill-zinc-700 text-zinc-700" />
          {verb} with Apple
        </button>
      )}
    </div>
  );
}

export function Divider({ children }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-zinc-200" />
      <span className="text-[15px] font-medium text-zinc-500">{children}</span>
      <div className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}

export function AuthField({ label, id, type = "text", value, onChange, autoComplete, autoFocus }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-[16px] font-bold text-black">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required
        className="h-[31px] w-full rounded-full border-0 bg-[#f1f1f1] px-5 text-[15px] font-medium text-black outline-none transition-shadow focus:shadow-[0_0_0_2px_rgba(0,0,0,0.18)]"
      />
    </label>
  );
}

export function PrimaryAuthButton({ children, loading, loadingText }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mx-auto mt-7 flex h-9 min-w-[200px] items-center justify-center rounded-full bg-black px-10 text-[14px] font-black uppercase text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthError({ children }) {
  if (!children) return null;

  return (
    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
      {children}
    </div>
  );
}

export function AuthSwitch({ children, href, linkText }) {
  return (
    <p className="mt-4 text-center text-[16px] text-black">
      {children}{" "}
      <Link href={href} className="underline underline-offset-2 hover:text-zinc-700">
        {linkText}
      </Link>
    </p>
  );
}
