import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronRight, Instagram, Linkedin, Loader2, Moon, Rss, ShieldCheck, Sun, Youtube } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const footerLinks = [
  { label: "Om oss", href: "/om-oss" },
  { label: "Redaksjonen", href: "/redaksjonen" },
  { label: "Annonsering", href: "/annonsering" },
  { label: "Kontakt", href: "/kontakt" },
  { label: "Personvern", href: "/personvern" },
  { label: "Vilkår", href: "/vilkar" },
];

export default function Footer() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleNewsletterSignup = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Kunne ikke melde deg på akkurat nå");
      }

      setEmail("");
      setStatus("success");
      setMessage("Du er påmeldt nyhetsbrevet.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Kunne ikke melde deg på akkurat nå");
    }
  };

  return (
    <footer className="w-full bg-background border-t border-border mt-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-0 py-10">
          <div className="lg:col-span-4 lg:border-r border-border/40 lg:pr-10 flex flex-col">
            <div className="flex items-center gap-3 mb-4 group cursor-default">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm shadow-orange-500/20">
                <span className="text-white font-black text-[15px] leading-none">T</span>
              </div>
              <span className="text-foreground font-extrabold text-[20px] tracking-[-0.04em]">TEKKNO</span>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-5 max-w-[95%]">
              Norges nyhetskilde for teknologi,<br />
              AI, gaming og digital innovasjon.<br /><br />
              Vi dekker fremtiden i sanntid.
            </p>

            <div className="flex items-center gap-2 mb-6">
              {[
                { icon: <span className="font-bold font-mono text-[13px]">X</span>, label: "X" },
                { icon: <Instagram className="w-3.5 h-3.5" />, label: "Instagram" },
                { icon: <Youtube className="w-3.5 h-3.5" />, label: "YouTube" },
                { icon: <Linkedin className="w-3.5 h-3.5" />, label: "LinkedIn" },
                { icon: <Rss className="w-3.5 h-3.5" />, label: "RSS" },
              ].map((social) => (
                <span
                  key={social.label}
                  className="w-8 h-8 rounded-lg bg-muted/20 border border-border flex items-center justify-center text-muted-foreground"
                  aria-label={`${social.label} kommer senere`}
                  title={`${social.label} kommer senere`}
                >
                  {social.icon}
                </span>
              ))}
            </div>

            <Link href="/redaksjonen" className="p-4 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-colors flex gap-3 mt-auto">
              <ShieldCheck className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
              <span className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-foreground leading-snug">Faktasjekket og redaksjonelt uavhengig.</span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  Les mer om redaksjonen <ChevronRight className="w-3 h-3" />
                </span>
              </span>
            </Link>
          </div>

          <div className="lg:col-span-4 lg:border-r border-border/40 lg:px-16 flex flex-col">
            <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-4">Om TEKKNO</h3>
            <ul className="flex flex-col">
              {footerLinks.map((item) => (
                <li key={item.href} className="border-b border-border/30 last:border-0">
                  <Link href={item.href} className="flex items-center justify-between py-2.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors group">
                    <span>{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-orange-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4 lg:pl-10 flex flex-col">
            <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-4">Nyhetsbrev</h3>
            <h4 className="text-[18px] font-bold text-foreground mb-3 leading-snug">
              Få de viktigste tech-<br />nyhetene rett i innboksen.
            </h4>
            <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">
              Ukentlig oppsummering. Eksklusive analyser.<br />
              Ingen støy, bare det som betyr noe.
            </p>

            <form onSubmit={handleNewsletterSignup} className="w-full" noValidate>
              <div className="relative flex items-center w-full">
                <label htmlFor="footer-newsletter-email" className="sr-only">E-postadresse</label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="din@epost.no"
                  autoComplete="email"
                  required
                  disabled={status === "loading"}
                  className="w-full pl-4 pr-28 py-2.5 bg-muted/20 border border-border rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  className="absolute right-1 top-1 bottom-1 min-w-[88px] px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white text-[12px] font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center"
                >
                  {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Melder på" /> : "Meld på"}
                </button>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Ved å melde deg på godtar du vår <Link href="/personvern" className="underline hover:text-foreground">personvernerklæring</Link>.
              </p>
              {message && (
                <p
                  className={`mt-3 text-[12px] flex items-center gap-1.5 ${status === "success" ? "text-emerald-500" : "text-red-500"}`}
                  role="status"
                >
                  {status === "success" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="border-t border-border/50 py-5 flex flex-col md:flex-row items-center w-full">
          <div className="flex-1 flex justify-center md:justify-start w-full md:w-auto mb-4 md:mb-0">
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mt-1 leading-none">
              © {new Date().getFullYear()} TEKKNO MEDIA AS. ALLE RETTIGHETER RESERVERT.
            </p>
          </div>

          <div className="flex-1 flex justify-center md:justify-end items-center gap-2 w-full md:w-auto">
            <button type="button" className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border bg-muted/10 text-[12px] font-medium text-foreground" aria-label="Språk: Norge">
              <span aria-hidden="true">NO</span>
              <span>Norge</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg border border-border bg-muted/10 hover:bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Bytt tema"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
