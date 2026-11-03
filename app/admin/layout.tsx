"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, FolderTree, LayoutDashboard, LogOut, Menu, MessageSquareText, Package, ShoppingCart, TicketPercent, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAdminGate } from "@/lib/admin";
import { Skeleton } from "@/components/admin/ui";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const gate = useAdminGate();
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    document.title = "Admin | Airawat Handicraft";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  useEffect(() => {
    if (gate === "signed-out") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [gate, pathname, router]);
  useEffect(() => setMenu(false), [pathname]);

  if (gate === "loading" || gate === "signed-out") {
    return <div className="mx-auto max-w-3xl p-10"><Skeleton rows={3} /></div>;
  }
  if (gate === "denied") {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-3xl">No admin access</h1>
        <p className="mt-3 text-sm text-muted">
          You&apos;re signed in as {user?.email}, which isn&apos;t an admin account. Ask the store owner to give this account access.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Back to shop</Link>
          <button onClick={async () => { await signOut(); router.replace("/login?next=/admin"); }} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent">Use another account</button>
        </div>
      </div>
    );
  }

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={active(href) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${active(href) ? "bg-white/10 font-semibold text-white" : "text-white/75 hover:bg-white/5 hover:text-white"}`}
        >
          <Icon size={18} /> {label}
        </Link>
      ))}
      <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"><ExternalLink size={18} /> View shop</a>
        <button onClick={async () => { await signOut(); router.replace("/"); }} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"><LogOut size={18} /> Sign out</button>
        <p className="truncate px-3 pt-2 text-xs text-white/50">{user?.email}</p>
      </div>
    </nav>
  );

  const brand = (
    <Link href="/admin" className="mb-6 flex items-center gap-2 px-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-mark.png" alt="" className="h-9 w-9 rounded-full bg-white object-contain p-1" />
      <span className="leading-tight text-white"><span className="block text-sm font-bold">Airawat Handicraft</span><span className="text-xs text-white/60">Admin</span></span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-bg md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-ink p-4 md:flex">{brand}{nav}</aside>

      <header className="flex items-center justify-between bg-ink px-4 py-3 text-white md:hidden">
        <span className="font-semibold">Airawat Admin</span>
        <button onClick={() => setMenu(true)} aria-label="Open admin menu" className="p-1"><Menu size={22} /></button>
      </header>
      {menu && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button className="absolute inset-0 bg-black/40" aria-label="Close admin menu" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-ink p-4">
            <div className="flex items-start justify-between">{brand}<button onClick={() => setMenu(false)} aria-label="Close admin menu" className="p-1 text-white"><X size={20} /></button></div>
            {nav}
          </div>
        </div>
      )}

      <main id="main" className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
