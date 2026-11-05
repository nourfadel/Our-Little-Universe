"use client";
import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form action={action} className="w-full max-w-sm space-y-5 rounded-xl bg-card p-8 shadow-2xl shadow-black/60 ring-1 ring-white/5">
        <h1 className="font-display text-3xl font-light">Our Little Universe</h1>
        <label className="block text-sm text-muted">
          Email
          <input name="email" type="email" autoComplete="email" required
            className="mt-1.5 w-full rounded-lg bg-surface px-3 py-2.5 text-white outline-none ring-1 ring-white/10 focus:ring-rose" />
        </label>
        <label className="block text-sm text-muted">
          Password
          <input name="password" type="password" autoComplete="current-password" required
            className="mt-1.5 w-full rounded-lg bg-surface px-3 py-2.5 text-white outline-none ring-1 ring-white/10 focus:ring-rose" />
        </label>
        {state?.error && <p role="alert" className="text-sm text-rose">{state.error}</p>}
        <button disabled={pending}
          className="w-full rounded-lg bg-rose py-2.5 font-medium transition hover:brightness-110 disabled:opacity-60">
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
