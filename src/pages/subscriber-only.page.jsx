import React from "react";
import { ForbiddenError, redirectForAuthError, requireAuth, userHasActiveSubscription } from "@/lib/server/auth-helpers";

export async function getServerSideProps({ req }) {
  try {
    const session = await requireAuth(req);
    const hasSubscription = await userHasActiveSubscription(session.user.id);

    if (!hasSubscription) {
      throw new ForbiddenError("Active subscription required");
    }

    return {
      props: {
        email: session.user.email || null,
      },
    };
  } catch (error) {
    return redirectForAuthError(error);
  }
}

export default function SubscriberOnlyPage({ email }) {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-950">
      <div className="mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[#ff6a00]">Subscriber protected</p>
        <h1 className="mt-4 text-3xl font-black">Subscriber-only route</h1>
        <p className="mt-3 text-zinc-600">
          Denne siden krever aktivt abonnement sjekket server-side mot Supabase/Postgres.
        </p>
        <p className="mt-6 text-sm">
          Innlogget som <span className="font-bold">{email}</span>.
        </p>
      </div>
    </main>
  );
}
