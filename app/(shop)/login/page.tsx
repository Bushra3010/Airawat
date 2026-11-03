"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { safeNext, useAuth } from "@/lib/auth";
import { browserClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/Header";

type Mode = "signin" | "signup" | "forgot";

const COPY: Record<Mode, { title: string; cta: string }> = {
  signin: { title: "Welcome back", cta: "Sign in" },
  signup: { title: "Create your account", cta: "Create account" },
  forgot: { title: "Reset your password", cta: "Email me a reset link" },
};

const input = "mt-1.5 h-11 w-full rounded-md border border-border-input bg-surface px-3 text-sm";

function Login() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get("next"));
  const { ready, user } = useAuth();
  const [mode, setMode] = useState<Mode>(sp.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  const switchTo = (m: Mode) => { setMode(m); setError(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (mode !== "forgot" && password.length < 8) return setError("Passwords are at least 8 characters.");
    if (mode === "signup" && name.trim().length < 2) return setError("Tell us your name.");
    setBusy(true);
    const sb = browserClient();
    const origin = window.location.origin;
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
      } else if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({
          email, password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: `${origin}${next}` },
        });
        if (error) throw error;
        if (data.session) router.replace(next); // email confirmation turned off
        else setSent("confirm");
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/account/reset` });
        if (error) throw error;
        setSent("reset");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg === "Invalid login credentials" ? "That email and password don't match." : msg);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <MailCheck size={44} className="mx-auto text-brass" />
        <h1 className="mt-5 font-display text-3xl">Check your inbox</h1>
        <p className="mt-3 text-sm text-muted">
          {sent === "confirm"
            ? <>We sent a confirmation link to <strong className="text-ink">{email}</strong>. Open it on this device to finish creating your account.</>
            : <>If <strong className="text-ink">{email}</strong> has an account, a reset link is on its way.</>}
        </p>
        <button onClick={() => { setSent(null); switchTo("signin"); }} className="mt-7 text-sm font-semibold text-accent underline">Back to sign in</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-14">
      <div className="flex justify-center"><Logo /></div>
      <div className="mt-8 rounded-lg border border-border bg-surface p-6 shadow-card md:p-8">
        <h1 className="font-display text-2xl">{COPY[mode].title}</h1>
        {mode !== "forgot" && (
          <p className="mt-1 text-sm text-muted">Track orders, keep your wishlist on every device, and check out faster.</p>
        )}
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="name" className="text-sm font-medium">Full name</label>
              <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
          {mode !== "forgot" && (
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                {mode === "signin" && <button type="button" onClick={() => switchTo("forgot")} className="text-xs text-accent underline">Forgot password?</button>}
              </div>
              <input
                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"} className={input}
                aria-describedby={mode === "signup" ? "pw-hint" : undefined}
              />
              {mode === "signup" && <p id="pw-hint" className="mt-1 text-xs text-muted">At least 8 characters.</p>}
            </div>
          )}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button disabled={busy} className="h-12 w-full rounded-full bg-accent font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-60">
            {busy ? "Please wait…" : COPY[mode].cta}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {mode === "signin" && <>New to Airawat? <button onClick={() => switchTo("signup")} className="font-semibold text-accent underline">Create an account</button></>}
          {mode === "signup" && <>Already have an account? <button onClick={() => switchTo("signin")} className="font-semibold text-accent underline">Sign in</button></>}
          {mode === "forgot" && <button onClick={() => switchTo("signin")} className="font-semibold text-accent underline">Back to sign in</button>}
        </p>
      </div>
      <p className="mt-6 text-center text-xs text-muted">Just browsing? <Link href="/" className="underline">You can check out as a guest</Link>.</p>
    </div>
  );
}

export default function LoginPage() {
  return <div className="wrap"><Suspense><Login /></Suspense></div>;
}
