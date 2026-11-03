"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, Menu, MapPin, Phone, Search, ShoppingBag, Truck, User, X } from "lucide-react";
import type { Category } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { displayName, useAuth } from "@/lib/auth";
import { BUSINESS } from "@/lib/business";

export function Logo({ className = "", onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="Airawat Handicraft home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-mark.png" alt="" width={159} height={193} className="h-10 w-auto md:h-11" />
      <span className={`flex flex-col font-[Arial,Helvetica,sans-serif] text-[15px] font-bold uppercase leading-[1.05] tracking-wide md:text-[17px] ${onDark ? "text-white" : "text-brand"}`}>
        <span>Airawat</span>
        <span>Handicraft</span>
      </span>
    </Link>
  );
}

function SearchBox({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (!q.trim()) return;
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        onDone?.();
      }}
    >
      <label htmlFor="site-search" className="sr-only">Search furniture</label>
      <input
        id="site-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search sofas, beds, teak, velvet…"
        className="h-11 w-full rounded-full border border-border bg-surface-alt/60 pl-5 pr-12 text-sm placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none"
      />
      <button type="submit" aria-label="Search" className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-accent text-on-accent hover:bg-accent-hover">
        <Search size={16} />
      </button>
    </form>
  );
}

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sale px-1 text-[10px] font-semibold text-white">
      {n}
    </span>
  );
}

export default function Header({ categories }: { categories: Category[] }) {
  const { cartCount, wishlist } = useStore();
  const { ready: authReady, user } = useAuth();
  const accountLabel = authReady && user ? displayName(user) : "Sign in";
  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="hidden bg-accent text-on-accent md:block">
        <div className="wrap flex h-9 items-center justify-between text-xs">
          <p className="flex items-center gap-2"><Truck size={14} /> Since {BUSINESS.since} · Wood-carved furniture from Baner, Pune</p>
          <div className="flex items-center gap-5">
            <a href={BUSINESS.phoneHref} className="flex items-center gap-1.5 hover:underline"><Phone size={13} /> {BUSINESS.phone}</a>
            <Link href="/stores" className="flex items-center gap-1.5 hover:underline"><MapPin size={13} /> Visit our showroom</Link>
            <Link href="/track" className="hover:underline">Track order</Link>
          </div>
        </div>
      </div>

      <div className="wrap flex h-16 items-center gap-4 md:h-[72px] md:gap-8">
        <button className="-ml-2 p-2 md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
        <Logo />
        <div className="hidden flex-1 md:block md:max-w-xl"><SearchBox /></div>
        <nav aria-label="Account" className="ml-auto flex items-center gap-1 md:gap-3">
          <Link href={user ? "/account" : "/login"} className="hidden max-w-24 flex-col items-center px-2 text-[11px] text-muted hover:text-ink sm:flex">
            <User size={20} className="text-ink" /> <span className="w-full truncate text-center">{accountLabel}</span>
          </Link>
          <Link href="/wishlist" aria-label={`Wishlist, ${wishlist.length} items`} className="flex flex-col items-center px-2 text-[11px] text-muted hover:text-ink">
            <span className="relative"><Heart size={20} className="text-ink" /><Badge n={wishlist.length} /></span>
            <span className="hidden sm:block">Wishlist</span>
          </Link>
          <Link href="/cart" aria-label={`Cart, ${cartCount} items`} className="flex flex-col items-center px-2 text-[11px] text-muted hover:text-ink">
            <span className="relative"><ShoppingBag size={20} className="text-ink" /><Badge n={cartCount} /></span>
            <span className="hidden sm:block">Cart</span>
          </Link>
        </nav>
      </div>

      <div className="wrap pb-3 md:hidden"><SearchBox /></div>

      <nav aria-label="Categories" className="hidden border-t border-border md:block">
        <ul className="wrap flex h-11 items-center gap-7 text-sm">
          {categories.map((c) => (
            <li key={c.slug}><Link href={`/c/${c.slug}`} className="py-3 text-ink/85 hover:text-accent">{c.name}</Link></li>
          ))}
          <li className="ml-auto"><Link href="/c/sofas?deal=1" className="font-medium text-sale">Festive Sale</Link></li>
        </ul>
      </nav>

      {open && <MobileMenu categories={categories} signedIn={!!user} onClose={closeMenu} />}
    </header>
  );
}

// Rendered into <body>: the header's backdrop-blur makes it the containing block for
// position:fixed children, which squeezed the drawer into the header's height.
function MobileMenu({ categories, signedIn, onClose }: { categories: Category[]; signedIn: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const first = useRef(pathname);

  useEffect(() => {
    if (pathname !== first.current) onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col overflow-y-auto bg-surface p-5 shadow-pop">
        <div className="mb-4 flex items-center justify-between">
          <Logo />
          <button onClick={onClose} aria-label="Close menu" autoFocus className="p-2"><X size={22} /></button>
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted">Shop</p>
        <ul className="divide-y divide-border">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/c/${c.slug}`} onClick={onClose} className="flex items-center gap-3 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${c.image}?w=96&h=96&fit=crop`} alt="" className="h-10 w-10 rounded-full object-cover" />
                {c.name}
              </Link>
            </li>
          ))}
          <li><Link href="/c/sofas?deal=1" onClick={onClose} className="block py-3 font-medium text-sale">Festive Sale</Link></li>
        </ul>
        <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <li><Link href={signedIn ? "/account" : "/login"} onClick={onClose} className="flex items-center gap-3 py-2"><User size={18} className="text-brass" />{signedIn ? "Your account" : "Sign in"}</Link></li>
          <li><Link href="/stores" onClick={onClose} className="flex items-center gap-3 py-2"><MapPin size={18} className="text-brass" />Visit our showroom</Link></li>
          <li><a href={BUSINESS.phoneHref} className="flex items-center gap-3 py-2"><Phone size={18} className="text-brass" />{BUSINESS.phone}</a></li>
        </ul>
      </div>
    </div>,
    document.body,
  );
}
