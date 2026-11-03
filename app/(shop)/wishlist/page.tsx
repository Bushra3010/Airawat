"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { productsBySlugs } from "@/lib/db";
import { useStore } from "@/lib/store";
import { ProductGrid } from "@/components/ui";

export default function WishlistPage() {
  const { ready, wishlist } = useStore();
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let live = true;
    productsBySlugs(wishlist)
      .then((rows) => { if (live) setItems(wishlist.map((s) => rows.find((p) => p.slug === s)).filter((p): p is Product => !!p)); })
      .catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [ready, wishlist]);

  return (
    <div className="wrap py-8">
      <h1 className="font-display text-3xl">Wishlist {items && <span className="text-lg text-muted">({items.length})</span>}</h1>
      {error ? (
        <p className="mt-6 text-danger">Couldn&apos;t load your saved items. Check your connection and refresh.</p>
      ) : !items ? (
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: Math.max(1, wishlist.length || 4) }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-surface-alt" />)}
        </div>
      ) : items.length ? (
        <div className="mt-6"><ProductGrid items={items} dense /></div>
      ) : (
        <div className="py-20 text-center">
          <Heart size={40} className="mx-auto text-brass" />
          <p className="mt-4 font-display text-2xl">Nothing saved yet</p>
          <p className="mt-2 text-sm text-muted">Tap the heart on anything you like and it&apos;ll wait for you here.</p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-on-accent">Find something</Link>
        </div>
      )}
    </div>
  );
}
