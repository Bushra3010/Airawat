"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Gift, X } from "lucide-react";
import { formatINR, img } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";

type Offer = { kind: "percent" | "flat"; value: number; max_discount_paise: number | null; min_order_paise: number; description: string };

const SEEN_KEY = "airawat.offer.dismissed"; // timestamp of the last close
const CLAIMED_KEY = "airawat.offer.claimed"; // set once a number is submitted
export const SAVED_COUPON_KEY = "airawat.coupon"; // the cart applies this code automatically
const SNOOZE_MS = 7 * 864e5;
const DELAY_MS = 6000;
const HIDDEN_ON = ["/checkout", "/login", "/account", "/order", "/cart"];
const IMAGE = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7";

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };

export function offerHeadline(o: Offer) {
  if (o.kind === "flat") return { big: formatINR(o.value / 100), small: "off your order" };
  if (o.max_discount_paise) return { big: formatINR(o.max_discount_paise / 100), small: `off · ${o.value}% up to this amount`, prefix: "up to" };
  return { big: `${o.value}%`, small: "off your order" };
}

export default function SignupOffer() {
  const pathname = usePathname();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (hidden || read(CLAIMED_KEY)) return;
    const last = Number(read(SEEN_KEY) || 0);
    if (Date.now() - last < SNOOZE_MS) return;
    let live = true;
    const t = window.setTimeout(async () => {
      const { data } = await supabase.rpc("signup_offer");
      if (live && data) { setOffer(data as Offer); setOpen(true); }
    }, DELAY_MS);
    return () => { live = false; window.clearTimeout(t); };
  }, [hidden]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  useEffect(() => { if (hidden) setOpen(false); }, [hidden]);

  const close = () => {
    setOpen(false);
    if (!code) write(SEEN_KEY, String(Date.now()));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError("Enter a valid 10-digit mobile number.");
      return inputRef.current?.focus();
    }
    setBusy(true);
    setError("");
    const { data, error } = await supabase.rpc("claim_signup_offer", { p_phone: digits });
    setBusy(false);
    if (error || !data) return setError(error?.message.includes("ended") ? "Sorry, this offer has just ended." : "Something went wrong. Please try again.");
    const c = (data as { code: string }).code;
    setCode(c);
    write(CLAIMED_KEY, "1");
    write(SAVED_COUPON_KEY, c);
  };

  if (!open || !offer) return null;
  const h = offerHeadline(offer);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="offer-title">
      <button className="absolute inset-0 bg-black/50" aria-label="Close offer" onClick={close} />
      <div className="relative max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface shadow-pop sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl">
        <button onClick={close} aria-label="Close offer" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-card hover:bg-white">
          <X size={18} />
        </button>

        <div className="relative m-4 mb-0 grid grid-cols-[42%_1fr] overflow-hidden rounded-xl bg-[#f6e7d6]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(IMAGE, 360)} alt="" className="h-full min-h-40 w-full object-cover" />
          <div className="flex flex-col justify-center p-4 text-center">
            <p className="text-sm text-ink/80">Sign up now &amp; get {h.prefix ?? ""}</p>
            <p className="font-display text-4xl font-bold leading-tight text-brand">{h.big}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink">{h.small}</p>
            {offer.min_order_paise > 0 && <p className="mt-1 text-[11px] text-muted">On orders above {formatINR(offer.min_order_paise / 100)}</p>}
          </div>
        </div>

        <div className="p-5 pt-5 sm:p-6">
          {!code ? (
            <form onSubmit={submit} noValidate>
              <h2 id="offer-title" className="font-display text-2xl">Unlock your discount</h2>
              <label htmlFor="offer-phone" className="sr-only">Mobile number</label>
              <div className={`mt-4 flex h-12 items-center rounded-md border bg-surface ${error ? "border-danger" : "border-border-input"} focus-within:border-accent`}>
                <span className="pl-4 pr-2 text-sm text-muted">+91</span>
                <input
                  ref={inputRef}
                  id="offer-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={14}
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/[^\d ]/g, "")); setError(""); }}
                  placeholder="Enter mobile number"
                  aria-invalid={!!error}
                  aria-describedby={error ? "offer-error" : "offer-consent"}
                  className="h-full flex-1 bg-transparent pr-4 text-base outline-none"
                />
              </div>
              {error && <p id="offer-error" role="alert" className="mt-2 text-sm text-danger">{error}</p>}
              <p id="offer-consent" className="mt-3 text-center text-xs text-muted">
                By continuing, I agree to the <Link href="/terms" className="text-accent underline" onClick={close}>Terms of Use</Link> &amp; <Link href="/privacy" className="text-accent underline" onClick={close}>Privacy Policy</Link>.
              </p>
              <button disabled={busy} className="mt-4 h-12 w-full rounded-md bg-accent font-semibold uppercase tracking-wide text-on-accent hover:bg-accent-hover disabled:opacity-60">
                {busy ? "Please wait…" : "Continue"}
              </button>
            </form>
          ) : (
            <div className="text-center" aria-live="polite">
              <Gift size={34} className="mx-auto text-brand" />
              <h2 id="offer-title" className="mt-2 font-display text-2xl">Your code is ready</h2>
              <button
                onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); } catch {} }}
                className="mx-auto mt-4 flex items-center gap-2 rounded-md border-2 border-dashed border-brand px-5 py-3 font-mono text-xl font-bold tracking-wider text-brand"
                aria-label={`Copy code ${code}`}
              >
                {code} {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
              <p className="mt-3 text-sm text-muted">{offer.description}. We&apos;ve saved it to your cart, so it applies at checkout.</p>
              <button onClick={() => setOpen(false)} className="mt-5 h-12 w-full rounded-md bg-accent font-semibold text-on-accent hover:bg-accent-hover">Start shopping</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
