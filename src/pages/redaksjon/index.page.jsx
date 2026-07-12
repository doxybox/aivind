import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  FilePlus2,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  Newspaper,
  Users,
} from "lucide-react";
import { redirectForAuthError, requireAnyRole } from "@/lib/server/auth-helpers";

const STAFF_ROLES = ["journalist", "editor", "admin"];

function getPayloadAdminUrl() {
  const configured = process.env.PAYLOAD_PUBLIC_SERVER_URL;
  if (!configured) return null;

  try {
    const url = new URL(configured);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return `${url.origin}/admin`;
  } catch {
    return null;
  }
}

export async function getServerSideProps({ req }) {
  try {
    const { session, roles } = await requireAnyRole(req, STAFF_ROLES);
    return {
      props: {
        user: {
          name: session.user.name || session.user.email || "Redaksjon",
          email: session.user.email || "",
        },
        roles,
        payloadAdminUrl: getPayloadAdminUrl(),
      },
    };
  } catch (error) {
    return redirectForAuthError(error);
  }
}

const tools = [
  {
    title: "Artikler",
    description: "Opprett, rediger, planlegg og publiser saker.",
    icon: Newspaper,
    collection: "articles",
  },
  {
    title: "Ny artikkel",
    description: "Gå rett til et nytt artikkelutkast i Payload.",
    icon: FilePlus2,
    collection: "articles/create",
  },
  {
    title: "Kategorier",
    description: "Behandle kategorier og hvor sakene hører hjemme.",
    icon: FolderTree,
    collection: "categories",
  },
  {
    title: "Forfattere",
    description: "Administrer forfatterprofiler og bylines.",
    icon: Users,
    collection: "authors",
  },
  {
    title: "Forsideplasseringer",
    description: "Velg hero, rekkefølge og aktive frontpage-slots.",
    icon: LayoutDashboard,
    collection: "frontpage-slots",
  },
];

function roleName(roles) {
  if (roles.includes("admin")) return "Administrator";
  if (roles.includes("editor")) return "Redaktør";
  return "Journalist";
}

export default function EditorialDashboard({ user, roles, payloadAdminUrl }) {
  return (
    <main className="min-h-screen bg-[#11161d] px-5 py-8 text-white md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ff6a00]">TEKKNO redaksjon</p>
            <h1 className="mt-2 text-3xl font-black">Redaksjonsoversikt</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Samlet inngang til publisering, forsidebehandling og media.
            </p>
          </div>
          <div className="border-l-2 border-[#ff6a00] pl-4 text-sm">
            <p className="font-bold">{user.name}</p>
            <p className="mt-1 text-xs text-zinc-400">{roleName(roles)}</p>
          </div>
        </header>

        {!payloadAdminUrl && (
          <div className="mt-7 border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Payload Admin-adressen er ikke konfigurert. Sett `PAYLOAD_PUBLIC_SERVER_URL` for å åpne CMS-verktøyene.
          </div>
        )}

        <section className="py-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-black">Innhold</h2>
              <p className="mt-1 text-sm text-zinc-400">Artikler og redaksjonelle grunndata behandles i Payload.</p>
            </div>
            {payloadAdminUrl && (
              <a
                href={payloadAdminUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#ff6a00] transition hover:text-[#ff8a3d]"
              >
                Åpne Payload Admin <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

          <div className="grid border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const href = payloadAdminUrl ? `${payloadAdminUrl}/collections/${tool.collection}` : null;

              return (
                <div key={tool.title} className="min-h-44 border-b border-r border-white/10 bg-[#0b1016] p-5">
                  <div className="flex h-10 w-10 items-center justify-center bg-[#ff6a00]/15 text-[#ff6a00]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-black">{tool.title}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-zinc-400">{tool.description}</p>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-[#ff6a00]"
                    >
                      Behandle <ArrowRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="mt-5 inline-block text-sm font-bold text-zinc-600">Ikke konfigurert</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-t border-white/10 py-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#ff6a00]/15 text-[#ff6a00]">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black">Media</h2>
                <p className="mt-1 text-sm leading-5 text-zinc-400">
                  Last opp bilder og video, kontroller status og kopier leveringsadresser.
                </p>
              </div>
            </div>
            <Link
              href="/redaksjon/media"
              className="inline-flex h-11 items-center justify-center gap-2 bg-[#ff6a00] px-5 text-sm font-black text-white transition hover:bg-[#ff7f24]"
            >
              Åpne mediabibliotek <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
