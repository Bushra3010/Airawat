"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { browserClient } from "@/lib/supabase-browser";

// Reached from the reset email (Supabase signs the user in with a recovery session)
// or from the account page by a signed-in user.
export default function ResetPage() {
  const router = useRouter();
  const { ready, user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className="wrap py-24" aria-busy="true"><div className="h-40 animate-pulse rounded-lg bg-surface-alt" /></div>;

  if (!user) {
    return (
      <div className="wrap max-w-md py-20 text-center">
        <h1 className="font-display text-3xl">This reset link has expired</h1>
        <p className="mt-2 text-sm text-muted">Reset links work once and only for a short time. Ask for a new one.</p>
        <Link href="/login" className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-on-accent">Back to sign in</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    const { error } = await browserClient().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace("/account");
  };

  return (
    <div className="wrap max-w-md py-14">
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card md:p-8">
        <h1 className="font-display text-2xl">Set a new password</h1>
        <p className="mt-1 text-sm text-muted">For {user.email}</p>
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="pw" className="text-sm font-medium">New password</label>
            <input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-11 w-full rounded-md border border-border-input bg-surface px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="pw2" className="text-sm font-medium">Repeat it</label>
            <input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1.5 h-11 w-full rounded-md border border-border-input bg-surface px-3 text-sm" />
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button disabled={busy} className="h-12 w-full rounded-full bg-accent font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-60">
            {busy ? "Saving…" : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
