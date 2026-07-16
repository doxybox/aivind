import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, CreditCard, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

function getReaderName(user) {
  const name = String(user?.name || user?.username || user?.email || "Leser").trim();
  const firstName = name.split(/[\s@._-]+/).find(Boolean) || "Leser";

  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

export default function HeaderAccountMenu({ mobile = false, onNavigate }) {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef(null);
  const readerName = getReaderName(user);
  const notifyNavigate = () => onNavigate?.();

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    notifyNavigate();
    await logout();
  };

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  if (isLoadingAuth) {
    return <span className="hidden h-9 w-24 animate-pulse rounded-full bg-muted sm:inline-flex" aria-label="Laster konto" />;
  }

  if (mobile) {
    if (!isAuthenticated) {
      return <Link href="/login" onClick={notifyNavigate} className="text-sm font-bold uppercase tracking-wider text-[#ff6a00] transition-colors hover:text-[#ff8c33]">LOGG INN</Link>;
    }

    return (
      <div className="rounded-xl border border-border bg-card p-3">
        <p className="px-1 text-xs text-muted-foreground">Innlogget som {readerName}</p>
        <Link href="/min-side" onClick={notifyNavigate} className="mt-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted hover:text-[#ff6a00]">
          <UserRound className="h-4 w-4" /> Kundeportalen
        </Link>
        <Link href="/abonnement" onClick={notifyNavigate} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted hover:text-[#ff6a00]">
          <CreditCard className="h-4 w-4" /> Abonnement
        </Link>
        <button type="button" onClick={handleLogout} disabled={isSigningOut} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60">
          <LogOut className="h-4 w-4" /> {isSigningOut ? "Logger ut..." : "Logg ut"}
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="hidden text-xs font-bold uppercase tracking-wider text-zinc-600 transition-colors hover:text-zinc-900 sm:block dark:text-zinc-300 dark:hover:text-white">
        LOGG INN
      </Link>
    );
  }

  const closeMenu = () => setIsOpen(false);

  return (
    <div ref={menuRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-[#ff6a00]/60 hover:text-[#ff6a00]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff6a00] text-xs font-black text-white">
          {readerName.charAt(0)}
        </span>
        <span className="max-w-24 truncate">{readerName}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div role="menu" className="absolute right-0 z-[70] mt-3 w-56 overflow-hidden rounded-xl border border-border bg-card p-2 shadow-xl">
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Innlogget som</p>
            <p className="mt-0.5 truncate text-sm font-black text-foreground">{readerName}</p>
          </div>
          <Link href="/min-side" role="menuitem" onClick={closeMenu} className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-[#ff6a00]">
            <UserRound className="h-4 w-4" /> Kundeportalen
          </Link>
          <Link href="/abonnement" role="menuitem" onClick={closeMenu} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-[#ff6a00]">
            <CreditCard className="h-4 w-4" /> Abonnement
          </Link>
          <div className="my-1 h-px bg-border" />
          <button type="button" role="menuitem" onClick={handleLogout} disabled={isSigningOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60">
            <LogOut className="h-4 w-4" /> {isSigningOut ? "Logger ut..." : "Logg ut"}
          </button>
        </div>
      )}
    </div>
  );
}
