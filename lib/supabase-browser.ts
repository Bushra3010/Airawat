"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser client: keeps the signed-in session in localStorage and picks up the
// tokens Supabase puts in the URL after email confirmation or password reset.
let client: SupabaseClient | undefined;

export function browserClient() {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "airawat.auth" },
  });
  return client;
}
