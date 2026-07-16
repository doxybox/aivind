import React, { useState } from "react";
import Link from "next/link";
import { Menu, Moon, Search, X } from "lucide-react";
import { GiFlashGrenade } from "react-icons/gi";
import BrandLogo from "@/components/aivind/BrandLogo";
import { categoryNavItems } from "@/components/aivind/categoryNav";
import HeaderAccountMenu from "@/components/aivind/HeaderAccountMenu";
import { useTheme } from "@/hooks/useTheme";

export default function EditorialHeader({ onSearchClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`absolute bottom-0 right-0 top-0 flex w-64 flex-col border-l border-zinc-200 bg-white p-6 transition-transform duration-300 dark:border-white/10 dark:bg-[#161a22] ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">MENY</span>
            <button type="button" onClick={() => setIsMenuOpen(false)} className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" aria-label="Lukk meny">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-6" aria-label="Mobilmeny">
            {categoryNavItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px w-full bg-zinc-200 dark:bg-white/10" />
            <HeaderAccountMenu mobile onNavigate={() => setIsMenuOpen(false)} />
          </nav>
        </div>
      </div>

      <header className="sticky top-0 z-50 flex h-[72px] items-center justify-between border-b border-zinc-200 bg-white px-6 transition-colors duration-300 dark:border-white/5 dark:bg-[#161a22]">
        <div className="flex items-center gap-10">
          <Link href="/" className="shrink-0" aria-label="TEKKNO forside">
            <BrandLogo className="h-10 max-w-[172px]" priority />
          </Link>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Hovedmeny">
            {categoryNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <HeaderAccountMenu />
          <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
            <button type="button" onClick={toggleTheme} className="transition-colors hover:text-zinc-900 dark:hover:text-white" aria-label="Bytt tema">
              {theme === "dark" ? <GiFlashGrenade className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button type="button" onClick={onSearchClick} className="transition-colors hover:text-zinc-900 dark:hover:text-white" aria-label="Søk">
              <Search className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setIsMenuOpen(true)} className="transition-colors hover:text-zinc-900 dark:hover:text-white lg:hidden" aria-label="Åpne meny">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
