"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent, Check, Hammer, Heart, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { formatINR, type Product } from "@/lib/catalog";
import { useStore, WARRANTY_PRICE } from "@/lib/store";
import { BUSINESS } from "@/lib/business";
import { Countdown, Price, Stars } from "@/components/ui";

export default function BuyBox({ p }: { p: Product }) {
  const router = useRouter();
  const { addToCart, wishlist, toggleWish } = useStore();
  const [variant, setVariant] = useState(p.variants[0]);
  const [size, setSize] = useState(p.sizes.find((s) => s.delta === 0) ?? p.sizes[0]);
  const [qty, setQty] = useState(1);
  const [warranty, setWarranty] = useState(false);
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const unit = p.price + variant.delta + size.delta;
  const mrp = Math.round(p.mrp * (unit / p.price));
  const total = (unit + (warranty ? WARRANTY_PRICE : 0)) * qty;
  const saved = wishlist.includes(p.slug);
  const line = () => ({ slug: p.slug, name: p.name, image: p.images[0], variant: variant.name, size: size.name, unitPrice: unit, mrp, warranty, qty });

  const checkPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin)) return setPinMsg({ ok: false, text: "Enter a valid 6-digit pincode." });
    setPinMsg({ ok: true, text: "Checking…" });
    // Shiprocket's courier coverage when it's connected; otherwise a rough estimate.
    try {
      const res = await fetch(`/api/delivery?pincode=${pin}`);
      const d = (await res.json()) as { configured?: boolean; serviceable?: boolean; days?: number | null; error?: string };
      if (d.configured && d.serviceable === false) {
        return setPinMsg({ ok: false, text: `Couriers don't reach ${pin} yet. WhatsApp us on ${BUSINESS.phone} and we'll try to arrange delivery.` });
      }
      if (d.configured && d.serviceable) {
        const days = (d.days ?? 5) + (p.shipsFast ? 2 : 5); // courier time + time to dispatch
        return setPinMsg({ ok: true, text: `Delivers to ${pin} in about ${days}–${days + 3} days.` });
      }
    } catch {}
    const days = p.shipsFast ? 3 : 7;
    setPinMsg({ ok: true, text: `Usually delivered in ${days}–${days + 4} days. We'll confirm the date after you order.` });
  };

  return (
    <div>
      <h1 className="font-display text-3xl leading-tight md:text-4xl">{p.name}</h1>
      <div className="mt-2 flex items-center gap-3">
        <Stars value={p.rating} count={p.ratingCount} />
        <a href="#rev-h" className="text-xs text-accent underline">Read reviews</a>
      </div>

      <div className="mt-5">
        <Price price={unit} mrp={mrp} large />
        <p className="mt-1 text-xs text-muted">Inclusive of all taxes · or {formatINR(Math.ceil(unit / 12))}/month with no-cost EMI</p>
      </div>

      {p.deal && (
        <div className="mt-5 flex items-center justify-between rounded-md bg-sale px-4 py-3 text-white">
          <span className="text-sm font-semibold">Festive price ends in</span>
          <Countdown compact />
        </div>
      )}

      <fieldset className="mt-7">
        <legend className="text-sm"><span className="text-muted">{variant.group}:</span> <span className="font-semibold">{variant.name}</span></legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {p.variants.map((v) => (
            <button
              key={v.name}
              onClick={() => setVariant(v)}
              aria-pressed={v.name === variant.name}
              aria-label={`${v.name}${v.delta ? `, plus ${formatINR(v.delta)}` : ""}`}
              className={`flex flex-col items-center gap-1.5 rounded-md border-2 p-1.5 ${v.name === variant.name ? "border-accent" : "border-border hover:border-ink/40"}`}
            >
              <span className="h-11 w-11 rounded" style={{ background: v.swatch }} />
              <span className="text-[11px]">{v.delta ? `+${formatINR(v.delta)}` : formatINR(p.price + size.delta)}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {p.sizes.length > 1 && (
        <fieldset className="mt-6">
          <legend className="text-sm"><span className="text-muted">Size:</span> <span className="font-semibold">{size.name}</span></legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.sizes.map((s) => (
              <button
                key={s.name}
                onClick={() => setSize(s)}
                aria-pressed={s.name === size.name}
                className={`rounded-md border-2 px-4 py-2 text-left text-sm ${s.name === size.name ? "border-accent bg-accent/5" : "border-border hover:border-ink/40"}`}
              >
                <span className="block font-medium">{s.name}</span>
                <span className="block text-xs text-muted">{formatINR(p.price + variant.delta + s.delta)}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-7 rounded-lg border border-border bg-surface p-4">
        <p className="flex items-center gap-2 text-sm font-semibold"><BadgePercent size={16} className="text-brass" /> Offers</p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          <li>Extra 10% off when you buy two or more pieces</li>
          <li>Have a coupon code? Apply it in your cart.</li>
        </ul>
      </div>

      <form onSubmit={checkPin} className="mt-5">
        <label htmlFor="pin" className="text-sm font-semibold">Check delivery</label>
        <div className="mt-2 flex gap-2">
          <input id="pin" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinMsg(null); }} placeholder="6-digit pincode" className="h-11 flex-1 rounded-md border border-border-input bg-surface px-3 text-sm" aria-describedby="pin-msg" />
          <button className="h-11 rounded-md border border-accent px-5 text-sm font-semibold text-accent hover:bg-accent hover:text-on-accent">Check</button>
        </div>
        <p id="pin-msg" role="status" className={`mt-2 min-h-5 text-sm ${pinMsg ? (pinMsg.ok ? "text-success" : "text-danger") : ""}`}>{pinMsg?.text}</p>
      </form>

      <label className={`mt-3 flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 ${warranty ? "border-accent bg-accent/5" : "border-border bg-surface"}`}>
        <input type="checkbox" checked={warranty} onChange={(e) => setWarranty(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-accent)]" />
        <span className="flex-1 text-sm">
          <span className="font-semibold">Add 2 more years of cover</span> — {formatINR(WARRANTY_PRICE)}
          <span className="mt-0.5 block text-xs text-muted">Extends the 3-year frame warranty to 5 years, including fabric seams and drawer runners.</span>
        </span>
      </label>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-12 items-center rounded-full border border-border bg-surface" role="group" aria-label="Quantity">
          <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="grid h-12 w-11 place-items-center disabled:opacity-30"><Minus size={16} /></button>
          <span className="w-6 text-center tabular-nums" aria-live="polite">{qty}</span>
          <button onClick={() => setQty(Math.min(10, qty + 1))} disabled={qty >= 10} aria-label="Increase quantity" className="grid h-12 w-11 place-items-center disabled:opacity-30"><Plus size={16} /></button>
        </div>
        <button onClick={() => toggleWish(p.slug)} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} className="grid h-12 w-12 place-items-center rounded-full border border-border bg-surface">
          <Heart size={18} className={saved ? "fill-sale text-sale" : ""} />
        </button>
        <p className="ml-auto text-right text-sm"><span className="block text-xs text-muted">Total</span><span className="text-lg font-semibold">{formatINR(total)}</span></p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => addToCart(line())} className="h-12 rounded-full border-2 border-accent font-semibold text-accent hover:bg-accent/5">Add to cart</button>
        <button onClick={() => { addToCart(line()); router.push("/checkout"); }} className="h-12 rounded-full bg-accent font-semibold text-on-accent hover:bg-accent-hover">Buy now</button>
      </div>

      <ul className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-muted">
        <li className="flex flex-col items-center gap-1.5"><Hammer size={18} className="text-brass" />Free assembly</li>
        <li className="flex flex-col items-center gap-1.5"><ShieldCheck size={18} className="text-brass" />3-year warranty</li>
        <li className="flex flex-col items-center gap-1.5"><Truck size={18} className="text-brass" />{p.shipsFast ? "Ships in 48 hrs" : "Free delivery"}</li>
      </ul>
      <p className="mt-5 flex items-center gap-2 text-xs text-muted"><Check size={14} className="text-success" /> 7-day no-questions return if it doesn&apos;t fit your space</p>
    </div>
  );
}
