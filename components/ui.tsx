"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Star, Truck } from "lucide-react";
import { discount, formatINR, img, type Product } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export function Stars({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted" aria-label={`Rated ${value} out of 5${count ? `, ${count} ratings` : ""}`}>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} className={i <= Math.round(value) ? "fill-star text-star" : "text-border"} />
        ))}
      </span>
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}

export function Price({ price, mrp, large = false }: { price: number; mrp: number; large?: boolean }) {
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 ${large ? "text-base" : "text-sm"}`}>
      <span className={`font-display font-semibold text-ink ${large ? "text-3xl" : "text-base"}`}>{formatINR(price)}</span>
      <span className="text-muted line-through">{formatINR(mrp)}</span>
      <span className="font-semibold text-success">{discount(price, mrp)}% off</span>
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { wishlist, toggleWish, addToCart } = useStore();
  const saved = wishlist.includes(p.slug);
  const v = p.variants[0];
  const s = p.sizes.find((x) => x.delta === 0) ?? p.sizes[0];
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-card">
      <Link href={`/p/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-alt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img(p.images[0], 600)} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {p.deal && <span className="absolute left-3 top-3 rounded-sm bg-sale px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">Deal of the week</span>}
      </Link>
      <button
        onClick={() => toggleWish(p.slug)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface/90 shadow-card hover:bg-surface"
      >
        <Heart size={17} className={saved ? "fill-sale text-sale" : "text-ink"} />
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/p/${p.slug}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 hover:text-accent">{p.name}</Link>
        <div className="flex items-center justify-between">
          <Stars value={p.rating} count={p.ratingCount} size={12} />
          {p.variants.length > 1 && (
            <span className="flex items-center gap-1" aria-label={`${p.variants.length} options`}>
              {p.variants.slice(0, 3).map((x) => <span key={x.name} className="h-3 w-3 rounded-full border border-border" style={{ background: x.swatch }} />)}
            </span>
          )}
        </div>
        <Price price={p.price} mrp={p.mrp} />
        <div className="mt-auto flex items-center justify-between pt-1">
          {p.shipsFast ? <span className="flex items-center gap-1 text-xs text-muted"><Truck size={14} className="text-brass" /> Ships in 48 hrs</span> : <span />}
          <button
            onClick={() => addToCart({ slug: p.slug, name: p.name, image: p.images[0], variant: v.name, size: s.name, unitPrice: p.price + v.delta + s.delta, mrp: p.mrp, warranty: false })}
            className="rounded-full border border-accent px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-on-accent"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items, dense = false }: { items: Product[]; dense?: boolean }) {
  return (
    <div className={`grid grid-cols-2 gap-3 md:gap-5 ${dense ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {items.map((p) => <ProductCard key={p.slug} p={p} />)}
    </div>
  );
}

// Sale ends at a fixed date so server and client agree.
const SALE_END = new Date("2026-11-15T23:59:59+05:30").getTime();

export function Countdown({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, SALE_END - (now ?? SALE_END));
  const parts = [
    ["Days", Math.floor(left / 864e5)],
    ["Hrs", Math.floor(left / 36e5) % 24],
    ["Min", Math.floor(left / 6e4) % 60],
    ["Sec", Math.floor(left / 1e3) % 60],
  ] as const;
  return (
    <div className="flex items-center gap-2" aria-live="off">
      {parts.map(([label, n], i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="text-center">
            <div className={`font-semibold tabular-nums ${compact ? "text-lg" : "text-2xl"}`}>{now === null ? "--" : String(n).padStart(2, "0")}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
          </div>
          {i < 3 && <span className="pb-3 opacity-60">:</span>}
        </div>
      ))}
    </div>
  );
}

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div role="status" className="toast-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm text-white shadow-pop">
      {toast}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="py-3 text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? <Link href={it.href} className="hover:text-accent">{it.label}</Link> : <span className="text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
