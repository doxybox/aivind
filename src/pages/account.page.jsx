import React from "react";
import { getUserEntitlements, getUserRoles, redirectForAuthError, requireAuth, userHasActiveSubscription } from "@/lib/server/auth-helpers";

export async function getServerSideProps({ req }) {
  try {
    const session = await requireAuth(req);
    const [roles, entitlements, hasActiveSubscription] = await Promise.all([
      getUserRoles(session.user.id),
      getUserEntitlements(session.user.id),
      userHasActiveSubscription(session.user.id),
    ]);

    return {
      props: {
        user: {
          id: session.user.id,
          name: session.user.name || null,
          email: session.user.email || null,
        },
        roles,
        entitlements: entitlements.map((row) => ({
          type: row.type,
          source: row.source,
          endsAt: row.endsAt ? row.endsAt.toISOString() : null,
        })),
        hasActiveSubscription,
      },
    };
  } catch (error) {
    return redirectForAuthError(error);
  }
}

export default function AccountPage({ user, roles, entitlements, hasActiveSubscription }) {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-950">
      <div className="mx-auto max-w-3xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[#ff6a00]">TEKKNO konto</p>
        <h1 className="mt-4 text-3xl font-black">{user.name || user.email}</h1>
        <p className="mt-2 text-zinc-600">{user.email}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-4">
            <p className="text-xs font-bold uppercase text-zinc-500">Roller</p>
            <p className="mt-2 font-bold">{roles.length ? roles.join(", ") : "reader"}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4">
            <p className="text-xs font-bold uppercase text-zinc-500">Abonnement</p>
            <p className="mt-2 font-bold">{hasActiveSubscription ? "Aktivt" : "Ikke aktivt"}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4">
            <p className="text-xs font-bold uppercase text-zinc-500">Entitlements</p>
            <p className="mt-2 font-bold">{entitlements.length}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
