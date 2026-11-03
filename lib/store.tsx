"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { browserClient } from "@/lib/supabase-browser";

export type CartLine = {
  key: string;
  slug: string;
  name: string;
  image: string;
  variant: string;
  size: string;
  unitPrice: number;
  mrp: number;
  qty: number;
  warranty: boolean;
};

export const WARRANTY_PRICE = 1499;

type Store = {
  ready: boolean;
  cart: CartLine[];
  wishlist: string[];
  addToCart: (line: Omit<CartLine, "key" | "qty"> & { qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  toggleWish: (slug: string) => void;
  toast: string | null;
  notify: (msg: string) => void;
  cartCount: number;
};

const Ctx = createContext<Store | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setCart(load("airawat.cart", []));
    setWishlist(load("airawat.wishlist", []));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) save("airawat.cart", cart); }, [cart, ready]);
  useEffect(() => { if (ready) save("airawat.wishlist", wishlist); }, [wishlist, ready]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);

  // Signed-in wishlists live in the database. On sign-in, merge what was saved on this device into the account.
  const { user } = useAuth();
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      if (wasSignedIn.current) setWishlist([]);
      wasSignedIn.current = false;
      return;
    }
    wasSignedIn.current = true;
    let live = true;
    (async () => {
      const sb = browserClient();
      const { data } = await sb.from("wishlists").select("products(slug)");
      const remote = (data ?? []).map((r) => (r.products as unknown as { slug: string }).slug);
      const local = load<string[]>("airawat.wishlist", []);
      const missing = local.filter((s) => !remote.includes(s));
      if (missing.length) {
        const { data: ids } = await sb.from("products").select("id").in("slug", missing);
        await sb.from("wishlists").upsert((ids ?? []).map((p) => ({ user_id: user.id, product_id: p.id })), { ignoreDuplicates: true });
      }
      if (live) setWishlist([...remote, ...missing]);
    })();
    return () => { live = false; };
  }, [user, ready]);

  const persistWish = useCallback(async (slug: string, add: boolean) => {
    if (!user) return;
    const sb = browserClient();
    const { data: p } = await sb.from("products").select("id").eq("slug", slug).single();
    if (!p) return;
    const res = add
      ? await sb.from("wishlists").upsert({ user_id: user.id, product_id: p.id }, { ignoreDuplicates: true })
      : await sb.from("wishlists").delete().eq("user_id", user.id).eq("product_id", p.id);
    if (res.error) notify("Couldn't sync your wishlist. It's saved on this device.");
  }, [user, notify]);

  const addToCart: Store["addToCart"] = useCallback((line) => {
    const key = `${line.slug}|${line.variant}|${line.size}|${line.warranty ? "w" : ""}`;
    setCart((c) => {
      const hit = c.find((l) => l.key === key);
      if (hit) return c.map((l) => (l.key === key ? { ...l, qty: Math.min(10, l.qty + (line.qty ?? 1)) } : l));
      return [...c, { ...line, key, qty: line.qty ?? 1 }];
    });
    notify(`Added to cart: ${line.name}`);
  }, [notify]);

  const value = useMemo<Store>(() => ({
    ready, cart, wishlist, toast, notify, addToCart,
    setQty: (key, qty) => setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l))),
    removeLine: (key) => setCart((c) => c.filter((l) => l.key !== key)),
    clearCart: () => setCart([]),
    toggleWish: (slug) => {
      const has = wishlist.includes(slug);
      setWishlist((w) => (has ? w.filter((s) => s !== slug) : [...w, slug]));
      notify(has ? "Removed from wishlist" : "Saved to wishlist");
      void persistWish(slug, !has);
    },
    cartCount: cart.reduce((n, l) => n + l.qty, 0),
  }), [ready, cart, wishlist, toast, notify, addToCart, persistWish]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

export const lineTotal = (l: CartLine) => (l.unitPrice + (l.warranty ? WARRANTY_PRICE : 0)) * l.qty;

// Guest orders are read back with a per-order token that only this browser holds.
export function saveOrderToken(code: string, token: string) {
  save("airawat.orders", { ...load<Record<string, string>>("airawat.orders", {}), [code]: token });
}
export function orderToken(code: string): string | null {
  return load<Record<string, string>>("airawat.orders", {})[code] ?? null;
}
