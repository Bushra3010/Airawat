"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { formatINR, img } from "@/lib/catalog";
import { orderToken } from "@/lib/store";
import { browserClient } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth";

type OrderView = {
  code: string;
  status: string;
  name: string;
  city: string;
  payment: string;
  total_paise: number;
  created_at: string;
  awb: string | null;
  courier: string | null;
  lines: { name: string; image: string; variant: string; size: string; qty: number; unit_price_paise: number }[];
};

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderView | null | undefined>(undefined);
  const { ready, user } = useAuth();

  useEffect(() => {
    if (!ready) return;
    // Guests read with the code this browser saved; signed-in owners are matched by account.
    const token = orderToken(id) ?? (user ? "00000000-0000-0000-0000-000000000000" : null);
    if (!token) return setOrder(null);
    let live = true;
    browserClient().rpc("get_order", { p_code: id, p_token: token }).then(({ data }) => { if (live) setOrder((data as OrderView) ?? null); });
    return () => { live = false; };
  }, [id, ready, user]);

  if (order === undefined) return <div className="wrap py-24" aria-busy="true"><div className="h-40 animate-pulse rounded-lg bg-surface-alt" /></div>;
  if (order === null) {
    return (
      <div className="wrap py-24 text-center">
        <h1 className="font-display text-3xl">We can&apos;t find that order</h1>
        <p className="mt-2 text-sm text-muted">Order {id} wasn&apos;t placed from this browser. If you placed it while signed in, <Link href={`/login?next=/order/${id}`} className="font-semibold text-accent underline">sign in</Link> to see it.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-on-accent">Back to home</Link>
      </div>
    );
  }

  const eta = new Date(order.created_at);
  eta.setDate(eta.getDate() + 7);

  return (
    <div className="wrap max-w-2xl py-14">
      <div className="text-center">
        <CheckCircle2 size={52} className="mx-auto text-success" />
        <h1 className="mt-4 font-display text-3xl">Thank you, {order.name.split(" ")[0]}!</h1>
        <p className="mt-2 text-muted">Order <span className="font-mono font-semibold text-ink">{order.code}</span> is confirmed. We&apos;ll call to book a delivery slot in {order.city}.</p>
        {order.awb ? (
          <p className="mt-3 text-sm">
            Shipped with {order.courier ?? "our courier"} · AWB <span className="font-mono">{order.awb}</span>{" "}
            <a href={`https://shiprocket.co/tracking/${encodeURIComponent(order.awb)}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">Track your parcel</a>
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">Expected by {eta.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
        )}
      </div>
      <ul className="mt-10 divide-y divide-border rounded-lg border border-border bg-surface">
        {order.lines.map((l, i) => (
          <li key={i} className="flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(l.image, 160)} alt="" className="h-16 w-20 rounded object-cover" />
            <span className="flex-1 text-sm"><span className="block font-medium">{l.name}</span><span className="text-xs text-muted">{l.variant} · {l.size} · Qty {l.qty}</span></span>
            <span className="text-sm tabular-nums">{formatINR((l.unit_price_paise * l.qty) / 100)}</span>
          </li>
        ))}
        <li className="flex justify-between p-4 font-semibold">
          <span>{order.payment === "cod" ? "To pay on delivery" : `Total (${order.payment.toUpperCase()})`}</span>
          <span>{formatINR(order.total_paise / 100)}</span>
        </li>
      </ul>
      <div className="mt-8 text-center"><Link href="/" className="rounded-full border border-ink px-6 py-3 text-sm font-semibold hover:bg-ink hover:text-white">Keep shopping</Link></div>
    </div>
  );
}
