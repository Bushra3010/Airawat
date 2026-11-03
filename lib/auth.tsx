"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { browserClient } from "@/lib/supabase-browser";

type Auth = {
  ready: boolean;
  user: User | null;
  recovering: boolean; // true after opening a password-reset link
  signOut: () => Promise<void>;
};

const Ctx = createContext<Auth | null>(null);

export const displayName = (u: User | null) =>
  (u?.user_metadata?.full_name as string | undefined)?.split(" ")[0] || u?.email?.split("@")[0] || "";

// Only allow same-site relative paths after sign-in, never "//evil.com" or absolute URLs.
export const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/account");

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    const sb = browserClient();
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "SIGNED_OUT") setRecovering(false);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<Auth>(() => ({
    ready, user, recovering,
    signOut: async () => { await browserClient().auth.signOut(); },
  }), [ready, user, recovering]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const a = useContext(Ctx);
  if (!a) throw new Error("useAuth outside AuthProvider");
  return a;
}
