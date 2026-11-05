"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, LogOut, Package, Truck } from "lucide-react";
import { formatINR, img } from "@/lib/catalog";
import { displayName, useAuth } from "@/lib/auth";
import { browserClient } from "@/lib/supabase-browser";
import { trackingUrl } from "@/lib/tracking";

type OrderRow = {
  code: string;
  status: string;
  total_paise: number;
  payment_method: string;
  created_at: string;
  awb: string | null;
  courier: string | null;
  order_lines: { product_name: string; image: string; qty: number }[];
};

const STATUS: Record<string, string> = {
  pending: "Confirmed", paid: "Paid", shipped: "On its way", delivered: "Delivered", cancelled: "Cancelled",
};

export default function AccountPage() {
  const router = useRouter();
  const { ready, user, signOut } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/account");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    let live = true;
    browserClient()
      .from("orders")
      .select("code, status, total_paise, payment_method, created_at, awb, courier, order_lines(product_name, image, qty)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!live) return;
        if (error) setError(true);
        else setOrders(data as OrderRow[]);
      });
    return () => { live = false; };
  }, [user]);

  if (!ready || !user) return <div className="wrap py-24" aria-busy="true"><div className="h-40 animate-pulse rounded-lg bg-surface-alt" /></div>;

  return (
    <div className="wrap max-w-4xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Hello, {displayName(user)}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <button
          onClick={async () => { await signOut(); router.replace("/"); }}
          className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm hover:border-ink"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/wishlist" className="rounded-lg border border-border bg-surface p-5 hover:border-ink">
          <p className="font-semibold">Wishlist</p>
          <p className="text-sm text-muted">Saved to your account, on every device</p>
        </Link>
        <Link href="/account/reset" className="rounded-lg border border-border bg-surface p-5 hover:border-ink">
          <p className="font-semibold">Change password</p>
          <p className="text-sm text-muted">Set a new password for this account</p>
        </Link>
      </div>

      <h2 className="mt-12 font-display text-2xl">Your orders</h2>
      {error ? (
        <p className="mt-4 text-danger">Couldn&apos;t load your orders. Refresh to try again.</p>
      ) : !orders ? (
        <div className="mt-4 space-y-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-alt" />)}</div>
      ) : !orders.length ? (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <Package size={36} className="mx-auto text-brass" />
          <p className="mt-3 font-display text-xl">No orders yet</p>
          <p className="mt-1 text-sm text-muted">Orders you place while signed in show up here.</p>
          <Link href="/" className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent">Start shopping</Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((o) => (
            <li key={o.code} className="overflow-hidden rounded-lg border border-border bg-surface has-[a:hover]:border-ink">
              <Link href={`/order/${o.code}`} className="flex items-center gap-4 p-4">
                <div className="flex -space-x-3">
                  {o.order_lines.slice(0, 3).map((l, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={img(l.image, 120)} alt="" className="h-14 w-14 rounded-md border-2 border-surface object-cover" />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.order_lines.map((l) => l.product_name).join(", ")}</p>
                  <p className="text-xs text-muted">
                    <span className="font-mono">{o.code}</span> · {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatINR(o.total_paise / 100)}</p>
                  <p className={`text-xs ${o.status === "cancelled" ? "text-danger" : "text-success"}`}>{STATUS[o.status] ?? o.status}</p>
                </div>
              </Link>
              {o.awb && o.status !== "cancelled" && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-alt px-4 py-3 text-sm">
                  <p className="flex min-w-0 items-center gap-2 text-muted">
                    <Truck size={16} className="shrink-0 text-brass" />
                    <span className="truncate">
                      {o.status === "delivered" ? "Delivered by" : "Shipped with"} {o.courier || "our courier"} · AWB <span className="font-mono text-ink">{o.awb}</span>
                    </span>
                  </p>
                  <a
                    href={trackingUrl(o.awb)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-on-accent hover:opacity-90"
                  >
                    Track parcel <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
