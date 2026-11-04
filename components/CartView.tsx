"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatINR, img, type Category } from "@/lib/catalog";
import { lineTotal, useStore } from "@/lib/store";
import { couponBase, summarise } from "@/lib/pricing";
import { useCoupon } from "@/lib/coupons";
import Summary from "@/components/Summary";
import { SAVED_COUPON_KEY } from "@/components/SignupOffer";

const savedCoupon = () => { try { return localStorage.getItem(SAVED_COUPON_KEY); } catch { return null; } };
const forgetCoupon = () => { try { localStorage.removeItem(SAVED_COUPON_KEY); } catch {} };

export default function CartView({ categories }: { categories: Category[] }) {
  const { ready, cart, setQty, removeLine } = useStore();
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const check = useCoupon(coupon, ready ? couponBase(cart) : 0);
  // A code claimed from the sign-up popup applies itself.
  useEffect(() => {
    const saved = savedCoupon();
    if (saved) { setCoupon(saved); setCode(saved); }
  }, []);

  if (!ready) return <div className="wrap py-24" aria-busy="true"><div className="h-40 animate-pulse rounded-lg bg-surface-alt" /></div>;

  if (!cart.length) {
    return (
      <div className="wrap py-20 text-center">
        <ShoppingBag size={44} className="mx-auto text-brass" />
        <h1 className="mt-5 font-display text-3xl">Your cart is waiting for something good</h1>
        <p className="mt-2 text-sm text-muted">Start with a room and we&apos;ll take it from there.</p>
        <Link href="/" className="mt-7 inline-block rounded-full bg-accent px-7 py-3 font-semibold text-on-accent">Start shopping</Link>
        <ul className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-5 md:grid-cols-7">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/c/${c.slug}`} className="flex flex-col items-center gap-2 text-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(c.image, 160)} alt="" className="aspect-square w-full rounded-full object-cover" />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const s = summarise(cart, check.valid ? check.off : 0);
  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    setCoupon(code.trim().toUpperCase() || null);
  };

  return (
    <div className="wrap py-8">
      <h1 className="font-display text-3xl">Your cart <span className="text-lg text-muted">({s.units})</span></h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-4">
          {cart.map((l) => (
            <li key={l.key} className="flex gap-4 rounded-lg border border-border bg-surface p-4">
              <Link href={`/p/${l.slug}`} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(l.image, 300)} alt={l.name} className="h-24 w-28 rounded-md object-cover md:h-32 md:w-40" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/p/${l.slug}`} className="font-medium hover:text-accent">{l.name}</Link>
                <p className="mt-1 text-xs text-muted">{l.variant} · {l.size}{l.warranty && " · +2 yr cover"}</p>
                <p className="mt-2 text-sm"><span className="font-semibold">{formatINR(lineTotal(l))}</span> <span className="text-muted line-through">{formatINR(l.mrp * l.qty)}</span></p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex h-9 items-center rounded-full border border-border" role="group" aria-label={`Quantity of ${l.name}`}>
                    <button onClick={() => setQty(l.key, l.qty - 1)} disabled={l.qty <= 1} aria-label="Decrease" className="grid h-9 w-9 place-items-center disabled:opacity-30"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm tabular-nums">{l.qty}</span>
                    <button onClick={() => setQty(l.key, l.qty + 1)} disabled={l.qty >= 10} aria-label="Increase" className="grid h-9 w-9 place-items-center disabled:opacity-30"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeLine(l.key)} className="flex items-center gap-1.5 text-sm text-muted hover:text-danger"><Trash2 size={15} /> Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <form onSubmit={apply} className="rounded-lg border border-border bg-surface p-5">
            <label htmlFor="coupon" className="text-sm font-semibold">Have a coupon?</label>
            <div className="mt-2 flex gap-2">
              <input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" className="h-10 flex-1 rounded-md border border-border-input px-3 text-sm uppercase" />
              <button className="h-10 rounded-md bg-ink px-4 text-sm font-semibold text-white">Apply</button>
            </div>
            {coupon && (
              <p role="status" className={`mt-2 text-xs ${check.checking ? "text-muted" : check.valid ? "text-success" : "text-danger"}`}>
                {check.checking ? "Checking…" : check.valid ? `${coupon} applied: ${check.message}` : check.message}
                {!check.checking && <button type="button" onClick={() => { setCoupon(null); setCode(""); forgetCoupon(); }} className="ml-2 underline">Remove</button>}
              </p>
            )}
          </form>
          <Summary s={s}>
            <Link href={`/checkout${coupon && check.valid ? `?coupon=${encodeURIComponent(coupon)}` : ""}`} className="mt-4 block h-12 rounded-full bg-accent text-center font-semibold leading-[3rem] text-on-accent hover:bg-accent-hover">Checkout securely</Link>
          </Summary>
        </div>
      </div>
    </div>
  );
}
