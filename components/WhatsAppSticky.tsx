"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { BUSINESS } from "@/lib/business";
import { ICON_PATHS } from "@/lib/social-icons";

// Ready-made questions. Each opens WhatsApp with the text typed in; the customer can edit before sending.
const QUESTIONS = [
  { label: "Price & current offers", text: "Hi! What's the best price and any offers you have right now?" },
  { label: "Custom size or wood", text: "Hi! Can you make this in a custom size or a different wood/finish?" },
  { label: "Delivery to my area", text: "Hi! How long does delivery take to my area? My pincode is: " },
  { label: "Installation & warranty", text: "Hi! Do you install the furniture, and what warranty do you give?" },
  { label: "Showroom timings", text: "Hi! What are your showroom timings in Baner? I'd like to visit." },
  { label: "Bulk or office order", text: "Hi! I'm looking for a bulk order (home / office / hotel). Can we discuss?" },
];
const GENERAL = "Hi Airawat Handicraft, I have a question about your furniture.";

function WaIcon({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={ICON_PATHS.whatsapp} /></svg>;
}

function Sticky() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Adds what the customer is looking at, so the team knows which product they mean.
  const withContext = (text: string) => {
    if (pathname.startsWith("/p/")) {
      const name = document.querySelector("main h1")?.textContent?.trim();
      return `${text}\n\nProduct: ${name ?? ""}\n${window.location.origin}${pathname}`;
    }
    const q = pathname === "/search" ? sp.get("q") : null;
    return q ? `${text}\n\n(I searched your website for "${q}")` : text;
  };
  const href = (text: string) => `${BUSINESS.whatsappHref}?text=${encodeURIComponent(text)}`;
  const go = (text: string) => {
    window.open(href(withContext(text)), "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <div
          id="wa-questions"
          role="dialog"
          aria-label="Chat with us on WhatsApp"
          className="w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-surface shadow-pop"
        >
          <div className="flex items-start gap-3 bg-[#075e54] px-4 py-3 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-mark.png" alt="" className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-1" />
            <div className="flex-1">
              <p className="font-display font-semibold">{BUSINESS.name}</p>
              <p className="text-xs text-white/80">Hi there! Pick a question or write your own. We&apos;ll reply on WhatsApp.</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="-mr-1 rounded-full p-1 hover:bg-white/10"><X size={18} /></button>
          </div>
          <ul className="max-h-[min(360px,60vh)] divide-y divide-border overflow-y-auto">
            {QUESTIONS.map((q) => (
              <li key={q.label}>
                <button onClick={() => go(q.text)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface-alt">
                  <span className="flex-1">{q.label}</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border p-3">
            <button onClick={() => go(GENERAL)} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25d366] text-sm font-semibold text-white hover:brightness-95">
              <WaIcon size={18} /> Ask something else
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">Opens WhatsApp · {BUSINESS.phone}</p>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="wa-questions"
        aria-label={open ? "Close WhatsApp questions" : "Chat with us on WhatsApp"}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-pop transition hover:scale-105"
      >
        {open ? <X size={26} /> : <WaIcon />}
        {!open && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25d366] opacity-30 motion-reduce:hidden" aria-hidden />}
      </button>
    </div>
  );
}

export default function WhatsAppSticky() {
  return <Suspense><Sticky /></Suspense>;
}
