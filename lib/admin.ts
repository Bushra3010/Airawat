"use client";

// Admin-panel helpers. Every write goes through the signed-in browser client, so the
// database's RLS policies (supabase/migrations/0002_admin.sql) decide what is allowed.
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { browserClient } from "@/lib/supabase-browser";

export type AdminGate = "loading" | "signed-out" | "denied" | "ok";

export function useAdminGate(): AdminGate {
  const { ready, user } = useAuth();
  const [gate, setGate] = useState<AdminGate>("loading");
  useEffect(() => {
    if (!ready) return;
    if (!user) return setGate("signed-out");
    let live = true;
    browserClient().rpc("is_admin").then(({ data }) => { if (live) setGate(data ? "ok" : "denied"); });
    return () => { live = false; };
  }, [ready, user]);
  return gate;
}

/** Ask the server to rebuild shop pages now instead of waiting for the 5-minute refresh. */
export async function refreshSite() {
  const { data } = await browserClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;
  const res = await fetch("/api/revalidate", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  return res.ok;
}

export async function uploadImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) throw new Error("Use a JPG, PNG, WebP or AVIF image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be under 5 MB.");
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `products/${crypto.randomUUID()}.${ext}`;
  const sb = browserClient();
  const { error } = await sb.storage.from("product-images").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return sb.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);

export const rupees = (paise: number) => Math.round(paise / 100);
export const paise = (rupees: number) => Math.round(rupees * 100);

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
export const STATUS_LABEL: Record<string, string> = {
  pending: "New", paid: "Paid", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};

/** Turn Postgres/PostgREST errors into something an admin can act on. */
export function friendlyError(message: string) {
  if (/duplicate key.*slug/.test(message)) return "Another product already uses this web address (slug). Change it and save again.";
  if (/violates foreign key.*order_lines/.test(message)) return "This product appears in orders, so it can't be deleted. Hide it instead.";
  if (/violates foreign key.*products/.test(message)) return "This category still has products. Move or delete them first.";
  if (/mrp_paise_check|mrp_paise >= price_paise/.test(message)) return "MRP must be the same as or higher than the price.";
  if (/row-level security|Not allowed|permission denied/.test(message)) return "Your account isn't allowed to do that.";
  return message;
}
