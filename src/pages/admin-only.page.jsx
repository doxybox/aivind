import React from "react";
import { redirectForAuthError, requireAdmin } from "@/lib/server/auth-helpers";

export async function getServerSideProps({ req }) {
  try {
    const { session, roles } = await requireAdmin(req);

    return {
      props: {
        email: session.user.email || null,
        roles,
      },
    };
  } catch (error) {
    return redirectForAuthError(error);
  }
}

export default function AdminOnlyPage({ email, roles }) {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-950">
      <div className="mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[#ff6a00]">Admin protected</p>
        <h1 className="mt-4 text-3xl font-black">Admin-only route</h1>
        <p className="mt-3 text-zinc-600">
          Denne siden ble rendret etter en server-side rolle-sjekk mot databasen.
        </p>
        <dl className="mt-6 space-y-2 text-sm">
          <div>
            <dt className="font-bold">Bruker</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt className="font-bold">Roller</dt>
            <dd>{roles.join(", ")}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
