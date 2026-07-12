import React, { useState } from "react";
import { Search, Sun, Moon, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";

const navLinks = [
  { label: "AI", href: "#" },
  { label: "Gaming", href: "#" },
  { label: "Elbil", href: "#" },
  { label: "Gadgets", href: "#" },
  { label: "Tester", href: "#" },
  { label: "Guider", href: "#" },
  { label: "Video", href: "#" },
];

export default function Navbar({ onSearchClick }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { isAuthenticated: isAuthed } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm leading-none">A</span>
            </div>
            <span className="text-foreground font-extrabold text-[19px] tracking-[-0.04em] group-hover:text-orange-500 transition-colors">TEKKNO</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-2 text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onSearchClick}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
              aria-label="Søk"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
              aria-label="Bytt tema"
            >
              {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            
            <div className="hidden sm:block w-px h-6 bg-border/60 mx-2" />

            {isAuthed ? (
              <button
                onClick={() => router.push("/min-side")}
                className="hidden sm:block px-5 py-2 bg-foreground hover:bg-foreground/90 text-background text-[13px] font-semibold rounded-full shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                Min side
              </button>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="hidden sm:block px-5 py-2 bg-foreground hover:bg-foreground/90 text-background text-[13px] font-semibold rounded-full shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                Logg Inn
              </button>
            )}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors ml-1"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 px-4 py-6 shadow-xl">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-4 py-3 text-[15px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="h-px bg-border/50 my-5" />
          {isAuthed ? (
            <button
              onClick={() => { router.push("/min-side"); setMobileOpen(false); }}
              className="w-full px-4 py-3.5 bg-foreground text-background text-[15px] font-semibold rounded-xl shadow-sm transition-colors"
            >
              Min side
            </button>
          ) : (
            <button
              onClick={() => { router.push("/login"); setMobileOpen(false); }}
              className="w-full px-4 py-3.5 bg-foreground text-background text-[15px] font-semibold rounded-xl shadow-sm transition-colors"
            >
              Logg Inn
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
