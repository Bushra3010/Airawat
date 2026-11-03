"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { formatINR, img } from "@/lib/catalog";
import { saveOrderToken, useStore } from "@/lib/store";
import { browserClient } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth";
import { couponBase, summarise } from "@/lib/pricing";
import { useCoupon } from "@/lib/coupons";
import { INDIAN_STATES } from "@/lib/india";
import Summary from "@/components/Summary";

type Field = "name" | "phone" | "email" | "pincode" | "address" | "city" | "state";
const FIELDS: { key: Field; label: string; type?: string; auto: string; full?: boolean; options?: string[]; test: (v: string) => string | null }[] = [
  { key: "name", label: "Full name", auto: "name", test: (v) => (v.trim().length >= 2 ? null : "Enter your name.") },
  { key: "phone", label: "Mobile number", type: "tel", auto: "tel", test: (v) => (/^[6-9]\d{9}$/.test(v) ? null : "Enter a 10-digit mobile number.") },
  { key: "email", label: "Email", type: "email", auto: "email", full: true, test: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email.") },
  { key: "address", label: "House, street and area", auto: "street-address", full: true, test: (v) => (v.trim().length >= 6 ? null : "Enter your full address.") },
  { key: "city", label: "City", auto: "address-level2", test: (v) => (v.trim() ? null : "Enter your city.") },
  { key: "state", label: "State", auto: "address-level1", options: INDIAN_STATES, test: (v) => (v ? null : "Choose your state.") },
  { key: "pincode", label: "Pincode", auto: "postal-code", test: (v) => (/^[1-9]\d{5}$/.test(v) ? null : "Enter a 6-digit pincode.") },
];

function Checkout() {
  const router = useRouter();
  const sp = useSearchParams();
  const { ready, cart, clearCart } = useStore();
  const [form, setForm] = useState<Record<Field, string>>({ name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" });
  const couponCode = sp.get("coupon");
  const check = useCoupon(couponCode, ready ? couponBase(cart) : 0);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [payment, setPayment] = useState("upi");
  const [placing, setPlacing] = useState(false);
  const [serverError, setServerError] = useState("");
  const { user } = useAuth();
  // Prefill from the signed-in account, once.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || ((user.user_metadata?.full_name as string | undefined) ?? ""),
      email: f.email || (user.email ?? ""),
    }));
  }, [user]);

  if (!ready) return <div className="wrap py-24"><div className="h-40 animate-pulse rounded-lg bg-surface-alt" /></div>;
  if (!cart.length) {
    return (
      <div className="wrap py-24 text-center">
        <h1 className="font-display text-3xl">Nothing to check out yet</h1>
        <Link href="/" className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-on-accent">Browse furniture</Link>
      </div>
    );
  }

  const s = summarise(cart, check.valid ? check.off : 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<Field, string>> = {};
    for (const f of FIELDS) { const m = f.test(form[f.key]); if (m) errs[f.key] = m; }
    setErrors(errs);
    const first = FIELDS.find((f) => errs[f.key]);
    if (first) { document.getElementById(`f-${first.key}`)?.focus(); return; }
    setPlacing(true);
    setServerError("");
    // The database re-prices every line; the browser's prices are display only.
    // Payment is still simulated: the order is created as "pending".
    const { data, error } = await browserClient().rpc("place_order", {
      p_lines: cart.map((l) => ({ slug: l.slug, variant: l.variant, size: l.size, qty: l.qty, warranty: l.warranty })),
      p_customer: { ...form, phone: form.phone.trim(), pincode: form.pincode.trim() },
      p_payment: payment,
      p_coupon: check.valid ? couponCode : null,
    });
    if (error || !data) {
      setPlacing(false);
      setServerError(error?.message ?? "Something went wrong placing your order. Please try again.");
      return;
    }
    const { code, token } = data as { code: string; token: string };
    saveOrderToken(code, token);
    clearCart();
    router.push(`/order/${code}`);
  };

  return (
    <div className="wrap py-8">
      <h1 className="flex items-center gap-2 font-display text-3xl"><Lock size={22} className="text-brass" /> Checkout</h1>
      <form onSubmit={submit} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <fieldset className="rounded-lg border border-border bg-surface p-5 md:p-6">
            <legend className="px-1 font-semibold">Delivery address</legend>
            {user
              ? <p className="mt-1 text-xs text-muted">Signed in as {user.email}. This order will be saved to your account.</p>
              : <p className="mt-1 text-xs text-muted">Checking out as a guest. <Link href="/login?next=/checkout" className="font-semibold text-accent underline">Sign in</Link> to keep this order in your account.</p>}
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
                  <label htmlFor={`f-${f.key}`} className="text-sm font-medium">{f.label}</label>
                  {f.options ? (
                    <select
                      id={`f-${f.key}`}
                      autoComplete={f.auto}
                      value={form[f.key]}
                      onChange={(e) => { setForm({ ...form, [f.key]: e.target.value }); if (errors[f.key]) setErrors({ ...errors, [f.key]: undefined }); }}
                      aria-invalid={!!errors[f.key]}
                      aria-describedby={errors[f.key] ? `e-${f.key}` : undefined}
                      className={`mt-1.5 h-11 w-full rounded-md border bg-surface px-3 text-sm ${errors[f.key] ? "border-danger" : "border-border-input"}`}
                    >
                      <option value="">Choose…</option>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      id={`f-${f.key}`}
                      type={f.type ?? "text"}
                      autoComplete={f.auto}
                      value={form[f.key]}
                      onChange={(e) => { setForm({ ...form, [f.key]: e.target.value }); if (errors[f.key]) setErrors({ ...errors, [f.key]: undefined }); }}
                      aria-invalid={!!errors[f.key]}
                      aria-describedby={errors[f.key] ? `e-${f.key}` : undefined}
                      className={`mt-1.5 h-11 w-full rounded-md border bg-surface px-3 text-sm ${errors[f.key] ? "border-danger" : "border-border-input"}`}
                    />
                  )}
                  {errors[f.key] && <p id={`e-${f.key}`} className="mt-1 text-xs text-danger">{errors[f.key]}</p>}
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-5 md:p-6">
            <legend className="px-1 font-semibold">Payment</legend>
            <div className="mt-2 space-y-3">
              {[
                ["upi", "UPI", "Pay with any UPI app"],
                ["card", "Credit / debit card", "No-cost EMI available on 3–12 months"],
                ["cod", "Pay on delivery", "Cash or UPI when it arrives"],
              ].map(([v, l, d]) => (
                <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-md border-2 p-4 ${payment === v ? "border-accent bg-accent/5" : "border-border"}`}>
                  <input type="radio" name="pay" value={v} checked={payment === v} onChange={() => setPayment(v)} className="mt-1 accent-[var(--color-accent)]" />
                  <span><span className="block text-sm font-semibold">{l}</span><span className="text-xs text-muted">{d}</span></span>
                </label>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">Demo store: no money is taken. Your order and address are saved to our database so we can deliver it.</p>
          </fieldset>
        </div>

        <div className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <ul className="space-y-3 rounded-lg border border-border bg-surface p-5">
            {cart.map((l) => (
              <li key={l.key} className="flex gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(l.image, 120)} alt="" className="h-14 w-16 rounded object-cover" />
                <span className="flex-1"><span className="line-clamp-1">{l.name}</span><span className="text-xs text-muted">Qty {l.qty} · {l.variant}</span></span>
              </li>
            ))}
          </ul>
          <Summary s={s}>
            <button disabled={placing} className="mt-4 h-12 w-full rounded-full bg-accent font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-60">
              {placing ? "Placing order…" : `Place order · ${formatINR(s.total)}`}
            </button>
            {serverError && <p role="alert" className="mt-3 text-sm text-danger">{serverError}</p>}
          </Summary>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense><Checkout /></Suspense>;
}
