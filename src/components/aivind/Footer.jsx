import React from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  Instagram,
  Youtube,
  Linkedin,
  Rss,
  ChevronRight,
  ShieldCheck,
  Sun,
  Moon,
  ChevronDown
} from "lucide-react";

export default function Footer() {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="w-full bg-background border-t border-border mt-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-0 py-10">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 lg:border-r border-border/40 lg:pr-10 flex flex-col">
            <div className="flex items-center gap-3 mb-4 group cursor-default">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm shadow-orange-500/20">
                <span className="text-white font-black text-[15px] leading-none">A</span>
              </div>
              <span className="text-foreground font-extrabold text-[20px] tracking-[-0.04em]">TEKKNO</span>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-5 max-w-[95%]">
              Norges ledende nyhetskilde for teknologi,<br/>
              AI, gaming og digital innovasjon.<br/><br/>
              Vi dekker fremtiden – i sanntid.
            </p>
            
            {/* Socials */}
            <div className="flex items-center gap-2 mb-6">
              {[
                { icon: <span className="font-bold font-mono text-[13px]">X</span>, label: "X" },
                { icon: <Instagram className="w-3.5 h-3.5" />, label: "Instagram" },
                { icon: <Youtube className="w-3.5 h-3.5" />, label: "YouTube" },
                { icon: <Linkedin className="w-3.5 h-3.5" />, label: "LinkedIn" },
                { icon: <Rss className="w-3.5 h-3.5" />, label: "RSS" }
              ].map((social, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="w-8 h-8 rounded-lg bg-muted/20 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all" 
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Shield Box */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer flex gap-3 mt-auto">
              <ShieldCheck className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-foreground leading-snug">Faktasjekket og redaksjonelt uavhengig.</span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
                  Les mer om vår redaksjonelle policy <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Center Links Container (Om TEKKNO) */}
          <div className="lg:col-span-4 lg:border-r border-border/40 lg:px-16 flex flex-col">
            <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-4">Om TEKKNO</h3>
            <ul className="flex flex-col">
              {["Om oss", "Redaksjonen", "Annonsering", "Kontakt", "Personvern", "Vilkår"].map((item, i) => (
                <li key={i} className="border-b border-border/30 last:border-0">
                  <a href="#" className="flex items-center justify-between py-2.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors group">
                    <span>{item}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-orange-500" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-4 lg:pl-10 flex flex-col">
            <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-4">Nyhetsbrev</h3>
            <h4 className="text-[18px] font-bold text-foreground mb-3 leading-snug">
              Få de viktigste tech-<br/>nyhetene rett i innboksen.
            </h4>
            <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">
              Ukentlig oppsummering. Eksklusive analyser.<br/>
              Ingen støy – bare det som betyr noe.
            </p>

            {/* Input Group */}
            <div className="relative flex items-center w-full mb-6">
              <input
                type="email"
                placeholder="din@epost.no"
                className="w-full pl-4 pr-24 py-2.5 bg-muted/20 border border-border rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
              />
              <button className="absolute right-1 top-1 bottom-1 px-4 bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-semibold rounded-lg shadow-sm transition-colors">
                Meld på
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-3 mt-auto">
              <div className="flex -space-x-2">
                <img src="/images/placeholders/avatar-placeholder.svg" alt="User" className="w-7 h-7 rounded-full border-2 border-background object-cover" />
                <img src="/images/placeholders/avatar-placeholder.svg" alt="User" className="w-7 h-7 rounded-full border-2 border-background object-cover" />
                <img src="/images/placeholders/avatar-placeholder.svg" alt="User" className="w-7 h-7 rounded-full border-2 border-background object-cover" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                <span className="text-foreground font-medium">10 000+ lesere</span> får ukentlige<br/>oppdateringer fra TEKKNO
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 py-5 flex flex-col md:flex-row items-center w-full">
          
          {/* Left: Copyright */}
          <div className="flex-1 flex justify-center md:justify-start w-full md:w-auto mb-4 md:mb-0">
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mt-1 leading-none">
              © {new Date().getFullYear()} TEKKNO MEDIA AS. ALLE RETTIGHETER RESERVERT.
            </p>
          </div>
          
          {/* Center: Links */}
          <div className="shrink-0 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground mb-4 md:mb-0">
            <a href="#" className="hover:text-foreground transition-colors">Personvern</a>
            <span className="text-border/80">•</span>
            <a href="#" className="hover:text-foreground transition-colors">Vilkår</a>
            <span className="text-border/80">•</span>
            <a href="#" className="hover:text-foreground transition-colors">Redaktørplakaten</a>
            <span className="text-border/80">•</span>
            <a href="#" className="hover:text-foreground transition-colors">Tilgjengelighet</a>
            <span className="text-border/80">•</span>
            <a href="#" className="hover:text-foreground transition-colors">Kontakt</a>
          </div>

          {/* Right: Toggles */}
          <div className="flex-1 flex justify-center md:justify-end items-center gap-2 w-full md:w-auto">
            <button className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border bg-muted/10 hover:bg-muted/30 transition-colors text-[12px] font-medium text-foreground">
              <span role="img" aria-label="Norge">🇳🇴</span>
              <span>Norge</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
            </button>
            <button 
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg border border-border bg-muted/10 hover:bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
