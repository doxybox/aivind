import React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import Footer from "@/components/aivind/Footer";
import { categoryNavItems } from "@/components/aivind/categoryNav";
import { useTheme } from "@/hooks/useTheme";

export function InfoSection({ title, children }) {
  return (
    <section className="py-8 border-t border-border first:border-t-0 first:pt-0">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">{title}</h2>
      <div className="space-y-4 text-[15px] leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

export default function InfoPageLayout({ title, kicker, intro, description, children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Head>
        <title>{title} | TEKKNO</title>
        <meta name="description" content={description || intro} />
      </Head>

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 min-w-0">
            <Link href="/" className="font-black text-xl tracking-tight whitespace-nowrap">
              TEKKNO<span className="text-orange-500">.NO</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-5" aria-label="Kategorier">
              {categoryNavItems.map((item) => (
                <Link key={item.href} href={item.href} className="text-[11px] font-bold text-muted-foreground hover:text-orange-500 transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:inline-flex px-4 h-9 items-center text-[12px] font-bold text-muted-foreground hover:text-foreground transition-colors">
              LOGG INN
            </Link>
            <button type="button" onClick={toggleTheme} className="w-9 h-9 inline-flex items-center justify-center border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors" aria-label="Bytt tema">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="border-b border-border/60 bg-muted/10">
          <div className="max-w-[980px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground hover:text-orange-500 transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" /> Til forsiden
            </Link>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-500 mb-4">{kicker}</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">{title}</h1>
            <p className="max-w-[720px] text-base sm:text-lg leading-8 text-muted-foreground">{intro}</p>
          </div>
        </div>

        <div className="max-w-[980px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
